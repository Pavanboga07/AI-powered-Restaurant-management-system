import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChefHat,
  CheckCircle,
  AlertTriangle,
  Bell,
  Flame,
  Users,
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useTranslation } from 'react-i18next';

/**
 * ChefKDS - Kitchen Display System for chefs
 * @component
 */
const ChefKDS = () => {
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef(null);
  const { subscribe, unsubscribe } = useWebSocket();
  const { t } = useTranslation();

  // Fetch active orders
  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersAPI.getAll({
        date_from: new Date().toISOString().split('T')[0],
      });
      
      // Filter for active orders only
      const activeOrders = data.filter(order =>
        ['confirmed', 'preparing', 'ready'].includes(order.status)
      );
      
      // Check for new orders (sound notification)
      if (activeOrders.length > lastOrderCount && lastOrderCount > 0) {
        playNotificationSound();
      }
      
      setOrders(activeOrders);
      setLastOrderCount(activeOrders.length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  }, [lastOrderCount]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    // Listen for new orders
    const handleNewOrder = (data) => {
      console.log('New order received via WebSocket:', data);
      playNotificationSound();
      fetchOrders(); // Refresh orders list
    };

    // Listen for order status changes
    const handleOrderStatusChange = (data) => {
      console.log('Order status changed via WebSocket:', data);
      fetchOrders(); // Refresh orders list
    };

    subscribe('new_order', handleNewOrder);
    subscribe('order_status_changed', handleOrderStatusChange);

    return () => {
      unsubscribe('new_order', handleNewOrder);
      unsubscribe('order_status_changed', handleOrderStatusChange);
    };
  }, [subscribe, unsubscribe, fetchOrders]);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  // Update order status
  const updateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Start cooking
  const startCooking = (orderId) => {
    updateStatus(orderId, 'preparing');
  };

  // Mark as ready
  const markReady = (orderId) => {
    updateStatus(orderId, 'ready');
  };

  // Calculate elapsed time
  const getElapsedTime = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - created) / 1000 / 60);
    
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get urgency level and color
  const getUrgencyStyle = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - created) / 1000 / 60);
    
    if (diffMinutes < 10) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-500',
        text: 'text-green-700',
        badge: 'bg-green-500',
        icon: <Clock className="text-green-600" size={24} />,
      };
    } else if (diffMinutes < 20) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-500',
        text: 'text-yellow-700',
        badge: 'bg-yellow-500',
        icon: <AlertTriangle className="text-yellow-600" size={24} />,
      };
    } else {
      return {
        bg: 'bg-red-50',
        border: 'border-red-500',
        text: 'text-red-700',
        badge: 'bg-red-500',
        icon: <Flame className="text-red-600" size={24} />,
      };
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500 text-white';
      case 'preparing':
        return 'bg-orange-500 text-white';
      case 'ready':
        return 'bg-green-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  // Sort orders by urgency (oldest first)
  const sortedOrders = [...orders].sort((a, b) =>
    new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 rounded-lg">
              <ChefHat size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('chef.title')}</h1>
              <p className="text-slate-400">{t('chef.activeOrders')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Active Orders Count */}
            <div className="bg-slate-800 rounded-lg px-6 py-3 flex items-center gap-3">
              <Bell size={24} className="text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-white">{orders.length}</div>
                <div className="text-xs text-slate-400">{t('dashboard.activeOrders')}</div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="bg-slate-800 rounded-lg px-6 py-3">
              <div className="text-xs text-slate-400">Auto-refresh</div>
              <div className="text-sm text-white font-medium">Every 10s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-12 text-center">
          <ChefHat size={64} className="mx-auto text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.activeOrders')}: 0</h2>
          <p className="text-slate-400">{t('notifications.allCaughtUp')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {sortedOrders.map((order) => {
              const urgency = getUrgencyStyle(order.created_at);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`${urgency.bg} ${urgency.border} border-4 rounded-xl p-6 shadow-xl`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-slate-800">
                        #{order.id}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusBadge(order.status)}`}>
                        {order.status.toUpperCase()}
                      </div>
                    </div>
                    {urgency.icon}
                  </div>

                  {/* Table & Time */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-slate-200">
                    <div className="flex items-center gap-2">
                      <Users size={20} className={urgency.text} />
                      <span className="text-xl font-bold text-slate-800">
                        Table {order.table?.table_number}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 text-xl font-bold ${urgency.text}`}>
                      <Clock size={20} />
                      <span>{getElapsedTime(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Customer */}
                  {order.customer_name && (
                    <div className="mb-4 text-lg text-slate-700">
                      <strong>{t('orders.customerName')}:</strong> {order.customer_name}
                    </div>
                  )}

                  {/* Items */}
                  <div className="mb-4 bg-white rounded-lg p-4">
                    <div className="text-sm font-bold text-slate-600 mb-3">{t('orders.orderItems').toUpperCase()}:</div>
                    <div className="space-y-3">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="pb-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-orange-600 min-w-[40px]">
                              {item.quantity}x
                            </div>
                            <div className="flex-1">
                              <div className="text-lg font-bold text-slate-800">
                                {item.menu_item?.name}
                              </div>
                              {item.special_instructions && (
                                <div className="mt-1 text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded">
                                  <strong>{t('orders.specialNotes')}:</strong> {item.special_instructions}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Notes */}
                  {order.special_notes && (
                    <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
                      <div className="text-sm font-bold text-yellow-900 mb-1">
                        ⚠️ {t('orders.specialNotes').toUpperCase()}:
                      </div>
                      <div className="text-sm text-yellow-800">{order.special_notes}</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => startCooking(order.id)}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Flame size={24} />
                        {t('chef.startCooking').toUpperCase()}
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => markReady(order.id)}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <CheckCircle size={24} />
                        {t('chef.markReady').toUpperCase()}
                      </button>
                    )}
                    
                    {order.status === 'ready' && (
                      <div className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg">
                        <CheckCircle size={24} />
                        {t('orders.status.ready').toUpperCase()} FOR PICKUP
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ChefKDS;
