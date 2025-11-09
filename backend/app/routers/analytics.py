"""
Analytics Router - Comprehensive business analytics endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import Optional
from datetime import datetime, timedelta, date
from .. import models, schemas
from ..database import get_db
from .auth import get_current_user, require_role

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def parse_date_range(date_from: Optional[str], date_to: Optional[str]):
    """Helper to parse date range parameters"""
    if date_from:
        start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
    else:
        start_date = datetime.now() - timedelta(days=30)
    
    if date_to:
        end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
    else:
        end_date = datetime.now()
    
    return start_date, end_date


# ============ Dashboard Summary Stats ============
@router.get("/dashboard", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    date_from: Optional[str] = Query(None, description="Start date (ISO format)"),
    date_to: Optional[str] = Query(None, description="End date (ISO format)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get dashboard summary statistics"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Current period orders (using created_at for simplicity)
    current_orders = db.query(models.Order).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).all()
    
    total_orders = len(current_orders)
    total_revenue = sum(float(order.total_amount) for order in current_orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Previous period for comparison
    period_length = (end_date - start_date).days
    prev_start = start_date - timedelta(days=period_length)
    prev_end = start_date
    
    prev_orders = db.query(models.Order).filter(
        and_(
            models.Order.created_at >= prev_start,
            models.Order.created_at < prev_end,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).all()
    
    prev_total_orders = len(prev_orders)
    prev_total_revenue = sum(float(order.total_amount) for order in prev_orders)
    
    # Calculate percentage changes
    revenue_change = ((total_revenue - prev_total_revenue) / prev_total_revenue * 100) if prev_total_revenue > 0 else 0
    orders_change = ((total_orders - prev_total_orders) / prev_total_orders * 100) if prev_total_orders > 0 else 0
    
    # Top selling item
    top_item_query = db.query(
        models.MenuItem.name,
        func.sum(models.OrderItem.quantity).label('total_qty')
    ).join(
        models.OrderItem
    ).join(
        models.Order
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(models.MenuItem.id, models.MenuItem.name).order_by(
        func.sum(models.OrderItem.quantity).desc()
    ).first()
    
    top_selling_item = top_item_query[0] if top_item_query else None
    
    # Active tables
    active_tables = db.query(models.Table).filter(
        models.Table.status.in_([models.TableStatus.occupied, models.TableStatus.reserved])
    ).count()
    
    # Pending orders
    pending_orders = db.query(models.Order).filter(
        models.Order.status.in_([models.OrderStatus.pending, models.OrderStatus.confirmed])
    ).count()
    
    return schemas.DashboardStats(
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        average_order_value=round(avg_order_value, 2),
        revenue_change_percent=round(revenue_change, 2),
        orders_change_percent=round(orders_change, 2),
        top_selling_item=top_selling_item,
        active_tables=active_tables,
        pending_orders=pending_orders
    )


# ============ Revenue Trend ============
@router.get("/revenue-trend", response_model=schemas.RevenueTrend)
async def get_revenue_trend(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    period: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get revenue trend over time"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Get all non-cancelled orders
    # Get orders for the period (using created_at)
    orders = db.query(models.Order).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).all()
    
    # Group by period
    trend_data = {}
    
    for order in orders:
        order_date = order.created_at
            
        if period == "daily":
            key = order_date.strftime("%Y-%m-%d")
        elif period == "weekly":
            # ISO week format
            key = order_date.strftime("%Y-W%V")
        else:  # monthly
            key = order_date.strftime("%Y-%m")
        
        if key not in trend_data:
            trend_data[key] = {"revenue": 0, "orders": 0}
        
        trend_data[key]["revenue"] += float(order.total_amount)
        trend_data[key]["orders"] += 1
    
    # Convert to list
    data_points = [
        schemas.RevenueTrendPoint(
            date=date_key,
            revenue=round(values["revenue"], 2),
            orders_count=values["orders"]
        )
        for date_key, values in sorted(trend_data.items())
    ]
    
    total_revenue = sum(point.revenue for point in data_points)
    total_orders = sum(point.orders_count for point in data_points)
    
    return schemas.RevenueTrend(
        data=data_points,
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        period=period
    )


# ============ Popular Items ============
@router.get("/popular-items", response_model=schemas.PopularItemsResponse)
async def get_popular_items(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get top selling menu items"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Query popular items with explicit joins
    popular_items = db.query(
        models.MenuItem.id,
        models.MenuItem.name,
        models.MenuItem.category,
        func.sum(models.OrderItem.quantity).label('total_quantity'),
        func.sum(models.OrderItem.quantity * models.OrderItem.price).label('total_revenue'),
        func.count(func.distinct(models.Order.id)).label('order_count')
    ).select_from(models.MenuItem).join(
        models.OrderItem,
        models.OrderItem.menu_item_id == models.MenuItem.id
    ).join(
        models.Order,
        models.Order.id == models.OrderItem.order_id
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(
        models.MenuItem.id,
        models.MenuItem.name,
        models.MenuItem.category
    ).order_by(
        func.sum(models.OrderItem.quantity).desc()
    ).limit(limit).all()
    
    items = [
        schemas.PopularItem(
            menu_item_id=item.id,
            name=item.name,
            category=item.category,
            total_quantity=int(item.total_quantity),
            total_revenue=round(float(item.total_revenue), 2),
            order_count=item.order_count
        )
        for item in popular_items
    ]
    
    return schemas.PopularItemsResponse(
        items=items,
        total_items=len(items)
    )


# ============ Orders by Hour ============
@router.get("/orders-by-hour", response_model=schemas.OrdersByHourResponse)
async def get_orders_by_hour(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get order distribution by hour of day"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Query orders grouped by hour
    hourly_data = db.query(
        extract('hour', models.Order.created_at).label('hour'),
        func.count(models.Order.id).label('order_count'),
        func.sum(models.Order.total_amount).label('revenue')
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(
        extract('hour', models.Order.created_at)
    ).all()
    
    # Create full 24-hour data
    hour_map = {int(row.hour): row for row in hourly_data}
    
    data_points = []
    peak_hour = 0
    peak_orders = 0
    
    for hour in range(24):
        if hour in hour_map:
            row = hour_map[hour]
            order_count = row.order_count
            revenue = float(row.revenue) if row.revenue else 0
        else:
            order_count = 0
            revenue = 0
        
        data_points.append(schemas.OrdersByHourPoint(
            hour=hour,
            order_count=order_count,
            revenue=round(revenue, 2)
        ))
        
        if order_count > peak_orders:
            peak_orders = order_count
            peak_hour = hour
    
    return schemas.OrdersByHourResponse(
        data=data_points,
        peak_hour=peak_hour,
        peak_orders=peak_orders
    )


# ============ Category Performance ============
@router.get("/category-performance", response_model=schemas.CategoryPerformanceResponse)
async def get_category_performance(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get sales performance by category"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Query category performance with explicit joins
    category_data = db.query(
        models.MenuItem.category,
        func.sum(models.OrderItem.quantity * models.OrderItem.price).label('total_revenue'),
        func.sum(models.OrderItem.quantity).label('total_quantity'),
        func.count(func.distinct(models.Order.id)).label('order_count')
    ).select_from(models.MenuItem).join(
        models.OrderItem,
        models.OrderItem.menu_item_id == models.MenuItem.id
    ).join(
        models.Order,
        models.Order.id == models.OrderItem.order_id
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(
        models.MenuItem.category
    ).all()
    
    total_revenue = sum(float(row.total_revenue) for row in category_data)
    
    categories = [
        schemas.CategoryPerformance(
            category=row.category,
            total_revenue=round(float(row.total_revenue), 2),
            total_quantity=int(row.total_quantity),
            order_count=row.order_count,
            percentage_of_total=round((float(row.total_revenue) / total_revenue * 100) if total_revenue > 0 else 0, 2)
        )
        for row in category_data
    ]
    
    # Sort by revenue descending
    categories.sort(key=lambda x: x.total_revenue, reverse=True)
    
    return schemas.CategoryPerformanceResponse(
        categories=categories,
        total_revenue=round(total_revenue, 2)
    )


# ============ Payment Methods Stats ============
@router.get("/payment-methods", response_model=schemas.PaymentMethodsResponse)
async def get_payment_methods_stats(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get payment methods distribution"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Query bills with payment info
    payment_data = db.query(
        models.Bill.payment_method,
        func.count(models.Bill.id).label('count'),
        func.sum(models.Bill.total_amount).label('total_amount')
    ).filter(
        and_(
            models.Bill.created_at >= start_date,
            models.Bill.created_at <= end_date,
            models.Bill.payment_status == models.PaymentStatus.paid
        )
    ).group_by(
        models.Bill.payment_method
    ).all()
    
    total_transactions = sum(row.count for row in payment_data)
    
    data = [
        schemas.PaymentMethodStats(
            payment_method=row.payment_method.value if row.payment_method else "unknown",
            count=row.count,
            total_amount=round(float(row.total_amount), 2),
            percentage=round((row.count / total_transactions * 100) if total_transactions > 0 else 0, 2)
        )
        for row in payment_data
    ]
    
    return schemas.PaymentMethodsResponse(
        data=data,
        total_transactions=total_transactions
    )


# ============ Staff Performance ============
@router.get("/staff-performance", response_model=schemas.StaffPerformanceResponse)
async def get_staff_performance(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get staff performance metrics"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Query staff with their order counts (using created_by field)
    staff_performance = db.query(
        models.User.id,
        models.User.full_name,
        func.count(func.distinct(models.Order.id)).label('total_orders'),
        func.sum(models.Order.total_amount).label('total_revenue'),
        func.avg(
            func.extract('epoch', models.Order.updated_at - models.Order.created_at) / 60
        ).label('avg_service_time')
    ).outerjoin(
        models.Order,
        and_(
            models.Order.created_by == models.User.id,
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).filter(
        models.User.role.in_([models.UserRole.staff, models.UserRole.manager])
    ).group_by(
        models.User.id,
        models.User.full_name
    ).all()
    
    staff_list = [
        schemas.StaffPerformance(
            staff_id=row.id,
            staff_name=row.full_name,
            total_orders=row.total_orders or 0,
            total_revenue=round(float(row.total_revenue or 0), 2),
            avg_service_time=round(float(row.avg_service_time or 0), 2)
        )
        for row in staff_performance
    ]
    
    # Sort by total orders descending
    staff_list.sort(key=lambda x: x.total_orders, reverse=True)
    
    return schemas.StaffPerformanceResponse(
        staff=staff_list,
        total_staff=len(staff_list)
    )


# ============ Table Utilization ============
@router.get("/table-utilization", response_model=schemas.TableUtilizationResponse)
async def get_table_utilization(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get table utilization statistics"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Query table usage
    table_stats = db.query(
        models.Table.id,
        models.Table.table_number,
        models.Table.capacity,
        func.count(models.Order.id).label('total_orders'),
        func.sum(models.Order.total_amount).label('total_revenue'),
        func.avg(
            func.extract('epoch', models.Order.updated_at - models.Order.created_at) / 60
        ).label('avg_occupancy_time')
    ).outerjoin(
        models.Order,
        and_(
            models.Order.table_id == models.Table.id,
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(
        models.Table.id,
        models.Table.table_number,
        models.Table.capacity
    ).all()
    
    tables = [
        schemas.TableUtilization(
            table_id=row.id,
            table_number=row.table_number,
            capacity=row.capacity,
            total_orders=row.total_orders or 0,
            total_revenue=round(float(row.total_revenue or 0), 2),
            avg_occupancy_time=round(float(row.avg_occupancy_time or 0), 2),
            utilization_rate=round((row.total_orders or 0) / max((end_date - start_date).days, 1) * 100, 2)
        )
        for row in table_stats
    ]
    
    # Sort by total revenue descending
    tables.sort(key=lambda x: x.total_revenue, reverse=True)
    
    return schemas.TableUtilizationResponse(
        tables=tables,
        total_tables=len(tables)
    )


# ============ Customer Analytics ============
@router.get("/customer-insights", response_model=schemas.CustomerInsightsResponse)
async def get_customer_insights(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get customer behavior insights"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Total customers (unique)
    total_customers = db.query(func.count(func.distinct(models.Order.customer_name))).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.customer_name.isnot(None)
        )
    ).scalar() or 0
    
    # Repeat customers (customers with more than one order)
    repeat_customers = db.query(models.Order.customer_name).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.customer_name.isnot(None)
        )
    ).group_by(models.Order.customer_name).having(
        func.count(models.Order.id) > 1
    ).count()
    
    # Average order frequency
    orders_per_customer = db.query(
        models.Order.customer_name,
        func.count(models.Order.id).label('order_count')
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.customer_name.isnot(None)
        )
    ).group_by(models.Order.customer_name).all()
    
    avg_orders_per_customer = sum(row.order_count for row in orders_per_customer) / total_customers if total_customers > 0 else 0
    
    # Customer lifetime value (top customers)
    top_customers = db.query(
        models.Order.customer_name,
        func.count(models.Order.id).label('total_orders'),
        func.sum(models.Order.total_amount).label('total_spent')
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.customer_name.isnot(None),
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(
        models.Order.customer_name
    ).order_by(
        func.sum(models.Order.total_amount).desc()
    ).limit(10).all()
    
    top_customers_list = [
        schemas.TopCustomer(
            customer_name=row.customer_name,
            total_orders=row.total_orders,
            total_spent=round(float(row.total_spent), 2)
        )
        for row in top_customers
    ]
    
    return schemas.CustomerInsightsResponse(
        total_customers=total_customers,
        repeat_customers=repeat_customers,
        new_customers=total_customers - repeat_customers,
        avg_orders_per_customer=round(avg_orders_per_customer, 2),
        retention_rate=round((repeat_customers / total_customers * 100) if total_customers > 0 else 0, 2),
        top_customers=top_customers_list
    )


# ============ Revenue Forecast ============
@router.get("/revenue-forecast", response_model=schemas.RevenueForecastResponse)
async def get_revenue_forecast(
    days: int = Query(7, ge=1, le=30, description="Number of days to forecast"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get revenue forecast based on historical data"""
    # Get last 30 days of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    daily_revenue = db.query(
        func.date(models.Order.created_at).label('date'),
        func.sum(models.Order.total_amount).label('revenue')
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(
        func.date(models.Order.created_at)
    ).all()
    
    # Calculate average daily revenue
    if daily_revenue:
        avg_daily_revenue = sum(float(row.revenue) for row in daily_revenue) / len(daily_revenue)
    else:
        avg_daily_revenue = 0
    
    # Simple moving average forecast
    forecast_points = []
    for i in range(days):
        forecast_date = end_date + timedelta(days=i+1)
        # Add some variance (±10%)
        import random
        variance = random.uniform(0.9, 1.1)
        forecasted_revenue = avg_daily_revenue * variance
        
        forecast_points.append(schemas.ForecastPoint(
            date=forecast_date.strftime("%Y-%m-%d"),
            forecasted_revenue=round(forecasted_revenue, 2),
            confidence=85.0  # Simplified confidence
        ))
    
    return schemas.RevenueForecastResponse(
        forecast=forecast_points,
        avg_daily_revenue=round(avg_daily_revenue, 2),
        forecast_days=days
    )


