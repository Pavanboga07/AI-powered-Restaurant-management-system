from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta, date
from .. import schemas, models
from ..database import get_db
from .auth import get_current_user

router = APIRouter(prefix="/api/reservations", tags=["reservations"])

# Time slots configuration
TIME_SLOTS = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"
]

# ============ Get All Reservations ============
@router.get("/", response_model=List[schemas.Reservation])
async def get_reservations(
    status: Optional[str] = Query(None),
    table_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all reservations with filters"""
    query = db.query(models.Reservation).options(
        joinedload(models.Reservation.table)
    )
    
    if status:
        try:
            status_enum = models.ReservationStatus(status)
            query = query.filter(models.Reservation.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    if table_id:
        query = query.filter(models.Reservation.table_id == table_id)
    
    if date_from:
        query = query.filter(func.date(models.Reservation.reservation_date) >= date_from)
    
    if date_to:
        query = query.filter(func.date(models.Reservation.reservation_date) <= date_to)
    
    query = query.order_by(models.Reservation.reservation_date.desc())
    reservations = query.offset(skip).limit(limit).all()
    
    return reservations

# ============ Get Single Reservation ============
@router.get("/{reservation_id}", response_model=schemas.Reservation)
async def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific reservation by ID"""
    reservation = db.query(models.Reservation).options(
        joinedload(models.Reservation.table)
    ).filter(models.Reservation.id == reservation_id).first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    return reservation

# ============ Check Availability ============
@router.post("/availability", response_model=schemas.AvailabilityResponse)
async def check_availability(
    request: schemas.AvailabilityRequest,
    db: Session = Depends(get_db)
):
    """Check available time slots for a given date and party size"""
    slots_availability = []
    reservation_date = request.date.date() if isinstance(request.date, datetime) else request.date
    
    for time_slot in TIME_SLOTS:
        # Parse time slot
        hour, minute = map(int, time_slot.split(':'))
        slot_start = datetime.combine(reservation_date, datetime.min.time()).replace(hour=hour, minute=minute)
        slot_end = slot_start + timedelta(minutes=request.duration)
        
        # Get all available tables
        available_tables_query = db.query(models.Table).filter(
            models.Table.status.in_([models.TableStatus.available, models.TableStatus.reserved]),
            models.Table.capacity >= request.guests
        )
        
        # Check for conflicting reservations
        conflicting_reservations = db.query(models.Reservation).filter(
            and_(
                func.date(models.Reservation.reservation_date) == reservation_date,
                models.Reservation.time_slot == time_slot,
                models.Reservation.status.in_([
                    models.ReservationStatus.pending,
                    models.ReservationStatus.confirmed,
                    models.ReservationStatus.seated
                ])
            )
        ).all()
        
        reserved_table_ids = [r.table_id for r in conflicting_reservations if r.table_id]
        
        available_tables = available_tables_query.filter(
            or_(
                models.Table.id.notin_(reserved_table_ids),
                len(reserved_table_ids) == 0
            )
        ).all() if reserved_table_ids else available_tables_query.all()
        
        total_capacity = sum(t.capacity for t in available_tables)
        
        slots_availability.append(schemas.TimeSlotAvailability(
            time_slot=time_slot,
            available_tables=len(available_tables),
            total_capacity=total_capacity,
            is_available=len(available_tables) > 0 and total_capacity >= request.guests
        ))
    
    return schemas.AvailabilityResponse(
        date=request.date,
        slots=slots_availability
    )

# ============ Create Reservation ============
@router.post("/", response_model=schemas.Reservation, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation: schemas.ReservationCreate,
    db: Session = Depends(get_db)
):
    """Create a new reservation"""
    # If table_id is not provided, find an available table
    if not reservation.table_id:
        available_table = db.query(models.Table).filter(
            models.Table.status.in_([models.TableStatus.available, models.TableStatus.reserved]),
            models.Table.capacity >= reservation.guests
        ).order_by(models.Table.capacity).first()
        
        if not available_table:
            raise HTTPException(
                status_code=400,
                detail="No available tables for the requested party size"
            )
        
        table_id = available_table.id
    else:
        table_id = reservation.table_id
        
        # Verify table exists and has enough capacity
        table = db.query(models.Table).filter(models.Table.id == table_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        if table.capacity < reservation.guests:
            raise HTTPException(status_code=400, detail="Table capacity insufficient")
    
    # Check for conflicts
    reservation_date = reservation.reservation_date.date() if isinstance(reservation.reservation_date, datetime) else reservation.reservation_date
    
    conflicts = db.query(models.Reservation).filter(
        and_(
            models.Reservation.table_id == table_id,
            func.date(models.Reservation.reservation_date) == reservation_date,
            models.Reservation.time_slot == reservation.time_slot,
            models.Reservation.status.in_([
                models.ReservationStatus.pending,
                models.ReservationStatus.confirmed,
                models.ReservationStatus.seated
            ])
        )
    ).first()
    
    if conflicts:
        raise HTTPException(
            status_code=400,
            detail="Table is already reserved for this time slot"
        )
    
    # Create reservation
    db_reservation = models.Reservation(
        table_id=table_id,
        customer_name=reservation.customer_name,
        customer_email=reservation.customer_email,
        customer_phone=reservation.customer_phone,
        reservation_date=reservation.reservation_date,
        time_slot=reservation.time_slot,
        duration=reservation.duration,
        guests=reservation.guests,
        special_requests=reservation.special_requests,
        status=models.ReservationStatus.pending
    )
    
    db.add(db_reservation)
    
    # Update table status if not already reserved/occupied
    table = db.query(models.Table).filter(models.Table.id == table_id).first()
    if table.status == models.TableStatus.available:
        table.status = models.TableStatus.reserved
    
    db.commit()
    db.refresh(db_reservation)
    
    # Load relationships
    db_reservation = db.query(models.Reservation).options(
        joinedload(models.Reservation.table)
    ).filter(models.Reservation.id == db_reservation.id).first()
    
    return db_reservation

# ============ Update Reservation ============
@router.put("/{reservation_id}", response_model=schemas.Reservation)
async def update_reservation(
    reservation_id: int,
    reservation: schemas.ReservationUpdate,
    db: Session = Depends(get_db)
):
    """Update a reservation"""
    db_reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id
    ).first()
    
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Update fields
    update_data = reservation.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_reservation, field, value)
    
    db.commit()
    db.refresh(db_reservation)
    
    # Load relationships
    db_reservation = db.query(models.Reservation).options(
        joinedload(models.Reservation.table)
    ).filter(models.Reservation.id == reservation_id).first()
    
    return db_reservation

