"""
Direct HTTP API Testing (No Browser, No WebSocket Client)
Tests backend API endpoints using fresh HTTP requests
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_BASE = BASE_URL  # Routes are at root level, not under /api

print("\n" + "="*100)
print(" PHASE 2: API ENDPOINT TESTING ".center(100, "="))
print("="*100 + "\n")

test_results = []

def test_endpoint(name, method, url, headers=None, data=None, json_data=None, expected_status=200):
    """Test a single endpoint and record result"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, headers=headers, data=data, json=json_data, timeout=5)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=json_data, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=5)
        
        success = response.status_code == expected_status
        result = {
            "name": name,
            "method": method,
            "url": url,
            "expected": expected_status,
            "actual": response.status_code,
            "success": success,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else None
        }
        test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name}: {response.status_code} (expected {expected_status})")
        
        return response, success
    except Exception as e:
        print(f"❌ {name}: ERROR - {str(e)}")
        test_results.append({
            "name": name,
            "method": method,
            "url": url,
            "success": False,
            "error": str(e)
        })
        return None, False

# ==================================================
# CATEGORY A: Health & Info Endpoints
# ==================================================
print("\n" + "-"*100)
print("CATEGORY A: Health & System Info")
print("-"*100)

test_endpoint("Health Check", "GET", f"{BASE_URL}/health")
test_endpoint("Root Endpoint", "GET", BASE_URL)
test_endpoint("API Docs", "GET", f"{BASE_URL}/docs", expected_status=200)

# ==================================================
# CATEGORY B: Authentication Endpoints
# ==================================================
print("\n" + "-"*100)
print("CATEGORY B: Authentication")
print("-"*100)

# Test all user logins
tokens = {}
users = {
    "admin": "admin123",
    "manager": "manager123",
    "chef": "chef123",
    "staff": "staff123",
    "customer": "customer123"
}

