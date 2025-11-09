"""
CRUD operations for staff-related features
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta, date
from typing import List, Optional
from .. import models, schemas


# ==================== ORDER OPERATIONS ====================

def get_orders_by_status(db: Session, status: models.OrderStatus, skip: int = 0, limit: int = 100):
    """Get orders filtered by status"""
    return db.query(models.Order).filter(
        models.Order.status == status
    ).offset(skip).limit(limit).all()


def get_todays_orders(db: Session, skip: int = 0, limit: int = 100):
    """Get all orders from today"""
    today = date.today()
    return db.query(models.Order).filter(
        func.date(models.Order.created_at) == today
    ).offset(skip).limit(limit).all()


def search_orders(db: Session, search_term: str, skip: int = 0, limit: int = 20):
    """Search orders by order ID, table number, or customer name"""
    return db.query(models.Order).filter(
        or_(
            models.Order.customer_name.ilike(f"%{search_term}%"),
            models.Order.special_notes.ilike(f"%{search_term}%")
        )
    ).offset(skip).limit(limit).all()


def get_staff_order_stats(db: Session, staff_id: Optional[int] = None):
    """Get order statistics for staff dashboard"""
    today = date.today()
    
    # Active orders (not completed or cancelled)
    active_statuses = [models.OrderStatus.pending, models.OrderStatus.confirmed, 
                      models.OrderStatus.preparing, models.OrderStatus.ready, 
                      models.OrderStatus.served]
    active_orders = db.query(func.count(models.Order.id)).filter(
        models.Order.status.in_(active_statuses)
    ).scalar() or 0
    
    # Orders created today
    todays_orders = db.query(func.count(models.Order.id)).filter(
        func.date(models.Order.created_at) == today
    ).scalar() or 0
    
    # Completed orders today
    completed_today = db.query(func.count(models.Order.id)).filter(
        and_(
            func.date(models.Order.created_at) == today,
            models.Order.status == models.OrderStatus.completed
        )
    ).scalar() or 0
    
    # Pending orders
    pending_orders = db.query(func.count(models.Order.id)).filter(
        models.Order.status == models.OrderStatus.pending
    ).scalar() or 0
    
    return {
        "active_orders": active_orders,
        "todays_orders": todays_orders,
        "completed_today": completed_today,
        "pending_orders": pending_orders
    }


# ==================== TABLE OPERATIONS ====================

def get_all_tables(db: Session):
    """Get all tables with their current status"""
    return db.query(models.Table).order_by(models.Table.table_number).all()


def get_tables_by_status(db: Session, status: models.TableStatus):
    """Get tables filtered by status"""
    return db.query(models.Table).filter(
        models.Table.status == status
    ).order_by(models.Table.table_number).all()


def update_table_status(db: Session, table_id: int, status: models.TableStatus):
    """Update table status"""
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if table:
        table.status = status
        table.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(table)
    return table


def get_table_with_active_order(db: Session, table_id: int):
    """Get table with its current active order"""
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if not table:
        return None
    
    # Get active order for this table
    active_order = db.query(models.Order).filter(
        and_(
            models.Order.table_id == table_id,
            models.Order.status.in_([
                models.OrderStatus.pending,
                models.OrderStatus.confirmed,
                models.OrderStatus.preparing,
                models.OrderStatus.ready,
                models.OrderStatus.served
            ])
        )
    ).first()
    
    return {
        "table": table,
        "active_order": active_order
    }


# ==================== SERVICE REQUEST OPERATIONS ====================

def create_service_request(db: Session, service_request: schemas.ServiceRequestCreate):
    """Create a new service request"""
    db_request = models.ServiceRequest(**service_request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request


def get_service_requests(
    db: Session, 
    status: Optional[models.ServiceRequestStatus] = None,
    staff_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100
):
    """Get service requests with optional filters"""
    query = db.query(models.ServiceRequest)
    
    if status:
        query = query.filter(models.ServiceRequest.status == status)
    if staff_id:
        query = query.filter(models.ServiceRequest.staff_id == staff_id)
    
    return query.order_by(desc(models.ServiceRequest.created_at)).offset(skip).limit(limit).all()


def update_service_request(
    db: Session, 
    request_id: int, 
    update_data: schemas.ServiceRequestUpdate
):
    """Update a service request"""
    db_request = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.id == request_id
    ).first()
    
    if not db_request:
        return None
    
    update_dict = update_data.dict(exclude_unset=True)
    
    # Set resolved_at if status changed to resolved
    if update_data.status == models.ServiceRequestStatus.resolved:
        update_dict["resolved_at"] = datetime.utcnow()
    
    for key, value in update_dict.items():
        setattr(db_request, key, value)
    
    db_request.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_request)
    return db_request


def assign_service_request(db: Session, request_id: int, staff_id: int):
    """Assign a service request to a staff member"""
    db_request = db.query(models.ServiceRequest).filter(
        models.ServiceRequest.id == request_id
    ).first()
    
    if db_request:
        db_request.staff_id = staff_id
        db_request.status = models.ServiceRequestStatus.in_progress
        db_request.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_request)
    
    return db_request


def get_pending_service_requests_count(db: Session):
    """Get count of pending service requests"""
    return db.query(func.count(models.ServiceRequest.id)).filter(
        models.ServiceRequest.status == models.ServiceRequestStatus.pending
    ).scalar() or 0


# ==================== CUSTOMER OPERATIONS ====================

def search_customers(db: Session, search_term: str, skip: int = 0, limit: int = 20):
    """Search customers by name, phone, or email"""
    # Search in User table (linked via customer.user_id)
    users = db.query(models.User).join(models.Customer).filter(
        or_(
            models.User.full_name.ilike(f"%{search_term}%"),
            models.User.email.ilike(f"%{search_term}%"),
            models.Customer.phone.ilike(f"%{search_term}%")
        )
    ).offset(skip).limit(limit).all()
    
    return users


def get_customer_by_phone(db: Session, phone: str):
    """Get customer by phone number"""
    customer = db.query(models.Customer).filter(
        models.Customer.phone == phone
    ).first()
    return customer


def get_customer_order_history(db: Session, customer_id: int, skip: int = 0, limit: int = 10):
    """Get customer's order history"""
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        return []
    
    # Get orders associated with this customer (assuming we track customer_id in orders)
    # For now, we'll search by customer name since that's what we have
    user = db.query(models.User).filter(models.User.id == customer.user_id).first()
    if not user:
        return []
    
    orders = db.query(models.Order).filter(
        models.Order.customer_name == user.full_name
    ).order_by(desc(models.Order.created_at)).offset(skip).limit(limit).all()
    
    return orders


