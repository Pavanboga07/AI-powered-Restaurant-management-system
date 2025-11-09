# Component Architecture & Visual Guide

## 🏗️ Complete Component Hierarchy

```
App.jsx (Root)
│
├── AuthProvider (Context)
│   │
│   ├── PUBLIC ROUTES
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   │
│   ├── MANAGER ROUTES (/manager/*)
│   │   └── ProtectedRoute (roles: ['admin', 'manager'])
│   │       └── ManagerDashboard.jsx
│   │           ├── Sidebar.jsx (shared)
│   │           └── Routes:
│   │               ├── Analytics.jsx (tab)
│   │               ├── MenuTab.jsx (tab)
│   │               └── TabPlaceholder.jsx (10 tabs)
│   │
│   ├── CHEF ROUTES (/chef)
│   │   └── ProtectedRoute (roles: ['admin', 'chef'])
│   │       └── ChefDashboard.jsx
│   │           └── OrderCard (subcomponent)
│   │
│   ├── STAFF ROUTES (/staff/*)
│   │   └── ProtectedRoute (roles: ['admin', 'staff'])
│   │       └── StaffDashboard.jsx
│   │           ├── Sidebar (internal)
│   │           └── Routes:
│   │               ├── HomePage
│   │               ├── OrdersPage
│   │               ├── TablesPage
│   │               ├── InventoryPage
│   │               └── ReservationsPage
│   │
│   ├── CUSTOMER ROUTES (/customer/*)
│   │   └── CustomerDashboard.jsx (public)
│   │       ├── Header/Navbar
│   │       ├── Cart Sidebar (conditional)
│   │       └── Routes:
│   │           ├── MenuPage
│   │           ├── TrackOrderPage
│   │           └── ProfilePage
│   │
│   └── PROTECTED ROUTES (/*) 
│       └── ProtectedRoute (any authenticated user)
│           ├── Navbar.jsx
│           └── Routes:
│               ├── Dashboard.jsx
│               ├── /menu
│               ├── /orders
│               ├── /tables
│               └── /reservations
```

---

## 📊 Component Details

### Core Components

#### 1. **App.jsx**
- **Purpose:** Root routing configuration
- **State:** None (managed by AuthContext)
- **Key Features:**
  - Route organization by role
  - Protected route wrappers
  - No navbar for role-specific dashboards
- **Dependencies:** React Router, AuthContext

#### 2. **AuthContext.jsx**
- **Purpose:** Global authentication state
- **State:**
  ```javascript
  user: { id, username, email, role, full_name }
  loading: boolean
  ```
- **Methods:**
  - `login(username, password)`
  - `register(userData)`
  - `logout()`
- **Persistence:** localStorage

#### 3. **ProtectedRoute.jsx**
- **Purpose:** Route guard with role checking
- **Props:**
  - `children` - Component to protect
  - `roles` - Array of allowed roles (optional)
- **Logic:**
  ```javascript
  if (!user) redirect to /login
  if (roles && !roles.includes(user.role)) redirect to /dashboard
  else render children
  ```

---

## 🎨 Dashboard Components

### Manager Dashboard

**File:** `components/manager/Dashboard.jsx`

```
ManagerDashboard
├── State: isSidebarOpen
├── Layout: Flex (sidebar + main)
│
├── Sidebar (shared/Sidebar.jsx)
│   ├── Logo & Toggle Button
│   ├── 12 Navigation Items
│   ├── User Info Card
│   └── Logout Button
│
└── Main Content (Routes)
    ├── Analytics.jsx
    │   ├── 4 Stat Cards
    │   └── Chart Placeholders
    │
    ├── MenuTab.jsx
    │   ├── Search Bar
    │   └── Menu Items Grid
    │
    └── TabPlaceholder.jsx (×10)
        └── Icon + Title + Description
```

**Key Props:**
- None (self-contained)

**State Management:**
```javascript
isSidebarOpen: boolean - Sidebar collapse state
location: object - Current route (from useLocation)
```

**Animations:**
```javascript
pageVariants: { initial, animate, exit }
sidebarVariants: { open, closed }
```

---

### Chef Dashboard

**File:** `components/chef/ChefDashboard.jsx`

```
ChefDashboard
├── State: activeOrders, inventoryAlerts
├── Layout: Full-screen (no sidebar)
│
├── Header
│   ├── Logo + Title
│   ├── Notification Bell (badge)
│   └── Current Time + Order Count
│
├── Inventory Alerts (conditional)
│   └── Alert Cards (red border)
│
├── Orders Grid (3 columns)
│   ├── Pending Column
│   │   └── OrderCard × N
│   ├── Preparing Column
│   │   └── OrderCard × N
│   └── Ready Column
│       └── OrderCard × N
│
└── Shift Handover
    ├── Textarea
    └── Save Button
```

**OrderCard Component:**
```jsx
<OrderCard
  order={object}
  onUpdateStatus={function}
  statusColor={string}
  priorityColor={string}
/>
```

