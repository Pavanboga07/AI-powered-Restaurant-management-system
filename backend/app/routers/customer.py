"""
Customer-facing API endpoints
Menu browsing, online ordering, order tracking, favorites, profile management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, models
from ..database import get_db
from ..crud import customer as customer_crud
from .auth import get_current_user, get_optional_user

router = APIRouter(
    prefix="/api/customer",
    tags=["customer"]
)


# ==================== MENU BROWSING ====================

@router.get("/menu", response_model=List[schemas.MenuItem])
def browse_menu(
    category: Optional[str] = None,
    diet_type: Optional[str] = None,
    search: Optional[str] = None,
    available_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Browse restaurant menu with optional filters
    Public endpoint - no authentication required
    """
    items = customer_crud.get_public_menu(
        db=db,
        category=category,
        diet_type=diet_type,
        search=search,
        available_only=available_only,
        skip=skip,
        limit=limit
    )
    return items


@router.get("/menu/categories", response_model=List[str])
def get_menu_categories(db: Session = Depends(get_db)):
    """
    Get all menu categories
    Public endpoint - no authentication required
    """
    return customer_crud.get_menu_categories(db)


@router.get("/menu/featured", response_model=List[schemas.MenuItem])
def get_featured_menu_items(
    limit: int = 6,
    db: Session = Depends(get_db)
):
    """
    Get featured/popular menu items
    Public endpoint - no authentication required
    """
    return customer_crud.get_featured_items(db, limit)


