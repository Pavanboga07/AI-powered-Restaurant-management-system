from app.database import SessionLocal
from app.models import User
from app.utils.security import verify_password, get_password_hash

db = SessionLocal()

# Test each user
test_passwords = {
    "admin": "admin123",
    "manager": "manager123",
    "chef": "chef123",
    "staff": "staff123"
}

print("Testing password verification:\n")

for username, password in test_passwords.items():
    user = db.query(User).filter(User.username == username).first()
    if user:
        # Test verification
        is_valid = verify_password(password, user.hashed_password)
        print(f"{username}:")
        print(f"  Password: {password}")
        print(f"  Hash (first 30): {user.hashed_password[:30]}...")
        print(f"  Verification: {'✅ PASS' if is_valid else '❌ FAIL'}")
        
        # Test with fresh hash
        fresh_hash = get_password_hash(password)
        fresh_verify = verify_password(password, fresh_hash)
        print(f"  Fresh hash verify: {'✅ PASS' if fresh_verify else '❌ FAIL'}")
        print()
    else:
        print(f"❌ User {username} not found!\n")

db.close()

print("\n" + "="*60)
print("Testing direct password functions:")
print("="*60)

test_pass = "manager123"
print(f"\nTest password: {test_pass}")
print(f"Password length: {len(test_pass)}")
print(f"Password bytes: {len(test_pass.encode('utf-8'))}")

# Create hash
hashed = get_password_hash(test_pass)
print(f"Hash created: {hashed[:50]}...")

# Verify
verified = verify_password(test_pass, hashed)
print(f"Verification result: {'✅ SUCCESS' if verified else '❌ FAILED'}")
