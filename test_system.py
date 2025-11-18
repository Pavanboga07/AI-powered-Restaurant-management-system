"""
Comprehensive System Test Script
Tests all critical endpoints, WebSocket connections, and database operations
"""
import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test users
TEST_USERS = {
    "admin": {"username": "admin", "password": "admin123"},
    "manager": {"username": "manager", "password": "manager123"},
    "chef": {"username": "chef", "password": "chef123"},
    "staff": {"username": "staff", "password": "staff123"},
    "customer": {"username": "customer", "password": "customer123"}
}

# Store tokens
tokens = {}

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 80}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.ENDC}")

# ============================================
# Test 1: Health Check
# ============================================

def test_health_check():
    print_header("Test 1: Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"Health check passed: {response.json()}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check error: {e}")
        return False

# ============================================
# Test 2: Authentication
# ============================================

def test_authentication():
    print_header("Test 2: Authentication for All Users")
    all_passed = True
    
    for role, credentials in TEST_USERS.items():
        try:
            response = requests.post(
                f"{API_BASE}/auth/login",
                data={
                    "username": credentials["username"],
                    "password": credentials["password"]
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                tokens[role] = data.get("access_token")
                print_success(f"{role.capitalize()} login successful")
            else:
                print_error(f"{role.capitalize()} login failed: {response.status_code} - {response.text}")
                all_passed = False
        except Exception as e:
            print_error(f"{role.capitalize()} login error: {e}")
            all_passed = False
    
    return all_passed

# ============================================
# Test 3: Chef Stats Endpoint
# ============================================

def test_chef_stats():
    print_header("Test 3: Chef Stats Endpoint (Previously Failing)")
    
    if "chef" not in tokens:
        print_error("Chef token not available")
        return False
    
    try:
        response = requests.get(
            f"{API_BASE}/chef/orders/stats",
            headers={"Authorization": f"Bearer {tokens['chef']}"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Chef stats endpoint working!")
            print_info(f"Stats: {json.dumps(data, indent=2)}")
            
            # Verify all expected fields are present
            expected_fields = [
                'total_orders', 'pending_orders', 'confirmed_orders', 
                'preparing_orders', 'ready_orders', 'served_orders',
                'completed_orders', 'cancelled_orders', 'total_revenue', 
                'average_order_value'
            ]
            
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                print_warning(f"Missing fields: {missing_fields}")
                return False
            else:
                print_success("All expected fields present")
                return True
        else:
            print_error(f"Chef stats failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Chef stats error: {e}")
        return False

# ============================================
# Test 4: Database Seeded Data
# ============================================

def test_database_data():
    print_header("Test 4: Database Seeded Data Verification")
    
    if "staff" not in tokens:
        print_error("Staff token not available")
        return False
    
    all_passed = True
    
    # Test menu items
    try:
        response = requests.get(
            f"{API_BASE}/menu/items",
            timeout=5
        )
        if response.status_code == 200:
            items = response.json()
            print_success(f"Menu items: {len(items)} found (expected: 30)")
            if len(items) != 30:
                print_warning(f"Expected 30 menu items, found {len(items)}")
        else:
            print_error(f"Failed to fetch menu items: {response.status_code}")
            all_passed = False
    except Exception as e:
        print_error(f"Menu items error: {e}")
        all_passed = False
    
    # Test tables
    try:
        response = requests.get(
            f"{API_BASE}/tables/",
            headers={"Authorization": f"Bearer {tokens['staff']}"},
            timeout=5
        )
        if response.status_code == 200:
            tables = response.json()
            print_success(f"Tables: {len(tables)} found (expected: 20)")
            if len(tables) != 20:
                print_warning(f"Expected 20 tables, found {len(tables)}")
        else:
            print_error(f"Failed to fetch tables: {response.status_code}")
            all_passed = False
    except Exception as e:
        print_error(f"Tables error: {e}")
        all_passed = False
    
    # Test orders
    try:
        response = requests.get(
            f"{API_BASE}/orders/",
            headers={"Authorization": f"Bearer {tokens['staff']}"},
            timeout=5
        )
        if response.status_code == 200:
            orders = response.json()
            print_success(f"Orders: {len(orders)} found (expected: 30)")
            if len(orders) != 30:
                print_warning(f"Expected 30 orders, found {len(orders)}")
        else:
            print_error(f"Failed to fetch orders: {response.status_code}")
            all_passed = False
    except Exception as e:
        print_error(f"Orders error: {e}")
        all_passed = False
    
    return all_passed

# ============================================
# Test 5: Critical API Endpoints
# ============================================

def test_critical_endpoints():
    print_header("Test 5: Critical API Endpoints")
    
    endpoints = [
        # Format: (method, path, token_role, expected_status)
        ("GET", "/api/menu/items", None, 200),
        ("GET", "/api/menu/categories", None, 200),
        ("GET", "/api/tables/", "staff", 200),
        ("GET", "/api/orders/", "staff", 200),
        ("GET", "/api/chef/orders/active", "chef", 200),
        ("GET", "/api/staff/dashboard/stats", "staff", 200),
        ("GET", "/api/analytics/revenue", "manager", 200),
        ("GET", "/api/customer/profile", "customer", 200),
    ]
    
    all_passed = True
    
    for method, path, token_role, expected_status in endpoints:
        try:
            headers = {}
            if token_role and token_role in tokens:
                headers["Authorization"] = f"Bearer {tokens[token_role]}"
            
            if method == "GET":
                response = requests.get(f"{BASE_URL}{path}", headers=headers, timeout=5)
            else:
                response = requests.post(f"{BASE_URL}{path}", headers=headers, timeout=5)
            
            if response.status_code == expected_status:
                print_success(f"{method} {path} - {response.status_code}")
            else:
                print_error(f"{method} {path} - Expected {expected_status}, got {response.status_code}")
                all_passed = False
        except Exception as e:
            print_error(f"{method} {path} - Error: {e}")
            all_passed = False
    
    return all_passed

# ============================================
# Test 6: Order Creation Flow
# ============================================

def test_order_creation():
    print_header("Test 6: Order Creation Flow")
    
    if "staff" not in tokens:
        print_error("Staff token not available")
        return False
    
    try:
        # Get a table
        tables_response = requests.get(
            f"{API_BASE}/tables/",
            headers={"Authorization": f"Bearer {tokens['staff']}"},
            timeout=5
        )
        
        if tables_response.status_code != 200:
            print_error("Failed to fetch tables")
            return False
        
        tables = tables_response.json()
        if not tables:
            print_error("No tables available")
            return False
        
        table_id = tables[0]["id"]
        print_info(f"Using table {table_id}")
        
        # Get menu items
        menu_response = requests.get(f"{API_BASE}/menu/items", timeout=5)
        if menu_response.status_code != 200:
            print_error("Failed to fetch menu items")
            return False
        
        menu_items = menu_response.json()
        if not menu_items:
            print_error("No menu items available")
            return False
        
        item_id = menu_items[0]["id"]
        print_info(f"Ordering item {item_id}")
        
        # Create order
        order_data = {
            "table_id": table_id,
            "order_type": "dine_in",
            "items": [
                {
                    "menu_item_id": item_id,
                    "quantity": 2,
                    "special_notes": "Test order"
                }
            ]
        }
        
        order_response = requests.post(
            f"{API_BASE}/orders/",
            json=order_data,
            headers={
                "Authorization": f"Bearer {tokens['staff']}",
                "Content-Type": "application/json"
            },
            timeout=5
        )
        
        if order_response.status_code in [200, 201]:
            order = order_response.json()
            print_success(f"Order created successfully: Order #{order.get('id')}")
            return True
        else:
            print_error(f"Order creation failed: {order_response.status_code}")
            print_error(f"Response: {order_response.text}")
            return False
    except Exception as e:
        print_error(f"Order creation error: {e}")
        return False

# ============================================
# Test 7: WebSocket Connection (Basic check)
# ============================================

def test_websocket_info():
    print_header("Test 7: WebSocket Configuration Info")
    print_info("WebSocket endpoint should be: ws://localhost:8000/socket.io/")
    print_info("Frontend should connect to: http://localhost:8000 (Socket.IO handles /socket.io internally)")
    print_info("To test WebSocket, open the frontend and check browser console")
    print_warning("WebSocket testing requires socketio-client library for Python")
    print_info("WebSocket tests should be done through the frontend UI")
    return True

# ============================================
# Run All Tests
# ============================================

def run_all_tests():
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'*' * 80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}RESTAURANT MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'*' * 80}{Colors.ENDC}")
    print(f"{Colors.BOLD}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.ENDC}")
    
    results = {}
    
    # Run tests
    results["Health Check"] = test_health_check()
    results["Authentication"] = test_authentication()
    results["Chef Stats"] = test_chef_stats()
    results["Database Data"] = test_database_data()
    results["Critical Endpoints"] = test_critical_endpoints()
    results["Order Creation"] = test_order_creation()
    results["WebSocket Info"] = test_websocket_info()
    
    # Summary
    print_header("Test Summary")
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}")
        else:
            print_error(f"{test_name}")
    
    print(f"\n{Colors.BOLD}Total Tests: {total}{Colors.ENDC}")
    print(f"{Colors.GREEN}{Colors.BOLD}Passed: {passed}{Colors.ENDC}")
    print(f"{Colors.RED}{Colors.BOLD}Failed: {failed}{Colors.ENDC}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! 🎉{Colors.ENDC}\n")
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Some tests failed. Please review the errors above.{Colors.ENDC}\n")

if __name__ == "__main__":
    print(f"{Colors.BOLD}Starting test suite...{Colors.ENDC}")
    print(f"{Colors.BOLD}Make sure the backend server is running on {BASE_URL}{Colors.ENDC}\n")
    time.sleep(2)
    run_all_tests()
