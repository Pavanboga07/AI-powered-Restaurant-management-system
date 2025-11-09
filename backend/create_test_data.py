"""
Create test data for Chef Dashboard
Run this after the backend is running to populate test data
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def register_user(username, email, password, full_name, role):
    """Register a new user"""
    response = requests.post(f"{BASE_URL}/api/register", json={
        "username": username,
        "email": email,
        "password": password,
        "full_name": full_name,
        "role": role
    })
    if response.status_code == 201:
        print(f"✅ Created {role} user: {username}")
        return response.json()
    else:
        print(f"❌ Failed to create {username}: {response.text}")
        return None

def login_user(email, password):
    """Login and get access token"""
    response = requests.post(f"{BASE_URL}/api/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Logged in as {email}")
        return data.get('access_token')
    else:
        print(f"❌ Failed to login {email}: {response.text}")
        return None

def create_menu_items(token):
    """Create sample menu items"""
    headers = {"Authorization": f"Bearer {token}"}
    
    menu_items = [
        {
            "name": "Margherita Pizza",
            "description": "Classic tomato and mozzarella pizza",
            "price": 12.99,
            "category": "Main Course",
            "is_available": True
        },
        {
            "name": "Caesar Salad",
            "description": "Fresh romaine with parmesan and croutons",
            "price": 8.99,
            "category": "Appetizer",
            "is_available": True
        },
        {
            "name": "Grilled Salmon",
            "description": "Fresh Atlantic salmon with vegetables",
            "price": 18.99,
            "category": "Main Course",
            "is_available": True
        },
        {
            "name": "Pasta Carbonara",
            "description": "Creamy pasta with bacon and parmesan",
            "price": 14.99,
            "category": "Main Course",
            "is_available": True
        },
        {
            "name": "Chocolate Lava Cake",
            "description": "Warm chocolate cake with vanilla ice cream",
            "price": 6.99,
            "category": "Dessert",
            "is_available": True
        },
        {
            "name": "Fresh Lemonade",
            "description": "House-made lemonade",
            "price": 3.99,
            "category": "Beverage",
            "is_available": True
        }
    ]
    
    created_items = []
    for item in menu_items:
        response = requests.post(f"{BASE_URL}/api/menu", headers=headers, json=item)
        if response.status_code == 201:
            created_item = response.json()
            created_items.append(created_item)
            print(f"✅ Created menu item: {item['name']}")
        else:
            print(f"❌ Failed to create {item['name']}: {response.text}")
    
    return created_items

def create_table(token, table_number, capacity):
    """Create a table"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/tables", headers=headers, json={
        "table_number": table_number,
        "capacity": capacity,
        "status": "available"
    })
    if response.status_code == 201:
        print(f"✅ Created table {table_number}")
        return response.json()
    else:
        print(f"❌ Failed to create table {table_number}: {response.text}")
        return None

def create_order(token, table_id, items):
    """Create an order"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/orders", headers=headers, json={
        "table_id": table_id,
        "items": items,
        "customer_name": "Test Customer",
        "special_notes": "Test order"
    })
    if response.status_code == 201:
        order = response.json()
        print(f"✅ Created order #{order.get('id')} for table {table_id}")
        return order
    else:
        print(f"❌ Failed to create order: {response.text}")
        return None

def main():
    print("\n🚀 Creating Test Data for Chef Dashboard\n")
    print("=" * 50)
    
    # 1. Create users
    print("\n1️⃣  Creating Users...")
    chef_user = register_user("chef1", "chef1@restaurant.com", "chef123", "John Chef", "chef")
    manager_user = register_user("manager1", "manager1@restaurant.com", "manager123", "Jane Manager", "manager")
    staff_user = register_user("staff1", "staff1@restaurant.com", "staff123", "Bob Staff", "staff")
    
    # 2. Login as manager to create menu items and tables
    print("\n2️⃣  Logging in as Manager...")
    manager_token = login_user("manager1@restaurant.com", "manager123")
    
    if not manager_token:
        print("❌ Cannot continue without manager token")
        return
    
    # 3. Create menu items
    print("\n3️⃣  Creating Menu Items...")
    menu_items = create_menu_items(manager_token)
    
    if not menu_items:
        print("❌ Cannot continue without menu items")
        return
    
    # 4. Create tables
    print("\n4️⃣  Creating Tables...")
    tables = []
    for i in range(1, 6):
        table = create_table(manager_token, i, 4)
        if table:
            tables.append(table)
    
    if not tables:
        print("❌ Cannot continue without tables")
        return
    
    # 5. Create test orders
    print("\n5️⃣  Creating Test Orders...")
    
    # Order 1 - Pending
    order1_items = [
        {"menu_item_id": menu_items[0]['id'], "quantity": 2, "special_requests": "No olives"},
        {"menu_item_id": menu_items[1]['id'], "quantity": 1, "special_requests": ""}
    ]
    create_order(manager_token, tables[0]['id'], order1_items)
    
    # Order 2 - Pending
    order2_items = [
        {"menu_item_id": menu_items[2]['id'], "quantity": 1, "special_requests": "Well done"},
        {"menu_item_id": menu_items[3]['id'], "quantity": 2, "special_requests": "Extra cheese"}
    ]
    create_order(manager_token, tables[1]['id'], order2_items)
    
    # Order 3 - Pending
    order3_items = [
        {"menu_item_id": menu_items[4]['id'], "quantity": 2, "special_requests": ""},
        {"menu_item_id": menu_items[5]['id'], "quantity": 3, "special_requests": "No ice"}
    ]
    create_order(manager_token, tables[2]['id'], order3_items)
    
    print("\n" + "=" * 50)
    print("\n✅ Test Data Creation Complete!\n")
    print("📋 Summary:")
    print(f"   - Users: 3 (1 chef, 1 manager, 1 staff)")
    print(f"   - Menu Items: {len(menu_items)}")
    print(f"   - Tables: {len(tables)}")
    print(f"   - Orders: 3 (all pending)")
    print("\n🔐 Test Credentials:")
    print("   Chef:")
    print("     Email: chef1@restaurant.com")
    print("     Password: chef123")
    print("\n   Manager:")
    print("     Email: manager1@restaurant.com")
    print("     Password: manager123")
    print("\n   Staff:")
    print("     Email: staff1@restaurant.com")
    print("     Password: staff123")
    print("\n🌐 Access Chef Dashboard:")
    print("   1. Start frontend: npm run dev")
    print("   2. Login as chef1@restaurant.com")
    print("   3. Navigate to: http://localhost:5173/chef")
    print("\n" + "=" * 50 + "\n")

if __name__ == "__main__":
    main()