# ==================== RESERVATION OPERATIONS ====================

def get_todays_reservations(db: Session):
    """Get all reservations for today"""
    today = date.today()
    return db.query(models.Reservation).filter(
        models.Reservation.reservation_date == today
    ).order_by(models.Reservation.reservation_time).all()


def get_upcoming_reservations(db: Session, skip: int = 0, limit: int = 20):
    """Get upcoming reservations"""
    now = datetime.utcnow()
    return db.query(models.Reservation).filter(
        models.Reservation.reservation_date >= now.date(),
        models.Reservation.status.in_([
            models.ReservationStatus.pending,
            models.ReservationStatus.confirmed
        ])
    ).order_by(
        models.Reservation.reservation_date,
        models.Reservation.reservation_time
    ).offset(skip).limit(limit).all()


def check_in_reservation(db: Session, reservation_id: int, table_id: int):
    """Check in a reservation and assign table"""
    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        return None
    
    # Update reservation status
    reservation.status = models.ReservationStatus.seated
    reservation.table_id = table_id
    
    # Update table status
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if table:
        table.status = models.TableStatus.occupied
    
    db.commit()
    db.refresh(reservation)
    return reservation


# ==================== INVENTORY OPERATIONS ====================

def get_low_stock_items(db: Session, threshold: int = 10):
    """Get inventory items that are low in stock (placeholder - implement when inventory model exists)"""
    # This is a placeholder - implement when you have an inventory model
    return []


# ==================== MESSAGING (reuse from chef) ====================

def create_message(db: Session, message: schemas.MessageCreate):
    """Create a new message"""
    db_message = models.Message(**message.dict())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_messages_for_user(
    db: Session, 
    user_id: int, 
    recipient_role: Optional[str] = None,
    message_type: Optional[models.MessageType] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get messages for a specific user"""
    query = db.query(models.Message).filter(
        or_(
            models.Message.recipient_id == user_id,
            models.Message.recipient_role == recipient_role
        )
    )
    
    if message_type:
        query = query.filter(models.Message.type == message_type)
    
    return query.order_by(desc(models.Message.created_at)).offset(skip).limit(limit).all()


def mark_message_as_read(db: Session, message_id: int):
    """Mark a message as read"""
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if message:
        message.is_read = True
        db.commit()
        db.refresh(message)
    return message
