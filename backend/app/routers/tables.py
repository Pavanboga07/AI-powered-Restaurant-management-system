from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, models
from ..database import get_db
from .auth import get_current_user, require_role
from ..websocket import broadcast_table_updated

router = APIRouter(prefix="/api/tables", tags=["tables"])

# ============ Get All Tables ============
@router.get("/", response_model=List[schemas.Table])
async def get_tables(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all tables with optional status filter"""
    query = db.query(models.Table)
    
    if status:
        try:
            status_enum = models.TableStatus(status)
            query = query.filter(models.Table.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    query = query.order_by(models.Table.table_number)
    tables = query.offset(skip).limit(limit).all()
    
    return tables

# ============ Get Single Table ============
@router.get("/{table_id}", response_model=schemas.Table)
async def get_table(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific table by ID"""
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return table

# ============ Create Table ============
@router.post("/", response_model=schemas.Table, status_code=status.HTTP_201_CREATED)
async def create_table(
    table: schemas.TableCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Create a new table (Admin/Manager only)"""
    # Check if table number already exists
    existing = db.query(models.Table).filter(
        models.Table.table_number == table.table_number
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Table number {table.table_number} already exists"
        )
    
    db_table = models.Table(**table.dict())
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    
    return db_table

# ============ Update Table ============
@router.put("/{table_id}", response_model=schemas.Table)
async def update_table(
    table_id: int,
    table: schemas.TableUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Update a table (Admin/Manager only)"""
    db_table = db.query(models.Table).filter(models.Table.id == table_id).first()
    
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Check table number uniqueness if being changed
    if table.table_number and table.table_number != db_table.table_number:
        existing = db.query(models.Table).filter(
            models.Table.table_number == table.table_number,
            models.Table.id != table_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Table number {table.table_number} already exists"
            )
    
    # Update fields
    update_data = table.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_table, field, value)
    
    db.commit()
    db.refresh(db_table)
    
    # Broadcast table update via WebSocket
    await broadcast_table_updated({
        "id": db_table.id,
        "table_number": db_table.table_number,
        "capacity": db_table.capacity,
        "status": db_table.status.value,
        "location": db_table.location,
        "updated_at": db_table.updated_at.isoformat() if db_table.updated_at else None
    })
    
    return db_table

# ============ Delete Table ============
@router.delete("/{table_id}")
async def delete_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Delete a table (Admin/Manager only)"""
    db_table = db.query(models.Table).filter(models.Table.id == table_id).first()
    
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Check if table has active reservations or orders
    active_reservations = db.query(models.Reservation).filter(
        models.Reservation.table_id == table_id,
        models.Reservation.status.in_([
            models.ReservationStatus.pending,
            models.ReservationStatus.confirmed,
            models.ReservationStatus.seated
        ])
    ).count()
    
    if active_reservations > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete table with active reservations"
        )
    
    db.delete(db_table)
    db.commit()
    
    return {"message": "Table deleted successfully"}

# ============ Mark Table for Cleaning ============
@router.post("/{table_id}/mark-for-cleaning", response_model=schemas.Table)
async def mark_table_for_cleaning(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark table as needing cleaning (Staff only)"""
    from datetime import datetime
    from sqlalchemy import and_
    
    db_table = db.query(models.Table).filter(models.Table.id == table_id).first()
    
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    if db_table.status != models.TableStatus.occupied:
        raise HTTPException(
            status_code=400,
            detail="Can only mark occupied tables for cleaning"
        )
    
    # Mark all active orders for this table as completed
    active_orders = db.query(models.Order).filter(
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
    ).all()
    
    for order in active_orders:
        order.status = models.OrderStatus.completed
        if not order.completed_at:
            order.completed_at = datetime.utcnow()
    
    # Mark table as cleaning
    db_table.status = models.TableStatus.cleaning
    db_table.cleaning_started_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_table)
    
    # Broadcast cleaning notification
    await broadcast_table_updated({
        "id": db_table.id,
        "table_number": db_table.table_number,
        "status": "cleaning",
        "cleaning_started_at": db_table.cleaning_started_at.isoformat(),
        "message": f"Table {db_table.table_number} needs cleaning",
        "notification_type": "cleaning_required"
    })
    
    return db_table

# ============ Complete Table Cleaning ============
@router.post("/{table_id}/complete-cleaning", response_model=schemas.Table)
async def complete_table_cleaning(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark table cleaning as complete (Staff/Cleaner only)"""
    
    db_table = db.query(models.Table).filter(models.Table.id == table_id).first()
    
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    if db_table.status != models.TableStatus.cleaning:
        raise HTTPException(
            status_code=400,
            detail="Table is not in cleaning status"
        )
    
    # Mark table as available
    db_table.status = models.TableStatus.available
    db_table.cleaning_started_at = None
    
    db.commit()
    db.refresh(db_table)
    
    # Broadcast table available
    await broadcast_table_updated({
        "id": db_table.id,
        "table_number": db_table.table_number,
        "status": "available",
        "message": f"Table {db_table.table_number} is now available",
        "notification_type": "cleaning_completed"
    })
    
    return db_table
