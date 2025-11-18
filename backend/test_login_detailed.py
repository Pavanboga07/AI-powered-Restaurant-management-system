import requests
import json

url = "http://192.168.1.2:8000/auth/login/json"

# Test with exact credentials
credentials = {
    "username": "manager",
    "password": "manager123"
}

print(f"Testing login at: {url}")
print(f"Credentials: {credentials}")
print(f"JSON: {json.dumps(credentials)}")
print("\n" + "="*60 + "\n")

try:
    response = requests.post(
        url,
        json=credentials,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ LOGIN SUCCESSFUL!")
        print(f"Access Token: {data.get('access_token', '')[:50]}...")
    else:
        print(f"\n❌ LOGIN FAILED")
        print(f"Error: {response.text}")
        
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection Error: {e}")
except requests.exceptions.Timeout as e:
    print(f"❌ Timeout Error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