# ============ Confirm Reservation ============
@router.post("/{reservation_id}/confirm", response_model=schemas.Reservation)
async def confirm_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Confirm a pending reservation"""
    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.status != models.ReservationStatus.pending:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot confirm reservation with status: {reservation.status}"
        )
    
    reservation.status = models.ReservationStatus.confirmed
    reservation.confirmed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reservation)
    
    # Load relationships
    reservation = db.query(models.Reservation).options(
        joinedload(models.Reservation.table)
    ).filter(models.Reservation.id == reservation_id).first()
    
    return reservation

# ============ Cancel Reservation ============
@router.post("/{reservation_id}/cancel", response_model=schemas.Reservation)
async def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db)
):
    """Cancel a reservation"""
    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.status in [models.ReservationStatus.completed, models.ReservationStatus.no_show]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel reservation with status: {reservation.status}"
        )
    
    reservation.status = models.ReservationStatus.cancelled
    
    # Free up table if no other active reservations
    if reservation.table:
        active_reservations = db.query(models.Reservation).filter(
            and_(
                models.Reservation.table_id == reservation.table_id,
                models.Reservation.id != reservation.id,
                models.Reservation.status.in_([
                    models.ReservationStatus.pending,
                    models.ReservationStatus.confirmed,
                    models.ReservationStatus.seated
                ])
            )
        ).count()
        
        if active_reservations == 0:
            reservation.table.status = models.TableStatus.available
    
    db.commit()
    db.refresh(reservation)
    
    # Load relationships
    reservation = db.query(models.Reservation).options(
        joinedload(models.Reservation.table)
    ).filter(models.Reservation.id == reservation_id).first()
    
    return reservation

# ============ Check-in (Seat) Reservation ============
@router.post("/{reservation_id}/checkin", response_model=schemas.Reservation)
async def checkin_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Check-in a confirmed reservation (mark as seated)"""
    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation.status != models.ReservationStatus.confirmed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot check-in reservation with status: {reservation.status}"
        )
    
    reservation.status = models.ReservationStatus.seated
    reservation.seated_at = datetime.utcnow()
    
    # Update table status to occupied
    if reservation.table:
        reservation.table.status = models.TableStatus.occupied
    
    db.commit()
    db.refresh(reservation)
    
    # Load relationships
    reservation = db.query(models.Reservation).options(
        joinedload(models.Reservation.table)
    ).filter(models.Reservation.id == reservation_id).first()
    
    return reservation

# ============ Delete Reservation ============
@router.delete("/{reservation_id}")
async def delete_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a reservation (admin only)"""
    reservation = db.query(models.Reservation).filter(
        models.Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    db.delete(reservation)
    db.commit()
    
    return {"message": "Reservation deleted successfully"}
