"""
Customer Profile API Router
Handles customer profiles, addresses, and favorites
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from ..database import get_db
from .auth import get_current_user
from .. import models, schemas

router = APIRouter(prefix="/api/profile", tags=["Customer Profile"])


# ==================== Profile Management ====================

@router.get("/me", response_model=schemas.CompleteProfileResponse)
async def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete customer profile with addresses and loyalty info"""
    
    # Get or create customer profile
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        # Create default profile
        profile = models.CustomerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Get addresses
    addresses = db.query(models.CustomerAddress).filter(
        models.CustomerAddress.customer_id == profile.id
    ).all()
    
    # Get loyalty account
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    # Count favorites
    favorites_count = 0
    if profile.favorite_items:
        try:
            favorites = json.loads(profile.favorite_items)
            favorites_count = len(favorites)
        except:
            favorites_count = 0
    
    return {
        "user": current_user,
        "profile": profile,
        "addresses": addresses,
        "loyalty": loyalty,
        "favorites_count": favorites_count
    }


@router.put("/me", response_model=schemas.CustomerProfile)
async def update_my_profile(
    profile_update: schemas.CustomerProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update customer profile"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update fields
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile


# ==================== Address Management ====================

@router.get("/addresses", response_model=List[schemas.CustomerAddress])
async def get_my_addresses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved addresses"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        return []
    
    return db.query(models.CustomerAddress).filter(
        models.CustomerAddress.customer_id == profile.id
    ).order_by(models.CustomerAddress.is_default.desc()).all()


@router.post("/addresses", response_model=schemas.CustomerAddress, status_code=status.HTTP_201_CREATED)
async def add_address(
    address: schemas.CustomerAddressCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add new delivery address"""
    
    # Get or create profile
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = models.CustomerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # If this is set as default, unset other defaults
    if address.is_default:
        db.query(models.CustomerAddress).filter(
            models.CustomerAddress.customer_id == profile.id
        ).update({"is_default": False})
    
    # Create address
    db_address = models.CustomerAddress(
        **address.dict(),
        customer_id=profile.id
    )
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    
    # If this is the first address, set it as default
    address_count = db.query(models.CustomerAddress).filter(
        models.CustomerAddress.customer_id == profile.id
    ).count()
    
    if address_count == 1:
        db_address.is_default = True
        profile.default_address_id = db_address.id
        db.commit()
        db.refresh(db_address)
    
    return db_address


@router.put("/addresses/{address_id}", response_model=schemas.CustomerAddress)
async def update_address(
    address_id: int,
    address_update: schemas.CustomerAddressUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update delivery address"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db_address = db.query(models.CustomerAddress).filter(
        models.CustomerAddress.id == address_id,
        models.CustomerAddress.customer_id == profile.id
    ).first()
    
    if not db_address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # If setting as default, unset others
    if address_update.is_default:
        db.query(models.CustomerAddress).filter(
            models.CustomerAddress.customer_id == profile.id,
            models.CustomerAddress.id != address_id
        ).update({"is_default": False})
    
    # Update fields
    for key, value in address_update.dict(exclude_unset=True).items():
        setattr(db_address, key, value)
    
    db.commit()
    db.refresh(db_address)
    return db_address


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete delivery address"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db_address = db.query(models.CustomerAddress).filter(
        models.CustomerAddress.id == address_id,
        models.CustomerAddress.customer_id == profile.id
    ).first()
    
    if not db_address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    was_default = db_address.is_default
    db.delete(db_address)
    db.commit()
    
    # If deleted address was default, set another as default
    if was_default:
        new_default = db.query(models.CustomerAddress).filter(
            models.CustomerAddress.customer_id == profile.id
        ).first()
        
        if new_default:
            new_default.is_default = True
            profile.default_address_id = new_default.id
            db.commit()
    
    return None


# ==================== Favorites Management ====================

@router.get("/favorites", response_model=List[schemas.MenuItem])
async def get_favorites(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get favorite menu items"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile or not profile.favorite_items:
        return []
    
    try:
        favorite_ids = json.loads(profile.favorite_items)
        items = db.query(models.MenuItem).filter(
            models.MenuItem.id.in_(favorite_ids),
            models.MenuItem.is_available == True
        ).all()
        return items
    except:
        return []


@router.post("/favorites/{item_id}", status_code=status.HTTP_201_CREATED)
async def add_to_favorites(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add menu item to favorites"""
    
    # Check if menu item exists
    menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Get or create profile
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = models.CustomerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Get current favorites
    try:
        favorites = json.loads(profile.favorite_items) if profile.favorite_items else []
    except:
        favorites = []
    
    # Add if not already in favorites
    if item_id not in favorites:
        favorites.append(item_id)
        profile.favorite_items = json.dumps(favorites)
        db.commit()
    
    return {"message": "Added to favorites", "item_id": item_id}


@router.delete("/favorites/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_favorites(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove menu item from favorites"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        favorites = json.loads(profile.favorite_items) if profile.favorite_items else []
        if item_id in favorites:
            favorites.remove(item_id)
            profile.favorite_items = json.dumps(favorites)
            db.commit()
    except:
        pass
    
    return None


@router.get("/dietary-preferences")
async def get_dietary_options():
    """Get available dietary preference options"""
    return {
        "dietary_preferences": [
            "vegetarian",
            "vegan",
            "gluten-free",
            "dairy-free",
            "halal",
            "kosher",
            "low-carb",
            "keto",
            "paleo"
        ],
        "common_allergies": [
            "nuts",
            "peanuts",
            "dairy",
            "eggs",
            "soy",
            "wheat",
            "shellfish",
            "fish",
            "sesame"
        ]
    }
