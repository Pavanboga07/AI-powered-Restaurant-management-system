from app.database import SessionLocal
from app.models import User

db = SessionLocal()
users = db.query(User).all()

print(f"\nTotal users in database: {len(users)}\n")

if users:
    print("Login Credentials:")
    print("-" * 50)
    for user in users:
        print(f"Username: {user.username:15} Password: {user.username}123")
        print(f"  Role: {user.role:20} Active: {user.is_active}")
        print()
else:
    print("❌ NO USERS FOUND!")
    print("Run: python reset_db.py")

db.close()
