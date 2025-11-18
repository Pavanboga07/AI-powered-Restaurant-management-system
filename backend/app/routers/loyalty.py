"""
Loyalty System API Router
Handles points earning, redemption, tiers, and referrals
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
import random
import string

from ..database import get_db
from .auth import get_current_user
from .. import models, schemas

router = APIRouter(prefix="/api/loyalty", tags=["Loyalty System"])


# Tier Configuration
TIER_CONFIG = {
    "bronze": {
        "name": "Bronze",
        "min_points": 0,
        "max_points": 999,
        "discount_percentage": 1.0,
        "benefits": [
            "1% discount on all orders",
            "Birthday special offer",
            "Early access to new menu items"
        ]
    },
    "silver": {
        "name": "Silver",
        "min_points": 1000,
        "max_points": 4999,
        "discount_percentage": 5.0,
        "benefits": [
            "5% discount on all orders",
            "Priority customer support",
            "Exclusive member events",
            "Free appetizer on birthday"
        ]
    },
    "gold": {
        "name": "Gold",
        "min_points": 5000,
        "max_points": 9999,
        "discount_percentage": 10.0,
        "benefits": [
            "10% discount on all orders",
            "Free delivery on all orders",
            "Complimentary dessert monthly",
            "VIP reservation priority",
            "Birthday dining experience"
        ]
    },
    "platinum": {
        "name": "Platinum",
        "min_points": 10000,
        "max_points": None,
        "discount_percentage": 15.0,
        "benefits": [
            "15% discount on all orders",
            "Free delivery always",
            "Reserved premium seating",
            "Personal chef consultation",
            "Exclusive seasonal tastings",
            "Birthday celebration package",
            "Refer friends for bonus points"
        ]
    }
}

POINTS_PER_RUPEE = 0.1  # 1 point per ₹10 spent
REFERRAL_BONUS_POINTS = 500
REFERRER_BONUS_POINTS = 250


def generate_referral_code():
    """Generate unique referral code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def calculate_tier(lifetime_points: int) -> str:
    """Calculate tier based on lifetime points"""
    if lifetime_points >= 10000:
        return "platinum"
    elif lifetime_points >= 5000:
        return "gold"
    elif lifetime_points >= 1000:
        return "silver"
    else:
        return "bronze"


# ==================== Loyalty Account Management ====================

