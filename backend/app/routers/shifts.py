from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from datetime import datetime, date, timedelta
from .. import models, schemas
from ..database import get_db
from ..routers.auth import get_current_user

router = APIRouter(prefix="/api/shifts", tags=["shifts"])

@router.post("/", response_model=schemas.Shift, status_code=status.HTTP_201_CREATED)
async def create_shift(
    shift: schemas.ShiftCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new shift"""
    # Check if employee exists
    employee = db.query(models.User).filter(models.User.id == shift.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check for conflicts
    existing_shifts = db.query(models.Shift).filter(
        and_(
            models.Shift.employee_id == shift.employee_id,
            models.Shift.date == shift.date
        )
    ).all()
    
    for existing in existing_shifts:
        # Check for time overlap
        if (shift.start_time < existing.end_time and shift.end_time > existing.start_time):
            raise HTTPException(
                status_code=400,
                detail=f"Shift conflicts with existing {existing.shift_type} shift"
            )
    
    # Create shift
    db_shift = models.Shift(**shift.dict())
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    
    return db_shift

@router.get("/", response_model=List[schemas.Shift])
async def get_shifts(
    employee_id: int = None,
    date_from: date = None,
    date_to: date = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get shifts with optional filters"""
    query = db.query(models.Shift)
    
    if employee_id:
        query = query.filter(models.Shift.employee_id == employee_id)
    
    if date_from:
        query = query.filter(models.Shift.date >= date_from)
    
    if date_to:
        query = query.filter(models.Shift.date <= date_to)
    
    shifts = query.order_by(models.Shift.date, models.Shift.start_time).all()
    return shifts

@router.get("/weekly", response_model=schemas.WeeklySchedule)
async def get_weekly_schedule(
    week_start: date = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get weekly schedule for all employees"""
    # If no week_start provided, use current week
    if not week_start:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
    
    week_end = week_start + timedelta(days=6)
    
    # Get all shifts for the week
    shifts = db.query(models.Shift).filter(
        and_(
            models.Shift.date >= week_start,
            models.Shift.date <= week_end
        )
    ).order_by(models.Shift.date, models.Shift.start_time).all()
    
    # Get all employees (staff, chef roles)
    employees = db.query(models.User).filter(
        or_(
            models.User.role == models.UserRole.staff,
            models.User.role == models.UserRole.chef
        )
    ).all()
    
    return schemas.WeeklySchedule(
        week_start=week_start,
        week_end=week_end,
        shifts=shifts,
        employees=employees
    )

@router.get("/{shift_id}", response_model=schemas.Shift)
async def get_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific shift"""
    shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    return shift

@router.put("/{shift_id}", response_model=schemas.Shift)
async def update_shift(
    shift_id: int,
    shift_update: schemas.ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a shift"""
    db_shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Update fields
    update_data = shift_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_shift, field, value)
    
    # Check for conflicts if date or time changed
    if any(k in update_data for k in ['date', 'start_time', 'end_time']):
        conflicting_shifts = db.query(models.Shift).filter(
            and_(
                models.Shift.employee_id == db_shift.employee_id,
                models.Shift.date == db_shift.date,
                models.Shift.id != shift_id
            )
        ).all()
        
        for existing in conflicting_shifts:
            if (db_shift.start_time < existing.end_time and 
                db_shift.end_time > existing.start_time):
                raise HTTPException(
                    status_code=400,
                    detail=f"Updated shift conflicts with existing {existing.shift_type} shift"
                )
    
    db.commit()
    db.refresh(db_shift)
    
    return db_shift

@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a shift"""
    shift = db.query(models.Shift).filter(models.Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    db.delete(shift)
    db.commit()
    
    return None

@router.post("/check-conflict", response_model=schemas.ShiftConflict)
async def check_shift_conflict(
    shift: schemas.ShiftCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Check if a shift would conflict with existing shifts"""
    existing_shifts = db.query(models.Shift).filter(
        and_(
            models.Shift.employee_id == shift.employee_id,
            models.Shift.date == shift.date
        )
    ).all()
    
    conflicting = []
    for existing in existing_shifts:
        if (shift.start_time < existing.end_time and shift.end_time > existing.start_time):
            conflicting.append(existing)
    
    has_conflict = len(conflicting) > 0
    message = "Shift conflicts with existing shifts" if has_conflict else "No conflicts found"
    
    return schemas.ShiftConflict(
        has_conflict=has_conflict,
        conflicting_shifts=conflicting,
        message=message
    )
