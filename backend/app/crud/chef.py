from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from datetime import datetime, date, timedelta
from typing import List, Optional
from .. import models, schemas

# ============ Order Management ============
def get_active_orders(db: Session, skip: int = 0, limit: int = 100):
    """Get orders with status: pending, preparing, ready"""
    return db.query(models.Order).filter(
        models.Order.status.in_([
            models.OrderStatus.pending,
            models.OrderStatus.preparing,
            models.OrderStatus.ready
        ])
    ).order_by(models.Order.created_at).offset(skip).limit(limit).all()

def update_order_status(db: Session, order_id: int, status: models.OrderStatus):
    """Update order status and set timestamps"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        return None
    
    order.status = status
    
    # Set started_at when status changes to preparing
    if status == models.OrderStatus.preparing and not order.started_at:
        order.started_at = datetime.utcnow()
    
    # Set completed_at when status changes to ready or served
    if status in [models.OrderStatus.ready, models.OrderStatus.served] and not order.completed_at:
        order.completed_at = datetime.utcnow()
    
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order

def get_chef_order_stats(db: Session):
    """Get chef's order statistics for today"""
    today = date.today()
    
    # Active orders count
    active_orders = db.query(models.Order).filter(
        models.Order.status.in_([
            models.OrderStatus.pending,
            models.OrderStatus.preparing,
            models.OrderStatus.ready
        ])
    ).count()
    
    # Orders prepared today
    orders_prepared_today = db.query(models.Order).filter(
        and_(
            func.date(models.Order.created_at) == today,
            models.Order.status.in_([
                models.OrderStatus.ready,
                models.OrderStatus.served,
                models.OrderStatus.completed
            ])
        )
    ).count()
    
    # Average prep time
    completed_orders = db.query(models.Order).filter(
        and_(
            func.date(models.Order.created_at) == today,
            models.Order.started_at.isnot(None),
            models.Order.completed_at.isnot(None)
        )
    ).all()
    
    avg_prep_time = 0.0
    if completed_orders:
        total_time = sum([
            (order.completed_at - order.started_at).total_seconds() / 60
            for order in completed_orders
        ])
        avg_prep_time = total_time / len(completed_orders)
    
    # Orders by status
    orders_by_status = {}
    for status in [models.OrderStatus.pending, models.OrderStatus.preparing, models.OrderStatus.ready]:
        count = db.query(models.Order).filter(
            and_(
                models.Order.status == status,
                func.date(models.Order.created_at) == today
            )
        ).count()
        orders_by_status[status.value] = count
    
    return {
        "active_orders": active_orders,
        "orders_prepared_today": orders_prepared_today,
        "avg_prep_time": round(avg_prep_time, 2),
        "orders_by_status": orders_by_status
    }

# ============ Menu Item Control ============
def toggle_menu_item_availability(db: Session, menu_item_id: int, is_available: bool):
    """Toggle menu item availability"""
    menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == menu_item_id).first()
    if not menu_item:
        return None
    
    menu_item.is_available = is_available
    menu_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(menu_item)
    return menu_item

def get_menu_items(db: Session, skip: int = 0, limit: int = 100):
    """Get all menu items"""
    return db.query(models.MenuItem).offset(skip).limit(limit).all()

# ============ Messaging ============
def create_message(db: Session, sender_id: int, message_data: schemas.MessageCreate):
    """Create a new message"""
    db_message = models.Message(
        sender_id=sender_id,
        recipient_id=message_data.recipient_id,
        recipient_role=message_data.recipient_role,
        message=message_data.message,
        type=message_data.type
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages_for_user(db: Session, user_id: int, user_role: models.UserRole, skip: int = 0, limit: int = 50):
    """Get messages for a specific user (direct messages + role-based broadcasts)"""
    messages = db.query(models.Message).filter(
        or_(
            models.Message.recipient_id == user_id,
            models.Message.recipient_role == user_role
        )
    ).order_by(models.Message.created_at.desc()).offset(skip).limit(limit).all()
    return messages

def mark_message_as_read(db: Session, message_id: int, user_id: int):
    """Mark a message as read"""
    message = db.query(models.Message).filter(
        and_(
            models.Message.id == message_id,
            or_(
                models.Message.recipient_id == user_id,
                models.Message.recipient_role.isnot(None)
            )
        )
    ).first()
    
    if not message:
        return None
    
    message.is_read = True
    message.read_at = datetime.utcnow()
    db.commit()
    db.refresh(message)
    return message

# ============ Shift Handover ============
def create_shift_handover(db: Session, handover_data: schemas.ShiftHandoverCreate):
    """Create a shift handover report"""
    db_handover = models.ShiftHandover(**handover_data.dict())
    db.add(db_handover)
    db.commit()
    db.refresh(db_handover)
    return db_handover

def get_latest_shift_handover(db: Session):
    """Get the most recent shift handover"""
    return db.query(models.ShiftHandover).order_by(
        models.ShiftHandover.created_at.desc()
    ).first()

def get_shift_handover_history(db: Session, skip: int = 0, limit: int = 20):
    """Get shift handover history"""
    return db.query(models.ShiftHandover).order_by(
        models.ShiftHandover.created_at.desc()
    ).offset(skip).limit(limit).all()

def get_shift_handover_by_date(db: Session, shift_date: date):
    """Get shift handover for a specific date"""
    return db.query(models.ShiftHandover).filter(
        models.ShiftHandover.shift_date == shift_date
    ).all()