@router.get("/account", response_model=schemas.LoyaltyAccount)
async def get_loyalty_account(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get customer's loyalty account"""
    
    # Get customer profile
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        # Create profile
        profile = models.CustomerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Get or create loyalty account
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if not loyalty:
        # Create loyalty account with referral code
        referral_code = generate_referral_code()
        loyalty = models.LoyaltyAccount(
            customer_id=profile.id,
            points_balance=0,
            lifetime_points=0,
            tier_level="bronze",
            tier_valid_until=datetime.now() + timedelta(days=365),
            total_spent=0.0,
            total_orders=0,
            referral_code=referral_code
        )
        db.add(loyalty)
        db.commit()
        db.refresh(loyalty)
    
    return loyalty


@router.get("/transactions", response_model=List[schemas.LoyaltyTransaction])
async def get_loyalty_transactions(
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get loyalty transaction history"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        return []
    
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if not loyalty:
        return []
    
    transactions = db.query(models.LoyaltyTransaction).filter(
        models.LoyaltyTransaction.loyalty_account_id == loyalty.id
    ).order_by(models.LoyaltyTransaction.created_at.desc()).offset(skip).limit(limit).all()
    
    return transactions


@router.post("/earn", response_model=schemas.LoyaltyTransaction)
async def earn_points(
    order_id: int,
    amount_spent: float,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Earn points for an order (called automatically after order completion)
    Admin/Manager only endpoint
    """
    
    # Verify user is admin/manager
    if current_user.role not in [models.UserRole.admin, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get order
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get order creator's profile
    order_user = db.query(models.User).filter(models.User.id == order.created_by).first()
    if not order_user:
        raise HTTPException(status_code=404, detail="Order user not found")
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == order_user.id
    ).first()
    
    if not profile:
        profile = models.CustomerProfile(user_id=order_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if not loyalty:
        referral_code = generate_referral_code()
        loyalty = models.LoyaltyAccount(
            customer_id=profile.id,
            referral_code=referral_code,
            tier_valid_until=datetime.now() + timedelta(days=365)
        )
        db.add(loyalty)
        db.commit()
        db.refresh(loyalty)
    
    # Calculate points (1 point per ₹10)
    points_earned = int(amount_spent * POINTS_PER_RUPEE)
    
    # Update loyalty account
    loyalty.points_balance += points_earned
    loyalty.lifetime_points += points_earned
    loyalty.total_spent += amount_spent
    loyalty.total_orders += 1
    
    # Check for tier upgrade
    new_tier = calculate_tier(loyalty.lifetime_points)
    if new_tier != loyalty.tier_level:
        loyalty.tier_level = new_tier
        loyalty.tier_valid_until = datetime.now() + timedelta(days=365)
    
    # Create transaction record
    transaction = models.LoyaltyTransaction(
        loyalty_account_id=loyalty.id,
        transaction_type="earn",
        points_change=points_earned,
        reference_type="order",
        reference_id=order_id,
        description=f"Earned {points_earned} points from Order #{order_id}"
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.post("/redeem", response_model=schemas.LoyaltyTransaction)
async def redeem_points(
    redemption: schemas.RedeemPointsRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Redeem loyalty points (100 points = ₹10 discount)"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if not loyalty:
        raise HTTPException(status_code=404, detail="Loyalty account not found")
    
    # Check if enough points
    if loyalty.points_balance < redemption.points:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient points. You have {loyalty.points_balance} points"
        )
    
    # Minimum redemption: 100 points
    if redemption.points < 100:
        raise HTTPException(status_code=400, detail="Minimum redemption is 100 points")
    
    # Must be multiple of 100
    if redemption.points % 100 != 0:
        raise HTTPException(status_code=400, detail="Points must be in multiples of 100")
    
    # Deduct points
    loyalty.points_balance -= redemption.points
    
    # Create transaction
    discount_amount = redemption.points / 10  # 100 points = ₹10
    transaction = models.LoyaltyTransaction(
        loyalty_account_id=loyalty.id,
        transaction_type="redeem",
        points_change=-redemption.points,
        reference_type="order" if redemption.order_id else "manual",
        reference_id=redemption.order_id,
        description=f"Redeemed {redemption.points} points for ₹{discount_amount:.2f} discount"
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.get("/tiers", response_model=List[schemas.TierInfo])
async def get_tier_info():
    """Get information about all loyalty tiers"""
    
    tiers = []
    for tier_key, tier_data in TIER_CONFIG.items():
        tiers.append(schemas.TierInfo(
            tier_name=tier_data["name"],
            min_points=tier_data["min_points"],
            max_points=tier_data["max_points"],
            discount_percentage=tier_data["discount_percentage"],
            benefits=tier_data["benefits"]
        ))
    
    return tiers


@router.get("/tier-discount")
async def get_tier_discount(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current tier discount percentage"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        return {"tier": "bronze", "discount_percentage": 1.0}
    
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if not loyalty:
        return {"tier": "bronze", "discount_percentage": 1.0}
    
    tier_info = TIER_CONFIG.get(loyalty.tier_level, TIER_CONFIG["bronze"])
    
    return {
        "tier": loyalty.tier_level,
        "discount_percentage": tier_info["discount_percentage"],
        "points_balance": loyalty.points_balance,
        "lifetime_points": loyalty.lifetime_points
    }


@router.post("/refer")
async def generate_referral_link(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate referral link for sharing"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if not loyalty:
        raise HTTPException(status_code=404, detail="Loyalty account not found")
    
    referral_url = f"http://localhost:5173/signup?ref={loyalty.referral_code}"
    
    return {
        "referral_code": loyalty.referral_code,
        "referral_url": referral_url,
        "referrer_bonus": REFERRER_BONUS_POINTS,
        "referee_bonus": REFERRAL_BONUS_POINTS,
        "message": f"Share this link! You get {REFERRER_BONUS_POINTS} points when someone signs up, they get {REFERRAL_BONUS_POINTS} points!"
    }


@router.post("/apply-referral/{referral_code}")
async def apply_referral_code(
    referral_code: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply referral code (for new users)"""
    
    # Find referrer's loyalty account
    referrer_loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.referral_code == referral_code
    ).first()
    
    if not referrer_loyalty:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Get current user's profile
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = models.CustomerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Check if user already has loyalty account
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if loyalty and loyalty.referred_by:
        raise HTTPException(status_code=400, detail="Referral code already applied")
    
    if not loyalty:
        # Create loyalty account
        loyalty = models.LoyaltyAccount(
            customer_id=profile.id,
            referral_code=generate_referral_code(),
            referred_by=referrer_loyalty.id,
            tier_valid_until=datetime.now() + timedelta(days=365)
        )
        db.add(loyalty)
    else:
        loyalty.referred_by = referrer_loyalty.id
    
    # Give bonus points to new user
    loyalty.points_balance += REFERRAL_BONUS_POINTS
    loyalty.lifetime_points += REFERRAL_BONUS_POINTS
    
    # Create transaction for referee
    referee_transaction = models.LoyaltyTransaction(
        loyalty_account_id=loyalty.id,
        transaction_type="referral",
        points_change=REFERRAL_BONUS_POINTS,
        reference_type="referral",
        reference_id=referrer_loyalty.id,
        description=f"Referral bonus: {REFERRAL_BONUS_POINTS} points"
    )
    db.add(referee_transaction)
    
    # Give bonus points to referrer
    referrer_loyalty.points_balance += REFERRER_BONUS_POINTS
    referrer_loyalty.lifetime_points += REFERRER_BONUS_POINTS
    
    # Create transaction for referrer
    referrer_transaction = models.LoyaltyTransaction(
        loyalty_account_id=referrer_loyalty.id,
        transaction_type="referral",
        points_change=REFERRER_BONUS_POINTS,
        reference_type="referral",
        reference_id=loyalty.id,
        description=f"Referral reward: {REFERRER_BONUS_POINTS} points"
    )
    db.add(referrer_transaction)
    
    db.commit()
    
    return {
        "message": f"Referral applied! You received {REFERRAL_BONUS_POINTS} bonus points",
        "points_balance": loyalty.points_balance
    }


@router.get("/stats")
async def get_loyalty_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get loyalty statistics and progress"""
    
    profile = db.query(models.CustomerProfile).filter(
        models.CustomerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        return None
    
    loyalty = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.customer_id == profile.id
    ).first()
    
    if not loyalty:
        return None
    
    # Get current tier info
    current_tier = TIER_CONFIG.get(loyalty.tier_level, TIER_CONFIG["bronze"])
    
    # Calculate next tier
    next_tier = None
    points_to_next_tier = None
    
    if loyalty.tier_level == "bronze":
        next_tier = TIER_CONFIG["silver"]
        points_to_next_tier = 1000 - loyalty.lifetime_points
    elif loyalty.tier_level == "silver":
        next_tier = TIER_CONFIG["gold"]
        points_to_next_tier = 5000 - loyalty.lifetime_points
    elif loyalty.tier_level == "gold":
        next_tier = TIER_CONFIG["platinum"]
        points_to_next_tier = 10000 - loyalty.lifetime_points
    
    # Count referrals
    referral_count = db.query(models.LoyaltyAccount).filter(
        models.LoyaltyAccount.referred_by == loyalty.id
    ).count()
    
    return {
        "points_balance": loyalty.points_balance,
        "lifetime_points": loyalty.lifetime_points,
        "current_tier": {
            "name": current_tier["name"],
            "discount": current_tier["discount_percentage"],
            "benefits": current_tier["benefits"]
        },
        "next_tier": {
            "name": next_tier["name"] if next_tier else None,
            "points_needed": points_to_next_tier
        } if next_tier else None,
        "total_spent": loyalty.total_spent,
        "total_orders": loyalty.total_orders,
        "referrals_made": referral_count,
        "tier_valid_until": loyalty.tier_valid_until
    }
