from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from .. import schemas, models
from ..database import get_db
from ..crud import crud
from .auth import get_current_user, require_role

router = APIRouter(prefix="/menu", tags=["Menu Items"])

@router.get("/", response_model=List[schemas.MenuItem])
def get_menu_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query(None, regex="^(name|price|category)$"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Get all menu items with search, filter, and sorting"""
    query = db.query(models.MenuItem)
    
    # Filter by category
    if category:
        query = query.filter(models.MenuItem.category == category)
    
    # Search by name or description
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.MenuItem.name.ilike(search_filter)) |
            (models.MenuItem.description.ilike(search_filter))
        )
    
    # Sorting
    if sort_by:
        sort_column = getattr(models.MenuItem, sort_by)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(models.MenuItem.name)
    
    # Pagination
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/{item_id}", response_model=schemas.MenuItem)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific menu item"""
    item = crud.get_menu_item(db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return item

@router.post("/", response_model=schemas.MenuItem, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    item: schemas.MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Create a new menu item (Admin/Manager only)"""
    return crud.create_menu_item(db=db, item=item)

@router.put("/{item_id}", response_model=schemas.MenuItem)
def update_menu_item(
    item_id: int,
    item: schemas.MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Update a menu item (Admin/Manager only)"""
    db_item = crud.update_menu_item(db, item_id=item_id, item=item)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return db_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Delete a menu item (Admin/Manager only)"""
    db_item = crud.delete_menu_item(db, item_id=item_id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return None

@router.patch("/{item_id}/toggle", response_model=schemas.MenuItem)
def toggle_menu_item_availability(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Toggle menu item availability (Admin/Manager only)"""
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Get current value and toggle
    current_val = bool(item.is_available)
    item.is_available = not current_val  # type: ignore
    
    db.commit()
    db.refresh(item)
    return item

@router.get("/categories/list", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Get all unique menu categories"""
    categories = db.query(models.MenuItem.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]

@router.post("/batch", response_model=List[schemas.MenuItem], status_code=status.HTTP_201_CREATED)
def bulk_create_menu_items(
    items: List[schemas.MenuItemCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Bulk import menu items (Admin/Manager only)"""
    created_items = []
    for item_data in items:
        db_item = models.MenuItem(**item_data.model_dump())
        db.add(db_item)
        created_items.append(db_item)
    
    db.commit()
    for item in created_items:
        db.refresh(item)
    
    return created_items

@router.get("/stats/summary")
def get_menu_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get menu statistics (Admin/Manager only)"""
    total_items = db.query(func.count(models.MenuItem.id)).scalar()
    available_items = db.query(func.count(models.MenuItem.id)).filter(
        models.MenuItem.is_available == True
    ).scalar()
    
    categories = db.query(
        models.MenuItem.category,
        func.count(models.MenuItem.id).label('count')
    ).group_by(models.MenuItem.category).all()
    
    return {
        "total_items": total_items,
        "available_items": available_items,
        "unavailable_items": total_items - available_items,
        "categories": [{"name": cat[0], "count": cat[1]} for cat in categories]
    }
