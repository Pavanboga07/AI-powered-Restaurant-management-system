from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date
from .. import models, schemas
from ..database import get_db
from .auth import get_current_user
from ..websocket import broadcast_new_order, broadcast_order_ready, broadcast_order_status_changed

router = APIRouter(prefix="/api/orders", tags=["orders"])

# ============ Create Order ============
@router.post("/", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
async def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new order with items"""
    table = db.query(models.Table).filter(models.Table.id == order.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    total_amount = 0.0
    db_order = models.Order(
        table_id=order.table_id,
        customer_name=order.customer_name,
        special_notes=order.special_notes,
        created_by=current_user.id,
        status=models.OrderStatus.pending,
        total_amount=0.0
    )
    db.add(db_order)
    db.flush()
    
    for item in order.items:
        menu_item = db.query(models.MenuItem).filter(
            models.MenuItem.id == item.menu_item_id
        ).first()
        
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item.menu_item_id} not found")
        if not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"{menu_item.name} is currently unavailable")
        
        item_total = menu_item.price * item.quantity
        total_amount += item_total
        
        order_item = models.OrderItem(
            order_id=db_order.id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity,
            price=menu_item.price,
            special_instructions=item.special_instructions
        )
        db.add(order_item)
    
    db_order.total_amount = total_amount
    table.status = models.TableStatus.occupied
    
    db.commit()
    db.refresh(db_order)
    
    db_order = db.query(models.Order).options(
        joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Order.table),
        joinedload(models.Order.bill)
    ).filter(models.Order.id == db_order.id).first()
    
    # Broadcast new order to chef room via WebSocket
    await broadcast_new_order({
        "id": db_order.id,
        "table_number": db_order.table.table_number,
        "customer_name": db_order.customer_name,
        "total_amount": float(db_order.total_amount),
        "status": db_order.status.value,
        "items": [
            {
                "name": item.menu_item.name,
                "quantity": item.quantity,
                "special_instructions": item.special_instructions
            }
            for item in db_order.order_items
        ],
        "special_notes": db_order.special_notes,
        "created_at": db_order.created_at.isoformat()
    })
    
    return db_order

# ============ Get Orders (with filters) ============
@router.get("/", response_model=List[schemas.Order])
async def get_orders(
    status: Optional[str] = Query(None),
    table_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get list of orders with optional filters"""
    query = db.query(models.Order).options(
        joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Order.table),
        joinedload(models.Order.bill)
    )
    
    if status:
        try:
            status_enum = models.OrderStatus(status)
            query = query.filter(models.Order.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    if table_id:
        query = query.filter(models.Order.table_id == table_id)
    
    if date_from:
        query = query.filter(func.date(models.Order.created_at) >= date_from)
    
    if date_to:
        query = query.filter(func.date(models.Order.created_at) <= date_to)
    
    if search:
        try:
            order_id = int(search)
            query = query.filter(models.Order.id == order_id)
        except ValueError:
            query = query.filter(models.Order.customer_name.ilike(f"%{search}%"))
    
    query = query.order_by(models.Order.created_at.desc())
    orders = query.offset(skip).limit(limit).all()
    
    return orders

# ============ Get Single Order ============
@router.get("/{order_id}", response_model=schemas.Order)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a single order by ID"""
    order = db.query(models.Order).options(
        joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Order.table),
        joinedload(models.Order.bill)
    ).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

# ============ Update Order Status ============
@router.patch("/{order_id}/status", response_model=schemas.Order)
async def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update order status"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_status = status_update.status
    order.status = new_status
    
    if new_status == models.OrderStatus.preparing and not order.started_at:
        order.started_at = datetime.utcnow()
    
    # Auto-generate bill when order is marked as served
    if new_status == models.OrderStatus.served:
        # Check if bill already exists
        existing_bill = db.query(models.Bill).filter(
            models.Bill.order_id == order_id
        ).first()
        
        if not existing_bill:
            # Auto-generate bill with 5% tax
            subtotal = order.total_amount
            tax_percentage = 5.0
            tax = (subtotal * tax_percentage) / 100
            
            bill = models.Bill(
                order_id=order_id,
                subtotal=subtotal,
                tax=tax,
                tax_percentage=tax_percentage,
                discount=0.0,
                total=subtotal + tax,
                payment_status=models.PaymentStatus.pending,
                split_count=1,
                notes=f"Auto-generated bill for Order #{order_id}"
            )
            db.add(bill)
            db.flush()  # Get bill ID without committing yet
    
    if new_status == models.OrderStatus.completed:
        order.completed_at = datetime.utcnow()
        
        if order.table:
            active_orders = db.query(models.Order).filter(
                and_(
                    models.Order.table_id == order.table_id,
                    models.Order.id != order.id,
                    models.Order.status.in_([
                        models.OrderStatus.pending,
                        models.OrderStatus.confirmed,
                        models.OrderStatus.preparing,
                        models.OrderStatus.ready,
                        models.OrderStatus.served
                    ])
                )
            ).count()
            
            if active_orders == 0:
                order.table.status = models.TableStatus.available
    
    db.commit()
    db.refresh(order)
    
    order = db.query(models.Order).options(
        joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Order.table),
        joinedload(models.Order.bill)
    ).filter(models.Order.id == order_id).first()
    
    # Broadcast order status change via WebSocket
    order_data = {
        "id": order.id,
        "table_number": order.table.table_number if order.table else None,
        "customer_name": order.customer_name,
        "total_amount": float(order.total_amount),
        "status": order.status.value,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None
    }
    
    # Broadcast to appropriate room based on status
    if new_status == models.OrderStatus.ready:
        await broadcast_order_ready(order_data)
    
    await broadcast_order_status_changed(order_data)
    
    return order

# ============ Cancel Order ============
@router.delete("/{order_id}", response_model=schemas.Order)
async def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Cancel an order"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status not in [models.OrderStatus.pending, models.OrderStatus.confirmed]:
        raise HTTPException(status_code=400, detail="Cannot cancel order that is already being prepared or completed")
    
    order.status = models.OrderStatus.cancelled
    
    if order.table:
        active_orders = db.query(models.Order).filter(
            and_(
                models.Order.table_id == order.table_id,
                models.Order.id != order.id,
                models.Order.status.in_([
                    models.OrderStatus.pending,
                    models.OrderStatus.confirmed,
                    models.OrderStatus.preparing,
                    models.OrderStatus.ready,
                    models.OrderStatus.served
                ])
            )
        ).count()
        
        if active_orders == 0:
            order.table.status = models.TableStatus.available
    
    db.commit()
    db.refresh(order)
    
    order = db.query(models.Order).options(
        joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Order.table),
        joinedload(models.Order.bill)
    ).filter(models.Order.id == order_id).first()
    
    return order

# ============ Get Order Statistics ============
@router.get("/stats/summary", response_model=schemas.OrderStats)
async def get_order_stats(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get order statistics"""
    query = db.query(models.Order)
    
    if date_from:
        query = query.filter(func.date(models.Order.created_at) >= date_from)
    
    if date_to:
        query = query.filter(func.date(models.Order.created_at) <= date_to)
    
    orders = query.all()
    
    total_orders = len(orders)
    pending_orders = sum(1 for o in orders if o.status == models.OrderStatus.pending)
    confirmed_orders = sum(1 for o in orders if o.status == models.OrderStatus.confirmed)
    preparing_orders = sum(1 for o in orders if o.status == models.OrderStatus.preparing)
    ready_orders = sum(1 for o in orders if o.status == models.OrderStatus.ready)
    served_orders = sum(1 for o in orders if o.status == models.OrderStatus.served)
    completed_orders = sum(1 for o in orders if o.status == models.OrderStatus.completed)
    cancelled_orders = sum(1 for o in orders if o.status == models.OrderStatus.cancelled)
    
    total_revenue = sum(o.total_amount for o in orders if o.status != models.OrderStatus.cancelled)
    
    average_order_value = (
        total_revenue / (total_orders - cancelled_orders)
        if (total_orders - cancelled_orders) > 0
        else 0.0
    )
    
    return schemas.OrderStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        confirmed_orders=confirmed_orders,
        preparing_orders=preparing_orders,
        ready_orders=ready_orders,
        served_orders=served_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        total_revenue=round(total_revenue, 2),
        average_order_value=round(average_order_value, 2)
    )
