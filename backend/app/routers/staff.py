"""
Staff API Router
Endpoints for staff operations: orders, tables, service requests, customers
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .auth import require_role, get_current_user
from .. import models, schemas
from ..crud import staff as staff_crud

router = APIRouter(
    prefix="/api/staff",
    tags=["staff"],
    dependencies=[Depends(require_role(["admin", "manager", "staff"]))]
)


# ==================== ORDER ENDPOINTS ====================

@router.get("/orders/stats", response_model=schemas.StaffOrderStats)
async def get_staff_order_statistics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order statistics for staff dashboard"""
    return staff_crud.get_staff_order_stats(db, current_user.id)


@router.get("/orders/today")
async def get_todays_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all orders from today"""
    orders = staff_crud.get_todays_orders(db, skip, limit)
    return orders


@router.get("/orders/status/{status}")
async def get_orders_by_status(
    status: models.OrderStatus,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get orders filtered by status"""
    orders = staff_crud.get_orders_by_status(db, status, skip, limit)
    return orders


@router.get("/orders/search")
async def search_orders(
    q: str = Query(..., description="Search term for order ID, table, or customer name"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Search orders by various criteria"""
    orders = staff_crud.search_orders(db, q, skip, limit)
    return orders


# ==================== TABLE ENDPOINTS ====================

@router.get("/tables")
async def get_all_tables(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all tables with their current status"""
    tables = staff_crud.get_all_tables(db)
    return tables


@router.get("/tables/status/{status}")
async def get_tables_by_status(
    status: models.TableStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get tables filtered by status"""
    tables = staff_crud.get_tables_by_status(db, status)
    return tables


@router.get("/tables/{table_id}/details")
async def get_table_details(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get table with its current active order"""
    result = staff_crud.get_table_with_active_order(db, table_id)
    if not result:
        raise HTTPException(status_code=404, detail="Table not found")
    return result


@router.put("/tables/{table_id}/status")
async def update_table_status(
    table_id: int,
    status: models.TableStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update table status"""
    table = staff_crud.update_table_status(db, table_id, status)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


# ==================== SERVICE REQUEST ENDPOINTS ====================

@router.post("/service-requests", response_model=schemas.ServiceRequest)
async def create_service_request(
    service_request: schemas.ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new service request"""
    return staff_crud.create_service_request(db, service_request)


@router.get("/service-requests", response_model=List[schemas.ServiceRequest])
async def get_service_requests(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get service requests with optional status filter"""
    status_enum = None
    if status:
        try:
            status_enum = models.ServiceRequestStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    return staff_crud.get_service_requests(db, status_enum, None, skip, limit)


@router.get("/service-requests/my")
async def get_my_service_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get service requests assigned to current staff member"""
    return staff_crud.get_service_requests(db, None, current_user.id, skip, limit)


@router.put("/service-requests/{request_id}", response_model=schemas.ServiceRequest)
async def update_service_request(
    request_id: int,
    update_data: schemas.ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a service request"""
    request = staff_crud.update_service_request(db, request_id, update_data)
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    return request


@router.put("/service-requests/{request_id}/assign/{staff_id}")
async def assign_service_request(
    request_id: int,
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Assign a service request to a staff member"""
    request = staff_crud.assign_service_request(db, request_id, staff_id)
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    return request


@router.get("/service-requests/stats/pending")
async def get_pending_requests_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get count of pending service requests"""
    count = staff_crud.get_pending_service_requests_count(db)
    return {"pending_count": count}


# ==================== CUSTOMER ENDPOINTS ====================

@router.get("/customers/search")
async def search_customers(
    q: str = Query(..., description="Search term for name, phone, or email"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Search customers by name, phone, or email"""
    customers = staff_crud.search_customers(db, q, skip, limit)
    return customers


@router.get("/customers/phone/{phone}")
async def get_customer_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get customer by phone number"""
    customer = staff_crud.get_customer_by_phone(db, phone)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/customers/{customer_id}/orders")
async def get_customer_order_history(
    customer_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get customer's order history"""
    orders = staff_crud.get_customer_order_history(db, customer_id, skip, limit)
    return orders


# ==================== RESERVATION ENDPOINTS ====================

@router.get("/reservations/today")
async def get_todays_reservations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all reservations for today"""
    return staff_crud.get_todays_reservations(db)


@router.get("/reservations/upcoming")
async def get_upcoming_reservations(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get upcoming reservations"""
    return staff_crud.get_upcoming_reservations(db, skip, limit)


@router.put("/reservations/{reservation_id}/check-in")
async def check_in_reservation(
    reservation_id: int,
    table_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Check in a reservation and assign table"""
    reservation = staff_crud.check_in_reservation(db, reservation_id, table_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation


# ==================== MESSAGING ENDPOINTS ====================

@router.post("/messages", response_model=schemas.Message)
async def send_message(
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Send a message to another user or role"""
    # Set sender_id to current user
    message.sender_id = current_user.id
    return staff_crud.create_message(db, message)


@router.get("/messages", response_model=List[schemas.Message])
async def get_my_messages(
    message_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get messages for current user"""
    type_enum = None
    if message_type:
        try:
            type_enum = models.MessageType(message_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid message type: {message_type}")
    
    return staff_crud.get_messages_for_user(
        db, 
        current_user.id, 
        current_user.role.value,
        type_enum,
        skip, 
        limit
    )


@router.put("/messages/{message_id}/read")
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark a message as read"""
    message = staff_crud.mark_message_as_read(db, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message
