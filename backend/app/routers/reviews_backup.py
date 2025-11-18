from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case
from typing import List
from datetime import datetime
from .. import schemas, models
from ..database import get_db
from .auth import get_current_user, require_role

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

# Submit review (public endpoint)
@router.post("/", response_model=schemas.Review)
async def create_review(
    review_data: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit a review for a menu item"""
    # Check if menu item exists
    menu_item = db.query(models.MenuItem).filter(
        models.MenuItem.id == review_data.menu_item_id
    ).first()
    
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Check if user already reviewed this item
    if current_user:
        existing = db.query(models.Review).filter(
            models.Review.menu_item_id == review_data.menu_item_id,
            models.Review.user_id == current_user.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="You have already reviewed this item. Please update your existing review."
            )
    
    # Create review
    review = models.Review(
        **review_data.model_dump(),
        user_id=current_user.id if current_user else None,
        status=models.ReviewStatus.pending,
        helpful_count=0
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Load menu_item relationship
    review.menu_item = menu_item
    
    return review

# Get all reviews
@router.get("/", response_model=List[schemas.Review])
async def get_reviews(
    status: str = None,
    menu_item_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get reviews with optional filters"""
    query = db.query(models.Review).options(
        joinedload(models.Review.menu_item)
    )
    
    if status:
        query = query.filter(models.Review.status == status)
    
    if menu_item_id:
        query = query.filter(models.Review.menu_item_id == menu_item_id)
    
    reviews = query.order_by(models.Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews

# Get review by ID
@router.get("/{review_id}", response_model=schemas.Review)
async def get_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific review by ID"""
    review = db.query(models.Review).options(
        joinedload(models.Review.menu_item)
    ).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return review

# Update review (by reviewer)
@router.put("/{review_id}", response_model=schemas.Review)
async def update_review(
    review_id: int,
    review_data: schemas.ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update your own review"""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check ownership
    if current_user and review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    # Update fields
    update_data = review_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    # Reset status to pending after update
    review.status = models.ReviewStatus.pending
    review.moderated_by = None
    review.moderated_at = None
    
    db.commit()
    db.refresh(review)
    
    return review

# Moderate review (approve/reject)
@router.patch("/{review_id}/moderate", response_model=schemas.Review)
async def moderate_review(
    review_id: int,
    moderation_data: schemas.ReviewModerationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Approve or reject a review (manager/admin only)"""
    review = db.query(models.Review).options(
        joinedload(models.Review.menu_item)
    ).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update moderation status
    review.status = moderation_data.status
    review.moderated_by = current_user.id
    review.moderated_at = datetime.now()
    
    db.commit()
    db.refresh(review)
    
    return review

# Increment helpful count
@router.post("/{review_id}/helpful", response_model=schemas.Review)
async def mark_helpful(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Mark a review as helpful"""
    review = db.query(models.Review).options(
        joinedload(models.Review.menu_item)
    ).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.helpful_count += 1
    
    db.commit()
    db.refresh(review)
    
    return review

# Get review statistics
@router.get("/stats/summary", response_model=schemas.ReviewStats)
async def get_review_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"]))
):
    """Get overall review statistics"""
    total_reviews = db.query(func.count(models.Review.id)).scalar()
    
    pending = db.query(func.count(models.Review.id)).filter(
        models.Review.status == models.ReviewStatus.pending
    ).scalar()
    
    approved = db.query(func.count(models.Review.id)).filter(
        models.Review.status == models.ReviewStatus.approved
    ).scalar()
    
    rejected = db.query(func.count(models.Review.id)).filter(
        models.Review.status == models.ReviewStatus.rejected
    ).scalar()
    
    # Calculate average rating (approved reviews only)
    avg_rating = db.query(func.avg(models.Review.rating)).filter(
        models.Review.status == models.ReviewStatus.approved
    ).scalar() or 0.0
    
    return schemas.ReviewStats(
        total_reviews=total_reviews,
        pending_reviews=pending,
        approved_reviews=approved,
        rejected_reviews=rejected,
        average_rating=round(avg_rating, 2)
    )

# Get menu item ratings
@router.get("/menu-item/{menu_item_id}/rating", response_model=schemas.MenuItemRating)
async def get_menu_item_rating(
    menu_item_id: int,
    db: Session = Depends(get_db)
):
    """Get rating statistics for a specific menu item"""
    # Check if menu item exists
    menu_item = db.query(models.MenuItem).filter(
        models.MenuItem.id == menu_item_id
    ).first()
    
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Get approved reviews only
    reviews = db.query(models.Review).filter(
        models.Review.menu_item_id == menu_item_id,
        models.Review.status == models.ReviewStatus.approved
    ).all()
    
    total_reviews = len(reviews)
    
    if total_reviews == 0:
        return schemas.MenuItemRating(
            menu_item_id=menu_item_id,
            average_rating=0.0,
            total_reviews=0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        )
    
    # Calculate average
    total_rating = sum(r.rating for r in reviews)
    avg_rating = total_rating / total_reviews
    
    # Calculate distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in reviews:
        distribution[review.rating] = distribution.get(review.rating, 0) + 1
    
    return schemas.MenuItemRating(
        menu_item_id=menu_item_id,
        average_rating=round(avg_rating, 2),
        total_reviews=total_reviews,
        rating_distribution=distribution
    )

# Get top rated menu items
@router.get("/menu-items/top-rated")
async def get_top_rated_items(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top rated menu items"""
    # Query approved reviews with ratings
    results = db.query(
        models.Review.menu_item_id,
        func.avg(models.Review.rating).label('avg_rating'),
        func.count(models.Review.id).label('review_count')
    ).filter(
        models.Review.status == models.ReviewStatus.approved
    ).group_by(
        models.Review.menu_item_id
    ).having(
        func.count(models.Review.id) >= 3  # At least 3 reviews
    ).order_by(
        func.avg(models.Review.rating).desc()
    ).limit(limit).all()
    
    # Get menu item details
    top_items = []
    for result in results:
        menu_item = db.query(models.MenuItem).filter(
            models.MenuItem.id == result.menu_item_id
        ).first()
        
        if menu_item:
            top_items.append({
                "menu_item": menu_item,
                "average_rating": round(result.avg_rating, 2),
                "review_count": result.review_count
            })
    
    return top_items

# Delete review
@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a review (own review or admin/manager)"""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check permissions
    is_owner = current_user and review.user_id == current_user.id
    is_admin = current_user and current_user.role in [models.UserRole.admin, models.UserRole.manager]
    
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}
