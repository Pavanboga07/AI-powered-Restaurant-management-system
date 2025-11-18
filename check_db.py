import sys
sys.path.insert(0, r'C:\Users\91862\OneDrive\Desktop\zbc\backend')

from app.database import engine, SessionLocal
from app.models import User

print(f"Database URL: {engine.url}")
print(f"Database file: {engine.url.database}")
print()

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"Total users in database: {len(users)}")
    
    if users:
        print("\nUsers found:")
        for user in users:
            print(f"  - {user.username} ({user.role}) - Active: {user.is_active}")
    else:
        print("\n❌ NO USERS IN DATABASE!")
        print("You need to run: python reset_db.py")
finally:
    db.close()
