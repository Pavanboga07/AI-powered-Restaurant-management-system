import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';
import {
  BarChart3,
  UtensilsCrossed,
  LayoutGrid,
  ShoppingCart,
  Receipt,
  QrCode,
  FileText,
  TrendingUp,
  Ticket,
  Star,
  Calendar,
  Users,
  Package,
  Mail,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Sidebar Navigation Component
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Sidebar open state
 * @param {Function} props.toggleSidebar - Function to toggle sidebar
 */
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor connection status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { path: '/manager', icon: BarChart3, label: 'Analytics', exact: true },
    { path: '/manager/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/manager/tables', icon: LayoutGrid, label: 'Tables' },
    { path: '/manager/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/manager/billing', icon: Receipt, label: 'Billing' },
    { path: '/manager/inventory', icon: Package, label: 'Inventory' },
    { path: '/manager/campaigns', icon: Mail, label: 'Campaigns' },
    { path: '/manager/qr-codes', icon: QrCode, label: 'QR Codes' },
    { path: '/manager/reports', icon: FileText, label: 'Reports' },
    { path: '/manager/advanced-analytics', icon: TrendingUp, label: 'Advanced Analytics' },
    { path: '/manager/coupons', icon: Ticket, label: 'Coupons' },
    { path: '/manager/reviews', icon: Star, label: 'Reviews' },
    { path: '/manager/reservations', icon: Calendar, label: 'Reservations' },
    { path: '/manager/scheduling', icon: Users, label: 'Scheduling' }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        className="fixed left-0 top-0 h-screen w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 z-50 lg:relative lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                🍽️ <span className="text-primary-500">RestaurantOS</span>
              </h1>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-slate-700">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">
                  {user?.full_name || user?.username || 'Manager'}
                </p>
                <p className="text-slate-400 text-sm capitalize truncate">
                  {user?.role || 'manager'}
                </p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              {isOnline ? (
                <>
                  <Wifi size={14} className="text-green-500" />
                  <span className="text-green-500">Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-red-500" />
                  <span className="text-red-500">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={`transition-transform ${
                          isActive ? 'scale-110' : 'group-hover:scale-110'
                        }`}
                      />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="ml-auto w-2 h-2 rounded-full bg-white"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 border border-transparent transition-all duration-200 group"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
