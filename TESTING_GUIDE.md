# Quick Testing Guide - Role-Specific Dashboards

## 🎯 Dashboard Access URLs

Once your application is running, access each dashboard at:

### Chef Dashboard
```
http://localhost:5173/chef
```
**Requirements:** 
- Must be logged in with `chef` role
- Dark theme with Kitchen Display System

### Staff Dashboard  
```
http://localhost:5173/staff
http://localhost:5173/staff/orders
http://localhost:5173/staff/tables
http://localhost:5173/staff/inventory
http://localhost:5173/staff/reservations
```
**Requirements:**
- Must be logged in with `staff` role
- Blue/slate clean theme with 5 pages

### Customer Dashboard
```
http://localhost:5173/customer
http://localhost:5173/customer/track
http://localhost:5173/customer/profile
```
**Requirements:**
- NO login required for menu browsing
- Login optional for tracking and profile
- Orange/red appetizing theme

### Manager Dashboard (Previously Created)
```
http://localhost:5173/manager
http://localhost:5173/manager/analytics
http://localhost:5173/manager/menu
... (12 total tabs)
```
**Requirements:**
- Must be logged in with `manager` or `admin` role
- Glassmorphism theme

---

## 🚀 Quick Start Testing

### 1. Start the Application
```bash
# Terminal 1 - Start Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

### 2. Create Test Users

**Option A: Using the API directly**
```bash
# Create Chef User
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "chef1",
    "email": "chef@restaurant.com",
    "password": "chef123",
    "full_name": "Chef Gordon",
    "role": "chef"
  }'

# Create Staff User
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff1",
    "email": "staff@restaurant.com",
    "password": "staff123",
    "full_name": "Staff Sarah",
    "role": "staff"
  }'

# Create Manager User
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager1",
    "email": "manager@restaurant.com",
    "password": "manager123",
    "full_name": "Manager Mike",
    "role": "manager"
  }'
```

**Option B: Using the Register Page**
1. Go to `http://localhost:5173/register`
2. Fill in the form
3. **Important:** Manually set role in database after registration (default is 'staff')

### 3. Login and Test Each Dashboard

#### Test Chef Dashboard
1. Login with chef credentials
2. Navigate to `/chef`
3. **What to test:**
   - ✅ See 3 columns: Pending, Preparing, Ready
   - ✅ View sample orders with table numbers
   - ✅ Click "Start Preparing" on pending order
   - ✅ Click "Mark as Ready" on preparing order
   - ✅ Check time elapsed updates
   - ✅ See inventory alerts at top
   - ✅ Try shift handover notes

#### Test Staff Dashboard
1. Login with staff credentials
2. Navigate to `/staff`
3. **What to test:**
   - ✅ Home page shows 4 stat cards
   - ✅ See recent activity feed
   - ✅ Click each navigation item (Orders, Tables, Inventory, Reservations)
   - ✅ Test sidebar collapse/expand
   - ✅ Try search on Orders page
   - ✅ Filter orders by status
   - ✅ Click on table cards

#### Test Customer Dashboard
1. **No login needed!** Just go to `/customer`
2. **What to test:**
   - ✅ See hero banner with restaurant name
   - ✅ Search for menu items
   - ✅ Filter by category
   - ✅ Click "Add to Cart" on menu items
   - ✅ Cart slides in from right
   - ✅ Adjust quantities with +/- buttons
   - ✅ See cart total update
   - ✅ Navigate to Track Order page
   - ✅ Navigate to Profile page (may need login)

---

## 🎨 Visual Checklist

### Chef Dashboard ✓
- [ ] Dark background (slate-900/950)
- [ ] Orange/red accent colors
- [ ] Order cards with colored status borders
- [ ] Time badges that change color
- [ ] Inventory alert banner at top
- [ ] Shift handover section at bottom
- [ ] Notification bell with badge
- [ ] Real-time clock display

### Staff Dashboard ✓
- [ ] Light background (slate-50/blue-50)
- [ ] Blue accent color
- [ ] White sidebar with icons
- [ ] Collapsible sidebar animation
- [ ] Blue highlight on active nav
- [ ] Clean white cards with shadows
- [ ] Professional table layouts
- [ ] Color-coded status badges

### Customer Dashboard ✓
- [ ] Bright pastel background (orange-50/red-50)
- [ ] Orange-to-red gradients
- [ ] Large emoji images on menu cards
- [ ] Star ratings visible
- [ ] Cart icon with item count badge
- [ ] Sliding cart panel from right
- [ ] Search bar with icon
- [ ] Category filter pills
- [ ] Large appetizing typography

---

## 🧪 Feature Testing Matrix

| Feature | Chef | Staff | Customer | Status |
|---------|------|-------|----------|--------|
| **Authentication** | Required | Required | Optional | ✅ |
| **Role Check** | chef only | staff only | Public | ✅ |
| **Real-time Updates** | Timer | - | - | ⚠️ Mock |
| **CRUD Operations** | Orders | View All | Orders | ⚠️ Mock |
| **Search** | - | Orders | Menu | ✅ |
| **Filter** | Status | Status | Category | ✅ |
| **Animations** | Cards | Pages | Cart | ✅ |
| **Responsive** | Yes | Yes | Yes | ✅ |
| **Dark Mode** | Built-in | - | - | ✅ |

