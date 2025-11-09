# Chef Dashboard - Quick Start Guide

## Prerequisites
- PostgreSQL database running
- Python virtual environment activated
- Backend dependencies installed (bcrypt 4.0.1, FastAPI, SQLAlchemy, etc.)
- Frontend dependencies installed (npm install)

## Step 1: Start Backend Server
```powershell
cd c:\Users\91862\OneDrive\Desktop\zbc\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: http://localhost:8000
API docs at: http://localhost:8000/docs

## Step 2: Start Frontend Development Server
```powershell
cd c:\Users\91862\OneDrive\Desktop\zbc\frontend
npm run dev
```

The frontend will be available at: http://localhost:5173 (or the port shown in terminal)

## Step 3: Create Test Chef User

### Option 1: Using the API (via Postman or curl)
```bash
POST http://localhost:8000/api/register
Content-Type: application/json

{
  "username": "chef1",
  "email": "chef1@restaurant.com",
  "password": "chef123",
  "full_name": "John Chef",
  "role": "chef"
}
```

### Option 2: Using Python Script
```python
import requests

response = requests.post('http://localhost:8000/api/register', json={
    "username": "chef1",
    "email": "chef1@restaurant.com",
    "password": "chef123",
    "full_name": "John Chef",
    "role": "chef"
})
print(response.json())
```

### Option 3: Using Frontend Registration
1. Go to http://localhost:5173/register
2. Fill in the form:
   - Username: chef1
   - Email: chef1@restaurant.com
   - Password: chef123
   - Full Name: John Chef
   - Role: Chef
3. Click Register

## Step 4: Login as Chef
1. Go to http://localhost:5173/login
2. Login with:
   - Email: chef1@restaurant.com
   - Password: chef123
3. You should be redirected to the dashboard

## Step 5: Access Chef Dashboard
Navigate to: http://localhost:5173/chef

You should see:
- **Kitchen Display** tab (active by default)
- **Messages** tab
- **Shift Handover** tab
- Stats header showing: Active Orders, Prepared Today, Avg Prep Time, Pending

## Testing the Features

### 1. Kitchen Display System
To test the KDS, you need some orders in the system:

```python
# Create a test order (run this as a staff/manager user)
import requests

# First login as staff/manager
login_response = requests.post('http://localhost:8000/api/login', json={
    "email": "staff@restaurant.com",
    "password": "staff123"
})
token = login_response.json()['access_token']

# Create an order
headers = {'Authorization': f'Bearer {token}'}
order_response = requests.post('http://localhost:8000/api/orders', 
    headers=headers,
    json={
        "table_id": 1,
        "items": [
            {"menu_item_id": 1, "quantity": 2, "special_requests": "No onions"},
            {"menu_item_id": 2, "quantity": 1}
        ]
    }
)
```

### 2. Test Order Status Updates
In the Kitchen Display:
- Click **Start Preparing** on a pending order → moves to Preparing column
- Click **Mark Ready** on a preparing order → moves to Ready column
- Click **Complete** on a ready order → removes from display

### 3. Test Messaging System
1. Click **Messages** tab
2. Select recipient: Choose a user or role (e.g., "manager")
3. Select type: Info / Urgent / Request
4. Write subject and message
5. Click **Send Message**
6. Check that message appears in the list

### 4. Test Shift Handover
1. Click **Shift Handover** tab
2. Click **Create** sub-tab
3. Fill in the form:
   - Shift Date: Select today
   - Shift Type: Morning / Afternoon / Night
   - Prep Work Completed: "Prepped vegetables, marinated chicken"
   - Low Stock Items: "Tomatoes, olive oil"
   - Pending Tasks: "Finish sauce prep"
   - Incidents: "None"
4. Click **Create Handover**
5. Check **History** tab to see the created handover

### 5. Test Real-time Updates
1. Keep Kitchen Display open in one browser tab
2. Create a new order using the API or another user session
3. Watch the Kitchen Display - the new order should appear automatically
4. You should hear a notification sound (if notification.mp3 exists)

## WebSocket Testing
Open browser console (F12) and check for WebSocket messages:
```
Connected to chef_room
New order received: {order details}
Order status changed: {status update}
```

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify .env file has correct database credentials
- Check port 8000 is not already in use

### Frontend won't connect to backend
- Verify backend is running on port 8000
- Check frontend/src/services/api.js has correct baseURL
- Check browser console for CORS errors

### Orders not appearing in Kitchen Display
- Verify orders exist in database
- Check order status is one of: pending, preparing, ready
- Check WebSocket connection status in browser console

### Messages not sending
- Verify user is logged in as chef
- Check recipient user/role exists
- Check browser console for API errors

### Database errors
- Run migration: `python migrate_db.py create`
- Check all tables exist: customers, favorites, messages, shift_handovers
- Verify foreign key relationships

### Sound notification not working
- Create/download notification.mp3 file
- Place in: `frontend/public/notification.mp3`
- Check browser console for audio loading errors

## API Endpoints Quick Reference

### Chef Orders
```
GET    /api/chef/orders/active
PUT    /api/chef/orders/{id}/status
GET    /api/chef/orders/stats
```

### Menu Control
```
PATCH  /api/chef/menu/{id}/toggle
```

### Messaging
```
POST   /api/chef/messages
GET    /api/chef/messages?type=urgent
PUT    /api/chef/messages/{id}/read
```

### Shift Handover
```
POST   /api/chef/shift-handover
GET    /api/chef/shift-handover/latest
GET    /api/chef/shift-handover/history?page=1&limit=10
```

## Next Steps
1. Add notification.mp3 sound file
2. Create test data (users, menu items, orders)
3. Test all features thoroughly
4. Implement inventory management component
5. Move to Phase 2: Staff Dashboard

---

**Need Help?**
- Check `PHASE1_COMPLETE.md` for detailed implementation docs
- Review API docs at http://localhost:8000/docs
- Check browser console and backend logs for errors