@router.get("/menu/{item_id}", response_model=dict)
def get_menu_item_details(
    item_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a menu item including reviews
    Public endpoint - no authentication required
    """
    details = customer_crud.get_menu_item_details(db, item_id)
    if not details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return details


@router.get("/menu/search", response_model=List[schemas.MenuItem])
def search_menu(
    q: str = Query(..., min_length=1, description="Search term"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Advanced search for menu items
    Public endpoint - no authentication required
    """
    return customer_crud.search_menu_items(db, q, skip, limit)


# ==================== FAVORITES ====================

@router.post("/favorites", response_model=schemas.Favorite, status_code=status.HTTP_201_CREATED)
def add_to_favorites(
    favorite: schemas.FavoriteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a menu item to favorites
    Requires authentication
    """
    # Get or create customer profile
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        # Create customer profile
        customer_data = schemas.CustomerCreate()
        customer_obj = customer_crud.create_customer_profile(db, current_user.id, customer_data)
        customer_id = customer_obj.id
    else:
        customer_id = customer["customer"].id
    
    return customer_crud.add_to_favorites(db, customer_id, favorite.menu_item_id)


@router.delete("/favorites/{menu_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_favorites(
    menu_item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a menu item from favorites
    Requires authentication
    """
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )
    
    success = customer_crud.remove_from_favorites(db, customer["customer"].id, menu_item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )


@router.get("/favorites", response_model=List[schemas.MenuItem])
def get_my_favorites(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get customer's favorite menu items
    Requires authentication
    """
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        return []
    
    return customer_crud.get_customer_favorites(db, customer["customer"].id)


@router.get("/favorites/check/{menu_item_id}", response_model=bool)
def check_if_favorited(
    menu_item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if a menu item is in favorites
    Requires authentication
    """
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        return False
    
    return customer_crud.is_favorited(db, customer["customer"].id, menu_item_id)


# ==================== ONLINE ORDERING ====================

@router.post("/orders", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def place_order(
    order: schemas.CustomerOrderCreate,
    current_user: Optional[models.User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Place an online order
    Optional authentication - can order as guest or logged-in customer
    """
    customer_id = None
    if current_user:
        customer = customer_crud.get_customer_profile(db, current_user.id)
        if customer:
            customer_id = customer["customer"].id
    
    try:
        return customer_crud.create_customer_order(db, order, customer_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders", response_model=List[schemas.Order])
def get_my_orders(
    skip: int = 0,
    limit: int = 20,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get customer's order history
    Requires authentication
    """
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        return []
    
    return customer_crud.get_customer_orders(db, customer["customer"].id, skip, limit)


@router.get("/orders/{order_id}/track", response_model=dict)
def track_order(
    order_id: int,
    customer_email: Optional[str] = None,
    current_user: Optional[models.User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Track order status
    Optional authentication - use email for guest orders, or auth for logged-in users
    """
    # If authenticated, use user's email
    if current_user:
        customer_email = current_user.email
    
    tracking_info = customer_crud.track_order(db, order_id, customer_email)
    if not tracking_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or unauthorized"
        )
    
    return tracking_info


# ==================== CUSTOMER PROFILE ====================

@router.get("/profile", response_model=dict)
def get_my_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get customer profile with stats
    Requires authentication
    """
    profile = customer_crud.get_customer_profile(db, current_user.id)
    if not profile:
        # Create profile if doesn't exist
        customer_data = schemas.CustomerCreate()
        customer_obj = customer_crud.create_customer_profile(db, current_user.id, customer_data)
        profile = {
            "customer": customer_obj,
            "user": current_user
        }
    
    # Convert customer model to dict for serialization
    customer_dict = {
        "id": profile["customer"].id,
        "user_id": profile["customer"].user_id,
        "phone": profile["customer"].phone,
        "address": profile["customer"].address,
        "total_orders": profile["customer"].total_orders,
        "total_spent": profile["customer"].total_spent,
        "loyalty_points": profile["customer"].loyalty_points,
        "created_at": profile["customer"].created_at.isoformat() if profile["customer"].created_at else None,
        "updated_at": profile["customer"].updated_at.isoformat() if profile["customer"].updated_at else None
    }
    
    # Convert user model to dict
    user_dict = {
        "id": profile["user"].id,
        "username": profile["user"].username,
        "email": profile["user"].email,
        "role": profile["user"].role.value if hasattr(profile["user"].role, 'value') else str(profile["user"].role)
    }
    
    # Get stats
    stats = customer_crud.get_customer_stats(db, profile["customer"].id)
    
    return {
        "customer": customer_dict,
        "user": user_dict,
        "stats": stats
    }


@router.put("/profile", response_model=schemas.Customer)
def update_my_profile(
    profile_update: schemas.CustomerUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update customer profile
    Requires authentication
    """
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        # Create if doesn't exist
        customer_data = schemas.CustomerCreate(
            phone=profile_update.phone,
            address=profile_update.address,
            preferences=profile_update.preferences
        )
        return customer_crud.create_customer_profile(db, current_user.id, customer_data)
    
    updated = customer_crud.update_customer_profile(db, customer["customer"].id, profile_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )
    
    return updated


# ==================== REVIEWS ====================

@router.post("/reviews", response_model=schemas.Review, status_code=status.HTTP_201_CREATED)
def create_review(
    review: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update a review for a menu item
    Requires authentication
    """
    # Get or create customer profile
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        customer_data = schemas.CustomerCreate()
        customer_obj = customer_crud.create_customer_profile(db, current_user.id, customer_data)
        customer_id = customer_obj.id
    else:
        customer_id = customer["customer"].id
    
    return customer_crud.create_review(db, review, customer_id)


@router.get("/reviews/my", response_model=List[schemas.Review])
def get_my_reviews(
    skip: int = 0,
    limit: int = 20,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get customer's reviews
    Requires authentication
    """
    customer = customer_crud.get_customer_profile(db, current_user.id)
    if not customer:
        return []
    
    return customer_crud.get_customer_reviews(db, customer["customer"].id, skip, limit)


# ==================== RECOMMENDATIONS ====================

@router.get("/recommendations", response_model=List[schemas.MenuItem])
def get_recommendations(
    limit: int = 6,
    current_user: Optional[models.User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized recommendations
    Optional authentication
    """
    customer_id = None
    if current_user:
        customer = customer_crud.get_customer_profile(db, current_user.id)
        if customer:
            customer_id = customer["customer"].id
    
    return customer_crud.get_recommended_items(db, customer_id, limit)
