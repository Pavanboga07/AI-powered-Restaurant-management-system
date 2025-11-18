"""
Phase 5: Kitchen Display System (KDS) API Router
Real-time kitchen order management with station-based workflow
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user
from ..websocket import (
    broadcast_order_item_status_changed,
    broadcast_order_bumped,
    broadcast_order_item_reassigned
)

router = APIRouter(prefix="/api/kds", tags=["Kitchen Display System"])


# ==================== KITCHEN STATIONS ====================

@router.get("/stations", response_model=List[schemas.KitchenStation])
async def get_stations(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all kitchen stations"""
    query = db.query(models.KitchenStation)
    
    if active_only:
        query = query.filter(models.KitchenStation.is_active == True)
    
    stations = query.order_by(models.KitchenStation.display_order).all()
    return stations


@router.get("/stations/{station_id}", response_model=schemas.KitchenStation)
async def get_station(
    station_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get specific station details"""
    station = db.query(models.KitchenStation).filter(
        models.KitchenStation.id == station_id
    ).first()
    
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    return station


@router.post("/stations", response_model=schemas.KitchenStation)
async def create_station(
    station: schemas.KitchenStationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create new kitchen station (Admin/Manager only)"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_station = models.KitchenStation(**station.dict())
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station


@router.put("/stations/{station_id}", response_model=schemas.KitchenStation)
async def update_station(
    station_id: int,
    station_update: schemas.KitchenStationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update station settings"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_station = db.query(models.KitchenStation).filter(
        models.KitchenStation.id == station_id
    ).first()
    
    if not db_station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    for key, value in station_update.dict(exclude_unset=True).items():
        setattr(db_station, key, value)
    
    db_station.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_station)
    return db_station


# ==================== ACTIVE ORDERS FOR KDS ====================

@router.get("/orders/active", response_model=List[schemas.OrderKDS])
async def get_active_orders(
    station_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get active orders for kitchen display
    Filter by station to show station-specific view
    """
    query = db.query(models.Order).options(
        joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Order.order_items).joinedload(models.OrderItem.station),
        joinedload(models.Order.order_items).joinedload(models.OrderItem.assigned_chef),
        joinedload(models.Order.table)
    ).filter(
        models.Order.status.in_(['confirmed', 'preparing', 'ready'])
    )
    
    # Filter by kitchen status
    if status_filter:
        query = query.filter(models.Order.kitchen_status == status_filter)
    else:
        # Default: show orders not yet bumped
        query = query.filter(
            or_(
                models.Order.kitchen_status == None,
                models.Order.kitchen_status.in_(['pending', 'received', 'in_progress', 'all_ready'])
            )
        )
    
    orders = query.order_by(models.Order.created_at).all()
    
    # Convert to KDS format
    kds_orders = []
    for order in orders:
        # Filter items by station if specified
        items = order.order_items
        if station_id:
            items = [item for item in items if item.station_id == station_id]
            if not items:  # Skip orders with no items for this station
                continue
        
        # Build KDS order response
        kds_order = {
            "id": order.id,
            "table_number": order.table.table_number if order.table else None,
            "customer_name": order.customer_name,
            "status": order.status.value if hasattr(order.status, 'value') else order.status,
            "kitchen_status": order.kitchen_status or "pending",
            "total_amount": order.total_amount,
            "special_notes": order.special_notes or order.notes,
            "created_at": order.created_at,
            "kitchen_received_at": order.kitchen_received_at,
            "all_items_ready_at": order.all_items_ready_at,
            "order_items": [
                {
                    "id": item.id,
                    "order_id": item.order_id,
                    "menu_item_id": item.menu_item_id,
                    "menu_item_name": item.menu_item.name,
                    "quantity": item.quantity,
                    "price": item.price,
                    "special_instructions": item.special_instructions,
                    "station_id": item.station_id,
                    "station_name": item.station.name if item.station else None,
                    "priority": item.priority or 0,
                    "prep_status": item.prep_status or "pending",
                    "prep_start_time": item.prep_start_time,
                    "prep_end_time": item.prep_end_time,
                    "assigned_chef_id": item.assigned_chef_id,
                    "assigned_chef_name": item.assigned_chef.username if item.assigned_chef else None,
                    "preparation_notes": item.preparation_notes,
                    "estimated_prep_time": item.estimated_prep_time,
                    "created_at": item.created_at
                }
                for item in items
            ]
        }
        kds_orders.append(kds_order)
    
    return kds_orders


