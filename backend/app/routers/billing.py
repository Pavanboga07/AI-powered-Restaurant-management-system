from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from .. import schemas, models
from ..database import get_db
from .auth import get_current_user, require_role

router = APIRouter(prefix="/api/billing", tags=["billing"])

# Generate bill from order
@router.post("/", response_model=schemas.BillWithDetails)
async def create_bill(
    bill_data: schemas.BillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Generate bill from an order"""
    # Check if order exists
    order = db.query(models.Order).filter(models.Order.id == bill_data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if bill already exists for this order
    existing_bill = db.query(models.Bill).filter(models.Bill.order_id == bill_data.order_id).first()
    if existing_bill:
        raise HTTPException(status_code=400, detail="Bill already exists for this order")
    
    # Calculate subtotal from order items
    subtotal = order.total_amount
    
    # Calculate tax
    tax = (subtotal * bill_data.tax_percentage) / 100
    
    # Create bill
    bill = models.Bill(
        order_id=bill_data.order_id,
        subtotal=subtotal,
        tax=tax,
        tax_percentage=bill_data.tax_percentage,
        discount=0.0,
        total=subtotal + tax,
        payment_status=models.PaymentStatus.pending,
        split_count=1,
        notes=bill_data.notes
    )
    
    db.add(bill)
    db.commit()
    db.refresh(bill)
    
    # Load order relationship
    bill.order = order
    bill.amount_per_person = bill.total / bill.split_count
    
    return bill

# Get all bills
@router.get("/", response_model=List[schemas.Bill])
async def get_bills(
    payment_status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Get all bills with optional filters"""
    query = db.query(models.Bill)
    
    if payment_status:
        query = query.filter(models.Bill.payment_status == payment_status)
    
    bills = query.order_by(models.Bill.created_at.desc()).offset(skip).limit(limit).all()
    return bills

# Get bill by ID
@router.get("/{bill_id}", response_model=schemas.BillWithDetails)
async def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Get a specific bill by ID"""
    bill = db.query(models.Bill).options(
        joinedload(models.Bill.order).joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Bill.order).joinedload(models.Order.table),
        joinedload(models.Bill.coupon)
    ).filter(models.Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    bill.amount_per_person = bill.total / bill.split_count
    return bill

# Get bill by order ID
@router.get("/order/{order_id}", response_model=schemas.BillWithDetails)
async def get_bill_by_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Get bill for a specific order"""
    bill = db.query(models.Bill).options(
        joinedload(models.Bill.order).joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Bill.order).joinedload(models.Order.table),
        joinedload(models.Bill.coupon)
    ).filter(models.Bill.order_id == order_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found for this order")
    
    bill.amount_per_person = bill.total / bill.split_count
    return bill

# Apply coupon to bill
@router.post("/{bill_id}/apply-coupon", response_model=schemas.BillWithDetails)
async def apply_coupon(
    bill_id: int,
    coupon_request: schemas.ApplyCouponRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Apply a coupon code to the bill"""
    # Get bill
    bill = db.query(models.Bill).options(
        joinedload(models.Bill.order)
    ).filter(models.Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if bill.payment_status != models.PaymentStatus.pending:
        raise HTTPException(status_code=400, detail="Cannot apply coupon to paid/failed bill")
    
    # Get coupon
    coupon = db.query(models.Coupon).filter(
        models.Coupon.code == coupon_request.coupon_code.upper()
    ).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Validate coupon
    if not coupon.active:
        raise HTTPException(status_code=400, detail="Coupon is inactive")
    
    if coupon.expiry_date and coupon.expiry_date < datetime.now():
        raise HTTPException(status_code=400, detail="Coupon has expired")
    
    if coupon.max_uses and coupon.current_uses >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    if bill.subtotal < coupon.min_order_value:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value of ₹{coupon.min_order_value} required"
        )
    
    # Calculate discount
    if coupon.type == models.CouponType.percentage:
        discount = (bill.subtotal * coupon.value) / 100
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:  # fixed
        discount = coupon.value
    
    # Ensure discount doesn't exceed subtotal
    discount = min(discount, bill.subtotal)
    
    # Update bill
    bill.coupon_id = coupon.id
    bill.discount = discount
    bill.total = bill.subtotal + bill.tax - discount
    
    # Increment coupon usage
    coupon.current_uses += 1
    
    db.commit()
    db.refresh(bill)
    
    bill.amount_per_person = bill.total / bill.split_count
    return bill

# Remove coupon from bill
@router.delete("/{bill_id}/remove-coupon", response_model=schemas.BillWithDetails)
async def remove_coupon(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Remove coupon from bill"""
    bill = db.query(models.Bill).options(
        joinedload(models.Bill.order),
        joinedload(models.Bill.coupon)
    ).filter(models.Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if not bill.coupon_id:
        raise HTTPException(status_code=400, detail="No coupon applied to this bill")
    
    if bill.payment_status != models.PaymentStatus.pending:
        raise HTTPException(status_code=400, detail="Cannot remove coupon from paid/failed bill")
    
    # Decrement coupon usage
    coupon = bill.coupon
    if coupon:
        coupon.current_uses = max(0, coupon.current_uses - 1)
    
    # Remove coupon
    bill.coupon_id = None
    bill.discount = 0.0
    bill.total = bill.subtotal + bill.tax
    
    db.commit()
    db.refresh(bill)
    
    bill.amount_per_person = bill.total / bill.split_count
    return bill

# Split bill
@router.post("/{bill_id}/split", response_model=schemas.BillWithDetails)
async def split_bill(
    bill_id: int,
    split_request: schemas.SplitBillRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Split bill among multiple people"""
    bill = db.query(models.Bill).options(
        joinedload(models.Bill.order)
    ).filter(models.Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if bill.payment_status != models.PaymentStatus.pending:
        raise HTTPException(status_code=400, detail="Cannot split paid/failed bill")
    
    bill.split_count = split_request.split_count
    
    db.commit()
    db.refresh(bill)
    
    bill.amount_per_person = bill.total / bill.split_count
    return bill

# Update payment
@router.put("/{bill_id}/payment", response_model=schemas.BillWithDetails)
async def update_payment(
    bill_id: int,
    payment_data: schemas.BillUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Update payment method and status"""
    bill = db.query(models.Bill).options(
        joinedload(models.Bill.order)
    ).filter(models.Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Update payment method
    if payment_data.payment_method:
        bill.payment_method = payment_data.payment_method
    
    # Update payment status
    if payment_data.payment_status:
        bill.payment_status = payment_data.payment_status
        if payment_data.payment_status == models.PaymentStatus.paid:
            bill.paid_at = datetime.now()
    
    # Update notes
    if payment_data.notes is not None:
        bill.notes = payment_data.notes
    
    db.commit()
    db.refresh(bill)
    
    bill.amount_per_person = bill.total / bill.split_count
    return bill

# Delete bill (admin only)
@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Delete a bill (admin only)"""
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if bill.payment_status == models.PaymentStatus.paid:
        raise HTTPException(status_code=400, detail="Cannot delete paid bill")
    
    db.delete(bill)
    db.commit()
    
    return {"message": "Bill deleted successfully"}

# Get billing statistics
@router.get("/stats/summary", response_model=schemas.BillingStats)
async def get_billing_stats(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "staff"]))
):
    """Get billing and revenue statistics from paid bills only"""
    # Query all bills
    all_bills_query = db.query(models.Bill)
    
    # Query paid bills
    paid_bills_query = db.query(models.Bill).filter(
        models.Bill.payment_status == models.PaymentStatus.paid
    )
    
    # Apply date filters if provided (using paid_at for paid bills)
    if date_from:
        paid_bills_query = paid_bills_query.filter(func.date(models.Bill.paid_at) >= date_from)
        all_bills_query = all_bills_query.filter(func.date(models.Bill.created_at) >= date_from)
    if date_to:
        paid_bills_query = paid_bills_query.filter(func.date(models.Bill.paid_at) <= date_to)
        all_bills_query = all_bills_query.filter(func.date(models.Bill.created_at) <= date_to)
    
    paid_bills = paid_bills_query.all()
    all_bills = all_bills_query.all()
    
    # Calculate revenue from paid bills only
    total_revenue = sum(float(b.total) for b in paid_bills)
    total_paid_orders = len(paid_bills)
    average_order_value = total_revenue / total_paid_orders if total_paid_orders > 0 else 0.0
    
    # Payment method breakdown (only from paid bills)
    cash_count = sum(1 for b in paid_bills if b.payment_method == models.PaymentMethod.cash)
    card_count = sum(1 for b in paid_bills if b.payment_method == models.PaymentMethod.card)
    upi_count = sum(1 for b in paid_bills if b.payment_method == models.PaymentMethod.upi)
    online_count = sum(1 for b in paid_bills if b.payment_method == models.PaymentMethod.online)
    
    # Count bills by status
    pending_bills = sum(1 for b in all_bills if b.payment_status == models.PaymentStatus.pending)
    failed_bills = sum(1 for b in all_bills if b.payment_status == models.PaymentStatus.failed)
    
    return schemas.BillingStats(
        total_revenue=round(total_revenue, 2),
        total_paid_orders=total_paid_orders,
        average_order_value=round(average_order_value, 2),
        payment_methods=schemas.PaymentMethodBreakdown(
            cash=cash_count,
            card=card_count,
            upi=upi_count,
            online=online_count
        ),
        pending_bills=pending_bills,
        failed_bills=failed_bills
    )
