from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from .. import schemas, models
from ..database import get_db
from .auth import get_current_user, require_role

router = APIRouter(prefix="/api/coupons", tags=["coupons"])

# Create coupon
@router.post("/", response_model=schemas.Coupon)
async def create_coupon(
    coupon_data: schemas.CouponCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Create a new coupon"""
    # Check if code already exists
    existing = db.query(models.Coupon).filter(
        models.Coupon.code == coupon_data.code.upper()
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    # Validate percentage value
    if coupon_data.type == models.CouponType.percentage and coupon_data.value > 100:
        raise HTTPException(status_code=400, detail="Percentage value cannot exceed 100")
    
    # Create coupon
    coupon = models.Coupon(
        **coupon_data.model_dump(),
        code=coupon_data.code.upper(),
        created_by=current_user.id,
        current_uses=0
    )
    
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    
    return coupon

# Get all coupons
@router.get("/", response_model=List[schemas.Coupon])
async def get_coupons(
    active: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Get all coupons with optional filters"""
    query = db.query(models.Coupon)
    
    if active is not None:
        query = query.filter(models.Coupon.active == active)
    
    coupons = query.order_by(models.Coupon.created_at.desc()).offset(skip).limit(limit).all()
    return coupons

# Get coupon by ID
@router.get("/{coupon_id}", response_model=schemas.Coupon)
async def get_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Get a specific coupon by ID"""
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return coupon

# Validate coupon
@router.post("/validate", response_model=schemas.CouponValidationResponse)
async def validate_coupon(
    validation_request: schemas.CouponValidationRequest,
    db: Session = Depends(get_db)
):
    """Validate a coupon code (public endpoint for order placement)"""
    coupon = db.query(models.Coupon).filter(
        models.Coupon.code == validation_request.code.upper()
    ).first()
    
    if not coupon:
        return schemas.CouponValidationResponse(
            valid=False,
            message="Invalid coupon code"
        )
    
    # Check if active
    if not coupon.active:
        return schemas.CouponValidationResponse(
            valid=False,
            message="This coupon is no longer active"
        )
    
    # Check expiry
    if coupon.expiry_date and coupon.expiry_date < datetime.now():
        return schemas.CouponValidationResponse(
            valid=False,
            message="This coupon has expired"
        )
    
    # Check usage limit
    if coupon.max_uses and coupon.current_uses >= coupon.max_uses:
        return schemas.CouponValidationResponse(
            valid=False,
            message="Coupon usage limit reached"
        )
    
    # Check minimum order value
    if validation_request.order_total < coupon.min_order_value:
        return schemas.CouponValidationResponse(
            valid=False,
            message=f"Minimum order value of ₹{coupon.min_order_value} required"
        )
    
    # Calculate discount
    if coupon.type == models.CouponType.percentage:
        discount = (validation_request.order_total * coupon.value) / 100
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:  # fixed
        discount = coupon.value
    
    # Ensure discount doesn't exceed order total
    discount = min(discount, validation_request.order_total)
    
    return schemas.CouponValidationResponse(
        valid=True,
        message=f"Coupon valid! You save ₹{discount:.2f}",
        discount_amount=discount,
        coupon=coupon
    )

# Update coupon
@router.put("/{coupon_id}", response_model=schemas.Coupon)
async def update_coupon(
    coupon_id: int,
    coupon_data: schemas.CouponUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Update coupon details"""
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Update fields
    update_data = coupon_data.model_dump(exclude_unset=True)
    
    # Validate percentage if being updated
    if "value" in update_data and coupon.type == models.CouponType.percentage:
        if update_data["value"] > 100:
            raise HTTPException(status_code=400, detail="Percentage value cannot exceed 100")
    
    for field, value in update_data.items():
        setattr(coupon, field, value)
    
    db.commit()
    db.refresh(coupon)
    
    return coupon

# Toggle coupon active status
@router.patch("/{coupon_id}/toggle", response_model=schemas.Coupon)
async def toggle_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Toggle coupon active/inactive status"""
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    coupon.active = not coupon.active
    
    db.commit()
    db.refresh(coupon)
    
    return coupon

# Get coupon statistics
@router.get("/stats/summary", response_model=schemas.CouponStats)
async def get_coupon_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Get overall coupon statistics"""
    total_coupons = db.query(func.count(models.Coupon.id)).scalar()
    active_coupons = db.query(func.count(models.Coupon.id)).filter(
        models.Coupon.active == True
    ).scalar()
    
    # Total redemptions
    total_redemptions = db.query(func.sum(models.Coupon.current_uses)).scalar() or 0
    
    # Total discount given (from bills with coupons)
    total_discount = db.query(func.sum(models.Bill.discount)).filter(
        models.Bill.coupon_id.isnot(None)
    ).scalar() or 0.0
    
    return schemas.CouponStats(
        total_coupons=total_coupons,
        active_coupons=active_coupons,
        total_redemptions=total_redemptions,
        total_discount_given=total_discount
    )

# Delete coupon
@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Delete a coupon"""
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Check if coupon is used in any bills
    bills_count = db.query(func.count(models.Bill.id)).filter(
        models.Bill.coupon_id == coupon_id
    ).scalar()
    
    if bills_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete coupon. It has been used in {bills_count} bills. Consider deactivating instead."
        )
    
    db.delete(coupon)
    db.commit()
    
    return {"message": "Coupon deleted successfully"}