# ============ Peak Hours Analysis ============
@router.get("/peak-hours-detailed", response_model=schemas.PeakHoursDetailedResponse)
async def get_peak_hours_detailed(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get detailed peak hours analysis with day-of-week breakdown"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Query by day of week and hour
    hourly_by_day = db.query(
        extract('dow', models.Order.created_at).label('day_of_week'),  # 0=Sunday, 6=Saturday
        extract('hour', models.Order.created_at).label('hour'),
        func.count(models.Order.id).label('order_count'),
        func.sum(models.Order.total_amount).label('revenue')
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    ).group_by(
        extract('dow', models.Order.created_at),
        extract('hour', models.Order.created_at)
    ).all()
    
    # Day names
    day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    # Structure data by day and hour
    day_hour_map = {}
    for row in hourly_by_day:
        day = int(row.day_of_week)
        hour = int(row.hour)
        if day not in day_hour_map:
            day_hour_map[day] = {}
        day_hour_map[day][hour] = {
            'order_count': row.order_count,
            'revenue': float(row.revenue)
        }
    
    # Build response
    days_data = []
    for day_num in range(7):
        hours_data = []
        for hour in range(24):
            data = day_hour_map.get(day_num, {}).get(hour, {'order_count': 0, 'revenue': 0})
            hours_data.append(schemas.HourData(
                hour=hour,
                order_count=data['order_count'],
                revenue=round(data['revenue'], 2)
            ))
        
        # Find peak hour for this day
        peak_hour_data = max(hours_data, key=lambda x: x.order_count)
        
        days_data.append(schemas.DayPeakHours(
            day_name=day_names[day_num],
            hours=hours_data,
            peak_hour=peak_hour_data.hour,
            peak_orders=peak_hour_data.order_count
        ))
    
    return schemas.PeakHoursDetailedResponse(days=days_data)


# ============ Menu Item Performance ============
@router.get("/menu-performance", response_model=schemas.MenuPerformanceResponse)
async def get_menu_performance(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([models.UserRole.admin, models.UserRole.manager]))
):
    """Get comprehensive menu item performance analysis"""
    start_date, end_date = parse_date_range(date_from, date_to)
    
    # Base query with explicit join path
    query = db.query(
        models.MenuItem.id,
        models.MenuItem.name,
        models.MenuItem.category,
        models.MenuItem.price,
        func.sum(models.OrderItem.quantity).label('total_sold'),
        func.sum(models.OrderItem.quantity * models.OrderItem.price).label('total_revenue'),
        func.count(func.distinct(models.Order.id)).label('order_count'),
        func.avg(models.OrderItem.quantity).label('avg_quantity_per_order')
    ).select_from(models.MenuItem).join(
        models.OrderItem,
        models.OrderItem.menu_item_id == models.MenuItem.id
    ).join(
        models.Order,
        models.Order.id == models.OrderItem.order_id
    ).filter(
        and_(
            models.Order.created_at >= start_date,
            models.Order.created_at <= end_date,
            models.Order.status != models.OrderStatus.cancelled
        )
    )
    
    # Apply category filter
    if category:
        query = query.filter(models.MenuItem.category == category)
    
    items = query.group_by(
        models.MenuItem.id,
        models.MenuItem.name,
        models.MenuItem.category,
        models.MenuItem.price
    ).all()
    
    # Calculate total revenue for percentage
    total_revenue = sum(float(item.total_revenue) for item in items)
    
    # Get items that haven't sold
    sold_item_ids = [item.id for item in items]
    unsold_items_query = db.query(
        models.MenuItem.id,
        models.MenuItem.name,
        models.MenuItem.category
    ).filter(
        models.MenuItem.id.notin_(sold_item_ids) if sold_item_ids else True
    )
    
    if category:
        unsold_items_query = unsold_items_query.filter(models.MenuItem.category == category)
    
    unsold_items = unsold_items_query.all()
    
    performance_data = [
        schemas.MenuItemPerformance(
            item_id=item.id,
            name=item.name,
            category=item.category,
            price=float(item.price),
            total_sold=int(item.total_sold),
            total_revenue=round(float(item.total_revenue), 2),
            order_count=item.order_count,
            avg_quantity_per_order=round(float(item.avg_quantity_per_order), 2),
            revenue_percentage=round((float(item.total_revenue) / total_revenue * 100) if total_revenue > 0 else 0, 2)
        )
        for item in items
    ]
    
    # Sort by revenue
    performance_data.sort(key=lambda x: x.total_revenue, reverse=True)
    
    # Add unsold items info
    underperforming = [
        schemas.UnderperformingItem(
            item_id=item.id,
            name=item.name,
            category=item.category
        )
        for item in unsold_items
    ]
    
    return schemas.MenuPerformanceResponse(
        items=performance_data,
        underperforming_items=underperforming,
        total_items_analyzed=len(performance_data),
        total_revenue=round(total_revenue, 2)
    )
