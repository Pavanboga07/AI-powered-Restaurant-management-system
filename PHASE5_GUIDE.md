# Phase 5 Implementation Guide

## Overview
Phase 5 adds three major features to the restaurant management system:
1. **Kitchen Display System (KDS)** - Real-time order tracking for kitchen staff
2. **WebSocket Events** - Instant updates across all kitchen displays
3. **Multi-language Support** - English, Hindi, and Tamil translations

---

## 1. Kitchen Display System (KDS)

### Access
- **URL**: `/kds`
- **Permissions**: Admin, Chef roles only
- **Component**: `frontend/src/components/kitchen/KitchenDisplay.jsx`

### Features

#### Station Management
- 6 default stations: Grill, Fry, Saute, Cold, Beverage, Expeditor
- Filter orders by specific station or view all
- Real-time station performance metrics

#### Order Display
- Active orders shown in card format
- Color coding:
  - **Yellow border**: Pending items
  - **Blue background**: Items in preparation
  - **Green border**: All items ready
  - **Red pulsing**: Orders over 15 minutes old (urgent)
- Shows: Order #, Table #, Customer name, Time elapsed, Special notes

#### Item Workflow
- **Pending** → Click "Start" → **Preparing** → Click "Complete" → **Ready**
- Auto-timestamps all status changes
- Auto-assigns current chef to items
- Tracks prep time vs. estimated time

#### Order Management
- **Bump Order**: Remove completed orders from display
- **Auto-Refresh**: Toggle 30-second auto-refresh
- **Manual Refresh**: Click refresh icon anytime
- **Priority Indicators**: 🔥 High priority, 📈 Medium priority

### API Endpoints (15 total)

#### Station Management
```
GET    /api/kds/stations                # List all stations
GET    /api/kds/stations/{id}           # Get specific station
POST   /api/kds/stations                # Create station (Admin/Manager)
PUT    /api/kds/stations/{id}           # Update station
```

#### Order Display
```
GET    /api/kds/orders/active           # Active orders (filter by station/status)
GET    /api/kds/orders/{id}/kds         # Single order KDS view
```

#### Item Workflow
```
PUT    /api/kds/items/{id}/status       # Update prep status
POST   /api/kds/items/{id}/start        # Quick start (sets to preparing)
POST   /api/kds/items/{id}/complete     # Quick complete (sets to ready)
POST   /api/kds/items/reassign          # Reassign to different station
```

#### Order Management
```
POST   /api/kds/orders/{id}/bump        # Bump order (remove from display)
```

#### Performance Analytics
```
GET    /api/kds/stations/{id}/performance   # Station metrics
GET    /api/kds/dashboard/stats             # Overall dashboard stats
```

#### Display Settings
```
GET    /api/kds/stations/{id}/settings      # Get display preferences
PUT    /api/kds/stations/{id}/settings      # Update display settings
```

### Database Schema

#### New Tables (6)
1. **kitchen_stations** - Station definitions
2. **station_assignments** - Chef-to-station scheduling
3. **kitchen_performance_logs** - Action history
4. **ticket_display_settings** - Per-station display preferences

#### Enhanced Tables
- **order_items**: +8 columns (station_id, prep_status, prep_start_time, etc.)
- **orders**: +4 columns (kitchen_status, kitchen_received_at, bumped_at, etc.)

---

## 2. WebSocket Events

### Real-Time Updates
All KDS actions broadcast instant updates to connected kitchen displays.

### Event Types (5 new)

#### `order_item_status_changed`
- **Triggered**: When item status changes (pending → preparing → ready)
- **Payload**: Item details, status, timestamp
- **Broadcast to**: Chef room
- **Use case**: All kitchen displays update instantly

#### `order_bumped`
- **Triggered**: When order is bumped from KDS
- **Payload**: Order ID, table number, bumped timestamp
- **Broadcast to**: Chef room + Staff room
- **Use case**: Remove from all displays, notify staff order is ready

#### `order_item_reassigned`
- **Triggered**: When item moved to different station
- **Payload**: Item details, old station, new station
- **Broadcast to**: Chef room
- **Use case**: Update displays at both stations

#### `kitchen_performance_alert`
- **Triggered**: When station falls behind or high load
- **Payload**: Station data, alert message, severity
- **Broadcast to**: Manager room + Chef room
- **Use case**: Proactive management intervention

#### `new_order` (existing, enhanced)
- **Triggered**: When new order created
- **Payload**: Complete order details
- **Broadcast to**: Chef room
- **Use case**: Instant notification to kitchen

### Integration
- Auto-emit on all KDS API actions
- Uses BackgroundTasks for non-blocking broadcast
- Connected via existing WebSocket infrastructure

### Testing WebSocket Events
```javascript
// Frontend subscription (in KitchenDisplay.jsx)
useEffect(() => {
  if (!lastMessage) return;
  
  switch (lastMessage.type) {
    case 'new_order':
    case 'order_status_changed':
    case 'order_item_updated':
    case 'order_bumped':
      fetchOrders(); // Refresh display
      break;
  }
}, [lastMessage]);
```

---

## 3. Multi-language Support (i18n)