for role, password in users.items():
    response, success = test_endpoint(
        f"Login - {role.capitalize()}",
        "POST",
        f"{BASE_URL}/auth/login",  # Auth is at /auth, not /api/auth
        data={"username": role, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if success and response:
        tokens[role] = response.json().get("access_token")

# ==================================================
# CATEGORY C: Menu Endpoints (Public)
# ==================================================
print("\n" + "-"*100)
print("CATEGORY C: Menu Endpoints")
print("-"*100)

response, _ = test_endpoint("Get All Menu Items", "GET", f"{BASE_URL}/menu/")  # Menu items at /menu/ root
if response and response.status_code == 200:
    items = response.json()
    print(f"   📊 Found {len(items)} menu items")

test_endpoint("Get Menu Categories", "GET", f"{BASE_URL}/menu/categories/list")  # Categories at /menu/categories/list

# ==================================================
# CATEGORY D: Chef Endpoints
# ==================================================
if "chef" in tokens:
    print("\n" + "-"*100)
    print("CATEGORY D: Chef Endpoints")
    print("-"*100)
    
    chef_headers = {"Authorization": f"Bearer {tokens['chef']}"}
    
    # THE CRITICAL FIX WE MADE
    response, success = test_endpoint(
        "Chef Order Stats (FIXED ENDPOINT)",
        "GET",
        f"{BASE_URL}/api/chef/orders/stats",
        headers=chef_headers
    )
    
    if success and response:
        data = response.json()
        print(f"   📊 Stats Summary:")
        print(f"      Total Orders: {data.get('total_orders')}")
        print(f"      Pending: {data.get('pending_orders')}")
        print(f"      Preparing: {data.get('preparing_orders')}")
        print(f"      Revenue: ${data.get('total_revenue')}")
        print(f"      Avg Order: ${data.get('average_order_value')}")
        
        # Verify all 10 required fields
        required_fields = [
            'total_orders', 'pending_orders', 'confirmed_orders',
            'preparing_orders', 'ready_orders', 'served_orders',
            'completed_orders', 'cancelled_orders', 'total_revenue',
            'average_order_value'
        ]
        missing = [f for f in required_fields if f not in data]
        if missing:
            print(f"   ⚠️  WARNING: Missing fields: {missing}")
        else:
            print(f"   ✅ All 10 required fields present!")
    
    test_endpoint("Chef Active Orders", "GET", f"{BASE_URL}/api/chef/orders/active", headers=chef_headers)
    test_endpoint("Chef Menu Items", "GET", f"{BASE_URL}/api/chef/menu/items", headers=chef_headers)

# ==================================================
# CATEGORY E: Staff Endpoints
# ==================================================
if "staff" in tokens:
    print("\n" + "-"*100)
    print("CATEGORY E: Staff Endpoints")
    print("-"*100)
    
    staff_headers = {"Authorization": f"Bearer {tokens['staff']}"}
    
    response, _ = test_endpoint("Staff Tables", "GET", f"{BASE_URL}/api/tables/", headers=staff_headers)
    if response and response.status_code == 200:
        tables = response.json()
        print(f"   📊 Found {len(tables)} tables")
    
    response, _ = test_endpoint("Staff Orders", "GET", f"{BASE_URL}/api/orders/", headers=staff_headers)
    if response and response.status_code == 200:
        orders = response.json()
        print(f"   📊 Found {len(orders)} orders")
    
    test_endpoint("Staff Order Stats", "GET", f"{BASE_URL}/api/staff/orders/stats", headers=staff_headers)

# ==================================================
# CATEGORY F: Manager/Analytics Endpoints
# ==================================================
if "manager" in tokens:
    print("\n" + "-"*100)
    print("CATEGORY F: Manager/Analytics Endpoints")
    print("-"*100)
    
    manager_headers = {"Authorization": f"Bearer {tokens['manager']}"}
    
    test_endpoint("Analytics Revenue Trend", "GET", f"{BASE_URL}/api/analytics/revenue-trend", headers=manager_headers)
    test_endpoint("Analytics Dashboard", "GET", f"{BASE_URL}/api/analytics/dashboard", headers=manager_headers)
    test_endpoint("Popular Items", "GET", f"{BASE_URL}/api/analytics/popular-items", headers=manager_headers)

# ==================================================
# CATEGORY G: Billing Endpoints
# ==================================================
if "staff" in tokens:
    print("\n" + "-"*100)
    print("CATEGORY G: Billing Endpoints")
    print("-"*100)
    
    test_endpoint("Get Bills", "GET", f"{BASE_URL}/api/billing/", headers=staff_headers)

# ==================================================
# CATEGORY H: Reservations Endpoints
# ==================================================
if "staff" in tokens:
    print("\n" + "-"*100)
    print("CATEGORY H: Reservations Endpoints")
    print("-"*100)
    
    test_endpoint("Get Reservations", "GET", f"{BASE_URL}/api/reservations/", headers=staff_headers)

# ==================================================
# CATEGORY I: Customer Endpoints
# ==================================================
if "customer" in tokens:
    print("\n" + "-"*100)
    print("CATEGORY I: Customer Endpoints")
    print("-"*100)
    
    customer_headers = {"Authorization": f"Bearer {tokens['customer']}"}
    
    test_endpoint("Customer Profile", "GET", f"{BASE_URL}/api/customer/profile", headers=customer_headers)
    test_endpoint("Customer Favorites", "GET", f"{BASE_URL}/api/customer/favorites", headers=customer_headers)

# ==================================================
# SUMMARY
# ==================================================
print("\n" + "="*100)
print(" TEST SUMMARY ".center(100, "="))
print("="*100 + "\n")

total = len(test_results)
passed = sum(1 for r in test_results if r.get("success", False))
failed = total - passed

print(f"Total Tests: {total}")
print(f"✅ Passed: {passed}")
print(f"❌ Failed: {failed}")
print(f"Success Rate: {(passed/total*100):.1f}%")

if failed > 0:
    print("\n" + "-"*100)
    print("FAILED TESTS:")
    print("-"*100)
    for result in test_results:
        if not result.get("success", False):
            print(f"  ❌ {result['name']}")
            if 'error' in result:
                print(f"     Error: {result['error']}")
            elif 'actual' in result:
                print(f"     Expected: {result['expected']}, Got: {result['actual']}")

print("\n" + "="*100)
print(" PHASE 2 COMPLETE ".center(100, "="))
print("="*100 + "\n")

# Save results to file
with open("api_test_results.json", "w") as f:
    json.dump({
        "timestamp": datetime.now().isoformat(),
        "total": total,
        "passed": passed,
        "failed": failed,
        "results": test_results
    }, f, indent=2)

print("📄 Detailed results saved to: api_test_results.json\n")
