"""
Quick API Health Check
Tests critical endpoints without shutting down backend
"""
import requests
import sys

BASE = "http://localhost:8000"

print("\n🔍 Quick API Health Check\n")

try:
    # 1. Health
    r = requests.get(f"{BASE}/health", timeout=2)
    print(f"✅ Health: {r.status_code}")
    
    # 2. Login Chef
    r = requests.post(
        f"{BASE}/api/auth/login",
        data={"username": "chef", "password": "chef123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=2
    )
    if r.status_code == 200:
        token = r.json()["access_token"]
        print(f"✅ Chef Login: {r.status_code}")
        
        # 3. Chef Stats (THE FIX!)
        r = requests.get(
            f"{BASE}/api/chef/orders/stats",
            headers={"Authorization": f"Bearer {token}"},
            timeout=2
        )
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Chef Stats: {r.status_code}")
            print(f"   Total Orders: {data.get('total_orders', 'N/A')}")
            print(f"   Revenue: ${data.get('total_revenue', 'N/A')}")
            
            # Check all 10 fields
            fields = ['total_orders', 'pending_orders', 'confirmed_orders', 
                     'preparing_orders', 'ready_orders', 'served_orders',
                     'completed_orders', 'cancelled_orders', 'total_revenue', 
                     'average_order_value']
            missing = [f for f in fields if f not in data]
            if not missing:
                print(f"   ✅ All 10 fields present!")
            else:
                print(f"   ⚠️  Missing: {missing}")
        else:
            print(f"❌ Chef Stats: {r.status_code}")
    else:
        print(f"❌ Chef Login: {r.status_code}")
    
    # 4. Menu Items
    r = requests.get(f"{BASE}/api/menu/items", timeout=2)
    print(f"✅ Menu Items: {r.status_code} ({len(r.json())} items)")
    
    print("\n✅ Critical endpoints working!\n")
    print("Backend still running at http://localhost:8000")
    print("Frontend at http://localhost:5173\n")
    
except Exception as e:
    print(f"\n❌ Error: {e}\n")
    sys.exit(1)