### Supported Languages
- 🇬🇧 **English** (en) - Default
- 🇮🇳 **Hindi** (hi) - हिंदी
- 🇮🇳 **Tamil** (ta) - தமிழ்

### Language Selector
- **Location**: Top-right corner of Navbar
- **Icon**: Globe with flag
- **Component**: `frontend/src/components/common/LanguageSelector.jsx`

### Features
- Dropdown menu with flag emojis
- Native language names displayed
- Current selection highlighted
- Preference saved to localStorage
- Instant language switching (no page reload)

### Translation Files
```
frontend/src/locales/
├── en/
│   └── translation.json   # English
├── hi/
│   └── translation.json   # Hindi (हिंदी)
└── ta/
    └── translation.json   # Tamil (தமிழ்)
```

### Translation Coverage
- **Common**: UI elements, buttons, navigation
- **Menu**: Browse, categories, favorites
- **Orders**: Status, actions, details
- **Reservations**: Booking, confirmation
- **Profile**: Personal info, addresses, dietary
- **Loyalty**: Points, tiers, redemption
- **Kitchen**: KDS interface, stations, statuses
- **Auth**: Login, register, password
- **Notifications**: Success, error, warnings
- **Dietary**: Allergies, preferences

### Usage in Components
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('menu_items.title')}</h1>
      <button>{t('menu_items.add_to_cart')}</button>
      <p>{t('order.order_number', { number: 123 })}</p>
    </div>
  );
}
```

### Configuration
- **File**: `frontend/src/i18n.js`
- **Fallback**: English (en)
- **Storage key**: `appLanguage`
- **Auto-save**: Language preference persists across sessions

---

## System Statistics

### Backend
- **Total Routes**: 216
- **Phase 5 Endpoints**: 15 (KDS)
- **WebSocket Functions**: 11 broadcast functions
- **Database Tables**: 23 total (6 new in Phase 5)

### Frontend
- **New Components**: 2 (KitchenDisplay, LanguageSelector)
- **Translation Keys**: 150+ per language
- **Supported Languages**: 3

---

## Testing Checklist

### KDS Testing
- [ ] Access `/kds` as chef user
- [ ] Filter orders by station
- [ ] Start item preparation → Status changes to "Preparing"
- [ ] Complete item → Status changes to "Ready"
- [ ] All items ready → Order shows green border
- [ ] Bump order → Order disappears from display
- [ ] Orders over 15 min show red pulsing border
- [ ] Auto-refresh toggles correctly
- [ ] Manual refresh updates display

### WebSocket Testing
- [ ] Open two browser windows to `/kds`
- [ ] Start item in window 1 → Window 2 updates instantly
- [ ] Complete item in window 2 → Window 1 updates instantly
- [ ] Bump order → Removed from both displays
- [ ] New order created → Appears in both displays

### Multi-language Testing
- [ ] Click language selector in Navbar
- [ ] Select Hindi → UI changes to Hindi
- [ ] Select Tamil → UI changes to Tamil
- [ ] Refresh page → Language persists
- [ ] Navigate between pages → Language stays consistent
- [ ] Menu items, buttons, errors all translated

---

## Known Issues & Notes

### SQLAlchemy Lint Errors
The KDS router (`backend/app/routers/kds.py`) shows type-checking errors for SQLAlchemy ORM assignments. These are false positives from Pylance and do not affect runtime functionality. SQLAlchemy uses descriptors that confuse static type checkers.

### Future Enhancements
- Add sound alerts for urgent orders (>15 min)
- Drag-and-drop priority reordering
- Export kitchen performance reports
- Add more languages (Spanish, French, Arabic)
- Backend i18n middleware for API error messages

---

## File Changes Summary

### Backend Files Created/Modified
- ✅ `migrate_phase5_kds.py` - Database migration
- ✅ `app/models.py` - Added 5 KDS models
- ✅ `app/schemas.py` - Added 15+ KDS schemas
- ✅ `app/routers/kds.py` - Created KDS router (700+ lines)
- ✅ `app/websocket.py` - Added 5 KDS broadcast functions
- ✅ `app/main.py` - Registered KDS router

### Frontend Files Created/Modified
- ✅ `components/kitchen/KitchenDisplay.jsx` - Full KDS UI (450+ lines)
- ✅ `components/common/LanguageSelector.jsx` - Language switcher
- ✅ `locales/en/translation.json` - English translations
- ✅ `locales/hi/translation.json` - Hindi translations
- ✅ `locales/ta/translation.json` - Tamil translations
- ✅ `i18n.js` - Updated language configuration
- ✅ `App.jsx` - Added `/kds` route
- ✅ `components/Navbar.jsx` - Added LanguageSelector

---

## Quick Start Commands

### Backend Test
```powershell
python -c "from app.main import app; from app.routers import kds; print(f'Total routes: {len(app.routes)}'); print(f'KDS endpoints: {len([r for r in kds.router.routes])}')"
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Access KDS
1. Login as chef user
2. Navigate to `/kds`
3. Select station or view all
4. Start working on orders!

---

## Support
For issues or questions about Phase 5 features, refer to:
- KDS API documentation: `/api/docs` (when backend running)
- Translation keys: Check `locales/*/translation.json`
- WebSocket events: See `backend/app/websocket.py`
