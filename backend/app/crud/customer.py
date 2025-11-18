"""
CRUD operations for customer-facing features
Menu browsing, ordering, favorites, profile management
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, date
from typing import List, Optional
from .. import models, schemas


# ==================== MENU BROWSING ====================

def get_public_menu(
    db: Session,
    category: Optional[str] = None,
    diet_type: Optional[str] = None,
    search: Optional[str] = None,
    available_only: bool = True,
    skip: int = 0,
    limit: int = 100
):
    """Get menu items with filters for customer browsing"""
    query = db.query(models.MenuItem)
    
    # Filter by availability
    if available_only:
        query = query.filter(models.MenuItem.is_available == True)
    
    # Filter by category
    if category:
        query = query.filter(models.MenuItem.category == category)
    
    # Filter by diet type
    if diet_type:
        query = query.filter(models.MenuItem.diet_type == diet_type)
    
    # Search in name or description
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.MenuItem.name.ilike(search_term),
                models.MenuItem.description.ilike(search_term)
            )
        )
    
    return query.offset(skip).limit(limit).all()


def get_menu_categories(db: Session):
    """Get all unique menu categories"""
    categories = db.query(models.MenuItem.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]


def get_featured_items(db: Session, limit: int = 6):
    """Get featured/popular menu items"""
    # For now, return recently added available items
    # In production, you might track popularity metrics
    return db.query(models.MenuItem).filter(
        models.MenuItem.is_available == True
    ).order_by(desc(models.MenuItem.created_at)).limit(limit).all()


def get_menu_item_details(db: Session, item_id: int):
    """Get detailed information about a menu item including reviews"""
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        return None
    
    # Get reviews for this item
    reviews = db.query(models.Review).filter(
        models.Review.menu_item_id == item_id
    ).order_by(desc(models.Review.created_at)).limit(10).all()
    
    # Calculate average rating
    avg_rating = db.query(func.avg(models.Review.rating)).filter(
        models.Review.menu_item_id == item_id
    ).scalar() or 0
    
    return {
        "item": item,
        "reviews": reviews,
        "average_rating": float(avg_rating),
        "review_count": len(reviews)
    }


# ==================== FAVORITES ====================

def add_to_favorites(db: Session, customer_id: int, menu_item_id: int):
    """Add item to customer's favorites"""
    # Check if already favorited
    existing = db.query(models.Favorite).filter(
        and_(
            models.Favorite.customer_id == customer_id,
            models.Favorite.menu_item_id == menu_item_id
        )
    ).first()
    
    if existing:
        return existing
    
    favorite = models.Favorite(
        customer_id=customer_id,
        menu_item_id=menu_item_id
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


def remove_from_favorites(db: Session, customer_id: int, menu_item_id: int):
    """Remove item from customer's favorites"""
    favorite = db.query(models.Favorite).filter(
        and_(
            models.Favorite.customer_id == customer_id,
            models.Favorite.menu_item_id == menu_item_id
        )
    ).first()
    
    if favorite:
        db.delete(favorite)
        db.commit()
        return True
    return False


def get_customer_favorites(db: Session, customer_id: int):
    """Get all favorite items for a customer"""
    favorites = db.query(models.Favorite).filter(
        models.Favorite.customer_id == customer_id
    ).all()
    
    # Get the actual menu items
    favorite_items = []
    for fav in favorites:
        item = db.query(models.MenuItem).filter(
            models.MenuItem.id == fav.menu_item_id
        ).first()
        if item:
            favorite_items.append(item)
    
    return favorite_items


def is_favorited(db: Session, customer_id: int, menu_item_id: int):
    """Check if an item is in customer's favorites"""
    favorite = db.query(models.Favorite).filter(
        and_(
            models.Favorite.customer_id == customer_id,
            models.Favorite.menu_item_id == menu_item_id
        )
    ).first()
    return favorite is not None


# ==================== ONLINE ORDERING ====================

def create_customer_order(db: Session, order_data: schemas.CustomerOrderCreate, customer_id: Optional[int] = None):
    """Create a new order from customer"""
    # Calculate total
    total_amount = 0
    
    # Create order
    db_order = models.Order(
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        customer_email=order_data.customer_email,
        delivery_address=order_data.delivery_address,
        special_notes=order_data.special_notes,
        status=models.OrderStatus.pending,
        total_amount=0  # Will calculate below
    )
    
    # If customer is logged in, link to customer record
    if customer_id:
        customer = db.query(models.Customer).filter(
            models.Customer.id == customer_id
        ).first()
        if customer:
            user = db.query(models.User).filter(
                models.User.id == customer.user_id
            ).first()
            if user:
                db_order.customer_name = user.full_name
                db_order.customer_email = user.email
                db_order.customer_phone = customer.phone
    
    db.add(db_order)
    db.flush()  # Get the order ID
    
    # Add order items
    for item_data in order_data.items:
        menu_item = db.query(models.MenuItem).filter(
            models.MenuItem.id == item_data.menu_item_id
        ).first()
        
        if not menu_item or not menu_item.is_available:
            db.rollback()
            raise ValueError(f"Menu item {item_data.menu_item_id} not available")
        
        item_total = menu_item.price * item_data.quantity
        total_amount += item_total
        
        order_item = models.OrderItem(
            order_id=db_order.id,
            menu_item_id=item_data.menu_item_id,
            quantity=item_data.quantity,
            price=menu_item.price,
            special_requests=item_data.special_requests
        )
        db.add(order_item)
    
    # Update total amount
    db_order.total_amount = total_amount
    
    db.commit()
    db.refresh(db_order)
    return db_order


def get_customer_orders(db: Session, customer_id: int, skip: int = 0, limit: int = 20):
    """Get order history for a customer"""
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id
    ).first()
    
    if not customer:
        return []
    
    user = db.query(models.User).filter(
        models.User.id == customer.user_id
    ).first()
    
    if not user:
        return []
    
    # Get orders by customer email
    orders = db.query(models.Order).filter(
        models.Order.customer_email == user.email
    ).order_by(desc(models.Order.created_at)).offset(skip).limit(limit).all()
    
    return orders


