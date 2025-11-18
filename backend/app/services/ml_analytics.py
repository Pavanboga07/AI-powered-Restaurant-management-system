"""
Phase 6: ML Analytics Service
Predictive models for inventory, demand forecasting, and customer behavior
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
import joblib
import logging
from pathlib import Path

from .. import models

logger = logging.getLogger(__name__)

class MLAnalyticsService:
    """Machine Learning Analytics Service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.models_dir = Path(__file__).parent / "ml_models"
        self.models_dir.mkdir(exist_ok=True)
    
    # ==================== INVENTORY FORECASTING ====================
    
    def predict_inventory_needs(self, days_ahead: int = 7) -> Dict[int, Dict]:
        """
        Predict inventory needs for the next N days
        Returns: {item_id: {predicted_usage, recommended_reorder, confidence}}
        """
        try:
            # Get historical inventory transactions (last 90 days)
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=90)
            
            transactions = self.db.query(models.InventoryTransaction).filter(
                and_(
                    models.InventoryTransaction.transaction_date >= start_date,
                    models.InventoryTransaction.transaction_type == 'usage'
                )
            ).all()
            
            if not transactions:
                return {}
            
            # Aggregate by item and day
            df = pd.DataFrame([{
                'item_id': t.item_id,
                'date': t.transaction_date.date(),
                'quantity': abs(t.quantity_change),
                'day_of_week': t.transaction_date.weekday(),
                'is_weekend': t.transaction_date.weekday() >= 5
            } for t in transactions])
            
            predictions = {}
            
            # Predict for each inventory item
            for item_id in df['item_id'].unique():
                item_df = df[df['item_id'] == item_id].copy()
                
                # Calculate daily average and trend
                daily_avg = item_df.groupby('date')['quantity'].sum()
                
                if len(daily_avg) < 7:  # Not enough data
                    continue
                
                # Simple moving average prediction
                recent_avg = daily_avg.tail(14).mean()
                overall_avg = daily_avg.mean()
                trend = (recent_avg - overall_avg) / overall_avg if overall_avg > 0 else 0
                
                # Adjust for weekday/weekend patterns
                weekday_avg = item_df[~item_df['is_weekend']].groupby('date')['quantity'].sum().mean()
                weekend_avg = item_df[item_df['is_weekend']].groupby('date')['quantity'].sum().mean()
                
                # Predict usage
                predicted_usage = recent_avg * days_ahead * (1 + trend)
                
                # Get current stock
                inventory_item = self.db.query(models.InventoryItem).filter(
                    models.InventoryItem.id == item_id
                ).first()
                
                if not inventory_item:
                    continue
                
                current_stock = inventory_item.quantity
                safety_stock = inventory_item.reorder_level * 1.5
                
                # Calculate recommendation
                recommended_reorder = max(0, predicted_usage + safety_stock - current_stock)
                
                # Confidence score based on data consistency
                std_dev = daily_avg.std()
                confidence = max(0, min(1, 1 - (std_dev / (overall_avg + 1))))
                
                predictions[item_id] = {
                    'item_name': inventory_item.item_name,
                    'current_stock': float(current_stock),
                    'predicted_usage': float(predicted_usage),
                    'recommended_reorder': float(recommended_reorder),
                    'confidence': float(confidence),
                    'weekday_avg_usage': float(weekday_avg),
                    'weekend_avg_usage': float(weekend_avg),
                    'trend': 'increasing' if trend > 0.1 else 'decreasing' if trend < -0.1 else 'stable'
                }
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error in inventory prediction: {e}")
            return {}
    
    # ==================== DEMAND FORECASTING ====================
    
    def predict_menu_item_demand(self, days_ahead: int = 7) -> Dict[int, Dict]:
        """
        Predict menu item demand for upcoming days
        Returns: {menu_item_id: {predicted_orders, peak_hours, confidence}}
        """
        try:
            # Get historical order data (last 60 days)
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=60)
            
            order_items = self.db.query(models.OrderItem).join(
                models.Order
            ).filter(
                models.Order.created_at >= start_date
            ).all()
            
            if not order_items:
                return {}
            
            # Create DataFrame
            df = pd.DataFrame([{
                'menu_item_id': oi.menu_item_id,
                'quantity': oi.quantity,
                'date': oi.order.created_at.date(),
                'hour': oi.order.created_at.hour,
                'day_of_week': oi.order.created_at.weekday(),
                'is_weekend': oi.order.created_at.weekday() >= 5
            } for oi in order_items])
            
            predictions = {}
            
            # Analyze each menu item
            for menu_item_id in df['menu_item_id'].unique():
                item_df = df[df['menu_item_id'] == menu_item_id].copy()
                
                # Daily aggregation
                daily_orders = item_df.groupby('date')['quantity'].sum()
                
                if len(daily_orders) < 7:
                    continue
                
                # Calculate metrics
                recent_avg = daily_orders.tail(14).mean()
                overall_avg = daily_orders.mean()
                std_dev = daily_orders.std()
                
                # Trend analysis
                trend = (recent_avg - overall_avg) / overall_avg if overall_avg > 0 else 0
                
                # Peak hours analysis
                hourly_orders = item_df.groupby('hour')['quantity'].sum().sort_values(ascending=False)
                peak_hours = hourly_orders.head(3).index.tolist()
                
                # Prediction
                predicted_orders = recent_avg * days_ahead * (1 + trend)
                confidence = max(0, min(1, 1 - (std_dev / (overall_avg + 1))))
                
                # Get menu item details
                menu_item = self.db.query(models.MenuItem).filter(
                    models.MenuItem.id == menu_item_id
                ).first()
                
                if not menu_item:
                    continue
                
                predictions[menu_item_id] = {
                    'item_name': menu_item.name,
                    'predicted_orders': float(predicted_orders),
                    'avg_daily_orders': float(recent_avg),
                    'peak_hours': [int(h) for h in peak_hours],
                    'trend': 'increasing' if trend > 0.1 else 'decreasing' if trend < -0.1 else 'stable',
                    'confidence': float(confidence),
                    'popularity_score': float(len(daily_orders) / 60)  # % of days ordered
                }
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error in demand prediction: {e}")
            return {}
    
    def predict_peak_hours(self, days_back: int = 30) -> Dict[str, any]:
        """
        Analyze and predict peak hours for restaurant operations
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days_back)
            
            orders = self.db.query(models.Order).filter(
                models.Order.created_at >= start_date
            ).all()
            
            if not orders:
                return {}
            
            # Create DataFrame
            df = pd.DataFrame([{
                'hour': o.created_at.hour,
                'day_of_week': o.created_at.weekday(),
                'is_weekend': o.created_at.weekday() >= 5,
                'order_count': 1,
                'revenue': float(o.total_price) if o.total_price else 0
            } for o in orders])
            
            # Hourly analysis
            hourly_stats = df.groupby('hour').agg({
                'order_count': 'sum',
                'revenue': 'sum'
            }).reset_index()
            
            # Peak hours (top 5)
            peak_hours = hourly_stats.nlargest(5, 'order_count')['hour'].tolist()
            
            # Weekday vs Weekend
            weekday_peak = df[~df['is_weekend']].groupby('hour')['order_count'].sum().idxmax()
            weekend_peak = df[df['is_weekend']].groupby('hour')['order_count'].sum().idxmax()
            
            return {
                'peak_hours': [int(h) for h in peak_hours],
                'weekday_peak_hour': int(weekday_peak),
                'weekend_peak_hour': int(weekend_peak),
                'hourly_distribution': hourly_stats.to_dict('records'),
                'busiest_hour': int(hourly_stats.loc[hourly_stats['order_count'].idxmax(), 'hour']),
                'total_orders_analyzed': len(orders)
            }
            
        except Exception as e:
            logger.error(f"Error in peak hours prediction: {e}")
            return {}
    
    # ==================== CUSTOMER BEHAVIOR ANALYSIS ====================
    
    def analyze_customer_segments(self) -> Dict[str, List[Dict]]:
        """
        Segment customers based on behavior (RFM analysis)
        Recency, Frequency, Monetary value
        """
        try:
            # Get all customers with orders
            customers = self.db.query(models.User).filter(
                models.User.role == 'customer'
            ).all()
            
            customer_data = []
            current_date = datetime.utcnow()
            
            for customer in customers:
                orders = self.db.query(models.Order).filter(
                    models.Order.user_id == customer.id
                ).all()
                
                if not orders:
                    continue
                
                # Calculate RFM metrics
                recency = (current_date - max(o.created_at for o in orders)).days
                frequency = len(orders)
                monetary = sum(float(o.total_price) for o in orders if o.total_price)
                
                customer_data.append({
                    'customer_id': customer.id,
                    'username': customer.username,
                    'email': customer.email,
                    'recency': recency,
                    'frequency': frequency,
                    'monetary': monetary,
                    'avg_order_value': monetary / frequency if frequency > 0 else 0
                })
            
            if not customer_data:
                return {'segments': []}
            
            df = pd.DataFrame(customer_data)
            
            # Simple segmentation based on quartiles
            df['R_score'] = pd.qcut(df['recency'], q=4, labels=[4, 3, 2, 1], duplicates='drop')
            df['F_score'] = pd.qcut(df['frequency'].rank(method='first'), q=4, labels=[1, 2, 3, 4], duplicates='drop')
            df['M_score'] = pd.qcut(df['monetary'].rank(method='first'), q=4, labels=[1, 2, 3, 4], duplicates='drop')
            
            df['RFM_score'] = df['R_score'].astype(int) + df['F_score'].astype(int) + df['M_score'].astype(int)
            
            # Define segments
            def segment_label(score):
                if score >= 10:
                    return 'Champions'
                elif score >= 8:
                    return 'Loyal Customers'
                elif score >= 6:
                    return 'Potential Loyalists'
                elif score >= 4:
                    return 'At Risk'
                else:
                    return 'Lost'
            
            df['segment'] = df['RFM_score'].apply(segment_label)
            
            # Group by segment
            segments = df.groupby('segment').apply(lambda x: x.to_dict('records')).to_dict()
            
            # Add segment statistics
            segment_stats = df.groupby('segment').agg({
                'customer_id': 'count',
                'monetary': 'sum',
                'frequency': 'mean'
            }).reset_index()
            segment_stats.columns = ['segment', 'customer_count', 'total_revenue', 'avg_frequency']
            
            return {
                'segments': segments,
                'statistics': segment_stats.to_dict('records')
            }
            
        except Exception as e:
            logger.error(f"Error in customer segmentation: {e}")
            return {'segments': []}
    
    def predict_customer_churn(self) -> List[Dict]:
        """
        Identify customers at risk of churning
        """
        try:
            customers = self.db.query(models.User).filter(
                models.User.role == 'customer'
            ).all()
            
            at_risk_customers = []
            current_date = datetime.utcnow()
            
            for customer in customers:
                orders = self.db.query(models.Order).filter(
                    models.Order.user_id == customer.id
                ).order_by(models.Order.created_at.desc()).all()
                
                if not orders or len(orders) < 2:
                    continue
                
                # Calculate days since last order
                days_since_last_order = (current_date - orders[0].created_at).days
                
                # Calculate average order interval
                order_dates = [o.created_at for o in orders]
                intervals = [(order_dates[i] - order_dates[i+1]).days 
                            for i in range(len(order_dates)-1)]
                avg_interval = np.mean(intervals) if intervals else 30
                
                # Churn risk if inactive > 2x avg interval
                if days_since_last_order > avg_interval * 2:
                    churn_risk = min(1.0, days_since_last_order / (avg_interval * 3))
                    
                    at_risk_customers.append({
                        'customer_id': customer.id,
                        'username': customer.username,
                        'email': customer.email,
                        'days_since_last_order': days_since_last_order,
                        'avg_order_interval': float(avg_interval),
                        'churn_risk_score': float(churn_risk),
                        'total_orders': len(orders),
                        'last_order_date': orders[0].created_at.isoformat(),
                        'risk_level': 'High' if churn_risk > 0.7 else 'Medium' if churn_risk > 0.4 else 'Low'
                    })
            
            # Sort by churn risk
            at_risk_customers.sort(key=lambda x: x['churn_risk_score'], reverse=True)
            
            return at_risk_customers
            
        except Exception as e:
            logger.error(f"Error in churn prediction: {e}")
            return []
    
    def calculate_customer_lifetime_value(self, customer_id: int) -> Dict:
        """
        Calculate predicted Customer Lifetime Value (CLV)
        """
        try:
            orders = self.db.query(models.Order).filter(
                models.Order.user_id == customer_id
            ).order_by(models.Order.created_at).all()
            
            if not orders:
                return {'clv': 0, 'confidence': 0}
            
            # Calculate metrics
            total_revenue = sum(float(o.total_price) for o in orders if o.total_price)
            order_count = len(orders)
            avg_order_value = total_revenue / order_count
            
            # Calculate order frequency (orders per month)
            first_order = orders[0].created_at
            last_order = orders[-1].created_at
            months_active = max(1, (last_order - first_order).days / 30)
            order_frequency = order_count / months_active
            
            # Simple CLV prediction (assuming 2-year lifetime)
            predicted_lifetime_months = 24
            predicted_clv = avg_order_value * order_frequency * predicted_lifetime_months
            
            # Confidence based on data points
            confidence = min(1.0, order_count / 20)  # More orders = higher confidence
            
            return {
                'customer_id': customer_id,
                'current_value': float(total_revenue),
                'predicted_clv': float(predicted_clv),
                'avg_order_value': float(avg_order_value),
                'order_frequency_per_month': float(order_frequency),
                'months_active': float(months_active),
                'total_orders': order_count,
                'confidence': float(confidence)
            }
            
        except Exception as e:
            logger.error(f"Error calculating CLV: {e}")
            return {'clv': 0, 'confidence': 0}
    
    def recommend_menu_items(self, customer_id: int, limit: int = 5) -> List[Dict]:
        """
        Recommend menu items based on customer order history
        Simple collaborative filtering approach
        """
        try:
            # Get customer's order history
            customer_items = self.db.query(models.OrderItem.menu_item_id).join(
                models.Order
            ).filter(
                models.Order.user_id == customer_id
            ).distinct().all()
            
            customer_item_ids = [item[0] for item in customer_items]
            
            if not customer_item_ids:
                # Return popular items for new customers
                popular_items = self.db.query(
                    models.OrderItem.menu_item_id,
                    func.count(models.OrderItem.id).label('order_count')
                ).group_by(models.OrderItem.menu_item_id).order_by(
                    func.count(models.OrderItem.id).desc()
                ).limit(limit).all()
                
                recommendations = []
                for item_id, count in popular_items:
                    menu_item = self.db.query(models.MenuItem).filter(
                        models.MenuItem.id == item_id
                    ).first()
                    if menu_item:
                        recommendations.append({
                            'menu_item_id': menu_item.id,
                            'name': menu_item.name,
                            'reason': 'Popular item',
                            'confidence': 0.5
                        })
                
                return recommendations
            
            # Find similar customers (who ordered same items)
            similar_customers = self.db.query(models.Order.user_id).join(
                models.OrderItem
            ).filter(
                models.OrderItem.menu_item_id.in_(customer_item_ids),
                models.Order.user_id != customer_id
            ).distinct().limit(50).all()
            
            similar_customer_ids = [c[0] for c in similar_customers]
            
            if not similar_customer_ids:
                return []
            
            # Get items ordered by similar customers that current customer hasn't tried
            recommended_items = self.db.query(
                models.OrderItem.menu_item_id,
                func.count(models.OrderItem.id).label('order_count')
            ).join(models.Order).filter(
                models.Order.user_id.in_(similar_customer_ids),
                models.OrderItem.menu_item_id.notin_(customer_item_ids)
            ).group_by(models.OrderItem.menu_item_id).order_by(
                func.count(models.OrderItem.id).desc()
            ).limit(limit).all()
            
            recommendations = []
            for item_id, count in recommended_items:
                menu_item = self.db.query(models.MenuItem).filter(
                    models.MenuItem.id == item_id
                ).first()
                if menu_item:
                    confidence = min(1.0, count / len(similar_customer_ids))
                    recommendations.append({
                        'menu_item_id': menu_item.id,
                        'name': menu_item.name,
                        'category': menu_item.category,
                        'price': float(menu_item.price),
                        'reason': 'Recommended based on similar customers',
                        'confidence': float(confidence)
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    # ==================== REVENUE FORECASTING ====================
    
    def forecast_revenue(self, days_ahead: int = 30) -> Dict:
        """
        Forecast revenue for upcoming period
        """
        try:
            # Get historical revenue (last 90 days)
            start_date = datetime.utcnow() - timedelta(days=90)
            
            orders = self.db.query(models.Order).filter(
                and_(
                    models.Order.created_at >= start_date,
                    models.Order.status.in_(['completed', 'ready', 'served'])
                )
            ).all()
            
            if not orders:
                return {'forecast': 0, 'confidence': 0}
            
            # Daily revenue
            df = pd.DataFrame([{
                'date': o.created_at.date(),
                'revenue': float(o.total_price) if o.total_price else 0,
                'day_of_week': o.created_at.weekday()
            } for o in orders])
            
            daily_revenue = df.groupby('date')['revenue'].sum()
            
            # Simple moving average forecast
            recent_avg = daily_revenue.tail(14).mean()
            overall_avg = daily_revenue.mean()
            trend = (recent_avg - overall_avg) / overall_avg if overall_avg > 0 else 0
            
            # Forecast
            predicted_revenue = recent_avg * days_ahead * (1 + trend)
            
            # Confidence
            std_dev = daily_revenue.std()
            confidence = max(0, min(1, 1 - (std_dev / (overall_avg + 1))))
            
            # Weekday vs Weekend breakdown
            weekday_avg = df[df['day_of_week'] < 5].groupby('date')['revenue'].sum().mean()
            weekend_avg = df[df['day_of_week'] >= 5].groupby('date')['revenue'].sum().mean()
            
            return {
                'forecasted_revenue': float(predicted_revenue),
                'daily_avg_forecast': float(recent_avg),
                'trend': 'increasing' if trend > 0.1 else 'decreasing' if trend < -0.1 else 'stable',
                'confidence': float(confidence),
                'weekday_avg_revenue': float(weekday_avg),
                'weekend_avg_revenue': float(weekend_avg),
                'days_forecasted': days_ahead
            }
            
        except Exception as e:
            logger.error(f"Error in revenue forecast: {e}")
            return {'forecast': 0, 'confidence': 0}
