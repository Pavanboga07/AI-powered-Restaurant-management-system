import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  AlertCircle,
  Search,
  Filter,
  X,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { menuAPI, tablesAPI, ordersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * PlaceOrderPage - Order placement interface
 * @component
 */
const PlaceOrderPage = () => {
  const navigate = useNavigate();
  
  // State
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const TAX_RATE = 0.08; // 8% tax

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tablesData, menuData] = await Promise.all([
          tablesAPI.getAll(),
          menuAPI.getAll({}),
        ]);
        setTables(tablesData.filter(t => t.status === 'available'));
        setMenuItems(menuData.filter(m => m.is_available));
      } catch (error) {
        showToast('Failed to load data', 'error');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(menuItems.map(item => item.category))];

  // Add to cart
  const addToCart = (menuItem) => {
    const existingItem = cart.find(item => item.menu_item_id === menuItem.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.menu_item_id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menu_item_id: menuItem.id,
        menu_item: menuItem,
        quantity: 1,
        special_instructions: '',
      }]);
    }
  };

  // Update quantity
  const updateQuantity = (menuItemId, delta) => {
    setCart(cart.map(item => {
      if (item.menu_item_id === menuItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Remove from cart
  const removeFromCart = (menuItemId) => {
    setCart(cart.filter(item => item.menu_item_id !== menuItemId));
  };

  // Update special instructions
  const updateInstructions = (menuItemId, instructions) => {
    setCart(cart.map(item =>
      item.menu_item_id === menuItemId
        ? { ...item, special_instructions: instructions }
        : item
    ));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Place order
  const placeOrder = async () => {
    // Validation
    if (!selectedTable) {
      showToast('Please select a table', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    try {
      setPlacing(true);
      
      const orderData = {
        table_id: selectedTable.id,
        customer_name: customerName || null,
        special_notes: specialNotes || null,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || null,
        })),
      };

      await ordersAPI.create(orderData);
      
      showToast('Order placed successfully!', 'success');
      
      // Reset form
      setSelectedTable(null);
      setCart([]);
      setCustomerName('');
      setSpecialNotes('');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate('/manager');
      }, 1500);
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to place order', 'error');
      console.error('Error placing order:', error);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Place New Order</h1>
            <p className="text-slate-600">Select table, add items, and place order</p>
          </div>
          <button
            onClick={() => navigate('/manager')}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Table Selection & Cart */}
          <div className="lg:col-span-1 space-y-6">
            {/* Table Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Select Table</h2>
              <div className="grid grid-cols-3 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTable?.id === table.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="text-lg font-bold text-slate-800">#{table.table_number}</div>
                    <div className="text-xs text-slate-600">Cap: {table.capacity}</div>
                  </button>
                ))}
              </div>
              {tables.length === 0 && (
                <p className="text-center text-slate-500 py-4">No available tables</p>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Customer Info (Optional)</h2>
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Cart Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart size={24} className="text-orange-500" />
                <h2 className="text-xl font-bold text-slate-800">Cart</h2>
                <span className="ml-auto bg-orange-500 text-white px-2 py-1 rounded-full text-sm">
                  {cart.length}
                </span>
              </div>

              {cart.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.menu_item_id} className="border-b border-slate-100 pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">{item.menu_item.name}</div>
                            <div className="text-sm text-slate-600">
                              ${item.menu_item.price.toFixed(2)} each
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.menu_item_id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.menu_item_id, -1)}
                              className="p-1 bg-slate-100 rounded hover:bg-slate-200"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.menu_item_id, 1)}
                              className="p-1 bg-slate-100 rounded hover:bg-slate-200"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="font-bold text-slate-800">
                            ${(item.menu_item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={item.special_instructions}
                          onChange={(e) => updateInstructions(item.menu_item_id, e.target.value)}
                          className="w-full mt-2 px-3 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Tax (8%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <textarea
                    placeholder="Special notes for this order..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
                    rows="2"
                  />

                  <button
                    onClick={placeOrder}
                    disabled={placing || !selectedTable}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    {placing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Receipt size={20} />
                        Place Order
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Menu Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Menu</h2>

              {/* Filters */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                        {item.diet_type && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.diet_type === 'Veg' ? 'bg-green-100 text-green-700' :
                            item.diet_type === 'Vegan' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.diet_type}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          ${item.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredMenuItems.length === 0 && (
                <p className="text-center text-slate-500 py-12">No menu items found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrderPage;
