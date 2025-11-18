# 🚀 Feature Implementation Roadmap
## Restaurant Management System - Complete Feature Integration Plan

**Version:** 2.0  
**Last Updated:** November 9, 2025  
**Status:** Ready for Implementation

---

## 📋 Table of Contents
1. [Implementation Strategy](#implementation-strategy)
2. [Phase 1: Foundation & WebSocket (Week 1-2)](#phase-1-foundation--websocket-week-1-2)
3. [Phase 2: Inventory Management (Week 3-4)](#phase-2-inventory-management-week-3-4)
4. [Phase 3: Email & Notifications (Week 5-6)](#phase-3-email--notifications-week-5-6)
5. [Phase 4: Enhanced User Features (Week 7-8)](#phase-4-enhanced-user-features-week-7-8)
6. [Phase 5: Multi-language & Advanced Features (Week 9-10)](#phase-5-multi-language--advanced-features-week-9-10)
7. [Phase 6: AI/ML & Analytics (Week 11-12)](#phase-6-aiml--analytics-week-11-12)
8. [Testing & Validation](#testing--validation)

---

## 🎯 Implementation Strategy

### **Core Principles**
1. ✅ **Zero Breaking Changes** - All new features are additive
2. ✅ **Backward Compatible** - Existing features continue working
3. ✅ **Incremental Integration** - Each phase is independently testable
4. ✅ **Database Migrations** - Use Alembic for schema changes
5. ✅ **Feature Flags** - Enable/disable features without code changes

### **Protected Components** (DO NOT MODIFY)
- ❌ `backend/app/main.py` (app initialization) - Only add new routers
- ❌ `backend/app/database.py` - Keep existing configuration
- ❌ `frontend/src/App.jsx` - Only add new routes
- ❌ `frontend/src/contexts/AuthContext.jsx` - Extend, don't replace
- ❌ Existing API endpoints - Create new endpoints for new features
- ❌ Existing database tables - Add new tables, don't alter existing

### **Naming Conventions**
- **Backend Models:** PascalCase (e.g., `InventoryItem`, `EmailNotification`)
- **Backend Files:** snake_case (e.g., `inventory.py`, `email_service.py`)
- **Frontend Components:** PascalCase (e.g., `InventoryManager.jsx`, `NotificationCenter.jsx`)
- **Frontend Files:** PascalCase for components, camelCase for utilities
- **API Routes:** kebab-case (e.g., `/api/inventory-items`, `/api/email/send`)
- **Database Tables:** snake_case (e.g., `inventory_items`, `email_logs`)

### **File Organization**
```
backend/app/
├── routers/          # Add: inventory.py, email.py, notifications.py
├── models.py         # Extend with new models
├── schemas.py        # Extend with new schemas
├── crud/             # Add: inventory.py, email.py
├── services/         # NEW: email_service.py, notification_service.py
└── utils/            # Add: ml_utils.py, i18n_utils.py

frontend/src/
├── components/
│   ├── manager/tabs/ # Add: InventoryManager.jsx, EmailCampaigns.jsx
│   ├── customer/     # Enhance: UserProfile.jsx, OrderHistory.jsx
│   └── shared/       # Add: NotificationCenter.jsx, LanguageSwitcher.jsx
├── contexts/         # Add: NotificationContext.jsx, LanguageContext.jsx
├── hooks/            # NEW: useWebSocket.js, useNotifications.js
└── services/         # Extend api.js with new endpoints
```

---

## 📅 PHASE 1: Foundation & WebSocket (Week 1-2)

### **Goal:** Enable real-time communication across all dashboards

### **Step 1.1: Install Dependencies** ⏱️ 30 mins

#### Backend (No new dependencies needed - WebSocket already exists!)
```bash
# Already installed: python-socketio, aiofiles
# Verify in backend/requirements.txt
```

#### Frontend
```bash
cd frontend
npm install socket.io-client@4.7.2
npm install react-toastify@9.1.3
```

**Update:** `frontend/package.json`
```json
{
  "dependencies": {
    // ... existing dependencies
    "socket.io-client": "^4.7.2",
    "react-toastify": "^9.1.3"
  }
}
```

---

### **Step 1.2: Create WebSocket Hook** ⏱️ 2 hours

**CREATE:** `frontend/src/hooks/useWebSocket.js`

```javascript
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

/**
 * Custom hook for WebSocket connection with automatic reconnection
 * @param {string} room - Room to join (manager, chef, staff, customer)
 * @param {Object} user - Current user object with role
 * @returns {Object} Socket instance and connection status
 */
export const useWebSocket = (room, user) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!user || !room) return;

    // Connect to WebSocket server
    const socket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('access_token'),
        user_id: user.id,
        role: user.role
      }
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      socket.emit('join_room', { room, user_id: user.id, role: user.role });
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    // Event listeners
    socket.on('new_order', (data) => {
      console.log('🔔 New order:', data);
      setLastMessage({ type: 'new_order', data });
      toast.info(`New Order #${data.order_id}`);
    });

    socket.on('order_status_changed', (data) => {
      console.log('🔄 Order status changed:', data);
      setLastMessage({ type: 'order_status_changed', data });
      toast.success(`Order #${data.order_id} is ${data.new_status}`);
    });

    socket.on('table_status_changed', (data) => {
      console.log('🪑 Table status changed:', data);
      setLastMessage({ type: 'table_status_changed', data });
    });

    socket.on('inventory_low', (data) => {
      console.log('⚠️ Low inventory:', data);
      setLastMessage({ type: 'inventory_low', data });
      toast.warning(`Low stock: ${data.inventory.item_name}`);
    });

    socket.on('custom_notification', (data) => {
      console.log('📬 Custom notification:', data);
      setLastMessage({ type: 'custom_notification', data });
      toast.info(data.message);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave_room', { room, user_id: user.id });
      socket.disconnect();
    };
  }, [room, user]);

  return { socket: socketRef.current, isConnected, lastMessage };
};
```

**IMPORTANT:** This hook uses existing backend WebSocket (`backend/app/websocket.py`) - NO backend changes needed!

---

### **Step 1.3: Create Notification Context** ⏱️ 1.5 hours

**CREATE:** `frontend/src/contexts/NotificationContext.jsx`

```javascript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast
    switch (notification.type) {
      case 'success':
        toast.success(notification.message);
        break;
      case 'error':
        toast.error(notification.message);
        break;
      case 'warning':
        toast.warning(notification.message);
        break;
      default:
        toast.info(notification.message);
    }
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        unreadCount
      }}
    >
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </NotificationContext.Provider>
  );
};
```

---

### **Step 1.4: Integrate WebSocket in Dashboards** ⏱️ 3 hours

**MODIFY:** `frontend/src/components/manager/Dashboard.jsx`

```javascript
// ADD these imports at the top (after existing imports)
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotifications } from '../../contexts/NotificationContext';

