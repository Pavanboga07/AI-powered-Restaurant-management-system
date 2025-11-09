# 🎯 Manager Dashboard - Quick Reference Card

## 🚀 One-Command Setup
```bash
cd frontend && npm install && npm run dev
```

## 🌐 Access URLs
- **Manager Dashboard**: http://localhost:5173/manager
- **Main Dashboard**: http://localhost:5173/dashboard
- **Login**: http://localhost:5173/login

## 📂 File Locations
```
frontend/src/components/
├── manager/
│   ├── Dashboard.jsx          → Main dashboard container
│   ├── tabs/
│   │   ├── Analytics.jsx      → Analytics tab (implemented)
│   │   ├── MenuTab.jsx        → Menu tab (implemented)
│   │   └── TabPlaceholder.jsx → Reusable placeholder
│   └── COMPONENT_TREE.js      → Architecture reference
└── shared/
    └── Sidebar.jsx            → Navigation sidebar
```

## 🎨 Key Classes
```css
/* Glass Card */
bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl

/* Primary Button */
bg-primary-500 text-white hover:bg-primary-600

/* Active Tab */
bg-primary-500 text-white shadow-lg shadow-primary-500/30

/* Gradient Background */
bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
```

## 🗺️ Route Map
```
/manager                    → Analytics
/manager/menu               → Menu Management
/manager/tables             → Tables
/manager/orders             → Orders
/manager/billing            → Billing
/manager/qr-menu            → QR Menu
/manager/reports            → Reports
/manager/enhanced-analytics → Enhanced Analytics
/manager/coupons            → Coupons
/manager/reviews            → Reviews
/manager/reservations       → Reservations
/manager/staff-schedule     → Staff Schedule
```

## 🔐 Access Control
```javascript
// Only admin and manager can access
<ProtectedRoute roles={['admin', 'manager']}>
```

## 🎭 Component Props

### Sidebar
```typescript
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}
```

### TabPlaceholder
```typescript
interface TabPlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}
```

## 📊 Analytics Tab - Stat Cards
```javascript
const stats = [
  { icon: DollarSign, label: 'Total Revenue', value: '$12,450', change: '+12.5%' },
  { icon: Users, label: 'Total Customers', value: '1,245', change: '+8.3%' },
  { icon: BarChart3, label: 'Orders Today', value: '156', change: '+5.2%' },
  { icon: TrendingUp, label: 'Average Order', value: '$79.80', change: '-2.1%' }
];
```

## 🎬 Animation Variants
```javascript
// Page transitions
const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};

// Sidebar toggle
variants={{
  open: { x: 0 },
  closed: { x: '-100%' }
}}
```

## 📱 Responsive Breakpoints
```javascript
// Desktop: lg and above
className="hidden lg:block"

// Mobile: below lg
className="lg:hidden"

// Sidebar width
className="w-72"  // 288px
```

## 🎨 Theme Colors
```javascript
Primary:   #F97316 (Orange)
Secondary: #1E293B (Slate)
Success:   #10B981 (Green)
Error:     #EF4444 (Red)
Warning:   #F59E0B (Amber)
```

## 🔧 State Management
```javascript
// Dashboard component
const [isSidebarOpen, setIsSidebarOpen] = useState(true);

// Sidebar component
const [isOnline, setIsOnline] = useState(navigator.onLine);

// From AuthContext
const { user, logout } = useAuth();
```

## 📦 Dependencies
```json
{
  "react-router-dom": "^6.21.3",
  "framer-motion": "^10.18.0",
  "lucide-react": "^0.312.0"
}
```

## 🎯 Quick Tasks

### Add a New Tab Component
1. Create: `components/manager/tabs/YourTab.jsx`
2. Add route in `Dashboard.jsx`
3. Add navigation in `Sidebar.jsx`

### Change Theme Color
1. Edit `tailwind.config.js`
2. Change `primary` color values

### Modify Animation Speed
1. Edit `Dashboard.jsx`
2. Change `duration` in `pageVariants`

## 🐛 Common Fixes

**Icons not showing**
```bash
npm install lucide-react
```

**Sidebar not working**
```javascript
// Check z-index in Sidebar.jsx
className="... z-50 ..."
```

**Routes not matching**
```javascript
// In App.jsx, ensure manager route is first
<Route path="/manager/*" ... />
<Route path="/*" ... />
```

## 📚 Documentation Files
- `MANAGER_DASHBOARD.md` → Full implementation guide
- `MANAGER_DASHBOARD_SUMMARY.md` → Feature overview
- `COMPONENT_TREE.js` → Visual architecture

## ✅ Testing Checklist
- [ ] Login as manager/admin
- [ ] Click "Open Manager Dashboard"
- [ ] Navigate through all 12 tabs
- [ ] Test sidebar toggle (mobile)
- [ ] Test logout functionality
- [ ] Verify animations are smooth
- [ ] Check responsive layout

## 🎊 Success Indicators
✅ All 12 tabs accessible
✅ Sidebar animates smoothly
✅ Active tab highlighted
✅ User info displays correctly
✅ Logout works
✅ Mobile responsive
✅ Glassmorphism design visible
✅ Icons rendering properly

---

**Manager Dashboard v1.0** | Built with React + Vite + TailwindCSS + Framer Motion
