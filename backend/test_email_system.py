"""
Email System Test Script
Run this to test if email sending is working correctly
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.email_service import email_service


async def test_welcome_email():
    """Test welcome email"""
    print("\n📧 Testing Welcome Email...")
    print("-" * 50)
    
    result = await email_service.send_welcome_email(
        email="pavanboga07@gmail.com",
        customer_name="Pavan Boga"
    )
    
    if result.get('success'):
        print("✅ Welcome email sent successfully!")
    else:
        print(f"❌ Failed to send welcome email: {result.get('error')}")
    
    return result


async def test_order_confirmation():
    """Test order confirmation email"""
    print("\n📧 Testing Order Confirmation Email...")
    print("-" * 50)
    
    order_details = {
        'items': [
            {'name': 'Margherita Pizza', 'quantity': 2, 'price': 299.0},
            {'name': 'Garlic Bread', 'quantity': 1, 'price': 99.0},
            {'name': 'Coke', 'quantity': 2, 'price': 50.0}
        ],
        'subtotal': 797.0,
        'tax': 39.85,
        'total': 836.85,
        'delivery_address': 'Table 5',
        'estimated_delivery': '20-30 minutes'
    }
    
    result = await email_service.send_order_confirmation(
        email="pavanboga07@gmail.com",  # Replace with your email
        customer_name="John Doe",
        order_id=12345,
        order_details=order_details
    )
    
    if result.get('success'):
        print("✅ Order confirmation email sent successfully!")
    else:
        print(f"❌ Failed to send order confirmation: {result.get('error')}")
    
    return result


async def test_order_status_update():
    """Test order status update email"""
    print("\n📧 Testing Order Status Update Email...")
    print("-" * 50)
    
    result = await email_service.send_order_status_update(
        email="pavanboga07@gmail.com",
        customer_name="Pavan Boga",
        order_id=12345,
        new_status="preparing",
        estimated_time="15-20 minutes"
    )
    
    if result.get('success'):
        print("✅ Status update email sent successfully!")
    else:
        print(f"❌ Failed to send status update: {result.get('error')}")
    
    return result


async def test_promotional_email():
    """Test promotional email"""
    print("\n📧 Testing Promotional Email...")
    print("-" * 50)
    
    campaign_data = {
        'title': 'Weekend Special Offer!',
        'subtitle': 'Get 50% Off on All Orders',
        'description': 'Don\'t miss this amazing weekend offer. Valid this Saturday and Sunday only!',
        'offer_details': [
            '50% off on all pizzas',
            'Free delivery on orders above ₹500',
            'Complimentary dessert with every meal',
            'Valid for dine-in and takeaway'
        ],
        'cta_text': 'Order Now',
        'cta_link': 'http://localhost:5173',
        'valid_until': 'November 10, 2025',
        'image_url': ''
    }
    
    result = await email_service.send_promotional_email(
        recipients=["pavanboga07@gmail.com"],
        subject="🎉 Weekend Special - 50% Off!",
        campaign_data=campaign_data
    )
    
    if result.get('success'):
        print("✅ Promotional email sent successfully!")
    else:
        print(f"❌ Failed to send promotional email: {result.get('error')}")
    
    return result


async def test_low_stock_alert():
    """Test low stock alert email"""
    print("\n📧 Testing Low Stock Alert Email...")
    print("-" * 50)
    
    inventory_alerts = [
        {
            'item_name': 'Tomatoes',
            'category': 'Vegetables',
            'unit': 'kg',
            'current_quantity': 2.5,
            'min_quantity': 10.0,
            'supplier_name': 'Fresh Farms Co.'
        },
        {
            'item_name': 'Mozzarella Cheese',
            'category': 'Dairy',
            'unit': 'kg',
            'current_quantity': 0.0,
            'min_quantity': 5.0,
            'supplier_name': 'Dairy Products Ltd.'
        }
    ]
    
    result = await email_service.send_low_stock_alert(
        recipients=["pavanboga07@gmail.com"],
        inventory_alerts=inventory_alerts
    )
    
    if result.get('success'):
        print("✅ Low stock alert sent successfully!")
    else:
        print(f"❌ Failed to send low stock alert: {result.get('error')}")
    
    return result


async def test_reservation_confirmation():
    """Test reservation confirmation email"""
    print("\n📧 Testing Reservation Confirmation Email...")
    print("-" * 50)
    
    reservation_details = {
        'date': 'November 15, 2025',
        'time': '7:30 PM',
        'guests': 4,
        'table_number': 'T-12',
        'special_requests': 'Window seat preferred, celebrating anniversary'
    }
    
    result = await email_service.send_reservation_confirmation(
        email="pavanboga07@gmail.com",
        customer_name="Pavan Boga",
        reservation_id=789,
        reservation_details=reservation_details
    )
    
    if result.get('success'):
        print("✅ Reservation confirmation sent successfully!")
    else:
        print(f"❌ Failed to send reservation confirmation: {result.get('error')}")
    
    return result


async def main():
    """Run all tests"""
    print("=" * 50)
    print("🧪 EMAIL SYSTEM TEST SUITE")
    print("=" * 50)
    
    # Check if email is configured
    import os
    from dotenv import load_dotenv
    
    # Load .env file from backend directory
    env_path = Path(__file__).parent / '.env'
    print(f"\n🔍 Loading .env from: {env_path}")
    print(f"   File exists: {env_path.exists()}")
    load_dotenv(dotenv_path=env_path, override=True)  # Force reload
    
    mail_username = os.getenv("MAIL_USERNAME")
    mail_password = os.getenv("MAIL_PASSWORD")
    
    print(f"   MAIL_USERNAME loaded: {mail_username}")
    print(f"   MAIL_PASSWORD loaded: {'*' * len(mail_password) if mail_password else 'None'}")
    
    if not mail_username or mail_username == "your-email@gmail.com":
        print("\n❌ ERROR: Email not configured!")
        print("\n📝 Please update .env file with your Gmail credentials:")
        print("   1. MAIL_USERNAME=your-email@gmail.com")
        print("   2. MAIL_PASSWORD=your-app-password")
        print("\n💡 To get app password:")
        print("   1. Enable 2FA: https://myaccount.google.com/security")
        print("   2. Generate app password: https://myaccount.google.com/apppasswords")
        return
    
    if not mail_password or mail_password == "your-app-specific-password":
        print("\n❌ ERROR: Email password not configured!")
        print("\n📝 Please update MAIL_PASSWORD in .env file")
        print("   Use App Password (16 characters), not regular password")
        return
    
    print(f"\n✅ Email configured: {mail_username}")
    print(f"📧 Test emails will be sent to: pavanboga07@gmail.com")
    print("\n🚀 Ready to send 6 test emails!")
    print("   - Welcome Email")
    print("   - Order Confirmation")
    print("   - Order Status Update")
    print("   - Promotional Campaign")
    print("   - Low Stock Alert")
    print("   - Reservation Confirmation")
    
    input("\n Press Enter to start sending emails or Ctrl+C to exit...")
    
    results = []
    
    # Run all tests
    try:
        results.append(await test_welcome_email())
        await asyncio.sleep(2)  # Wait between emails
        
        results.append(await test_order_confirmation())
        await asyncio.sleep(2)
        
        results.append(await test_order_status_update())
        await asyncio.sleep(2)
        
        results.append(await test_promotional_email())
        await asyncio.sleep(2)
        
        results.append(await test_low_stock_alert())
        await asyncio.sleep(2)
        
        results.append(await test_reservation_confirmation())
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    success_count = sum(1 for r in results if r.get('success'))
    total_count = len(results)
    
    print(f"\n✅ Successful: {success_count}/{total_count}")
    print(f"❌ Failed: {total_count - success_count}/{total_count}")
    
    if success_count == total_count:
        print("\n🎉 All tests passed! Email system is working perfectly!")
        print("\n📧 Check your inbox (and spam folder) for test emails")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")
        print("\nCommon issues:")
        print("   - Wrong email/password in .env")
        print("   - Need to use App Password, not regular password")
        print("   - 2FA not enabled on Gmail")
        print("   - Check firewall/network settings")
    
    print("\n" + "=" * 50)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