// Inside Dashboard component, after const [isSidebarOpen, setIsSidebarOpen] = useState(true);
const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // ADD: WebSocket integration
  const { user } = useAuth(); // Assuming AuthContext provides user
  const { socket, isConnected, lastMessage } = useWebSocket('manager', user);
  const { addNotification } = useNotifications();

  // ADD: Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      // Trigger re-fetch of data or update state
      switch (lastMessage.type) {
        case 'new_order':
          addNotification({
            type: 'info',
            title: 'New Order',
            message: `Order #${lastMessage.data.order_id} received`
          });
          break;
        case 'order_status_changed':
          addNotification({
            type: 'success',
            title: 'Order Updated',
            message: `Order #${lastMessage.data.order_id} status changed`
          });
          break;
        case 'inventory_low':
          addNotification({
            type: 'warning',
            title: 'Low Stock Alert',
            message: lastMessage.data.message
          });
          break;
      }
    }
  }, [lastMessage, addNotification]);

  // Rest of existing code remains unchanged
  // ...
};
```

**REPEAT** similar integration for:
- `frontend/src/components/chef/ChefDashboard.jsx` (room: 'chef')
- `frontend/src/components/staff/StaffDashboard.jsx` (room: 'staff')
- `frontend/src/components/customer/CustomerDashboard.jsx` (room: 'customer')

---

### **Step 1.5: Update App.jsx** ⏱️ 30 mins

**MODIFY:** `frontend/src/App.jsx`

```javascript
// ADD import at top
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider> {/* ADD: Wrap entire app */}
        <Router>
          {/* Existing routes remain unchanged */}
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
```

---

### **Step 1.6: Create Notification Bell Component** ⏱️ 2 hours

**CREATE:** `frontend/src/components/shared/NotificationBell.jsx`

```javascript
import React, { useState } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell className="text-white" size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="mx-auto mb-2 opacity-50" size={48} />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                      !notification.read ? 'bg-primary-500/10' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-slate-300 text-sm mt-1">
                          {notification.message}
                        </p>
                        <p className="text-slate-500 text-xs mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-primary-400 hover:text-primary-300"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => clearNotification(notification.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={16} />
                          </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
```

**ADD** NotificationBell to all dashboard headers (Manager, Chef, Staff, Customer)

---

### ✅ **Phase 1 Validation**

**Test Checklist:**
- [ ] Frontend connects to WebSocket on dashboard load
- [ ] Toast notifications appear for new orders
- [ ] Notification bell shows unread count
- [ ] Clicking bell opens notification dropdown
- [ ] Mark as read works
- [ ] Clear notifications works
- [ ] Real-time updates visible across all dashboards
- [ ] No console errors
- [ ] Existing features still work

**Rollback Plan:** Remove NotificationProvider from App.jsx, remove useWebSocket hook calls

---

## 📅 PHASE 2: Inventory Management (Week 3-4)

### **Goal:** Complete inventory tracking with automatic order deduction

### **Step 2.1: Database Migration** ⏱️ 2 hours

**CREATE:** `backend/app/alembic/versions/001_add_inventory_tables.py`

```python
"""Add inventory tables

Revision ID: 001
Create Date: 2025-11-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create suppliers table
    op.create_table(
        'suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('contact_person', sa.String(100)),
        sa.Column('email', sa.String(100)),
        sa.Column('phone', sa.String(20)),
        sa.Column('address', sa.Text()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create inventory_items table
    op.create_table(
        'inventory_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(50)),  # Raw Material, Packaging, etc.
        sa.Column('unit', sa.String(20)),  # kg, liter, piece, etc.
        sa.Column('current_quantity', sa.Float(), default=0),
        sa.Column('min_quantity', sa.Float(), default=0),  # Reorder point
        sa.Column('max_quantity', sa.Float()),
        sa.Column('unit_cost', sa.Float()),
        sa.Column('supplier_id', sa.Integer(), sa.ForeignKey('suppliers.id')),
        sa.Column('location', sa.String(100)),  # Storage location
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('last_restocked', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_inventory_name', 'name'),
        sa.Index('idx_inventory_category', 'category')
    )

    # Create inventory_transactions table
    op.create_table(
        'inventory_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('inventory_item_id', sa.Integer(), sa.ForeignKey('inventory_items.id'), nullable=False),
        sa.Column('transaction_type', sa.String(20)),  # purchase, usage, wastage, adjustment
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_cost', sa.Float()),
        sa.Column('reference_type', sa.String(20)),  # order, purchase, adjustment
        sa.Column('reference_id', sa.Integer()),  # Order ID, Purchase ID, etc.
        sa.Column('notes', sa.Text()),
        sa.Column('performed_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_transaction_item', 'inventory_item_id'),
        sa.Index('idx_transaction_type', 'transaction_type'),
        sa.Index('idx_transaction_date', 'created_at')
    )

    # Create menu_item_recipes table (links menu items to inventory)
    op.create_table(
        'menu_item_recipes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('menu_item_id', sa.Integer(), sa.ForeignKey('menu_items.id'), nullable=False),
        sa.Column('inventory_item_id', sa.Integer(), sa.ForeignKey('inventory_items.id'), nullable=False),
        sa.Column('quantity_required', sa.Float(), nullable=False),  # Per serving
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('menu_item_id', 'inventory_item_id', name='unique_recipe_ingredient')
    )

    # Create purchase_orders table
    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('po_number', sa.String(50), unique=True),
        sa.Column('supplier_id', sa.Integer(), sa.ForeignKey('suppliers.id'), nullable=False),
        sa.Column('status', sa.String(20), default='pending'),  # pending, confirmed, received, cancelled
        sa.Column('order_date', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('expected_delivery', sa.DateTime()),
        sa.Column('actual_delivery', sa.DateTime()),
        sa.Column('total_cost', sa.Float()),
        sa.Column('notes', sa.Text()),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create purchase_order_items table
    op.create_table(
        'purchase_order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('purchase_order_id', sa.Integer(), sa.ForeignKey('purchase_orders.id'), nullable=False),
        sa.Column('inventory_item_id', sa.Integer(), sa.ForeignKey('inventory_items.id'), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_cost', sa.Float(), nullable=False),
        sa.Column('received_quantity', sa.Float(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('purchase_order_items')
    op.drop_table('purchase_orders')
    op.drop_table('menu_item_recipes')
    op.drop_table('inventory_transactions')
    op.drop_table('inventory_items')
    op.drop_table('suppliers')
```

**Run Migration:**
```bash
cd backend
alembic revision --autogenerate -m "Add inventory tables"
alembic upgrade head
```

---

### **Step 2.2: Add Models to models.py** ⏱️ 1.5 hours

**MODIFY:** `backend/app/models.py` (ADD at the end, don't modify existing models)

```python
# ==================== INVENTORY MODELS (NEW) ====================

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50))  # Raw Material, Packaging, Beverages, etc.
    unit = Column(String(20))  # kg, liter, piece, box, etc.
    current_quantity = Column(Float, default=0)
    min_quantity = Column(Float, default=0)  # Reorder point
    max_quantity = Column(Float)
    unit_cost = Column(Float)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    location = Column(String(100))  # Storage location
    is_active = Column(Boolean, default=True)
    last_restocked = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier", back_populates="inventory_items")
    transactions = relationship("InventoryTransaction", back_populates="inventory_item")
    recipes = relationship("MenuItemRecipe", back_populates="inventory_item")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="inventory_item")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    transaction_type = Column(String(20))  # purchase, usage, wastage, adjustment
    quantity = Column(Float, nullable=False)  # Positive for add, negative for deduct
    unit_cost = Column(Float)
    reference_type = Column(String(20))  # order, purchase, adjustment
    reference_id = Column(Integer)  # Order ID, Purchase ID, etc.
    notes = Column(Text)
    performed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="transactions")
    user = relationship("User")


class MenuItemRecipe(Base):
    __tablename__ = "menu_item_recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_required = Column(Float, nullable=False)  # Quantity per serving
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    menu_item = relationship("MenuItem")
    inventory_item = relationship("InventoryItem", back_populates="recipes")
    
    __table_args__ = (
        UniqueConstraint('menu_item_id', 'inventory_item_id', name='unique_recipe_ingredient'),
    )


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, received, cancelled
    order_date = Column(DateTime, server_default=func.now())
    expected_delivery = Column(DateTime)
    actual_delivery = Column(DateTime)
    total_cost = Column(Float)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    creator = relationship("User")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)
    received_quantity = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    inventory_item = relationship("InventoryItem", back_populates="purchase_order_items")
```

---

### **Step 2.3: Add Schemas** ⏱️ 1.5 hours

**MODIFY:** `backend/app/schemas.py` (ADD at the end)

```python
# ==================== INVENTORY SCHEMAS (NEW) ====================

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class Supplier(SupplierBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Inventory Item Schemas
class InventoryItemBase(BaseModel):
    name: str
    category: Optional[str] = None
    unit: str = "piece"
    current_quantity: float = 0
    min_quantity: float = 0
    max_quantity: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier_id: Optional[int] = None
    location: Optional[str] = None
    is_active: bool = True

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_quantity: Optional[float] = None
    min_quantity: Optional[float] = None
    max_quantity: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier_id: Optional[int] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class InventoryItem(InventoryItemBase):
    id: int
    last_restocked: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[Supplier] = None
    is_low_stock: bool = False  # Computed field
    
    class Config:
        from_attributes = True

# Inventory Transaction Schemas
class InventoryTransactionBase(BaseModel):
    inventory_item_id: int
    transaction_type: str  # purchase, usage, wastage, adjustment
    quantity: float
    unit_cost: Optional[float] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None

class InventoryTransactionCreate(InventoryTransactionBase):
    pass

class InventoryTransaction(InventoryTransactionBase):
    id: int
    performed_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Recipe Schemas
class MenuItemRecipeBase(BaseModel):
    menu_item_id: int
    inventory_item_id: int
    quantity_required: float

class MenuItemRecipeCreate(MenuItemRecipeBase):
    pass

class MenuItemRecipe(MenuItemRecipeBase):
    id: int
    created_at: datetime
    inventory_item: Optional[InventoryItem] = None
    
    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderItemBase(BaseModel):
    inventory_item_id: int
    quantity: float
    unit_cost: float

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    purchase_order_id: int
    received_quantity: float = 0
    created_at: datetime
    inventory_item: Optional[InventoryItem] = None
    
    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    supplier_id: int
    expected_delivery: Optional[datetime] = None
    notes: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    actual_delivery: Optional[datetime] = None
    notes: Optional[str] = None

class PurchaseOrder(PurchaseOrderBase):
    id: int
    po_number: str
    status: str
    order_date: datetime
    actual_delivery: Optional[datetime] = None
    total_cost: Optional[float] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[Supplier] = None
    items: List[PurchaseOrderItem] = []
    
    class Config:
        from_attributes = True

# Response Schemas
class InventoryListResponse(BaseModel):
    items: List[InventoryItem]
    total: int
    low_stock_count: int

class InventoryStatsResponse(BaseModel):
    total_items: int
    low_stock_count: int
    out_of_stock_count: int
    total_value: float
    categories: List[dict]
```

---

### **Step 2.4: Create Inventory CRUD** ⏱️ 3 hours

**CREATE:** `backend/app/crud/inventory.py`

```python
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional
from .. import models, schemas
from ..websocket import broadcast_inventory_low

# ==================== SUPPLIER CRUD ====================

def create_supplier(db: Session, supplier: schemas.SupplierCreate):
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def get_suppliers(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True):
    query = db.query(models.Supplier)
    if active_only:
        query = query.filter(models.Supplier.is_active == True)
    return query.offset(skip).limit(limit).all()

def get_supplier(db: Session, supplier_id: int):
    return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()

def update_supplier(db: Session, supplier_id: int, supplier: schemas.SupplierUpdate):
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return None
    
    for key, value in supplier.dict(exclude_unset=True).items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

# ==================== INVENTORY ITEM CRUD ====================

def create_inventory_item(db: Session, item: schemas.InventoryItemCreate):
    db_item = models.InventoryItem(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_inventory_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    search: Optional[str] = None
):
    query = db.query(models.InventoryItem).filter(models.InventoryItem.is_active == True)
    
    if category:
        query = query.filter(models.InventoryItem.category == category)
    
    if low_stock_only:
        query = query.filter(models.InventoryItem.current_quantity <= models.InventoryItem.min_quantity)
    
    if search:
        query = query.filter(models.InventoryItem.name.ilike(f"%{search}%"))
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # Add computed field
    for item in items:
        item.is_low_stock = item.current_quantity <= item.min_quantity
    
    low_stock_count = db.query(models.InventoryItem).filter(
        and_(
            models.InventoryItem.is_active == True,
            models.InventoryItem.current_quantity <= models.InventoryItem.min_quantity
        )
    ).count()
    
    return {
        "items": items,
        "total": total,
        "low_stock_count": low_stock_count
    }

def get_inventory_item(db: Session, item_id: int):
    return db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()

def update_inventory_quantity(
    db: Session,
    item_id: int,
    quantity_change: float,
    transaction_type: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    user_id: Optional[int] = None,
    notes: Optional[str] = None
):
    """
    Update inventory quantity and create transaction record
    quantity_change: positive for add, negative for deduct
    """
    db_item = get_inventory_item(db, item_id)
    if not db_item:
        return None
    
    # Update quantity
    db_item.current_quantity += quantity_change
    
    if quantity_change > 0:
        db_item.last_restocked = datetime.now()
    
    # Create transaction record
    transaction = models.InventoryTransaction(
        inventory_item_id=item_id,
        transaction_type=transaction_type,
        quantity=quantity_change,
        unit_cost=db_item.unit_cost,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        performed_by=user_id
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(db_item)
    
    # Check if low stock and broadcast alert
    if db_item.current_quantity <= db_item.min_quantity:
        asyncio.create_task(broadcast_inventory_low({
            'item_id': db_item.id,
            'item_name': db_item.name,
            'current_quantity': db_item.current_quantity,
            'min_quantity': db_item.min_quantity,
            'unit': db_item.unit,
            'updated_at': datetime.now().isoformat()
        }))
    
    return db_item

# ==================== RECIPE CRUD ====================

def create_recipe(db: Session, recipe: schemas.MenuItemRecipeCreate):
    db_recipe = models.MenuItemRecipe(**recipe.dict())
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def get_recipe(db: Session, menu_item_id: int):
    """Get all ingredients for a menu item"""
    return db.query(models.MenuItemRecipe).filter(
        models.MenuItemRecipe.menu_item_id == menu_item_id
    ).all()

def delete_recipe_ingredient(db: Session, recipe_id: int):
    recipe = db.query(models.MenuItemRecipe).filter(models.MenuItemRecipe.id == recipe_id).first()
    if recipe:
        db.delete(recipe)
        db.commit()
        return True
    return False

# ==================== ORDER INVENTORY DEDUCTION ====================

def deduct_inventory_for_order(db: Session, order_id: int):
    """
    Automatically deduct inventory when order is confirmed
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        return {"success": False, "error": "Order not found"}
    
    insufficient_items = []
    
    # Get all order items
    order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
    
    for order_item in order_items:
        # Get recipe ingredients for this menu item
        recipes = get_recipe(db, order_item.menu_item_id)
        
        for recipe in recipes:
            required_quantity = recipe.quantity_required * order_item.quantity
            inventory_item = recipe.inventory_item
            
            # Check if sufficient stock
            if inventory_item.current_quantity < required_quantity:
                insufficient_items.append({
                    "item_name": inventory_item.name,
                    "required": required_quantity,
                    "available": inventory_item.current_quantity,
                    "unit": inventory_item.unit
                })
                continue
            
            # Deduct inventory
            update_inventory_quantity(
                db=db,
                item_id=inventory_item.id,
                quantity_change=-required_quantity,
                transaction_type="usage",
                reference_type="order",
                reference_id=order_id,
                notes=f"Used for Order #{order_id} - {order_item.menu_item.name} x{order_item.quantity}"
            )
    
    if insufficient_items:
        return {
            "success": False,
            "error": "Insufficient inventory",
            "insufficient_items": insufficient_items
        }
    
    return {"success": True, "message": "Inventory deducted successfully"}

# ==================== PURCHASE ORDERS ====================

def create_purchase_order(db: Session, po: schemas.PurchaseOrderCreate, user_id: int):
    # Generate PO number
    po_number = f"PO{datetime.now().strftime('%Y%m%d')}{db.query(models.PurchaseOrder).count() + 1:04d}"
    
    # Calculate total cost
    total_cost = sum(item.quantity * item.unit_cost for item in po.items)
    
    db_po = models.PurchaseOrder(
        po_number=po_number,
        supplier_id=po.supplier_id,
        expected_delivery=po.expected_delivery,
        notes=po.notes,
        total_cost=total_cost,
        created_by=user_id,
        status="pending"
    )
    db.add(db_po)
    db.flush()
    
    # Add items
    for item in po.items:
        po_item = models.PurchaseOrderItem(
            purchase_order_id=db_po.id,
            **item.dict()
        )
        db.add(po_item)
    
    db.commit()
    db.refresh(db_po)
    return db_po

def receive_purchase_order(db: Session, po_id: int, user_id: int):
    """Mark PO as received and update inventory"""
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
    if not po:
        return None
    
    po.status = "received"
    po.actual_delivery = datetime.now()
    
    # Update inventory for each item
    for item in po.items:
        update_inventory_quantity(
            db=db,
            item_id=item.inventory_item_id,
            quantity_change=item.quantity,
            transaction_type="purchase",
            reference_type="purchase_order",
            reference_id=po_id,
            user_id=user_id,
            notes=f"Received from PO #{po.po_number}"
        )
        item.received_quantity = item.quantity
    
    db.commit()
    db.refresh(po)
    return po

def get_inventory_stats(db: Session):
    """Get inventory statistics"""
    total_items = db.query(models.InventoryItem).filter(models.InventoryItem.is_active == True).count()
    
    low_stock = db.query(models.InventoryItem).filter(
        and_(
            models.InventoryItem.is_active == True,
            models.InventoryItem.current_quantity <= models.InventoryItem.min_quantity,
            models.InventoryItem.current_quantity > 0
        )
    ).count()
    
    out_of_stock = db.query(models.InventoryItem).filter(
        and_(
            models.InventoryItem.is_active == True,
            models.InventoryItem.current_quantity <= 0
        )
    ).count()
    
    total_value = db.query(
        func.sum(models.InventoryItem.current_quantity * models.InventoryItem.unit_cost)
    ).filter(models.InventoryItem.is_active == True).scalar() or 0
    
    # Category breakdown
    categories = db.query(
        models.InventoryItem.category,
        func.count(models.InventoryItem.id).label('count'),
        func.sum(models.InventoryItem.current_quantity * models.InventoryItem.unit_cost).label('value')
    ).filter(models.InventoryItem.is_active == True)\
     .group_by(models.InventoryItem.category)\
     .all()
    
    return {
        "total_items": total_items,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "total_value": round(total_value, 2),
        "categories": [
            {
                "category": cat.category or "Uncategorized",
                "count": cat.count,
                "value": round(cat.value or 0, 2)
            }
            for cat in categories
        ]
    }
```

---

Due to character limits, I'll continue in the next response with the remaining phases and detailed implementation steps. Would you like me to continue with:

1. Phase 2 Router implementation (inventory.py)
2. Phase 3 Email/SMS integration
3. Phase 4 Enhanced user features
4. Phase 5 Multi-language & advanced features
5. Phase 6 AI/ML features

Or would you prefer I export this to a complete document file that you can reference during implementation?