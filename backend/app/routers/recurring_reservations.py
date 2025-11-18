"""
Recurring Reservations API Router
Handles recurring reservation patterns (weekly, monthly, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, timedelta, date, time as dt_time

from ..database import get_db
from .auth import get_current_user
from .. import models, schemas

router = APIRouter(prefix="/api/recurring-reservations", tags=["Recurring Reservations"])


def generate_next_reservation_date(pattern: models.RecurringReservation, from_date: date) -> date:
    """Calculate next reservation date based on pattern"""
    
    if pattern.pattern_type == "weekly":
        # Find next occurrence of the specified day of week
        days_ahead = pattern.day_of_week - from_date.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        return from_date + timedelta(days=days_ahead)
    
    elif pattern.pattern_type == "biweekly":
        days_ahead = pattern.day_of_week - from_date.weekday()
        if days_ahead <= 0:
            days_ahead += 14
        else:
            days_ahead += 7  # Skip to next week, then add days
        return from_date + timedelta(days=days_ahead)
    
    elif pattern.pattern_type == "monthly":
        # Same day of week, but next month
        next_month = from_date + timedelta(days=30)
        # Find the same day of week in next month
        while next_month.weekday() != pattern.day_of_week:
            next_month += timedelta(days=1)
        return next_month
    
    return from_date


# ==================== Pattern Management ====================

@router.post("", response_model=schemas.RecurringReservation, status_code=status.HTTP_201_CREATED)
async def create_recurring_pattern(
    pattern: schemas.RecurringReservationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a recurring reservation pattern"""
    
    # Validate pattern type
    if pattern.pattern_type not in ["weekly", "biweekly", "monthly"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid pattern type. Must be 'weekly', 'biweekly', or 'monthly'"
        )
    
    # Validate day of week for weekly/biweekly patterns
    if pattern.pattern_type in ["weekly", "biweekly"]:
        if pattern.day_of_week is None or not (0 <= pattern.day_of_week <= 6):
            raise HTTPException(
                status_code=400,
                detail="day_of_week must be between 0 (Monday) and 6 (Sunday)"
            )
    
    # Validate dates
    if pattern.end_date and pattern.end_date < pattern.start_date:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    
    # Create pattern
    db_pattern = models.RecurringReservation(
        **pattern.dict(),
        user_id=current_user.id,
        is_active=True
    )
    
    db.add(db_pattern)
    db.commit()
    db.refresh(db_pattern)
    
    # Generate initial reservations (next 30 days)
    await generate_reservations_for_pattern(db_pattern, db)
    
    return db_pattern


