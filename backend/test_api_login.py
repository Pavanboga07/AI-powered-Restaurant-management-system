import requests
import json

# Test login endpoint
url = "http://192.168.1.2:8000/auth/login/json"

test_users = [
    {"username": "admin", "password": "admin123"},
    {"username": "manager", "password": "manager123"},
    {"username": "chef", "password": "chef123"},
    {"username": "staff", "password": "staff123"},
]

print("Testing login endpoint...")
print(f"URL: {url}\n")

for user in test_users:
    print(f"Testing {user['username']}...")
    try:
        response = requests.post(url, json=user, timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful!")
            print(f"Access Token (first 50 chars): {data.get('access_token', '')[:50]}...")
        else:
            print(f"❌ Login failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    print("-" * 60)