def track_order(db: Session, order_id: int, customer_email: Optional[str] = None):
    """Track order status"""
    query = db.query(models.Order).filter(models.Order.id == order_id)
    
    # If email provided, verify it matches
    if customer_email:
        query = query.filter(models.Order.customer_email == customer_email)
    
    order = query.first()
    if not order:
        return None
    
    # Get order items
    items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id
    ).all()
    
    return {
        "order": order,
        "items": items,
        "status": order.status.value,
        "created_at": order.created_at,
        "estimated_time": order.preparation_time if hasattr(order, 'preparation_time') else None
    }


# ==================== CUSTOMER PROFILE ====================

def get_customer_profile(db: Session, user_id: int):
    """Get customer profile by user ID"""
    customer = db.query(models.Customer).filter(
        models.Customer.user_id == user_id
    ).first()
    
    if not customer:
        return None
    
    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()
    
    return {
        "customer": customer,
        "user": user
    }


def create_customer_profile(db: Session, user_id: int, profile_data: schemas.CustomerCreate):
    """Create customer profile"""
    customer = models.Customer(
        user_id=user_id,
        phone=profile_data.phone if profile_data.phone else None,
        address=profile_data.address if profile_data.address else None,
        loyalty_points=profile_data.loyalty_points if hasattr(profile_data, 'loyalty_points') else 0
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer_profile(db: Session, customer_id: int, update_data: schemas.CustomerUpdate):
    """Update customer profile"""
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id
    ).first()
    
    if not customer:
        return None
    
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer


def get_customer_stats(db: Session, customer_id: int):
    """Get customer statistics (order count, total spent, etc.)"""
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id
    ).first()
    
    if not customer:
        return None
    
    user = db.query(models.User).filter(
        models.User.id == customer.user_id
    ).first()
    
    if not user:
        return None
    
    # Count orders
    order_count = db.query(func.count(models.Order.id)).filter(
        models.Order.customer_id == customer_id
    ).scalar() or 0
    
    # Sum total spent
    total_spent = db.query(func.sum(models.Order.total_amount)).filter(
        and_(
            models.Order.customer_id == customer_id,
            models.Order.status == models.OrderStatus.completed
        )
    ).scalar() or 0
    
    # Count favorites
    favorites_count = db.query(func.count(models.Favorite.id)).filter(
        models.Favorite.customer_id == customer_id
    ).scalar() or 0
    
    return {
        "order_count": order_count,
        "total_spent": float(total_spent),
        "favorites_count": favorites_count,
        "member_since": customer.created_at
    }


# ==================== REVIEWS ====================

def create_review(db: Session, review_data: schemas.ReviewCreate, customer_id: int):
    """Create a review for a menu item"""
    # Check if customer already reviewed this item
    existing = db.query(models.Review).filter(
        and_(
            models.Review.customer_id == customer_id,
            models.Review.menu_item_id == review_data.menu_item_id
        )
    ).first()
    
    if existing:
        # Update existing review
        existing.rating = review_data.rating
        existing.comment = review_data.comment
        db.commit()
        db.refresh(existing)
        return existing
    
    review = models.Review(
        customer_id=customer_id,
        menu_item_id=review_data.menu_item_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_customer_reviews(db: Session, customer_id: int, skip: int = 0, limit: int = 20):
    """Get all reviews by a customer"""
    return db.query(models.Review).filter(
        models.Review.customer_id == customer_id
    ).order_by(desc(models.Review.created_at)).offset(skip).limit(limit).all()


# ==================== SEARCH & RECOMMENDATIONS ====================

def search_menu_items(db: Session, search_term: str, skip: int = 0, limit: int = 20):
    """Advanced menu search"""
    search_pattern = f"%{search_term}%"
    
    return db.query(models.MenuItem).filter(
        and_(
            models.MenuItem.is_available == True,
            or_(
                models.MenuItem.name.ilike(search_pattern),
                models.MenuItem.description.ilike(search_pattern),
                models.MenuItem.category.ilike(search_pattern)
            )
        )
    ).offset(skip).limit(limit).all()


def get_recommended_items(db: Session, customer_id: Optional[int] = None, limit: int = 6):
    """Get recommended items (popular or based on favorites)"""
    # Simple implementation: return popular items
    # In production, use collaborative filtering or ML
    return get_featured_items(db, limit)
