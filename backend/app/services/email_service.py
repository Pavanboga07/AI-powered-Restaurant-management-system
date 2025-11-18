"""
Email Service
Handles sending emails with templates for various notifications
"""

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from typing import List, Dict, Any
import os
from datetime import datetime

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your-email@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your-app-password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "your-email@gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates' / 'email'
)

fm = FastMail(conf)

# Setup Jinja2 environment for templates
template_dir = Path(__file__).parent.parent / 'templates' / 'email'
jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))


class EmailService:
    """Service class for sending various types of emails"""
    
    @staticmethod
    async def send_order_confirmation(
        email: str,
        customer_name: str,
        order_id: int,
        order_details: Dict[str, Any]
    ):
        """Send order confirmation email"""
        template = jinja_env.get_template('order_confirmation.html')
        
        html_content = template.render(
            customer_name=customer_name,
            order_id=order_id,
            order_date=datetime.now().strftime("%B %d, %Y %I:%M %p"),
            items=order_details.get('items', []),
            subtotal=order_details.get('subtotal', 0),
            tax=order_details.get('tax', 0),
            total=order_details.get('total', 0),
            delivery_address=order_details.get('delivery_address', 'N/A'),
            estimated_delivery=order_details.get('estimated_delivery', '30-45 minutes')
        )
        
        message = MessageSchema(
            subject=f"Order Confirmation - Order #{order_id}",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        try:
            await fm.send_message(message)
            return {"success": True, "message": "Order confirmation email sent"}
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_order_status_update(
        email: str,
        customer_name: str,
        order_id: int,
        new_status: str,
        estimated_time: str = None
    ):
        """Send order status update email"""
        template = jinja_env.get_template('order_status_update.html')
        
        status_messages = {
            'pending': 'Your order has been received and is being prepared.',
            'preparing': 'Our chef is preparing your delicious meal!',
            'ready': 'Your order is ready for pickup/delivery!',
            'out_for_delivery': 'Your order is on the way!',
            'delivered': 'Your order has been delivered. Enjoy!',
            'cancelled': 'Your order has been cancelled.'
        }
        
        html_content = template.render(
            customer_name=customer_name,
            order_id=order_id,
            new_status=new_status.replace('_', ' ').title(),
            status_message=status_messages.get(new_status, 'Your order status has been updated.'),
            estimated_time=estimated_time,
            timestamp=datetime.now().strftime("%B %d, %Y %I:%M %p")
        )
        
        message = MessageSchema(
            subject=f"Order #{order_id} Status Update - {new_status.replace('_', ' ').title()}",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        try:
            await fm.send_message(message)
            return {"success": True, "message": "Status update email sent"}
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_reservation_confirmation(
        email: str,
        customer_name: str,
        reservation_id: int,
        reservation_details: Dict[str, Any]
    ):
        """Send table reservation confirmation email"""
        template = jinja_env.get_template('reservation_confirmation.html')
        
        html_content = template.render(
            customer_name=customer_name,
            reservation_id=reservation_id,
            date=reservation_details.get('date'),
            time=reservation_details.get('time'),
            guests=reservation_details.get('guests'),
            table_number=reservation_details.get('table_number', 'TBA'),
            special_requests=reservation_details.get('special_requests', 'None')
        )
        
        message = MessageSchema(
            subject=f"Reservation Confirmed - Booking #{reservation_id}",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        try:
            await fm.send_message(message)
            return {"success": True, "message": "Reservation confirmation email sent"}
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_promotional_email(
        recipients: List[str],
        subject: str,
        campaign_data: Dict[str, Any]
    ):
        """Send promotional/marketing email"""
        template = jinja_env.get_template('promotional.html')
        
        html_content = template.render(
            title=campaign_data.get('title', 'Special Offer'),
            subtitle=campaign_data.get('subtitle', ''),
            description=campaign_data.get('description', ''),
            offer_details=campaign_data.get('offer_details', []),
            cta_text=campaign_data.get('cta_text', 'Order Now'),
            cta_link=campaign_data.get('cta_link', 'http://localhost:5173'),
            valid_until=campaign_data.get('valid_until', ''),
            image_url=campaign_data.get('image_url', '')
        )
        
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=html_content,
            subtype=MessageType.html
        )
        
        try:
            await fm.send_message(message)
            return {"success": True, "message": f"Promotional email sent to {len(recipients)} recipients"}
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_low_stock_alert(
        recipients: List[str],
        inventory_alerts: List[Dict[str, Any]]
    ):
        """Send low stock alert to managers"""
        template = jinja_env.get_template('low_stock_alert.html')
        
        html_content = template.render(
            alerts=inventory_alerts,
            timestamp=datetime.now().strftime("%B %d, %Y %I:%M %p")
        )
        
        message = MessageSchema(
            subject="⚠️ Low Stock Alert - Immediate Action Required",
            recipients=recipients,
            body=html_content,
            subtype=MessageType.html
        )
        
        try:
            await fm.send_message(message)
            return {"success": True, "message": "Low stock alert sent"}
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_welcome_email(
        email: str,
        customer_name: str
    ):
        """Send welcome email to new users"""
        template = jinja_env.get_template('welcome.html')
        
        html_content = template.render(
            customer_name=customer_name,
            app_url='http://localhost:5173'
        )
        
        message = MessageSchema(
            subject="Welcome to Our Restaurant! 🎉",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        try:
            await fm.send_message(message)
            return {"success": True, "message": "Welcome email sent"}
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def send_password_reset(
        email: str,
        customer_name: str,
        reset_token: str
    ):
        """Send password reset email"""
        template = jinja_env.get_template('password_reset.html')
        
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        html_content = template.render(
            customer_name=customer_name,
            reset_link=reset_link,
            expiry_time="1 hour"
        )
        
        message = MessageSchema(
            subject="Password Reset Request",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html
        )
        
        try:
            await fm.send_message(message)
            return {"success": True, "message": "Password reset email sent"}
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}


# Create singleton instance
email_service = EmailService()
