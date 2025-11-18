"""
Phase 6: AI/ML Analytics API Router
Endpoints for predictive analytics, forecasting, and insights
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user
from ..services.ml_analytics import MLAnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["AI/ML Analytics"])


# ==================== INVENTORY FORECASTING ====================

@router.get("/inventory/forecast")
async def forecast_inventory(
    days_ahead: int = Query(7, ge=1, le=30, description="Days to forecast"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Predict inventory needs for upcoming days
    Returns predicted usage and reorder recommendations
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ml_service = MLAnalyticsService(db)
    predictions = ml_service.predict_inventory_needs(days_ahead)
    
    return {
        "success": True,
        "days_ahead": days_ahead,
        "predictions": predictions,
        "total_items": len(predictions)
    }


# ==================== DEMAND FORECASTING ====================

@router.get("/demand/menu-items")
async def forecast_menu_demand(
    days_ahead: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Predict demand for menu items
    Returns predicted orders, peak hours, and trends
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ml_service = MLAnalyticsService(db)
    predictions = ml_service.predict_menu_item_demand(days_ahead)
    
    return {
        "success": True,
        "days_ahead": days_ahead,
        "predictions": predictions,
        "total_items": len(predictions)
    }


@router.get("/demand/peak-hours")
async def analyze_peak_hours(
    days_back: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Analyze peak operating hours
    Useful for staff scheduling and inventory planning
    """
    ml_service = MLAnalyticsService(db)
    analysis = ml_service.predict_peak_hours(days_back)
    
    return {
        "success": True,
        "days_analyzed": days_back,
        **analysis
    }


