"""
API-Only Test Script (No WebSocket Interference)
Tests critical API endpoints without triggering WebSocket connections
"""
import requests
import json

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

print("\n" + "="*80)
print("API ENDPOINT TESTING (Phase 2)".center(80))
print("="*80 + "\n")

# Test 1: Health Check
print("TEST 1: Health Check")
try:
    r = requests.get(f"{BASE_URL}/health", timeout=3)
    print(f"✅ Health: {r.status_code} - {r.json()}")
except Exception as e:
    print(f"❌ Health: {e}")

# Test 2: Root Endpoint
print("\nTEST 2: Root Endpoint")
try:
    r = requests.get(f"{BASE_URL}/", timeout=3)
    print(f"✅ Root: {r.status_code}")
except Exception as e:
    print(f"❌ Root: {e}")

# Test 3: Login (Admin)
print("\nTEST 3: Authentication - Admin Login")
try:
    r = requests.post(
        f"{API_BASE}/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=3
    )
    if r.status_code == 200:
        admin_token = r.json()["access_token"]
        print(f"✅ Admin Login: {r.status_code}")
    else:
        print(f"❌ Admin Login: {r.status_code} - {r.text}")
        admin_token = None
except Exception as e:
    print(f"❌ Admin Login: {e}")
    admin_token = None

# Test 4: Login (Chef)
print("\nTEST 4: Authentication - Chef Login")
try:
    r = requests.post(
        f"{API_BASE}/auth/login",
        data={"username": "chef", "password": "chef123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=3
    )
    if r.status_code == 200:
        chef_token = r.json()["access_token"]
        print(f"✅ Chef Login: {r.status_code}")
    else:
        print(f"❌ Chef Login: {r.status_code}")
        chef_token = None
except Exception as e:
    print(f"❌ Chef Login: {e}")
    chef_token = None

# Test 5: Chef Stats (The endpoint we fixed)
if chef_token:
    print("\nTEST 5: Chef Stats Endpoint (CRITICAL FIX)")
    try:
        r = requests.get(
            f"{API_BASE}/chef/orders/stats",
            headers={"Authorization": f"Bearer {chef_token}"},
            timeout=3
        )
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Chef Stats: {r.status_code}")
            print(f"   Total Orders: {data.get('total_orders')}")
            print(f"   Revenue: ${data.get('total_revenue')}")
            print(f"   Avg Order Value: ${data.get('average_order_value')}")
            
            # Verify all 10 fields
            required = ['total_orders', 'pending_orders', 'confirmed_orders', 
                       'preparing_orders', 'ready_orders', 'served_orders',
                       'completed_orders', 'cancelled_orders', 'total_revenue', 
                       'average_order_value']
            missing = [f for f in required if f not in data]
            if missing:
                print(f"   ⚠️  Missing fields: {missing}")
            else:
                print(f"   ✅ All 10 required fields present!")
        else:
            print(f"❌ Chef Stats: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ Chef Stats: {e}")

# Test 6: Menu Items (Public)
print("\nTEST 6: Menu Items (Public)")
try:
    r = requests.get(f"{API_BASE}/menu/items", timeout=3)
    if r.status_code == 200:
        items = r.json()
        print(f"✅ Menu Items: {r.status_code} - {len(items)} items found")
    else:
        print(f"❌ Menu Items: {r.status_code}")
except Exception as e:
    print(f"❌ Menu Items: {e}")

# Test 7: Staff Login
print("\nTEST 7: Authentication - Staff Login")
try:
    r = requests.post(
        f"{API_BASE}/auth/login",
        data={"username": "staff", "password": "staff123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=3
    )
    if r.status_code == 200:
        staff_token = r.json()["access_token"]
        print(f"✅ Staff Login: {r.status_code}")
    else:
        print(f"❌ Staff Login: {r.status_code}")
        staff_token = None
except Exception as e:
    print(f"❌ Staff Login: {e}")
    staff_token = None

# Test 8: Tables (Staff)
if staff_token:
    print("\nTEST 8: Tables Endpoint (Staff)")
    try:
        r = requests.get(
            f"{API_BASE}/tables/",
            headers={"Authorization": f"Bearer {staff_token}"},
            timeout=3
        )
        if r.status_code == 200:
            tables = r.json()
            print(f"✅ Tables: {r.status_code} - {len(tables)} tables found")
        else:
            print(f"❌ Tables: {r.status_code}")
    except Exception as e:
        print(f"❌ Tables: {e}")

# Test 9: Orders (Staff)
if staff_token:
    print("\nTEST 9: Orders Endpoint (Staff)")
    try:
        r = requests.get(
            f"{API_BASE}/orders/",
            headers={"Authorization": f"Bearer {staff_token}"},
            timeout=3
        )
        if r.status_code == 200:
            orders = r.json()
            print(f"✅ Orders: {r.status_code} - {len(orders)} orders found")
        else:
            print(f"❌ Orders: {r.status_code}")
    except Exception as e:
        print(f"❌ Orders: {e}")

# Test 10: Manager Login
print("\nTEST 10: Authentication - Manager Login")
try:
    r = requests.post(
        f"{API_BASE}/auth/login",
        data={"username": "manager", "password": "manager123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=3
    )
    if r.status_code == 200:
        manager_token = r.json()["access_token"]
        print(f"✅ Manager Login: {r.status_code}")
    else:
        print(f"❌ Manager Login: {r.status_code}")
        manager_token = None
except Exception as e:
    print(f"❌ Manager Login: {e}")
    manager_token = None

# Test 11: Analytics Revenue (Manager)
if manager_token:
    print("\nTEST 11: Analytics Revenue Endpoint (Manager)")
    try:
        r = requests.get(
            f"{API_BASE}/analytics/revenue",
            headers={"Authorization": f"Bearer {manager_token}"},
            timeout=3
        )
        if r.status_code == 200:
            print(f"✅ Analytics Revenue: {r.status_code}")
        else:
            print(f"❌ Analytics Revenue: {r.status_code}")
    except Exception as e:
        print(f"❌ Analytics Revenue: {e}")

print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print("\n✅ = Passed | ❌ = Failed | ⚠️ = Warning")
print("\nAll critical API endpoints tested!")
print("Backend server still running at http://localhost:8000")
print("\n" + "="*80 + "\n")