**State Management:**
```javascript
activeOrders: [
  {
    id, tableNumber, items[], status, 
    timeElapsed, priority
  }
]

inventoryAlerts: [
  { item, level, quantity }
]
```

**Effects:**
```javascript
useEffect - Timer updates every 60s
         - Auto-urgency after 20min
```

---

### Staff Dashboard

**File:** `components/staff/StaffDashboard.jsx`

```
StaffDashboard
├── State: isSidebarOpen
├── Layout: Flex (sidebar + pages)
│
├── Sidebar (internal component)
│   ├── Logo + Toggle
│   └── 5 Nav Items
│       ├── Home (/)
│       ├── Orders (/orders)
│       ├── Tables (/tables)
│       ├── Inventory (/inventory)
│       └── Reservations (/reservations)
│
└── Main Content (Routes)
    │
    ├── HomePage
    │   ├── 4 Stat Cards
    │   └── Recent Activity Feed
    │
    ├── OrdersPage
    │   ├── Search + Filter
    │   └── Orders Table
    │
    ├── TablesPage
    │   └── Table Grid (visual cards)
    │
    ├── InventoryPage
    │   └── Inventory Table
    │
    └── ReservationsPage
        └── Reservations Table
```

**Sub-Components:**
```javascript
HomePage - Stats + Activity
OrdersPage - Search + Table + Filters
TablesPage - Grid of table cards
InventoryPage - Stock table
ReservationsPage - Booking table
```

**State by Page:**
```javascript
// OrdersPage
searchTerm: string
filterStatus: 'all' | 'pending' | 'preparing' | 'ready'

// All use local state, no global state needed
```

---

### Customer Dashboard

**File:** `components/customer/CustomerDashboard.jsx`

```
CustomerDashboard
├── State: cart, isCartOpen
├── Layout: Full-width (no sidebar)
│
├── Header
│   ├── Logo + Restaurant Name
│   ├── Navigation Links
│   │   ├── Menu
│   │   ├── Track Order
│   │   └── Profile
│   └── Cart Button (badge)
│
├── Main Content (Routes)
│   │
│   ├── MenuPage
│   │   ├── Hero Section
│   │   ├── Search + Categories
│   │   └── Menu Grid
│   │       └── MenuCard × N
│   │           ├── Image
│   │           ├── Name + Rating
│   │           ├── Description
│   │           ├── Price
│   │           └── Add Button
│   │
│   ├── TrackOrderPage
│   │   ├── Order ID Display
│   │   ├── Progress Steps
│   │   └── Delivery Info
│   │
│   └── ProfilePage
│       ├── User Avatar + Info
│       └── Order History
│
└── Cart Sidebar (conditional render)
    ├── Backdrop (click to close)
    └── Panel (slide from right)
        ├── Header (title + close)
        ├── Items List
        │   └── CartItem × N
        │       ├── Name + Price
        │       ├── Quantity Controls
        │       └── Remove Button
        └── Footer
            ├── Total Display
            └── Checkout Button
```

**State Management:**
```javascript
cart: [
  { id, name, price, quantity }
]

isCartOpen: boolean

// Computed values
cartTotal: sum of (price × quantity)
cartItemCount: sum of quantities
```

**Methods:**
```javascript
addToCart(item) - Add or increment
removeFromCart(itemId) - Remove completely
updateQuantity(itemId, delta) - +1 or -1
```

**Sub-Components:**
```javascript
MenuPage({ addToCart })
TrackOrderPage()
ProfilePage()
```

---

## 🎯 Data Flow Diagrams

### Authentication Flow

```
User Action → Login Form
              ↓
         AuthContext.login()
              ↓
         api.authAPI.login()
              ↓
         Backend /api/auth/login
              ↓
         Returns { user, access_token, refresh_token }
              ↓
         Store in localStorage
              ↓
         Update AuthContext state
              ↓
         Redirect based on role
              ↓
    ┌─────────┼─────────┬─────────┐
    ↓         ↓         ↓         ↓
 Manager    Chef     Staff   Customer
Dashboard Dashboard Dashboard Dashboard
```

### Order Status Update (Chef)

```
Chef clicks "Start Preparing"
         ↓
updateOrderStatus(orderId, 'preparing')
         ↓
setActiveOrders(prev => 
  map over orders, update matching ID
)
         ↓
React re-renders
         ↓
Order moves to "Preparing" column
(Currently: Mock data only)

With Backend:
         ↓
await ordersAPI.updateStatus(orderId, 'preparing')
         ↓
Backend updates database
         ↓
Fetch fresh orders
         ↓
Update state
```

### Cart Management (Customer)

```
User clicks "Add to Cart"
         ↓
addToCart(menuItem)
         ↓
Check if item exists in cart
    ├── Yes: Increment quantity
    └── No: Add with quantity = 1
         ↓
setCart(newCart)
         ↓
setIsCartOpen(true)
         ↓
Cart sidebar slides in
         ↓
Quantity/Total auto-calculate
```

---

## 🎨 Styling Architecture

### Tailwind Class Patterns

