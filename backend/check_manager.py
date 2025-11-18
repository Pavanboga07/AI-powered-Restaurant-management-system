from app.database import SessionLocal
from app.models import User
from app.utils.security import verify_password

db = SessionLocal()

# Get manager user
manager = db.query(User).filter(User.username == "manager").first()

if manager:
    print(f"Manager User Details:")
    print(f"  ID: {manager.id}")
    print(f"  Username: {manager.username}")
    print(f"  Email: {manager.email}")
    print(f"  Role: {manager.role}")
    print(f"  Is Active: {manager.is_active}")
    print(f"  Full Name: {manager.full_name}")
    print(f"  Phone: {manager.phone}")
    print(f"  Created At: {manager.created_at}")
    print(f"\n  Hashed Password (first 20 chars): {manager.hashed_password[:20]}...")
    
    # Test password
    test_pass = "manager123"
    is_valid = verify_password(test_pass, manager.hashed_password)
    print(f"\n  Password 'manager123' verification: {is_valid}")
    
    # Check for any related data that might cause delays
    print(f"\n  Checking related data...")
    # You can add checks for orders, bills, etc. if needed
else:
    print("Manager user not found!")

db.close()