---

## 🐛 Common Issues & Solutions

### Issue: "401 Unauthorized" when accessing dashboard
**Solution:** Make sure you're logged in with the correct role
```javascript
// Check your role in browser console
localStorage.getItem('user') // Should show your user data with role
```

### Issue: Dashboard doesn't load / blank page
**Solution:** Check browser console for errors
- Missing component imports?
- Routing conflicts?
- Try clearing cache and refreshing

### Issue: Cart not opening in Customer Dashboard
**Solution:** 
- Check if `isCartOpen` state is working
- Look for console errors
- Try adding items to cart first

### Issue: Staff sidebar not toggling
**Solution:**
- Check `isSidebarOpen` state
- Verify button onClick handler
- Check Tailwind classes for width transition

### Issue: Chef orders not updating status
**Solution:**
- Check `updateOrderStatus` function
- Verify state is being updated correctly
- This is mock data - backend integration needed for persistence

---

## 📊 Sample Test Data

### Mock Orders (Chef Dashboard)
```javascript
// Automatically loaded with component
Order #1: Table 5 - Grilled Salmon (Pending)
Order #2: Table 12 - Burger (Preparing, 15 min)
Order #3: Table 8 - Pasta (Ready, 22 min)
```

### Mock Menu Items (Customer Dashboard)
```javascript
6 items across categories:
- Grilled Salmon ($24.99)
- Caesar Salad ($12.99)
- Margherita Pizza ($16.99)
- Chocolate Lava Cake ($8.99)
- Fresh Orange Juice ($4.99)
- Beef Burger ($18.99)
```

### Mock Tables (Staff Dashboard)
```javascript
6 tables:
- Table 1-6 with varying status (available/occupied/reserved)
- 2-6 seat capacities
```

---

## 🔄 Workflow Testing Scenarios

### Scenario 1: Chef Workflow
1. Login as chef
2. See pending order for Table 5
3. Click "Start Preparing" → moves to Preparing column
4. Wait/refresh to see time increase
5. Click "Mark as Ready" → moves to Ready column
6. Note inventory alert for low stock items
7. Add shift handover note

### Scenario 2: Staff Workflow  
1. Login as staff
2. View Home dashboard stats
3. Navigate to Orders → search for specific order
4. Navigate to Tables → see table status grid
5. Navigate to Inventory → check stock levels
6. Navigate to Reservations → view upcoming reservations

### Scenario 3: Customer Workflow
1. No login - direct to /customer
2. Browse menu items
3. Search for "salmon"
4. Filter by "Main Course"
5. Add Salmon to cart
6. Add Burger to cart
7. Open cart → adjust quantities
8. View total price
9. Navigate to Track Order (enter order ID)
10. Navigate to Profile (may require login)

---

## 🎯 Success Criteria

Your dashboards are working correctly if:

### Chef Dashboard
- ✅ Orders display in 3 status columns
- ✅ Status updates work (orders move between columns)
- ✅ Time elapsed displays and updates
- ✅ Urgent orders have red border and pulse
- ✅ Inventory alerts show at top
- ✅ Dark theme with orange/red accents

### Staff Dashboard
- ✅ All 5 pages accessible via sidebar
- ✅ Sidebar collapses/expands smoothly
- ✅ Active page highlighted in blue
- ✅ Search and filters work on Orders page
- ✅ Table grid shows color-coded status
- ✅ Clean blue/white theme throughout

### Customer Dashboard
- ✅ Menu displays in responsive grid
- ✅ Search filters menu items
- ✅ Category filter works
- ✅ Add to cart increases badge count
- ✅ Cart slides in from right
- ✅ Quantity controls work
- ✅ Cart total calculates correctly
- ✅ Bright orange/red appetizing theme

---

## 📝 Notes for Development

### Current Limitations (Mock Data)
- All dashboards use static sample data
- No real backend integration yet
- Order updates don't persist
- Cart doesn't save to database
- No real-time WebSocket updates

### Ready for Backend Integration
All components are structured to easily connect to APIs:
```javascript
// Example: Replace mock data with API call
useEffect(() => {
  const fetchOrders = async () => {
    const { data } = await ordersAPI.getAll();
    setActiveOrders(data);
  };
  fetchOrders();
}, []);
```

### Recommended Next Steps
1. Connect Chef dashboard to real orders endpoint
2. Add WebSocket for real-time order updates
3. Integrate Staff dashboard with all backend APIs
4. Add payment processing to Customer cart
5. Implement order creation from customer cart
6. Add authentication requirement to customer profile/tracking

---

## 🎨 Design Tokens Reference

### Chef Dashboard Colors
```css
Background: slate-950, slate-900
Accents: orange-500, red-500
Text: white, slate-400
Borders: yellow-500, orange-500, green-500, red-500
```

### Staff Dashboard Colors
```css
Background: slate-50, blue-50, slate-100
Accents: blue-500
Text: slate-800, slate-600
Cards: white with shadows
```

### Customer Dashboard Colors
```css
Background: orange-50, red-50, orange-100
Gradients: orange-500 to red-500
Text: slate-800, slate-600
Cards: white with gradients
```

---

**Happy Testing! 🚀**

If you encounter any issues, check:
1. Console for JavaScript errors
2. Network tab for failed API calls  
3. React DevTools for component state
4. This guide for common solutions
