# Role-Specific Dashboards Documentation

## Overview
This document covers the three role-specific dashboards: Chef, Staff, and Customer. Each dashboard is designed with a unique UI/UX tailored to its user role and specific needs.

---

## 🧑‍🍳 Chef Dashboard

### Purpose
Kitchen Display System (KDS) for real-time order management in the kitchen.

### Route
- **Path:** `/chef`
- **Access:** Chef role only (+ admin)
- **Authentication:** Required

### Design Theme
- **Colors:** Dark theme with red/orange accents
- **Background:** `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`
- **Accent Colors:** Orange (#F97316), Red (#EF4444)
- **Card Style:** Dark cards with colored borders for status

### Features

#### 1. **Active Orders Grid**
Three-column layout organizing orders by status:
- **Pending Orders** (Yellow border)
  - New orders waiting to be started
  - Shows time elapsed since order placed
  
- **Preparing Orders** (Orange border)
  - Currently being prepared
  - Updates in real-time
  
- **Ready Orders** (Green border)
  - Completed and ready for service

#### 2. **Order Cards**
Each order displays:
- **Table Number** - Large, prominent display
- **Order ID** - Reference number
- **Time Elapsed** - Updates every minute
  - Normal: Gray badge
  - Warning (>15 min): Orange badge
  - Urgent (>20 min): Red badge with pulse animation
- **Menu Items** - List with quantities
- **Special Instructions** - Yellow text with alert icon
- **Action Buttons**
  - Pending → "Start Preparing" (Orange)
  - Preparing → "Mark as Ready" (Green)
  - Ready → "Complete Order" (Blue)

#### 3. **Priority System**
- Orders automatically marked urgent after 20 minutes
- Red border pulse animation for urgent orders
- Visual hierarchy based on wait time

#### 4. **Inventory Alerts**
Top banner showing:
- Low stock items (Yellow alert)
- Critical stock items (Red alert with pulse)
- Quantity remaining

#### 5. **Shift Handover**
- Text area for notes to next shift
- Can include:
  - Low stock items
  - Equipment issues
  - Pending tasks

#### 6. **Header Information**
- Current time (live update)
- Active order count
- Notification bell with badge

### Component Structure
```
components/chef/
└── ChefDashboard.jsx (Main component + OrderCard subcomponent)
```

### Sample Data Structure
```javascript
{
  id: 1,
  tableNumber: 5,
  items: [
    { name: 'Grilled Salmon', quantity: 2, special: 'No lemon' }
  ],
  status: 'pending', // 'preparing', 'ready'
  timeElapsed: 5,
  priority: 'normal' // 'urgent'
}
```

### Key Interactions
1. Click "Start Preparing" → Moves to Preparing column
2. Click "Mark as Ready" → Moves to Ready column
3. Click "Complete Order" → Removes from display
4. Real-time timer updates every 60 seconds
5. Auto-priority escalation based on time

---

## 👔 Staff Dashboard

### Purpose
Multi-page dashboard for front-of-house staff to manage daily operations.

### Route
- **Path:** `/staff/*`
- **Access:** Staff role only (+ admin)
- **Authentication:** Required

### Design Theme
- **Colors:** Blue/slate clean professional theme
- **Background:** `bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`
- **Primary Color:** Blue (#3B82F6)
- **Card Style:** White cards with subtle shadows

### Navigation Structure
5-page navigation with sidebar:
1. **Home** (`/staff/`)
2. **Orders** (`/staff/orders`)
3. **Tables** (`/staff/tables`)
4. **Inventory** (`/staff/inventory`)
5. **Reservations** (`/staff/reservations`)

### Features by Page

#### 1. Home Page
**Stat Cards** (4 cards):
- Active Orders (Blue)
- Occupied Tables (Green)
- Pending Tasks (Orange)
- Completed Today (Purple)

**Recent Activity Feed**:
- Color-coded activity dots (success/warning/info)
- Timestamp for each activity
- Real-time updates

#### 2. Orders Page
**Search & Filter**:
- Search bar with icon
- Status filter dropdown (All/Pending/Preparing/Ready)

**Orders Table**:
- Order # | Table | Items | Status | Time | Total
- Hover effects on rows
- Status badges with color coding

#### 3. Tables Page
**Visual Grid Layout**:
- 2-4 columns responsive grid
- Large table number display
- Seat capacity
- Status badges:
  - Available (Green border)
  - Occupied (Blue border)
  - Reserved (Orange border)
- Clickable cards for details

#### 4. Inventory Page
**Stock Table**:
- Item | Category | Quantity | Status
- Color-coded status:
  - Good: Green badge
  - Low: Red badge
- Simple, scannable layout

#### 5. Reservations Page
**Reservations Table**:
- Guest Name | Party Size | Time | Status
- Status badges (Confirmed/Pending)
- Chronological ordering

### Sidebar Navigation
- **Collapsible:** Toggle between full (256px) and compact (80px)
- **Active Highlighting:** Blue background for current page
- **Icons:** lucide-react icons for each page
- **Smooth Transitions:** 300ms animation

### Component Structure
```
components/staff/
└── StaffDashboard.jsx
    ├── Main container with routing
    ├── HomePage component
    ├── OrdersPage component
    ├── TablesPage component
    ├── InventoryPage component
    └── ReservationsPage component
```

### Key Interactions
1. Sidebar toggle for mobile/desktop
2. Search filtering on Orders page
3. Table status changes via click
4. Page transitions with AnimatePresence

---

## 🍽️ Customer Dashboard

### Purpose
Public-facing menu browsing and customer portal for ordering and tracking.

### Route
- **Path:** `/customer/*`
- **Access:** Public (no auth required for menu)
- **Authentication:** Optional for profile and tracking

### Design Theme
- **Colors:** Bright orange/red appetizing theme
- **Background:** `bg-gradient-to-br from-orange-50 via-red-50 to-orange-100`
- **Primary Gradient:** Orange (#F97316) to Red (#EF4444)
- **Card Style:** White cards with vibrant accents

### Page Structure
1. **Menu Browsing** (`/customer/`)
2. **Order Tracking** (`/customer/track`)
3. **Profile** (`/customer/profile`)

### Features

#### 1. Header/Navbar
- **Restaurant Logo & Name**
- **Navigation Links:** Menu | Track Order | Profile
- **Cart Button:** 
  - Floating cart icon
  - Badge showing item count
  - Gradient background

#### 2. Menu Page

**Hero Section**:
- Full-width gradient banner
- Large heading and tagline
- Eye-catching colors

**Search & Categories**:
- Search bar with icon
- Category pills (All/Starters/Main Course/Desserts/Beverages)
- Active category highlighted with gradient

**Menu Grid**:
- 1-3 column responsive grid
- Each card shows:
  - Large emoji image (gradient background)
  - Dish name and description
  - Star rating
  - Price (large, orange)
  - "Add to Cart" button with gradient

**Staggered Animations**:
- Cards fade in with 0.1s delay between each
- Smooth hover effects

#### 3. Cart Sidebar

**Sliding Panel**:
- Slides in from right
- Full-height overlay
- Click outside to close

**Cart Items**:
- Item cards with:
  - Name and price
  - Quantity controls (-, count, +)
  - Remove button (X)
  - Subtotal calculation

**Cart Footer**:
- Total price display
- Checkout button with gradient

**Empty State**:
- Large cart icon
- "Your cart is empty" message

#### 4. Order Tracking Page

**Order Status Card**:
- Large order ID display
- Estimated time badge
- Progress steps:
  - Order Received ✓
  - Preparing ✓
  - Ready for Pickup
  - Delivered

**Delivery Info**:
- Address card with map pin icon
- Formatted address display

#### 5. Profile Page

**Profile Card**:
- Avatar with gradient background
- User name and email
- Centered layout

**Order History**:
- Historical orders list
- Order # | Date | Total | Status
- Each in a card layout

### Cart Functionality

**State Management**:
```javascript
// Cart state
const [cart, setCart] = useState([]);
const [isCartOpen, setIsCartOpen] = useState(false);

// Add to cart
addToCart(item) - Adds or increments quantity

// Remove from cart
removeFromCart(itemId) - Removes item completely

// Update quantity
updateQuantity(itemId, delta) - +1 or -1

// Calculations
cartTotal - Sum of all items × quantities
cartItemCount - Total number of items
```

### Component Structure
```
components/customer/
└── CustomerDashboard.jsx
    ├── Main container with cart state
    ├── MenuPage component
    ├── TrackOrderPage component
    ├── ProfilePage component
    └── Cart sidebar (conditional render)
```

### Animations
- **Cart Slide:** Spring animation (damping: 30, stiffness: 300)
- **Backdrop Fade:** Opacity 0 → 1
- **Menu Cards:** Staggered entrance
- **Page Transitions:** Fade in/out

---

## 🎨 Design Comparison

| Aspect | Chef | Staff | Customer |
|--------|------|-------|----------|
| **Theme** | Dark | Light Clean | Bright Appetizing |
| **Primary Colors** | Orange/Red on Dark | Blue/Slate | Orange/Red on Light |
| **Background** | Dark gradient | Light gradient | Pastel gradient |
| **Navigation** | None (single page) | Sidebar | Top navbar |
| **Card Style** | Dark with borders | White with shadows | White with gradients |
| **Typography** | High contrast | Professional | Friendly |
| **Target Emotion** | Urgency, Focus | Efficiency | Excitement, Hunger |

---

## 🔐 Role-Based Access Control

### Route Protection

**App.jsx Configuration**:
```jsx
// Chef - Chef role only
<Route path="/chef" element={
  <ProtectedRoute roles={['admin', 'chef']}>
    <ChefDashboard />
  </ProtectedRoute>
} />

// Staff - Staff role only
<Route path="/staff/*" element={
  <ProtectedRoute roles={['admin', 'staff']}>
    <StaffDashboard />
  </ProtectedRoute>
} />

// Customer - Public access
<Route path="/customer/*" element={<CustomerDashboard />} />
```

### Access Matrix

| Role | Manager | Chef | Staff | Customer |
|------|---------|------|-------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ❌ | ❌ | ✅ |
| Chef | ❌ | ✅ | ❌ | ✅ |
| Staff | ❌ | ❌ | ✅ | ✅ |
| Guest | ❌ | ❌ | ❌ | ✅ (Menu only) |

---

## 📱 Responsive Design

### Breakpoints
All dashboards use Tailwind's responsive classes:
- **Mobile:** Default (< 768px)
- **Tablet:** `md:` (≥ 768px)
- **Desktop:** `lg:` (≥ 1024px)

### Responsive Features

**Chef Dashboard**:
- 1 column on mobile → 3 columns on desktop
- Stacked cards with full width on mobile

**Staff Dashboard**:
- Collapsible sidebar (20px → 256px)
- 1-2 columns on mobile → 4 columns on desktop (tables)
- Horizontal scroll for table headers on mobile

**Customer Dashboard**:
- Full-width cart on mobile → 384px sidebar on desktop
- 1 column grid → 2 columns → 3 columns menu grid
- Hidden text on collapsed navbar items

---

## 🚀 Next Steps

### Recommended Enhancements

1. **Real-time Updates**
   - WebSocket connection for live order updates
   - Push notifications for chefs
   - Real-time table status sync

2. **Backend Integration**
   - Connect to orders API endpoints
   - Implement actual order status updates
   - Real inventory tracking

3. **Additional Features**
   - Chef: Order history, performance metrics
   - Staff: Task assignment system, shift management
   - Customer: Payment integration, order customization

4. **Accessibility**
   - ARIA labels for all interactive elements
   - Keyboard navigation support
   - Screen reader optimization

5. **Performance**
   - Virtualized lists for large order volumes
   - Image optimization for menu items
   - Code splitting per dashboard

---

## 📊 Sample Data Integration

### Connecting to Backend

All dashboards currently use placeholder data. To connect to real APIs:

```javascript
// Chef Dashboard
useEffect(() => {
  const fetchOrders = async () => {
    const response = await ordersAPI.getAll();
    setActiveOrders(response.data);
  };
  fetchOrders();
  
  // Poll every 30 seconds
  const interval = setInterval(fetchOrders, 30000);
  return () => clearInterval(interval);
}, []);

// Update order status
const updateOrderStatus = async (orderId, newStatus) => {
  await ordersAPI.update(orderId, { status: newStatus });
  // Refresh orders
};
```

### API Endpoints Needed

- `GET /api/orders` - Get all active orders
- `PATCH /api/orders/:id` - Update order status
- `GET /api/menu` - Get menu items
- `GET /api/tables` - Get table status
- `GET /api/inventory` - Get inventory levels
- `POST /api/orders` - Create new order (customer)

---

## 🎯 Key Takeaways

1. **Chef Dashboard** - Fast, visual, urgent KDS for kitchen efficiency
2. **Staff Dashboard** - Clean, organized multi-page tool for FOH operations
3. **Customer Dashboard** - Engaging, appetizing interface for ordering
4. **Each has unique UX** - Tailored to role needs and context
5. **Ready for integration** - Structured for easy API connection
6. **Fully responsive** - Works on all device sizes
7. **Role-based security** - Protected routes with authentication

---

**Created:** December 2024  
**Components:** 3 dashboards, 15+ pages/views  
**Lines of Code:** ~1,200 (total across all dashboards)
