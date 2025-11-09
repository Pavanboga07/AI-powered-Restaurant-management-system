import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  ClipboardList, 
  Users, 
  Package, 
  Calendar,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  PlusCircle,
  CalendarPlus,
  Minus,
  Plus,
  X,
  DollarSign,
  Receipt,
  CreditCard
} from 'lucide-react';
import { Link, Routes, Route, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { menuAPI, ordersAPI, tablesAPI, staffAPI, billingAPI } from '../../services/api';

/**
 * Staff Dashboard - Multi-page navigation
 * @component
 */
const StaffDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '', label: t('nav.home'), icon: Home },
    { path: 'create-order', label: 'Create Order', icon: PlusCircle },
    { path: 'book-table', label: 'Book Table', icon: CalendarPlus },
    { path: 'orders', label: t('nav.orders'), icon: ClipboardList },
    { path: 'tables', label: t('nav.tables'), icon: Users },
    { path: 'inventory', label: t('nav.inventory'), icon: Package },
    { path: 'reservations', label: t('nav.reservations'), icon: Calendar }
  ];

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 fixed h-full z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 sm:p-6 relative h-full pb-32">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            {isSidebarOpen && <h2 className="text-lg sm:text-xl font-bold text-slate-800">{t('staff.title')}</h2>}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Users className="text-blue-600" size={20} />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={`/staff/${item.path}`}
                end={item.path === ''}
                className={({ isActive }) =>
                  `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon size={18} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-slate-200 bg-white">
            {isSidebarOpen ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-slate-800 truncate">{user?.username}</p>
                  <p className="text-slate-500 capitalize text-xs">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} transition-all duration-300`}>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <Users size={24} />
        </button>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/create-order" element={<CreateOrderPage />} />
            <Route path="/book-table" element={<BookTablePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

/**
 * Home Page - Quick Order Interface with Table Selection
 * @component
 */
const HomePage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchMenu, setSearchMenu] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch tables and menu items
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tablesData, menuData] = await Promise.all([
          tablesAPI.getAll(),
          menuAPI.getAll()
        ]);
        console.log('Tables:', tablesData);
        console.log('Menu:', menuData);
        setTables(Array.isArray(tablesData) ? tablesData : []);
        setMenuItems(Array.isArray(menuData) ? menuData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  const addItem = (item) => {
    if (!item.is_available) return;
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setSelectedItems(selectedItems.map(i =>
      i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = total * 0.1;
  const grandTotal = total + tax;

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      alert('Please select a table');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        table_id: selectedTable.id,
        customer_name: customerName,
        special_notes: specialInstructions,
        items: selectedItems.map(item => ({ 
          menu_item_id: item.id, 
          quantity: item.quantity 
        }))
      };

      const result = await ordersAPI.create(orderData);
      alert(`Order #${result.id} created successfully!`);
      
      // Reset form
      setSelectedTable(null);
      setCustomerName('');
      setSelectedItems([]);
      setSpecialInstructions('');
      
      // Refresh tables to show updated status
      const tablesData = await tablesAPI.getAll();
      setTables(Array.isArray(tablesData) ? tablesData : []);
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8"
    >
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Quick Order</h1>
        <p className="text-slate-600">Select a table and create order instantly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tables & Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Table Selection */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4">1. Select Table</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableSelect(table)}
                  disabled={table.status === 'occupied'}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTable?.id === table.id
                      ? 'border-blue-500 bg-blue-50'
                      : table.status === 'available'
                      ? 'border-green-300 hover:border-green-500 hover:bg-green-50'
                      : 'border-slate-300 bg-slate-100 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-2xl font-bold">{table.table_number}</p>
                    <p className="text-xs text-slate-600">{table.capacity} seats</p>
                    <p className={`text-xs mt-1 capitalize ${
                      table.status === 'available' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {table.status}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Details */}
          {selectedTable && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold mb-4">
                2. Customer Details (Table {selectedTable.table_number})
              </h2>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </motion.div>
          )}

          {/* Menu Items */}
          {selectedTable && customerName && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold mb-4">3. Add Menu Items</h2>
              <input
                type="text"
                value={searchMenu}
                onChange={(e) => setSearchMenu(e.target.value)}
                placeholder="Search menu..."
                className="w-full px-4 py-2 mb-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {menuItems
                  .filter(item => 
                    item.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
                    item.category?.toLowerCase().includes(searchMenu.toLowerCase())
                  )
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      disabled={!item.is_available}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        item.is_available
                          ? 'border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                          : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-800">{item.name}</h3>
                          <p className="text-sm text-slate-500">{item.category}</p>
                          {!item.is_available && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded mt-1 inline-block">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <span className="text-blue-600 font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            {!selectedTable ? (
              <p className="text-slate-500 text-center py-8">Select a table to start</p>
            ) : selectedItems.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No items added</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-sm text-slate-500">${item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Special instructions..."
                  rows={2}
                  className="w-full mt-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />

                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || !customerName}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={20} />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Create Order Page - For placing orders on behalf of customers
 * @component
 */
const CreateOrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [orderType, setOrderType] = useState('dine-in'); // dine-in, takeaway
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchMenu, setSearchMenu] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if table was passed from navigation state
  useEffect(() => {
    if (location.state?.selectedTable) {
      setSelectedTable(location.state.selectedTable.toString());
      setOrderType('dine-in'); // Automatically set to dine-in when coming from table
    }
  }, [location.state]);

  // Fetch menu items and tables on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuData, tablesData] = await Promise.all([
          menuAPI.getAll(),
          tablesAPI.getAll()
        ]);
        console.log('Fetched menu items:', menuData);
        console.log('Fetched tables:', tablesData);
        setMenuItems(Array.isArray(menuData) ? menuData : []);
        setTables(Array.isArray(tablesData) ? tablesData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Error loading data: ${error.message || 'Please check console for details'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addItem = (item) => {
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setSelectedItems(selectedItems.map(i =>
      i.id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = total * 0.1; // 10% tax
  const grandTotal = total + tax;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (orderType === 'dine-in' && !selectedTable) {
      alert('Please select a table');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        table_id: orderType === 'dine-in' ? parseInt(selectedTable) : null,
        customer_name: customerName,
        special_notes: specialInstructions,
        items: selectedItems.map(item => ({ 
          menu_item_id: item.id, 
          quantity: item.quantity 
        }))
      };

      const result = await ordersAPI.create(orderData);
      
      // Success notification
      alert(`Order #${result.id} created successfully! Chef has been notified.`);
      
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setSelectedTable('');
      setSelectedItems([]);
      setSpecialInstructions('');
      setOrderType('dine-in');
      
      // Navigate to orders page to see the new order
      navigate('/staff/orders');
      
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create order. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Order</h1>
        <p className="text-slate-600">Place order for walk-in customers</p>
        {location.state?.selectedTable && (
          <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">
              Creating order for Table {location.state.selectedTable}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer Info & Order Type */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>
              {orderType === 'dine-in' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Table Number
                    {location.state?.selectedTable && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Pre-selected from Tables
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Table</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        Table {table.table_number} ({table.capacity} seats) - {table.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items Selection */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Select Menu Items</h2>
            <div className="mb-4">
              <input
                type="text"
                value={searchMenu}
                onChange={(e) => setSearchMenu(e.target.value)}
                placeholder="Search menu items..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-slate-600">Loading menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {menuItems
                  .filter(item => 
                    item.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
                    item.category?.toLowerCase().includes(searchMenu.toLowerCase())
                  )
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => item.is_available && addItem(item)}
                      className={`p-4 border rounded-lg transition-colors ${
                        item.is_available
                          ? 'border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                          : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">{item.name}</h3>
                          <p className="text-sm text-slate-500">{item.category}</p>
                          {item.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          {!item.is_available && (
                            <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <span className="text-blue-600 font-semibold ml-2">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                {menuItems.length === 0 && !loading && (
                  <div className="col-span-2 text-center py-8 text-slate-500">
                    No menu items available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Special Instructions</h2>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests or dietary requirements..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            {selectedItems.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No items selected</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">${item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting || !customerName || (orderType === 'dine-in' && !selectedTable)}
                  className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Book Table Page - For creating reservations on behalf of customers
 * @component
 */
const BookTablePage = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Sample available tables
  const tables = [
    { id: 1, number: 1, capacity: 2, status: 'available' },
    { id: 2, number: 2, capacity: 4, status: 'available' },
    { id: 3, number: 3, capacity: 4, status: 'available' },
    { id: 4, number: 4, capacity: 6, status: 'available' },
    { id: 5, number: 5, capacity: 2, status: 'reserved' },
    { id: 6, number: 6, capacity: 8, status: 'available' }
  ];

  const timeSlots = [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'
  ];

  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    const reservationData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      guest_count: guestCount,
      reservation_date: reservationDate,
      reservation_time: reservationTime,
      table_id: selectedTable,
      special_requests: specialRequests
    };
    console.log('Submitting reservation:', reservationData);
    // TODO: Call API to create reservation
    alert('Table booked successfully!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Book Table</h1>
        <p className="text-slate-600">Create reservation for walk-in customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmitReservation} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
            {/* Customer Details */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="Enter customer name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Reservation Details */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Reservation Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Guests *</label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value))}
                    min="1"
                    max="20"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
                  <select
                    value={reservationTime}
                    onChange={(e) => setReservationTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Table</label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any available table</option>
                    {tables
                      .filter(t => t.status === 'available' && t.capacity >= guestCount)
                      .map(table => (
                        <option key={table.id} value={table.id}>
                          Table {table.number} (Seats {table.capacity})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Special Requests</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Birthday celebration, window seat, high chair, etc..."
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Confirm Reservation
            </button>
          </form>
        </div>

        {/* Right: Table Availability */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Table Availability</h2>
            <div className="space-y-3">
              {tables.map(table => (
                <div
                  key={table.id}
                  className={`p-4 rounded-lg border-2 ${
                    table.status === 'available'
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">Table {table.number}</p>
                      <p className="text-sm text-slate-600">Seats {table.capacity}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      table.status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {table.status === 'available' ? 'Available' : 'Reserved'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Quick Tips:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Select date and time first</li>
                <li>• Tables auto-filter by capacity</li>
                <li>• Confirm all details before booking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Receipt Modal Component
 * @component
 */
const ReceiptModal = ({ order, bill, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Dynamic import to reduce initial bundle size
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Restaurant Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Restaurant Name', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('123 Main Street, City, State 12345', 105, 27, { align: 'center' });
      doc.text('Phone: (123) 456-7890', 105, 32, { align: 'center' });
      
      // Divider
      doc.setLineWidth(0.5);
      doc.line(20, 38, 190, 38);
      
      // Receipt Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIPT', 105, 48, { align: 'center' });
      
      // Order Information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yPos = 58;
      
      doc.text(`Order #: ${order.id}`, 20, yPos);
      doc.text(`Date: ${new Date(bill.created_at).toLocaleString()}`, 20, yPos + 6);
      doc.text(`Customer: ${order.customer_name || 'N/A'}`, 20, yPos + 12);
      if (order.table) {
        doc.text(`Table: ${order.table.table_number}`, 20, yPos + 18);
      }
      
      yPos += 28;
      
      // Divider
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      
      // Items Header
      doc.setFont('helvetica', 'bold');
      doc.text('Item', 20, yPos);
      doc.text('Qty', 130, yPos, { align: 'right' });
      doc.text('Price', 160, yPos, { align: 'right' });
      doc.text('Total', 190, yPos, { align: 'right' });
      
      yPos += 6;
      doc.line(20, yPos, 190, yPos);
      yPos += 6;
      
      // Order Items
      doc.setFont('helvetica', 'normal');
      order.order_items?.forEach((item) => {
        const itemTotal = (item.quantity * item.price).toFixed(2);
        doc.text(item.menu_item?.name || 'Unknown Item', 20, yPos);
        doc.text(item.quantity.toString(), 130, yPos, { align: 'right' });
        doc.text(`$${item.price.toFixed(2)}`, 160, yPos, { align: 'right' });
        doc.text(`$${itemTotal}`, 190, yPos, { align: 'right' });
        yPos += 6;
      });
      
      yPos += 4;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      
      // Bill Summary
      doc.text('Subtotal:', 130, yPos);
      doc.text(`$${bill.subtotal?.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 6;
      
      doc.text(`Tax (${bill.tax_percentage}%):`, 130, yPos);
      doc.text(`$${bill.tax?.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 6;
      
      if (bill.discount > 0) {
        doc.text('Discount:', 130, yPos);
        doc.text(`-$${bill.discount?.toFixed(2)}`, 190, yPos, { align: 'right' });
        yPos += 6;
      }
      
      // Total
      doc.setLineWidth(0.8);
      doc.line(130, yPos, 190, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', 130, yPos);
      doc.text(`$${bill.total?.toFixed(2)}`, 190, yPos, { align: 'right' });
      
      yPos += 8;
      doc.setLineWidth(0.8);
      doc.line(130, yPos, 190, yPos);
      yPos += 10;
      
      // Payment Information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment Method: ${bill.payment_method?.toUpperCase() || 'N/A'}`, 20, yPos);
      yPos += 6;
      doc.text(`Payment Status: ${bill.payment_status?.toUpperCase()}`, 20, yPos);
      if (bill.paid_at) {
        yPos += 6;
        doc.text(`Paid At: ${new Date(bill.paid_at).toLocaleString()}`, 20, yPos);
      }
      
      // Footer
      yPos += 20;
      doc.setFontSize(10);
      doc.text('Thank you for dining with us!', 105, yPos, { align: 'center' });
      yPos += 6;
      doc.setFontSize(8);
      doc.text('Please visit us again', 105, yPos, { align: 'center' });
      
      // Save PDF
      doc.save(`receipt-order-${order.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!order || !bill) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 print:border-none">
          <h2 className="text-2xl font-bold text-slate-800">Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors print:hidden"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-8 print:p-0">
          {/* Restaurant Info */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Restaurant Name</h1>
            <p className="text-slate-600">123 Main Street, City, State 12345</p>
            <p className="text-slate-600">Phone: (123) 456-7890</p>
          </div>

          <div className="border-t-2 border-slate-200 my-6"></div>

          {/* Receipt Title */}
          <h2 className="text-2xl font-bold text-center mb-6">RECEIPT</h2>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-slate-600">Order #:</p>
              <p className="font-semibold text-slate-800">#{order.id}</p>
            </div>
            <div>
              <p className="text-slate-600">Date:</p>
              <p className="font-semibold text-slate-800">
                {new Date(bill.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-600">Customer:</p>
              <p className="font-semibold text-slate-800">{order.customer_name || 'N/A'}</p>
            </div>
            {order.table && (
              <div>
                <p className="text-slate-600">Table:</p>
                <p className="font-semibold text-slate-800">Table {order.table.table_number}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 my-6"></div>

          {/* Order Items */}
          <div className="mb-6">
            <table className="w-full">
              <thead className="border-b-2 border-slate-300">
                <tr>
                  <th className="text-left py-2 text-slate-700 font-semibold">Item</th>
                  <th className="text-center py-2 text-slate-700 font-semibold">Qty</th>
                  <th className="text-right py-2 text-slate-700 font-semibold">Price</th>
                  <th className="text-right py-2 text-slate-700 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 text-slate-800">{item.menu_item?.name || 'Unknown Item'}</td>
                    <td className="py-3 text-center text-slate-800">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-800">${item.price.toFixed(2)}</td>
                    <td className="py-3 text-right text-slate-800 font-semibold">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 my-6"></div>

          {/* Bill Summary */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal:</span>
              <span>${bill.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Tax ({bill.tax_percentage}%):</span>
              <span>${bill.tax?.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-${bill.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t-2 border-slate-300 pt-3 flex justify-between text-xl font-bold text-slate-800">
              <span>TOTAL:</span>
              <span>${bill.total?.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t-2 border-slate-300 pt-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Payment Method:</p>
                <p className="font-semibold text-slate-800 capitalize">
                  {bill.payment_method || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Payment Status:</p>
                <p className="font-semibold text-green-600 capitalize">
                  {bill.payment_status}
                </p>
              </div>
              {bill.paid_at && (
                <div className="col-span-2">
                  <p className="text-slate-600">Paid At:</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(bill.paid_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-slate-200">
            <p className="text-lg font-semibold text-slate-800 mb-2">
              Thank you for dining with us!
            </p>
            <p className="text-slate-600 text-sm">Please visit us again</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 border-t border-slate-200 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Receipt size={20} />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Receipt size={20} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Payment Modal Component
 * @component
 */
const PaymentModal = ({ order, bill, onClose, onPaymentSuccess }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const { addToast } = useWebSocket();

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: DollarSign, color: 'green' },
    { value: 'card', label: 'Card', icon: CreditCard, color: 'blue' },
    { value: 'upi', label: 'UPI', icon: Receipt, color: 'purple' },
    { value: 'online', label: 'Online', icon: CreditCard, color: 'indigo' }
  ];

  const handleProcessPayment = async () => {
    setProcessing(true);
    try {
      await billingAPI.updatePayment(bill.id, {
        payment_method: selectedPaymentMethod,
        payment_status: 'paid'
      });
      
      addToast({
        type: 'success',
        message: `✅ Payment processed successfully via ${selectedPaymentMethod.toUpperCase()}!`
      });
      
      onPaymentSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      addToast({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to process payment'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!order || !bill) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Process Payment</h2>
            <p className="text-sm text-slate-600">Order #{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Customer:</span>
                <span className="font-medium text-slate-800">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Table:</span>
                <span className="font-medium text-slate-800">
                  {order.table ? `Table ${order.table.table_number}` : 'Takeaway'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Items:</span>
                <span className="font-medium text-slate-800">{order.order_items?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Bill Breakdown */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Bill Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span>${bill.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Tax ({bill.tax_percentage}%):</span>
                <span>${bill.tax?.toFixed(2)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${bill.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-slate-300">
                <span>Total:</span>
                <span>${bill.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setSelectedPaymentMethod(method.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === method.value
                      ? `border-${method.color}-500 bg-${method.color}-50`
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <method.icon className={`mx-auto mb-2 ${
                    selectedPaymentMethod === method.value ? `text-${method.color}-600` : 'text-slate-400'
                  }`} size={32} />
                  <p className={`text-sm font-medium ${
                    selectedPaymentMethod === method.value ? `text-${method.color}-700` : 'text-slate-600'
                  }`}>
                    {method.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Orders Page
 * @component
 */
const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const { subscribe, unsubscribe, addToast } = useWebSocket();

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Use the general orders API to get all orders
      const data = await ordersAPI.getAll();
      console.log('Fetched orders:', data);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    // Listen for new orders
    const handleNewOrder = (data) => {
      console.log('New order via WebSocket:', data);
      fetchOrders(); // Refresh orders list
    };

    // Listen for order ready events
    const handleOrderReady = (data) => {
      console.log('Order ready via WebSocket:', data);
      fetchOrders();
      
      // Show notification to staff
      addToast({
        type: 'success',
        message: `🍽️ Order #${data.id} for Table ${data.table_number} is ready to serve!`,
      });
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    };

    // Listen for order status changes
    const handleOrderStatusChange = (data) => {
      console.log('Order status changed via WebSocket:', data);
      fetchOrders();
    };

    // Listen for table updates
    const handleTableUpdate = (data) => {
      console.log('Table updated via WebSocket:', data);
    };

    subscribe('new_order', handleNewOrder);
    subscribe('order_ready', handleOrderReady);
    subscribe('order_status_changed', handleOrderStatusChange);
    subscribe('table_updated', handleTableUpdate);

    return () => {
      unsubscribe('new_order', handleNewOrder);
      unsubscribe('order_ready', handleOrderReady);
      unsubscribe('order_status_changed', handleOrderStatusChange);
      unsubscribe('table_updated', handleTableUpdate);
    };
  }, [subscribe, unsubscribe]);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id?.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Orders Management</h1>
        <p className="text-slate-600">Track and manage all active orders</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-600 text-lg font-medium">No orders found</p>
            <p className="text-slate-500 text-sm mt-2">
              {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Orders will appear here once created'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Order #</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Customer</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Table</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Items</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Status</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Total</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Bill Status</th>
                <th className="text-left px-6 py-4 text-slate-700 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    order.status === 'ready' ? 'bg-green-50 animate-pulse-subtle' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-slate-800 font-medium">#{order.id}</td>
                  <td className="px-6 py-4 text-slate-700">{order.customer_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {order.table ? `Table ${order.table.table_number}` : 'Takeaway'}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{order.order_items?.length || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'ready' ? 'bg-green-100 text-green-700 ring-2 ring-green-300' :
                      order.status === 'served' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status === 'ready' && '🔔 '}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-semibold">${order.total_amount?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {order.bill ? (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        order.bill.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.bill.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                        order.bill.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.bill.payment_status}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">No bill</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {order.status === 'ready' && (
                        <button
                          onClick={async () => {
                            try {
                              await ordersAPI.updateStatus(order.id, 'served');
                              fetchOrders();
                              addToast({
                                type: 'success',
                                message: `Order #${order.id} marked as served! Bill generated.`
                              });
                            } catch (error) {
                              console.error('Error updating order:', error);
                              addToast({
                                type: 'error',
                                message: 'Failed to update order status'
                              });
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Serve
                        </button>
                      )}
                      {order.status === 'served' && order.bill && order.bill.payment_status === 'pending' && (
                        <button
                          onClick={() => setPaymentModalOrder(order)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <DollarSign size={16} />
                          Process Payment
                        </button>
                      )}
                      {order.bill && order.bill.payment_status === 'paid' && (
                        <button
                          onClick={() => setReceiptModalOrder(order)}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Receipt size={16} />
                          View Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModalOrder && (
          <PaymentModal
            order={paymentModalOrder}
            bill={paymentModalOrder.bill}
            onClose={() => setPaymentModalOrder(null)}
            onPaymentSuccess={fetchOrders}
          />
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receiptModalOrder && (
          <ReceiptModal
            order={receiptModalOrder}
            bill={receiptModalOrder.bill}
            onClose={() => setReceiptModalOrder(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Tables Page
 * @component
 */
const TablesPage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleaningTimers, setCleaningTimers] = useState({});
  const { subscribe, unsubscribe, addToast } = useWebSocket();

  const fetchTables = async () => {
    setLoading(true);
    try {
      const data = await tablesAPI.getAll();
      setTables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // WebSocket listener for table updates
    const handleTableUpdate = (data) => {
      console.log('Table updated via WebSocket:', data);
      fetchTables();
      
      // Show notification for cleaning events
      if (data.notification_type === 'cleaning_required') {
        addToast({
          type: 'info',
          message: `🧹 ${data.message} - Cleaners notified!`
        });
      } else if (data.notification_type === 'cleaning_completed') {
        addToast({
          type: 'success',
          message: `✅ ${data.message}`
        });
      }
    };

    subscribe('table_updated', handleTableUpdate);

    return () => {
      unsubscribe('table_updated', handleTableUpdate);
    };
  }, [subscribe, unsubscribe, addToast]);

  // Auto-complete cleaning after 2 minutes
  useEffect(() => {
    const intervals = {};
    
    tables.forEach(table => {
      if (table.status === 'cleaning' && table.cleaning_started_at) {
        const cleaningStarted = new Date(table.cleaning_started_at);
        const twoMinutesLater = new Date(cleaningStarted.getTime() + 2 * 60 * 1000);
        const now = new Date();
        const timeRemaining = twoMinutesLater - now;

        if (timeRemaining > 0) {
          // Set timer to update countdown
          intervals[table.id] = setInterval(() => {
            const currentTime = new Date();
            const remaining = Math.max(0, twoMinutesLater - currentTime);
            
            setCleaningTimers(prev => ({
              ...prev,
              [table.id]: Math.ceil(remaining / 1000)
            }));

            // Auto-complete cleaning after 2 minutes
            if (remaining <= 0) {
              clearInterval(intervals[table.id]);
              completeTableCleaning(table.id);
            }
          }, 1000);
        } else {
          // Already past 2 minutes, complete immediately
          completeTableCleaning(table.id);
        }
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [tables]);

  const markTableForCleaning = async (tableId) => {
    try {
      await tablesAPI.markForCleaning(tableId);
      addToast({
        type: 'success',
        message: '🧹 Table marked for cleaning. Will be available in 2 minutes.'
      });
      fetchTables();
    } catch (error) {
      console.error('Error marking table for cleaning:', error);
      addToast({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to mark table for cleaning'
      });
    }
  };

  const completeTableCleaning = async (tableId) => {
    try {
      await tablesAPI.completeCleaning(tableId);
      fetchTables();
    } catch (error) {
      console.error('Error completing cleaning:', error);
    }
  };

  const handleTableClick = (tableId, tableStatus) => {
    // Only navigate for available tables
    if (tableStatus === 'available') {
      navigate('/staff/create-order', { state: { selectedTable: tableId } });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Table Management</h1>
        <p className="text-slate-600">Monitor table availability and manage cleaning</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Loading tables...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((table) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleTableClick(table.id, table.status)}
              className={`bg-white rounded-lg p-6 border-2 transition-all ${
                table.status === 'available' ? 'border-green-500 hover:border-green-600 cursor-pointer hover:scale-105 hover:shadow-lg' :
                table.status === 'occupied' ? 'border-blue-500' :
                table.status === 'cleaning' ? 'border-yellow-500 animate-pulse-subtle' :
                'border-orange-500'
              }`}
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800 mb-2">{table.table_number}</p>
                <p className="text-slate-600 mb-3">{table.capacity} seats</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize inline-block mb-3 ${
                  table.status === 'available' ? 'bg-green-100 text-green-700' :
                  table.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                  table.status === 'cleaning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {table.status === 'cleaning' && '🧹 '}
                  {table.status}
                </span>
                
                {/* Cleaning timer */}
                {table.status === 'cleaning' && cleaningTimers[table.id] > 0 && (
                  <div className="mt-2 text-sm font-semibold text-yellow-700">
                    ⏱️ {formatTime(cleaningTimers[table.id])}
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  {table.status === 'occupied' && (
                    <button
                      onClick={() => markTableForCleaning(table.id)}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      🧹 Mark for Cleaning
                    </button>
                  )}
                  {table.status === 'cleaning' && (
                    <button
                      onClick={() => completeTableCleaning(table.id)}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      ✅ Complete Cleaning
                    </button>
                  )}
                  {table.status === 'available' && (
                    <button
                      onClick={() => handleTableClick(table.id, table.status)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      + Create Order
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {tables.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No tables found
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Inventory Page
 * @component
 */
const InventoryPage = () => {
  const inventory = [
    { name: 'Salmon', category: 'Seafood', quantity: 15, unit: 'portions', status: 'good' },
    { name: 'Chicken Breast', category: 'Poultry', quantity: 25, unit: 'pieces', status: 'good' },
    { name: 'Fresh Basil', category: 'Herbs', quantity: 2, unit: 'bunches', status: 'low' },
    { name: 'Tomatoes', category: 'Vegetables', quantity: 30, unit: 'kg', status: 'good' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Inventory</h1>
        <p className="text-slate-600">Monitor stock levels and supplies</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Item</th>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Category</th>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Quantity</th>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-800 font-medium">{item.name}</td>
                <td className="px-6 py-4 text-slate-700">{item.category}</td>
                <td className="px-6 py-4 text-slate-700">{item.quantity} {item.unit}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'low' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

/**
 * Reservations Page
 * @component
 */
const ReservationsPage = () => {
  const reservations = [
    { id: 1, name: 'John Doe', guests: 4, time: '6:30 PM', status: 'confirmed' },
    { id: 2, name: 'Jane Smith', guests: 2, time: '7:00 PM', status: 'pending' },
    { id: 3, name: 'Bob Johnson', guests: 6, time: '8:00 PM', status: 'confirmed' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Reservations</h1>
        <p className="text-slate-600">Manage table reservations</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Guest Name</th>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Party Size</th>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Time</th>
              <th className="text-left px-6 py-4 text-slate-700 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-800 font-medium">{reservation.name}</td>
                <td className="px-6 py-4 text-slate-700">{reservation.guests} guests</td>
                <td className="px-6 py-4 text-slate-700">{reservation.time}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {reservation.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default StaffDashboard;
