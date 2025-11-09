import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Plus,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  ChevronRight,
  Calendar,
  DollarSign,
  Users,
} from 'lucide-react';
import { ordersAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * OrderManager - Kanban board for order management
 * @component
 */
const OrderManager = () => {
  const navigate = useNavigate();
  
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [draggedOrder, setDraggedOrder] = useState(null);

  // Order statuses for Kanban columns
  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
    { value: 'preparing', label: 'Preparing', color: 'bg-orange-500' },
    { value: 'ready', label: 'Ready', color: 'bg-green-500' },
    { value: 'served', label: 'Served', color: 'bg-purple-500' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-500' },
  ];

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterTable) params.table_id = filterTable;
      if (searchTerm) params.search = searchTerm;
      
      // Date filtering
      if (dateFilter === 'today') {
        params.date_from = new Date().toISOString().split('T')[0];
        params.date_to = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.date_from = weekAgo.toISOString().split('T')[0];
      }
      
      const data = await ordersAPI.getAll(params);
      setOrders(data);
    } catch (error) {
      showToast('Failed to fetch orders', 'error');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTable, searchTerm, dateFilter]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      showToast('Order status updated!', 'success');
      fetchOrders();
    } catch (error) {
      showToast('Failed to update order status', 'error');
      console.error('Error updating order:', error);
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await ordersAPI.cancel(orderId);
      showToast('Order cancelled successfully!', 'success');
      fetchOrders();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to cancel order', 'error');
      console.error('Error cancelling order:', error);
    }
  };

  // Calculate elapsed time
  const getElapsedTime = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - created) / 1000 / 60); // minutes
    
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  // Get time color based on urgency
  const getTimeColor = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - created) / 1000 / 60); // minutes
    
    if (diff < 15) return 'text-green-600';
    if (diff < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Drag and drop handlers
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedOrder || draggedOrder.status === newStatus) {
      setDraggedOrder(null);
      return;
    }
    
    await updateOrderStatus(draggedOrder.id, newStatus);
    setDraggedOrder(null);
  };

  // Group orders by status
  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  // Order card component
  const OrderCard = ({ order }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={(e) => handleDragStart(e, order)}
      className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500 cursor-move hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-slate-800">#{order.id}</span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
            Table {order.table?.table_number}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${getTimeColor(order.created_at)}`}>
          <Clock size={14} />
          <span>{getElapsedTime(order.created_at)}</span>
        </div>
      </div>

      {/* Customer */}
      {order.customer_name && (
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-600">
          <Users size={14} />
          <span>{order.customer_name}</span>
        </div>
      )}

      {/* Items */}
      <div className="mb-3">
        <div className="text-xs text-slate-500 mb-1">Items:</div>
        <div className="space-y-1">
          {order.order_items?.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {item.quantity}x {item.menu_item?.name}
              </span>
              <span className="text-slate-600 font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          {order.order_items?.length > 3 && (
            <div className="text-xs text-slate-400">
              +{order.order_items.length - 3} more items
            </div>
          )}
        </div>
      </div>

      {/* Special Notes */}
      {order.special_notes && (
        <div className="mb-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          <strong>Note:</strong> {order.special_notes}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-green-600 font-bold">
          <DollarSign size={16} />
          <span>${order.total_amount?.toFixed(2)}</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {order.status === 'pending' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'confirmed')}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Confirm
            </button>
          )}
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <button
              onClick={() => cancelOrder(order.id)}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          )}
          {order.status === 'confirmed' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
            >
              Start
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'ready')}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
            >
              Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'served')}
              className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
            >
              Serve
            </button>
          )}
          {order.status === 'served' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'completed')}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Order Management</h1>
            <p className="text-slate-600">Manage orders with drag-and-drop workflow</p>
          </div>
          <button
            onClick={() => navigate('/orders/new')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-md"
          >
            <Plus size={20} />
            New Order
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Table Filter */}
            <input
              type="number"
              placeholder="Filter by table..."
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full pb-4" style={{ minWidth: 'max-content' }}>
            {statuses.map((status) => {
              const statusOrders = getOrdersByStatus(status.value);
              
              return (
                <div
                  key={status.value}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status.value)}
                  className="flex-shrink-0 w-80"
                >
                  {/* Column Header */}
                  <div className={`${status.color} text-white px-4 py-3 rounded-t-lg flex items-center justify-between`}>
                    <span className="font-bold">{status.label}</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                      {statusOrders.length}
                    </span>
                  </div>

                  {/* Column Body */}
                  <div className="bg-slate-50 rounded-b-lg p-4 h-[calc(100%-56px)] overflow-y-auto space-y-3">
                    <AnimatePresence>
                      {statusOrders.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                          No orders
                        </div>
                      ) : (
                        statusOrders.map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