@router.get("/orders/{order_id}/kds", response_model=schemas.OrderKDS)
async def get_order_kds_view(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get single order in KDS format"""
    order = db.query(models.Order).options(
        joinedload(models.Order.order_items).joinedload(models.OrderItem.menu_item),
        joinedload(models.Order.order_items).joinedload(models.OrderItem.station),
        joinedload(models.Order.order_items).joinedload(models.OrderItem.assigned_chef),
        joinedload(models.Order.table)
    ).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Build response (same format as get_active_orders)
    kds_order = {
        "id": order.id,
        "table_number": order.table.table_number if order.table else None,
        "customer_name": order.customer_name,
        "status": order.status.value if hasattr(order.status, 'value') else order.status,
        "kitchen_status": order.kitchen_status or "pending",
        "total_amount": order.total_amount,
        "special_notes": order.special_notes or order.notes,
        "created_at": order.created_at,
        "kitchen_received_at": order.kitchen_received_at,
        "all_items_ready_at": order.all_items_ready_at,
        "order_items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "menu_item_id": item.menu_item_id,
                "menu_item_name": item.menu_item.name,
                "quantity": item.quantity,
                "price": item.price,
                "special_instructions": item.special_instructions,
                "station_id": item.station_id,
                "station_name": item.station.name if item.station else None,
                "priority": item.priority or 0,
                "prep_status": item.prep_status or "pending",
                "prep_start_time": item.prep_start_time,
                "prep_end_time": item.prep_end_time,
                "assigned_chef_id": item.assigned_chef_id,
                "assigned_chef_name": item.assigned_chef.username if item.assigned_chef else None,
                "preparation_notes": item.preparation_notes,
                "estimated_prep_time": item.estimated_prep_time,
                "created_at": item.created_at
            }
            for item in order.order_items
        ]
    }
    
    return kds_order


# ==================== ORDER ITEM STATUS UPDATES ====================

@router.put("/items/{item_id}/status")
async def update_item_status(
    item_id: int,
    status_update: schemas.OrderItemKDSUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update order item preparation status"""
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    # Update fields
    for key, value in status_update.dict(exclude_unset=True).items():
        setattr(item, key, value)
    
    # Auto-set timestamps based on status
    if status_update.prep_status:
        if status_update.prep_status == "preparing" and not item.prep_start_time:
            item.prep_start_time = datetime.utcnow()
        elif status_update.prep_status == "ready" and not item.prep_end_time:
            item.prep_end_time = datetime.utcnow()
            
            # Log performance
            if item.prep_start_time:
                duration = (datetime.utcnow() - item.prep_start_time).total_seconds()
                perf_log = models.KitchenPerformanceLog(
                    station_id=item.station_id,
                    order_item_id=item.id,
                    action="completed",
                    chef_id=current_user.id,
                    duration_seconds=int(duration)
                )
                db.add(perf_log)
    
    # Auto-assign current chef if not assigned
    if not item.assigned_chef_id and status_update.prep_status == "preparing":
        item.assigned_chef_id = current_user.id
    
    db.commit()
    db.refresh(item)
    
    # WebSocket: Broadcast status change
    background_tasks.add_task(
        broadcast_order_item_status_changed,
        {
            "id": item.id,
            "order_id": item.order_id,
            "menu_item_name": item.menu_item.name if item.menu_item else "Unknown",
            "prep_status": item.prep_status,
            "station_id": item.station_id,
            "updated_at": item.updated_at.isoformat() if item.updated_at else datetime.utcnow().isoformat()
        }
    )
    
    # Check if all items in order are ready
    order = db.query(models.Order).filter(models.Order.id == item.order_id).first()
    all_ready = all(
        oi.prep_status == "ready" 
        for oi in order.order_items
    )
    
    if all_ready and not order.all_items_ready_at:
        order.all_items_ready_at = datetime.utcnow()
        order.kitchen_status = "all_ready"
        order.status = models.OrderStatus.ready
        db.commit()
    
    return {"success": True, "message": "Item status updated"}


@router.post("/items/{item_id}/start")
async def start_item_preparation(
    item_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark item as started (shortcut endpoint)"""
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    item.prep_status = "preparing"
    item.prep_start_time = datetime.utcnow()
    item.assigned_chef_id = current_user.id
    
    # Update order kitchen status
    order = db.query(models.Order).filter(models.Order.id == item.order_id).first()
    if order.kitchen_status == "pending":
        order.kitchen_status = "received"
        order.kitchen_received_at = datetime.utcnow()
    
    if order.kitchen_status == "received":
        order.kitchen_status = "in_progress"
    
    db.commit()
    db.refresh(item)
    
    # WebSocket: Broadcast status change
    background_tasks.add_task(
        broadcast_order_item_status_changed,
        {
            "id": item.id,
            "order_id": item.order_id,
            "menu_item_name": item.menu_item.name if item.menu_item else "Unknown",
            "prep_status": "preparing",
            "station_id": item.station_id,
            "updated_at": item.updated_at.isoformat() if item.updated_at else datetime.utcnow().isoformat()
        }
    )
    
    return {"success": True, "message": "Item preparation started"}


@router.post("/items/{item_id}/complete")
async def complete_item_preparation(
    item_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark item as ready (shortcut endpoint)"""
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    item.prep_status = "ready"
    item.prep_end_time = datetime.utcnow()
    
    # Log performance
    if item.prep_start_time and item.station_id:
        duration = (datetime.utcnow() - item.prep_start_time).total_seconds()
        perf_log = models.KitchenPerformanceLog(
            station_id=item.station_id,
            order_item_id=item.id,
            action="completed",
            chef_id=current_user.id,
            duration_seconds=int(duration)
        )
        db.add(perf_log)
    
    db.commit()
    db.refresh(item)
    
    # Check if all items ready
    order = db.query(models.Order).filter(models.Order.id == item.order_id).first()
    all_ready = all(oi.prep_status == "ready" for oi in order.order_items)
    
    if all_ready:
        order.all_items_ready_at = datetime.utcnow()
        order.kitchen_status = "all_ready"
        order.status = models.OrderStatus.ready
        db.commit()
    
    # WebSocket: Broadcast completion
    background_tasks.add_task(
        broadcast_order_item_status_changed,
        {
            "id": item.id,
            "order_id": item.order_id,
            "menu_item_name": item.menu_item.name if item.menu_item else "Unknown",
            "prep_status": "ready",
            "station_id": item.station_id,
            "updated_at": item.updated_at.isoformat() if item.updated_at else datetime.utcnow().isoformat()
        }
    )
    
    return {"success": True, "message": "Item marked as ready", "all_items_ready": all_ready}


# ==================== BUMP ORDERS ====================

@router.post("/orders/{order_id}/bump")
async def bump_order(
    order_id: int,
    background_tasks: BackgroundTasks,
    bump_request: Optional[schemas.BumpOrderRequest] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Bump (remove from display) completed order or station items
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If station_id provided, only bump items from that station
    if bump_request and bump_request.station_id:
        items = [item for item in order.order_items if item.station_id == bump_request.station_id]
        for item in items:
            item.prep_status = "served"
    else:
        # Bump entire order
        order.bumped_at = datetime.utcnow()
        order.kitchen_status = "bumped"
        
        # Mark all items as served
        for item in order.order_items:
            item.prep_status = "served"
    
    db.commit()
    db.refresh(order)
    
    # WebSocket: Broadcast order bump
    background_tasks.add_task(
        broadcast_order_bumped,
        {
            "id": order.id,
            "table_number": order.table_number,
            "bumped_at": order.bumped_at.isoformat() if order.bumped_at else datetime.utcnow().isoformat(),
            "station_specific": bump_request.station_id if bump_request else None
        }
    )
    
    return {"success": True, "message": "Order bumped successfully"}


# ==================== REASSIGN ITEMS ====================

@router.post("/items/reassign")
async def reassign_item(
    reassign_request: schemas.ReassignItemRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Reassign order item to different station/chef"""
    if current_user.role not in ['admin', 'manager', 'chef']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    item = db.query(models.OrderItem).filter(
        models.OrderItem.id == reassign_request.order_item_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")
    
    # Get station names for WebSocket event
    old_station = db.query(models.KitchenStation).filter(
        models.KitchenStation.id == item.station_id
    ).first()
    new_station = db.query(models.KitchenStation).filter(
        models.KitchenStation.id == reassign_request.new_station_id
    ).first()
    
    # Update station and chef
    old_station_id = item.station_id
    item.station_id = reassign_request.new_station_id
    
    if reassign_request.new_chef_id:
        item.assigned_chef_id = reassign_request.new_chef_id
    
    # Log the reassignment
    if old_station_id:
        perf_log = models.KitchenPerformanceLog(
            station_id=old_station_id,
            order_item_id=item.id,
            action="reassigned",
            chef_id=current_user.id,
            notes=reassign_request.reason or f"Reassigned to station {reassign_request.new_station_id}"
        )
        db.add(perf_log)
    
    db.commit()
    db.refresh(item)
    
    # WebSocket: Broadcast reassignment
    background_tasks.add_task(
        broadcast_order_item_reassigned,
        {
            "id": item.id,
            "order_id": item.order_id,
            "menu_item_name": item.menu_item.name if item.menu_item else "Unknown",
            "updated_at": item.updated_at.isoformat() if item.updated_at else datetime.utcnow().isoformat()
        },
        old_station.name if old_station else "Unknown",
        new_station.name if new_station else "Unknown"
    )
    
    return {"success": True, "message": "Item reassigned successfully"}


# ==================== STATION PERFORMANCE ====================

@router.get("/stations/{station_id}/performance", response_model=schemas.StationPerformance)
async def get_station_performance(
    station_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get performance metrics for specific station"""
    station = db.query(models.KitchenStation).filter(
        models.KitchenStation.id == station_id
    ).first()
    
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    # Count active items by status
    active_orders = db.query(func.count(func.distinct(models.OrderItem.order_id))).filter(
        models.OrderItem.station_id == station_id,
        models.OrderItem.prep_status.in_(['pending', 'assigned', 'preparing'])
    ).scalar()
    
    pending_items = db.query(func.count(models.OrderItem.id)).filter(
        models.OrderItem.station_id == station_id,
        models.OrderItem.prep_status == 'pending'
    ).scalar()
    
    preparing_items = db.query(func.count(models.OrderItem.id)).filter(
        models.OrderItem.station_id == station_id,
        models.OrderItem.prep_status == 'preparing'
    ).scalar()
    
    ready_items = db.query(func.count(models.OrderItem.id)).filter(
        models.OrderItem.station_id == station_id,
        models.OrderItem.prep_status == 'ready'
    ).scalar()
    
    # Items completed today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    items_completed_today = db.query(func.count(models.OrderItem.id)).filter(
        models.OrderItem.station_id == station_id,
        models.OrderItem.prep_status == 'ready',
        models.OrderItem.prep_end_time >= today_start
    ).scalar()
    
    # Average prep time (from performance logs)
    avg_duration = db.query(func.avg(models.KitchenPerformanceLog.duration_seconds)).filter(
        models.KitchenPerformanceLog.station_id == station_id,
        models.KitchenPerformanceLog.action == 'completed',
        models.KitchenPerformanceLog.created_at >= today_start
    ).scalar()
    
    avg_prep_time_minutes = round(avg_duration / 60, 1) if avg_duration else None
    
    # On-time percentage (items completed within estimated time)
    # Simplified: consider on-time if prep time <= estimated + 5 min buffer
    on_time_count = 0
    total_with_estimate = 0
    
    completed_items = db.query(models.OrderItem).filter(
        models.OrderItem.station_id == station_id,
        models.OrderItem.prep_status == 'ready',
        models.OrderItem.prep_end_time >= today_start,
        models.OrderItem.estimated_prep_time.isnot(None)
    ).all()
    
    for item in completed_items:
        if item.prep_start_time and item.prep_end_time and item.estimated_prep_time:
            actual_minutes = (item.prep_end_time - item.prep_start_time).total_seconds() / 60
            if actual_minutes <= (item.estimated_prep_time + 5):
                on_time_count += 1
            total_with_estimate += 1
    
    on_time_percentage = round((on_time_count / total_with_estimate * 100), 1) if total_with_estimate > 0 else None
    
    return {
        "station_id": station.id,
        "station_name": station.name,
        "active_orders": active_orders or 0,
        "pending_items": pending_items or 0,
        "preparing_items": preparing_items or 0,
        "ready_items": ready_items or 0,
        "avg_prep_time_minutes": avg_prep_time_minutes,
        "items_completed_today": items_completed_today or 0,
        "on_time_percentage": on_time_percentage
    }


@router.get("/dashboard/stats", response_model=schemas.KDSDashboardStats)
async def get_kds_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get overall KDS dashboard statistics"""
    
    # Total counts across all stations
    total_active_orders = db.query(func.count(func.distinct(models.Order.id))).filter(
        models.Order.status.in_(['confirmed', 'preparing', 'ready']),
        or_(
            models.Order.kitchen_status == None,
            models.Order.kitchen_status.in_(['pending', 'received', 'in_progress', 'all_ready'])
        )
    ).scalar()
    
    total_pending = db.query(func.count(models.OrderItem.id)).join(models.Order).filter(
        models.OrderItem.prep_status.in_(['pending', 'assigned']),
        models.Order.status.in_(['confirmed', 'preparing', 'ready'])
    ).scalar()
    
    total_preparing = db.query(func.count(models.OrderItem.id)).join(models.Order).filter(
        models.OrderItem.prep_status == 'preparing',
        models.Order.status.in_(['confirmed', 'preparing', 'ready'])
    ).scalar()
    
    total_ready = db.query(func.count(models.OrderItem.id)).join(models.Order).filter(
        models.OrderItem.prep_status == 'ready',
        models.Order.status == 'ready'
    ).scalar()
    
    # Get performance for each active station
    stations = db.query(models.KitchenStation).filter(
        models.KitchenStation.is_active == True
    ).order_by(models.KitchenStation.display_order).all()
    
    station_performances = []
    for station in stations:
        perf = await get_station_performance(station.id, db, current_user)
        station_performances.append(perf)
    
    # Oldest pending order
    oldest_order = db.query(models.Order).filter(
        models.Order.status.in_(['confirmed', 'preparing']),
        or_(
            models.Order.kitchen_status == None,
            models.Order.kitchen_status.in_(['pending', 'received', 'in_progress'])
        )
    ).order_by(models.Order.created_at).first()
    
    oldest_order_kds = None
    if oldest_order:
        oldest_order_kds = await get_order_kds_view(oldest_order.id, db, current_user)
    
    # Average ticket time for today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    completed_today = db.query(models.Order).filter(
        models.Order.all_items_ready_at >= today_start,
        models.Order.all_items_ready_at.isnot(None)
    ).all()
    
    total_ticket_time = 0
    count = 0
    for order in completed_today:
        if order.kitchen_received_at:
            ticket_time = (order.all_items_ready_at - order.kitchen_received_at).total_seconds() / 60
            total_ticket_time += ticket_time
            count += 1
        elif order.created_at:
            ticket_time = (order.all_items_ready_at - order.created_at).total_seconds() / 60
            total_ticket_time += ticket_time
            count += 1
    
    avg_ticket_time = round(total_ticket_time / count, 1) if count > 0 else None
    
    return {
        "total_active_orders": total_active_orders or 0,
        "total_pending_items": total_pending or 0,
        "total_preparing_items": total_preparing or 0,
        "total_ready_items": total_ready or 0,
        "stations": station_performances,
        "oldest_pending_order": oldest_order_kds,
        "average_ticket_time_minutes": avg_ticket_time
    }


# ==================== DISPLAY SETTINGS ====================

@router.get("/stations/{station_id}/settings", response_model=schemas.TicketDisplaySettings)
async def get_display_settings(
    station_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get display settings for station KDS screen"""
    settings = db.query(models.TicketDisplaySettings).filter(
        models.TicketDisplaySettings.station_id == station_id
    ).first()
    
    if not settings:
        # Return defaults
        return {
            "id": 0,
            "station_id": station_id,
            "font_size": "medium",
            "show_customer_names": True,
            "show_ticket_times": True,
            "show_special_requests": True,
            "auto_bump_completed": False,
            "bump_delay_seconds": 0,
            "alert_threshold_minutes": 15
        }
    
    return settings


@router.put("/stations/{station_id}/settings", response_model=schemas.TicketDisplaySettings)
async def update_display_settings(
    station_id: int,
    settings_update: schemas.TicketDisplaySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update display settings for station"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    settings = db.query(models.TicketDisplaySettings).filter(
        models.TicketDisplaySettings.station_id == station_id
    ).first()
    
    if not settings:
        # Create new settings
        settings = models.TicketDisplaySettings(
            station_id=station_id,
            **settings_update.dict()
        )
        db.add(settings)
    else:
        # Update existing
        for key, value in settings_update.dict().items():
            setattr(settings, key, value)
        settings.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(settings)
    return settings
