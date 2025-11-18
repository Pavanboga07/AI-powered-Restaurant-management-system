"""
Seed script to create test users in the database
"""
from app.database import SessionLocal, engine, Base
from app.models import User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_test_users():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users")
            return
        
        # Create test users
        test_users = [
            {
                "username": "admin",
                "email": "admin@restaurant.com",
                "hashed_password": hash_password("admin123"),
                "full_name": "Admin User",
                "role": UserRole.admin,
                "is_active": True
            },
            {
                "username": "manager",
                "email": "manager@restaurant.com",
                "hashed_password": hash_password("manager123"),
                "full_name": "Manager User",
                "role": UserRole.manager,
                "is_active": True
            },
            {
                "username": "chef",
                "email": "chef@restaurant.com",
                "hashed_password": hash_password("chef123"),
                "full_name": "Chef User",
                "role": UserRole.chef,
                "is_active": True
            },
            {
                "username": "staff",
                "email": "staff@restaurant.com",
                "hashed_password": hash_password("staff123"),
                "full_name": "Staff User",
                "role": UserRole.staff,
                "is_active": True
            },
            {
                "username": "customer",
                "email": "customer@restaurant.com",
                "hashed_password": hash_password("customer123"),
                "full_name": "Customer User",
                "role": UserRole.customer,
                "is_active": True
            }
        ]
        
        for user_data in test_users:
            user = User(**user_data)
            db.add(user)
        
        db.commit()
        
        print("✅ Test users created successfully!")
        print("\nLogin credentials:")
        print("==================")
        print("Admin:    username='admin'    password='admin123'")
        print("Manager:  username='manager'  password='manager123'")
        print("Chef:     username='chef'     password='chef123'")
        print("Staff:    username='staff'    password='staff123'")
        print("Customer: username='customer' password='customer123'")
        
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