@router.get("/revenue/forecast")
async def forecast_revenue(
    days_ahead: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Forecast revenue for upcoming period
    Based on historical trends and patterns
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ml_service = MLAnalyticsService(db)
    forecast = ml_service.forecast_revenue(days_ahead)
    
    return {
        "success": True,
        **forecast
    }


# ==================== CUSTOMER ANALYTICS ====================

@router.get("/customers/segments")
async def get_customer_segments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Segment customers using RFM analysis
    Returns: Champions, Loyal, At Risk, Lost, etc.
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ml_service = MLAnalyticsService(db)
    segments = ml_service.analyze_customer_segments()
    
    return {
        "success": True,
        **segments
    }


@router.get("/customers/churn-risk")
async def predict_churn(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Identify customers at risk of churning
    Returns customers who haven't ordered recently
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ml_service = MLAnalyticsService(db)
    at_risk = ml_service.predict_customer_churn()
    
    return {
        "success": True,
        "at_risk_customers": at_risk,
        "total_at_risk": len(at_risk)
    }


@router.get("/customers/{customer_id}/lifetime-value")
async def get_customer_clv(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Calculate Customer Lifetime Value (CLV)
    Predicts long-term value of customer
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify customer exists
    customer = db.query(models.User).filter(
        models.User.id == customer_id,
        models.User.role == 'customer'
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    ml_service = MLAnalyticsService(db)
    clv_data = ml_service.calculate_customer_lifetime_value(customer_id)
    
    return {
        "success": True,
        "customer": {
            "id": customer.id,
            "username": customer.username,
            "email": customer.email
        },
        **clv_data
    }


@router.get("/customers/{customer_id}/recommendations")
async def get_menu_recommendations(
    customer_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get personalized menu recommendations
    Based on order history and similar customers
    """
    # Allow customers to get their own recommendations
    if current_user.role == 'customer' and current_user.id != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ml_service = MLAnalyticsService(db)
    recommendations = ml_service.recommend_menu_items(customer_id, limit)
    
    return {
        "success": True,
        "customer_id": customer_id,
        "recommendations": recommendations,
        "total": len(recommendations)
    }


# ==================== COMPREHENSIVE DASHBOARD ====================

@router.get("/dashboard")
async def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get comprehensive analytics dashboard
    Combines multiple insights for overview
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ml_service = MLAnalyticsService(db)
    
    # Gather all analytics
    inventory_forecast = ml_service.predict_inventory_needs(days_ahead=7)
    demand_forecast = ml_service.predict_menu_item_demand(days_ahead=7)
    peak_hours = ml_service.predict_peak_hours(days_back=30)
    revenue_forecast = ml_service.forecast_revenue(days_ahead=30)
    customer_segments = ml_service.analyze_customer_segments()
    churn_risk = ml_service.predict_customer_churn()
    
    # Top insights
    insights = []
    
    # Low stock items
    low_stock_items = [
        item for item_id, item in inventory_forecast.items()
        if item['recommended_reorder'] > 0
    ]
    if low_stock_items:
        insights.append({
            "type": "warning",
            "category": "inventory",
            "message": f"{len(low_stock_items)} items need reordering soon",
            "action": "Review inventory forecast",
            "priority": "high"
        })
    
    # Trending items
    trending_up = [
        item for item_id, item in demand_forecast.items()
        if item['trend'] == 'increasing'
    ]
    if trending_up:
        top_trending = sorted(trending_up, key=lambda x: x['predicted_orders'], reverse=True)[:3]
        insights.append({
            "type": "success",
            "category": "demand",
            "message": f"{len(trending_up)} menu items trending up",
            "items": [item['item_name'] for item in top_trending],
            "action": "Ensure adequate inventory",
            "priority": "medium"
        })
    
    # High churn risk customers
    high_risk = [c for c in churn_risk if c['risk_level'] == 'High']
    if high_risk:
        insights.append({
            "type": "warning",
            "category": "customers",
            "message": f"{len(high_risk)} customers at high churn risk",
            "action": "Consider re-engagement campaign",
            "priority": "high"
        })
    
    # Revenue trend
    if revenue_forecast.get('trend') == 'decreasing':
        insights.append({
            "type": "error",
            "category": "revenue",
            "message": "Revenue showing downward trend",
            "action": "Review pricing and promotions",
            "priority": "high"
        })
    elif revenue_forecast.get('trend') == 'increasing':
        insights.append({
            "type": "success",
            "category": "revenue",
            "message": "Revenue trending upward",
            "action": "Continue current strategies",
            "priority": "low"
        })
    
    return {
        "success": True,
        "generated_at": datetime.utcnow().isoformat(),
        "insights": insights,
        "summary": {
            "inventory_items_forecasted": len(inventory_forecast),
            "menu_items_forecasted": len(demand_forecast),
            "items_need_reorder": len(low_stock_items),
            "trending_items": len(trending_up),
            "at_risk_customers": len(churn_risk),
            "high_risk_customers": len(high_risk),
            "forecasted_revenue_30d": revenue_forecast.get('forecasted_revenue', 0),
            "revenue_trend": revenue_forecast.get('trend', 'stable')
        },
        "details": {
            "inventory_forecast": inventory_forecast,
            "demand_forecast": demand_forecast,
            "peak_hours": peak_hours,
            "revenue_forecast": revenue_forecast,
            "customer_segments": customer_segments.get('statistics', []),
            "top_churn_risks": churn_risk[:10]  # Top 10 at-risk customers
        }
    }


# ==================== INSIGHTS & RECOMMENDATIONS ====================

@router.get("/insights/top-performers")
async def get_top_performers(
    period_days: int = Query(30, ge=7, le=90),
    limit: int = Query(10, ge=5, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get top performing menu items by revenue
    """
    from sqlalchemy import func
    from datetime import timedelta
    
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    top_items = db.query(
        models.MenuItem.id,
        models.MenuItem.name,
        models.MenuItem.category,
        func.count(models.OrderItem.id).label('order_count'),
        func.sum(models.OrderItem.quantity).label('quantity_sold'),
        func.sum(models.OrderItem.price * models.OrderItem.quantity).label('revenue')
    ).join(models.OrderItem).join(models.Order).filter(
        models.Order.created_at >= start_date
    ).group_by(
        models.MenuItem.id
    ).order_by(
        func.sum(models.OrderItem.price * models.OrderItem.quantity).desc()
    ).limit(limit).all()
    
    return {
        "success": True,
        "period_days": period_days,
        "top_performers": [{
            "menu_item_id": item.id,
            "name": item.name,
            "category": item.category,
            "order_count": item.order_count,
            "quantity_sold": item.quantity_sold,
            "revenue": float(item.revenue)
        } for item in top_items]
    }


@router.get("/insights/underperformers")
async def get_underperformers(
    period_days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Identify menu items with low or declining sales
    """
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from datetime import timedelta
    
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Get all menu items
    all_items = db.query(models.MenuItem).filter(
        models.MenuItem.is_available == True
    ).all()
    
    underperformers = []
    
    for item in all_items:
        order_count = db.query(models.OrderItem).join(models.Order).filter(
            models.OrderItem.menu_item_id == item.id,
            models.Order.created_at >= start_date
        ).count()
        
        if order_count < 5:  # Less than 5 orders in period
            underperformers.append({
                "menu_item_id": item.id,
                "name": item.name,
                "category": item.category,
                "price": float(item.price),
                "order_count": order_count,
                "recommendation": "Consider promotion or menu review"
            })
    
    return {
        "success": True,
        "period_days": period_days,
        "underperformers": sorted(underperformers, key=lambda x: x['order_count']),
        "total": len(underperformers)
    }
