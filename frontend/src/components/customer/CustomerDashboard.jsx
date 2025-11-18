import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  MapPin, 
  User, 
  Heart,
  Plus,
  Minus,
  X,
  Trash2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import NotificationBell from '../shared/NotificationBell';

// Import Phase 3 Components
import MenuBrowsing from './MenuBrowsing';
import OnlineOrdering from './OnlineOrdering';
import OrderTracking from './OrderTracking';
import CustomerProfile from './CustomerProfile';
import Favorites from './Favorites';

/**
 * Customer Dashboard - Phase 3: Complete customer portal
 * Features: Menu browsing, online ordering, order tracking, favorites, profile
 * @component
 */
const CustomerDashboard = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // WebSocket integration for real-time order updates
  const { socket, isConnected, lastMessage } = useWebSocket('customer', user);
  const { addNotification } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle incoming WebSocket messages for customer
  useEffect(() => {
    if (lastMessage) {
      console.log('🛍️ Customer Dashboard received message:', lastMessage.type);
      
      switch (lastMessage.type) {
        case 'order_status_changed':
          addNotification({
            type: 'success',
            title: 'Order Status Update',
            message: `Your order #${lastMessage.data.order_id} is now ${lastMessage.data.new_status}`
          });
          break;
          
        case 'reservation_update':
          addNotification({
            type: 'info',
            title: 'Reservation Update',
            message: `Your reservation #${lastMessage.data.reservation_id} has been updated`
          });
          break;
          
        case 'custom_notification':
          addNotification({
            type: 'info',
            title: lastMessage.data.title || 'Notification',
            message: lastMessage.data.message || 'You have a new notification'
          });
          break;
          
        default:
          console.log('Unhandled message type:', lastMessage.type);
      }
    }
  }, [lastMessage, addNotification]);

  const handleAddToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id);
    
    if (existingItem) {
      // Update quantity if delta provided, otherwise increment by 1
      const delta = item.quantity || 1;
      setCart(cart.map(i => 
        i.id === item.id 
          ? { ...i, quantity: Math.max(0, i.quantity + delta) } 
          : i
      ).filter(i => i.quantity > 0));
    } else {
      // Add new item with quantity
      setCart([...cart, { ...item, quantity: item.quantity || 1 }]);
    }
    
    if (item.quantity > 0) {
      setIsCartOpen(true);
    }
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(i => i.id !== itemId));
    } else {
      setCart(cart.map(i => 
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">
      {/* Header/Navbar */}
      <header className="bg-white border-b border-orange-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <UtensilsCrossed className="text-white" size={20} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Restaurant Name
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm">Delicious food, delivered fresh</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
              <NavLink
                to="/customer"
                end
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`
                }
              >
                Menu
              </NavLink>
              <NavLink
                to="/customer/favorites"
                className={({ isActive }) =>
                  `font-medium transition-colors flex items-center gap-1 ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`
                }
              >
                <Heart className="w-4 h-4" />
                Favorites
              </NavLink>
              <NavLink
                to="/customer/track"
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`
                }
              >
                Track Order
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`
                }
              >
                Profile
              </NavLink>
              <NavLink
                to="/loyalty"
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'}`
                }
              >
                Loyalty
              </NavLink>
            </nav>

            {/* User Info & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isConnected && (
                <div className="hidden sm:flex items-center gap-2 text-green-600 text-xs">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
              <NotificationBell />
              {user && (
                <div className="hidden md:flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 sm:py-2 bg-slate-100 rounded-lg">
                  <User size={14} className="text-slate-600" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700 truncate max-w-[100px]">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="ml-1 sm:ml-2 p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <ShoppingCart size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white text-xs w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full font-bold">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex lg:hidden items-center gap-3 mt-3 overflow-x-auto pb-2">
            <NavLink
              to="/customer"
              end
              className={({ isActive }) =>
                `font-medium transition-colors whitespace-nowrap text-sm px-3 py-1 rounded-full ${isActive ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-orange-600'}`
              }
            >
              Menu
            </NavLink>
            <NavLink
              to="/customer/favorites"
              className={({ isActive }) =>
                `font-medium transition-colors flex items-center gap-1 whitespace-nowrap text-sm px-3 py-1 rounded-full ${isActive ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-orange-600'}`
              }
            >
              <Heart className="w-3 h-3" />
              Favorites
            </NavLink>
            <NavLink
              to="/customer/track"
              className={({ isActive }) =>
                `font-medium transition-colors whitespace-nowrap text-sm px-3 py-1 rounded-full ${isActive ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-orange-600'}`
              }
            >
              Track
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `font-medium transition-colors whitespace-nowrap text-sm px-3 py-1 rounded-full ${isActive ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-orange-600'}`
              }
            >
              Profile
            </NavLink>
            <NavLink
              to="/loyalty"
              className={({ isActive }) =>
                `font-medium transition-colors whitespace-nowrap text-sm px-3 py-1 rounded-full ${isActive ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-orange-600'}`
              }
            >
              Loyalty
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route 
              path="/" 
              element={<MenuBrowsing onAddToCart={handleAddToCart} cart={cart} />} 
            />
            <Route 
              path="/order" 
              element={
                <OnlineOrdering 
                  cart={cart} 
                  onUpdateCart={updateCartQuantity}
                  onClearCart={clearCart}
                />
              } 
            />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route 
              path="/favorites" 
              element={<Favorites onAddToCart={handleAddToCart} cart={cart} />} 
            />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Cart Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Cart Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">Your Cart</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-slate-600" />
                  </button>
                </div>
                <p className="text-slate-600 text-sm mt-1">{cartItemCount} items</p>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="mx-auto text-slate-300 mb-4" size={64} />
                    <p className="text-slate-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{item.name}</h3>
                            <p className="text-orange-600 font-bold">${item.price.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => updateCartQuantity(item.id, 0)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold text-slate-800 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-600">Total</span>
                    <span className="text-2xl font-bold text-slate-800">${cartTotal.toFixed(2)}</span>
                  </div>
                  <a
                    href="/customer/order"
                    className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-shadow text-center"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Proceed to Checkout
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDashboard;
