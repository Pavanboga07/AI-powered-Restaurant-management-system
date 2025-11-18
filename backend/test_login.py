from app.database import SessionLocal
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = SessionLocal()

# Test all users
users = db.query(User).all()
print(f"Total users in database: {len(users)}\n")

for user in users:
    print(f"Username: {user.username}")
    print(f"Role: {user.role}")
    print(f"Active: {user.is_active}")
    
    # Test password verification
    test_password = f"{user.username}123"
    is_valid = pwd_context.verify(test_password, user.hashed_password)
    print(f"Password '{test_password}' valid: {is_valid}")
    print("-" * 50)

db.close()