**Manager Dashboard:**
```css
Container: bg-white/10 backdrop-blur-xl
Gradient: from-orange-400 to-red-500
Cards: border border-white/20 rounded-xl
Text: text-white, text-slate-200
```

**Chef Dashboard:**
```css
Background: bg-slate-950, bg-slate-900
Cards: bg-slate-900/80 backdrop-blur-xl
Borders: border-2 border-{color}-500
Urgent: animate-pulse border-red-500
Text: text-white, text-slate-400
```

**Staff Dashboard:**
```css
Background: bg-slate-50, bg-blue-50
Cards: bg-white shadow-lg
Primary: bg-blue-500
Borders: border border-slate-200
Text: text-slate-800, text-slate-600
```

**Customer Dashboard:**
```css
Background: bg-orange-50, bg-red-50
Gradients: from-orange-500 to-red-500
Cards: bg-white shadow-lg rounded-xl
Text: text-slate-800
Images: bg-gradient-to-br orange/red
```

---

## 📱 Responsive Patterns

### Sidebar Behavior

```javascript
// Manager & Staff Dashboards
Desktop (>768px):  Sidebar always visible (256px)
Tablet (768px):    Toggle between 256px and 80px
Mobile (<768px):   Overlay mode (close on nav)

// Implementation
const [isSidebarOpen, setIsSidebarOpen] = useState(true);

// Width classes
className={`
  ${isSidebarOpen ? 'w-64' : 'w-20'}
  transition-all duration-300
`}
```

### Grid Columns

```javascript
// Menu Grid (Customer)
Mobile:  "grid-cols-1"
Tablet:  "md:grid-cols-2"
Desktop: "lg:grid-cols-3"

// Tables Grid (Staff)
Mobile:  "grid-cols-2"
Tablet:  "md:grid-cols-3"
Desktop: "lg:grid-cols-4"

// Order Columns (Chef)
Mobile:  Stack vertically
Desktop: "lg:grid-cols-3" (side by side)
```

### Cart Sidebar

```javascript
// Customer Dashboard
Mobile:  w-full (full screen)
Desktop: md:w-96 (fixed 384px)

// Animation
initial={{ x: '100%' }}
animate={{ x: 0 }}
```

---

## 🔄 State Management Overview

### Global State (AuthContext)
```javascript
user: { id, username, email, role, full_name }
loading: boolean
login: (username, password) => Promise
register: (data) => Promise
logout: () => void
```

### Local State by Dashboard

**Manager:**
- `isSidebarOpen` - Sidebar collapse

**Chef:**
- `activeOrders` - All active orders
- `inventoryAlerts` - Stock warnings

**Staff:**
- `isSidebarOpen` - Sidebar collapse
- Per-page search/filter states

**Customer:**
- `cart` - Shopping cart items
- `isCartOpen` - Cart visibility
- Per-page filter states

---

## 🎭 Animation Configurations

### Page Transitions
```javascript
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

<AnimatePresence mode="wait">
  <motion.div variants={pageVariants}>
    {content}
  </motion.div>
</AnimatePresence>
```

### Sidebar Toggle
```javascript
const sidebarVariants = {
  open: { width: '256px' },
  closed: { width: '80px' }
};

transition={{ type: 'spring', damping: 30, stiffness: 300 }}
```

### Cart Slide
```javascript
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', damping: 30, stiffness: 300 }}
```

### Staggered Cards
```javascript
menuItems.map((item, index) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    {item}
  </motion.div>
))
```

---

## 🗂️ File Size Reference

```
ChefDashboard.jsx     ~350 lines  ~11 KB
StaffDashboard.jsx    ~450 lines  ~14 KB
CustomerDashboard.jsx ~400 lines  ~13 KB
ManagerDashboard.jsx  ~200 lines  ~6 KB
Sidebar.jsx           ~150 lines  ~5 KB
Analytics.jsx         ~100 lines  ~3 KB
MenuTab.jsx           ~120 lines  ~4 KB
AuthContext.jsx       ~100 lines  ~3 KB
api.js                ~200 lines  ~6 KB
App.jsx               ~100 lines  ~3 KB
```

**Total Frontend Code:** ~2,200+ lines

---

## 🎓 Best Practices Used

### Component Design
✅ Single Responsibility Principle  
✅ Props validation through PropTypes (ready to add)  
✅ Consistent naming conventions  
✅ Reusable subcomponents  
✅ Clear component hierarchy  

### State Management
✅ Minimal global state (auth only)  
✅ Local state where appropriate  
✅ Lifted state for shared data  
✅ No prop drilling  
✅ Context for cross-cutting concerns  

### Performance
✅ Lazy loading ready (code splitting)  
✅ Memoization opportunities identified  
✅ Efficient re-render patterns  
✅ Optimized animations  
✅ No unnecessary effects  

### Accessibility
✅ Semantic HTML  
✅ Keyboard navigation  
✅ Color contrast  
✅ Clear visual hierarchy  
✅ Status indicators (not just color)  

---

**This document maps all 15+ components and their relationships!**
