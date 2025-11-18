import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import NotificationBell from '../shared/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import Analytics from './tabs/Analytics';
import EnhancedAnalytics from './tabs/EnhancedAnalytics';
import AdvancedAnalytics from './tabs/AdvancedAnalytics';
import Reports from './tabs/Reports';
import MenuManager from './tabs/MenuManager';
import OrderManager from './tabs/OrderManager';
import TableManager from './tabs/TableManager';
import ReservationManager from './tabs/ReservationManager';
import BillingManager from './tabs/BillingManager';
import CouponManager from './tabs/CouponManager';
import ReviewManager from './tabs/ReviewManager';
import QRCodeGenerator from './tabs/QRCodeGenerator';
import EmployeeScheduling from './tabs/EmployeeScheduling';
import InventoryManager from './tabs/InventoryManager';
import EmailCampaignManager from './EmailCampaignManager';
import TabPlaceholder from './tabs/TabPlaceholder';
import {
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
  BarChart3
} from 'lucide-react';

/**
 * Manager Dashboard Component
 * Main dashboard with sidebar navigation and tab-based content
 * @component
 */
const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // WebSocket integration for real-time updates
  const { user } = useAuth();
  const { socket, isConnected, lastMessage } = useWebSocket('manager', user);
  const { addNotification } = useNotifications();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('📨 Manager Dashboard received message:', lastMessage.type);
      
      switch (lastMessage.type) {
        case 'new_order':
          addNotification({
            type: 'info',
            title: 'New Order Received',
            message: `Order #${lastMessage.data.order_id} has been placed`
          });
          // Trigger data refresh for order-related components
          break;
          
        case 'order_status_changed':
          addNotification({
            type: 'success',
            title: 'Order Status Updated',
            message: `Order #${lastMessage.data.order_id} is now ${lastMessage.data.new_status}`
          });
          break;
          
        case 'table_status_changed':
          addNotification({
            type: 'info',
            title: 'Table Status Changed',
            message: `Table ${lastMessage.data.table_number} is now ${lastMessage.data.new_status}`
          });
          break;
          
        case 'inventory_low':
          addNotification({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${lastMessage.data.inventory?.item_name || 'Item'} is running low (${lastMessage.data.inventory?.current_quantity || 0} ${lastMessage.data.inventory?.unit || 'units'} left)`
          });
          break;
          
        case 'reservation_update':
          addNotification({
            type: 'info',
            title: 'Reservation Updated',
            message: `Reservation #${lastMessage.data.reservation_id} has been updated`
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

  // Animation variants for page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      x: 50
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Menu className="text-white" size={24} />
                </button>
                <h1 className="text-xl font-bold text-white">Manager Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <div className="flex items-center gap-2 text-green-400 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="hidden sm:inline">Live</span>
                  </div>
                )}
                <NotificationBell />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <Routes>
                {/* Analytics Tab */}
                <Route
                  path="/"
                  element={
                    <motion.div
                      key="analytics"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Analytics />
                    </motion.div>
                  }
                />

                {/* Menu Tab */}
                <Route
                  path="/menu"
                  element={
                    <motion.div
                      key="menu"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <MenuManager />
                    </motion.div>
                  }
                />

                {/* Tables Tab */}
                <Route
                  path="/tables"
                  element={
                    <motion.div
                      key="tables"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <TableManager />
                    </motion.div>
                  }
                />

                {/* Orders Tab */}
                <Route
                  path="/orders"
                  element={
                    <motion.div
                      key="orders"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <OrderManager />
                    </motion.div>
                  }
                />

                {/* Billing Tab */}
                <Route
                  path="/billing"
                  element={
                    <motion.div
                      key="billing"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <BillingManager />
                    </motion.div>
                  }
                />

                {/* Inventory Tab */}
                <Route
                  path="/inventory"
                  element={
                    <motion.div
                      key="inventory"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <InventoryManager />
                    </motion.div>
                  }
                />

                {/* QR Code Generator Tab */}
                <Route
                  path="/qr-codes"
                  element={
                    <motion.div
                      key="qr-codes"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <QRCodeGenerator />
                    </motion.div>
                  }
                />

                {/* Reports Tab */}
                <Route
                  path="/reports"
                  element={
                    <motion.div
                      key="reports"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Reports />
                    </motion.div>
                  }
                />

                {/* Advanced Analytics Tab */}
                <Route
                  path="/advanced-analytics"
                  element={
                    <motion.div
                      key="advanced-analytics"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <AdvancedAnalytics />
                    </motion.div>
                  }
                />

                {/* Coupons Tab */}
                <Route
                  path="/coupons"
                  element={
                    <motion.div
                      key="coupons"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <CouponManager />
                    </motion.div>
                  }
                />

                {/* Reviews Tab */}
                <Route
                  path="/reviews"
                  element={
                    <motion.div
                      key="reviews"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <ReviewManager />
                    </motion.div>
                  }
                />

                {/* Reservations Tab */}
                <Route
                  path="/reservations"
                  element={
                    <motion.div
                      key="reservations"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <ReservationManager />
                    </motion.div>
                  }
                />

                {/* Employee Scheduling Tab */}
                <Route
                  path="/scheduling"
                  element={
                    <motion.div
                      key="scheduling"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <EmployeeScheduling />
                    </motion.div>
                  }
                />

                {/* Enhanced Analytics Route */}
                <Route
                  path="/enhanced-analytics"
                  element={
                    <motion.div
                      key="enhanced-analytics"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <EnhancedAnalytics />
                    </motion.div>
                  }
                />

                {/* Email Campaigns Route */}
                <Route
                  path="/campaigns"
                  element={
                    <motion.div
                      key="campaigns"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <EmailCampaignManager />
                    </motion.div>
                  }
                />

                {/* Catch all - redirect to analytics */}
                <Route path="*" element={<Navigate to="/manager" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
