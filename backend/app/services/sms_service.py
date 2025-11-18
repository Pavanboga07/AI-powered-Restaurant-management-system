"""
SMS Service using Twilio
Handles sending SMS notifications for order updates and alerts
"""

from twilio.rest import Client
import os
from typing import Dict, Any
from datetime import datetime


class SMSService:
    """Service class for sending SMS notifications via Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            print("⚠️  Twilio credentials not configured. SMS service is disabled.")
    
    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """Send SMS to a phone number"""
        if not self.enabled:
            return {"success": False, "error": "SMS service not configured"}
        
        try:
            # Ensure number has country code
            if not to_number.startswith('+'):
                to_number = '+91' + to_number  # Default to India country code
            
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            return {
                "success": True,
                "message_sid": message_obj.sid,
                "status": message_obj.status
            }
        except Exception as e:
            print(f"Error sending SMS: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def send_order_confirmation_sms(
        self,
        phone_number: str,
        customer_name: str,
        order_id: int,
        total_amount: float
    ) -> Dict[str, Any]:
        """Send order confirmation SMS"""
        message = (
            f"Hi {customer_name}! Your order #{order_id} has been confirmed. "
            f"Total: ₹{total_amount:.2f}. "
            f"We'll notify you when it's ready. Thank you!"
        )
        return self.send_sms(phone_number, message)
    
    def send_order_status_sms(
        self,
        phone_number: str,
        customer_name: str,
        order_id: int,
        new_status: str
    ) -> Dict[str, Any]:
        """Send order status update SMS"""
        status_messages = {
            'pending': 'Your order has been received.',
            'preparing': 'Your order is being prepared by our chef.',
            'ready': 'Your order is ready for pickup!',
            'out_for_delivery': 'Your order is out for delivery!',
            'delivered': 'Your order has been delivered. Enjoy your meal!',
            'cancelled': 'Your order has been cancelled.'
        }
        
        status_text = status_messages.get(new_status, 'Your order status has been updated.')
        
        message = (
            f"Hi {customer_name}! Order #{order_id} update: {status_text}"
        )
        return self.send_sms(phone_number, message)
    
    def send_reservation_confirmation_sms(
        self,
        phone_number: str,
        customer_name: str,
        reservation_id: int,
        date: str,
        time: str,
        guests: int
    ) -> Dict[str, Any]:
        """Send reservation confirmation SMS"""
        message = (
            f"Hi {customer_name}! Your table reservation #{reservation_id} is confirmed for "
            f"{date} at {time} for {guests} guest(s). See you soon!"
        )
        return self.send_sms(phone_number, message)
    
    def send_reservation_reminder_sms(
        self,
        phone_number: str,
        customer_name: str,
        reservation_id: int,
        time: str
    ) -> Dict[str, Any]:
        """Send reservation reminder SMS (1 hour before)"""
        message = (
            f"Hi {customer_name}! Reminder: Your table reservation #{reservation_id} "
            f"is at {time} today. We look forward to serving you!"
        )
        return self.send_sms(phone_number, message)
    
    def send_promotional_sms(
        self,
        phone_number: str,
        customer_name: str,
        offer_text: str
    ) -> Dict[str, Any]:
        """Send promotional SMS"""
        message = (
            f"Hi {customer_name}! {offer_text} "
            f"Order now at [Your Restaurant URL]. T&C apply."
        )
        return self.send_sms(phone_number, message)
    
    def send_otp_sms(
        self,
        phone_number: str,
        otp: str
    ) -> Dict[str, Any]:
        """Send OTP for verification"""
        message = (
            f"Your verification code is: {otp}. "
            f"Valid for 10 minutes. Do not share this code with anyone."
        )
        return self.send_sms(phone_number, message)


# Create singleton instance
sms_service = SMSService()
