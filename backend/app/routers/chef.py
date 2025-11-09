from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db
from .auth import get_current_user, require_role

router = APIRouter(prefix="/api/chef", tags=["Chef"])

# ============ Order Management ============
@router.get("/orders/active", response_model=List[schemas.Order])
async def get_active_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Get orders with status: pending, preparing, ready"""
    from ..crud import chef as chef_crud
    return chef_crud.get_active_orders(db, skip=skip, limit=limit)

@router.put("/orders/{order_id}/status", response_model=schemas.Order)
async def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Update order status (preparing, ready, served)"""
    from ..crud import chef as chef_crud
    
    # Validate status transitions
    allowed_statuses = [
        models.OrderStatus.preparing,
        models.OrderStatus.ready,
        models.OrderStatus.served
    ]
    
    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {[s.value for s in allowed_statuses]}"
        )
    
    order = chef_crud.update_order_status(db, order_id, status_update.status)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order

@router.get("/orders/stats", response_model=schemas.OrderStats)
async def get_chef_order_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Get today's order statistics"""
    from ..crud import chef as chef_crud
    return chef_crud.get_chef_order_stats(db)

# ============ Menu Item Control ============
@router.patch("/menu/{menu_item_id}/toggle", response_model=schemas.MenuItem)
async def toggle_menu_item_availability(
    menu_item_id: int,
    toggle_data: schemas.MenuItemToggle,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Toggle dish availability (mark as sold out)"""
    from ..crud import chef as chef_crud
    menu_item = chef_crud.toggle_menu_item_availability(
        db, menu_item_id, toggle_data.is_available
    )
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return menu_item

@router.get("/menu/items", response_model=List[schemas.MenuItem])
async def get_menu_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Get menu items"""
    from ..crud import chef as chef_crud
    return chef_crud.get_menu_items(db, skip=skip, limit=limit)

# ============ Kitchen Communication ============
@router.post("/messages", response_model=schemas.Message, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager", "staff"]))
):
    """Send message to staff/manager"""
    from ..crud import chef as chef_crud
    
    # Validate message type
    allowed_types = ["info", "urgent", "request"]
    if message_data.type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid message type. Allowed: {allowed_types}"
        )
    
    return chef_crud.create_message(db, current_user.id, message_data)

@router.get("/messages", response_model=List[schemas.Message])
async def get_messages(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager", "staff"]))
):
    """Get received messages"""
    from ..crud import chef as chef_crud
    return chef_crud.get_messages_for_user(
        db, current_user.id, current_user.role, skip=skip, limit=limit
    )

@router.patch("/messages/{message_id}/read", response_model=schemas.Message)
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager", "staff"]))
):
    """Mark message as read"""
    from ..crud import chef as chef_crud
    message = chef_crud.mark_message_as_read(db, message_id, current_user.id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or unauthorized"
        )
    return message

# ============ Shift Handover ============
@router.post("/shift-handover", response_model=schemas.ShiftHandover, status_code=status.HTTP_201_CREATED)
async def create_shift_handover(
    handover_data: schemas.ShiftHandoverCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Create shift handover report"""
    from ..crud import chef as chef_crud
    
    # Set chef_id to current user
    handover_data.chef_id = current_user.id
    
    return chef_crud.create_shift_handover(db, handover_data)

@router.get("/shift-handover/latest", response_model=schemas.ShiftHandover)
async def get_latest_shift_handover(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Get latest handover report"""
    from ..crud import chef as chef_crud
    handover = chef_crud.get_latest_shift_handover(db)
    if not handover:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No handover reports found"
        )
    return handover

@router.get("/shift-handover/history", response_model=List[schemas.ShiftHandover])
async def get_shift_handover_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["chef", "manager"]))
):
    """Get all handover reports"""
    from ..crud import chef as chef_crud
    return chef_crud.get_shift_handover_history(db, skip=skip, limit=limit)