@router.get("", response_model=List[schemas.RecurringReservation])
async def get_my_patterns(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all recurring reservation patterns for current user"""
    
    patterns = db.query(models.RecurringReservation).filter(
        models.RecurringReservation.user_id == current_user.id
    ).order_by(models.RecurringReservation.created_at.desc()).all()
    
    return patterns


@router.get("/{pattern_id}", response_model=schemas.RecurringReservation)
async def get_pattern(
    pattern_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific recurring pattern"""
    
    pattern = db.query(models.RecurringReservation).filter(
        models.RecurringReservation.id == pattern_id,
        models.RecurringReservation.user_id == current_user.id
    ).first()
    
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    return pattern


@router.put("/{pattern_id}", response_model=schemas.RecurringReservation)
async def update_pattern(
    pattern_id: int,
    pattern_update: schemas.RecurringReservationUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update recurring reservation pattern"""
    
    db_pattern = db.query(models.RecurringReservation).filter(
        models.RecurringReservation.id == pattern_id,
        models.RecurringReservation.user_id == current_user.id
    ).first()
    
    if not db_pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    # Update fields
    for key, value in pattern_update.dict(exclude_unset=True).items():
        setattr(db_pattern, key, value)
    
    db.commit()
    db.refresh(db_pattern)
    
    return db_pattern


@router.delete("/{pattern_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pattern(
    pattern_id: int,
    cancel_future_reservations: bool = True,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete recurring pattern and optionally cancel future reservations"""
    
    pattern = db.query(models.RecurringReservation).filter(
        models.RecurringReservation.id == pattern_id,
        models.RecurringReservation.user_id == current_user.id
    ).first()
    
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    # Cancel future reservations if requested
    if cancel_future_reservations:
        future_reservations = db.query(models.Reservation).filter(
            models.Reservation.recurring_reservation_id == pattern_id,
            models.Reservation.reservation_date >= datetime.now(),
            models.Reservation.status.in_([
                models.ReservationStatus.pending,
                models.ReservationStatus.confirmed
            ])
        ).all()
        
        for reservation in future_reservations:
            reservation.status = models.ReservationStatus.cancelled
    
    db.delete(pattern)
    db.commit()
    
    return None


@router.post("/{pattern_id}/toggle")
async def toggle_pattern(
    pattern_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable or disable a recurring pattern"""
    
    pattern = db.query(models.RecurringReservation).filter(
        models.RecurringReservation.id == pattern_id,
        models.RecurringReservation.user_id == current_user.id
    ).first()
    
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    pattern.is_active = not pattern.is_active
    db.commit()
    
    status_text = "enabled" if pattern.is_active else "disabled"
    
    return {
        "message": f"Pattern {status_text}",
        "pattern_id": pattern_id,
        "is_active": pattern.is_active
    }


@router.get("/{pattern_id}/reservations")
async def get_pattern_reservations(
    pattern_id: int,
    include_past: bool = False,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reservations generated from this pattern"""
    
    pattern = db.query(models.RecurringReservation).filter(
        models.RecurringReservation.id == pattern_id,
        models.RecurringReservation.user_id == current_user.id
    ).first()
    
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    query = db.query(models.Reservation).filter(
        models.Reservation.recurring_reservation_id == pattern_id
    )
    
    if not include_past:
        query = query.filter(models.Reservation.reservation_date >= datetime.now())
    
    reservations = query.order_by(models.Reservation.reservation_date).all()
    
    return reservations


# ==================== Background Job Functions ====================

async def generate_reservations_for_pattern(
    pattern: models.RecurringReservation,
    db: Session,
    days_ahead: int = 30
):
    """Generate reservations for the next N days based on pattern"""
    
    if not pattern.is_active:
        return
    
    today = date.today()
    end_generation_date = today + timedelta(days=days_ahead)
    
    # Don't generate beyond pattern end date
    if pattern.end_date and end_generation_date > pattern.end_date:
        end_generation_date = pattern.end_date
    
    current_date = max(today, pattern.start_date)
    
    while current_date <= end_generation_date:
        # Calculate next reservation date
        next_date = generate_next_reservation_date(pattern, current_date)
        
        if next_date > end_generation_date:
            break
        
        # Check if reservation already exists
        existing = db.query(models.Reservation).filter(
            models.Reservation.user_id == pattern.user_id,
            models.Reservation.recurring_reservation_id == pattern.id,
            func.date(models.Reservation.reservation_date) == next_date
        ).first()
        
        if not existing:
            # Create reservation
            reservation_datetime = datetime.combine(next_date, pattern.time)
            
            # Find available table
            available_table = db.query(models.Table).filter(
                models.Table.status == models.TableStatus.available,
                models.Table.capacity >= pattern.guests
            ).first()
            
            if available_table:
                reservation = models.Reservation(
                    user_id=pattern.user_id,
                    table_id=available_table.id,
                    customer_name=db.query(models.User).filter(
                        models.User.id == pattern.user_id
                    ).first().full_name or "Customer",
                    customer_phone="",  # Get from user profile
                    reservation_date=reservation_datetime,
                    time_slot=pattern.time.strftime("%H:%M"),
                    guests=pattern.guests,
                    special_requests=pattern.special_requests,
                    recurring_reservation_id=pattern.id,
                    status=models.ReservationStatus.confirmed
                )
                
                db.add(reservation)
        
        current_date = next_date + timedelta(days=1)
    
    db.commit()


@router.post("/generate-batch")
async def generate_batch_reservations(
    days_ahead: int = 30,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger generation of recurring reservations
    (This would normally be a cron job)
    Admin/Manager only
    """
    
    if current_user.role not in [models.UserRole.admin, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all active patterns
    active_patterns = db.query(models.RecurringReservation).filter(
        models.RecurringReservation.is_active == True
    ).all()
    
    generated_count = 0
    
    for pattern in active_patterns:
        await generate_reservations_for_pattern(pattern, db, days_ahead)
        generated_count += 1
    
    return {
        "message": f"Generated reservations for {generated_count} active patterns",
        "patterns_processed": generated_count,
        "days_ahead": days_ahead
    }
