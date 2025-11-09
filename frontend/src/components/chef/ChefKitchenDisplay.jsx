import React, { useState, useEffect, useRef } from 'react';
import { chefAPI } from '../../services/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { Clock, ChefHat, AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react';

const ChefKitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTable, setSearchTable] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useWebSocket();
  const audioRef = useRef(null);

  // Fetch active orders
  const fetchOrders = async () => {
    try {
      const data = await chefAPI.getActiveOrders();
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]); // Set empty array on error
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchOrders, 10000);

    // WebSocket listeners
    if (socket) {
      socket.on('new_order', (data) => {
        console.log('New order received:', data);
        fetchOrders();
        playNotification();
      });

      socket.on('order_status_changed', (data) => {
        console.log('Order status changed:', data);
        fetchOrders();
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('new_order');
        socket.off('order_status_changed');
      }
    };
  }, [socket]);

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await chefAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now - created) / 1000 / 60); // minutes
    return diff;
  };

  const getTimerColor = (minutes) => {
    if (minutes < 15) return 'text-green-500';
    if (minutes < 30) return 'text-yellow-500';
    return 'text-red-500 animate-pulse';
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (searchTable && !order.table?.table_number?.toString().includes(searchTable)) return false;
    return true;
  });

  const groupedOrders = {
    pending: filteredOrders.filter(o => o.status === 'pending'),
    preparing: filteredOrders.filter(o => o.status === 'preparing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
  };

  const OrderCard = ({ order }) => {
    const elapsed = getElapsedTime(order.created_at);
    const timerColor = getTimerColor(elapsed);
    
    const statusConfig = {
      pending: { bg: 'bg-blue-900/50', border: 'border-blue-500', icon: Clock },
      preparing: { bg: 'bg-orange-900/50', border: 'border-orange-500', icon: ChefHat },
      ready: { bg: 'bg-green-900/50', border: 'border-green-500', icon: CheckCircle2 },
    };

    const config = statusConfig[order.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`${config.bg} ${config.border} border-2 rounded-lg p-4 mb-4 backdrop-blur-sm`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <span className="text-3xl font-bold">Table {order.table?.table_number || 'N/A'}</span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timerColor}`}>
              {elapsed} min
            </div>
            <div className="text-xs text-slate-400">
              {new Date(order.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-2 mb-4">
          {order.order_items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-lg">
              <span className="font-medium">
                {item.quantity}x {item.menu_item?.name}
              </span>
              {item.special_instructions && (
                <span className="text-orange-300 text-sm">
                  *{item.special_instructions}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Special Notes */}
        {order.special_notes && (
          <div className="bg-orange-500/20 border border-orange-500 rounded p-2 mb-3">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            <span className="text-sm">{order.special_notes}</span>
          </div>
        )}

        {/* Customer Info */}
        {order.customer_name && (
          <div className="text-sm text-slate-400 mb-3">
            Customer: {order.customer_name}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <button
              onClick={() => handleStatusUpdate(order.id, 'preparing')}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded font-medium transition-colors"
            >
              <PlayCircle className="w-4 h-4 inline mr-2" />
              Start Cooking
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => handleStatusUpdate(order.id, 'ready')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Mark Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={() => handleStatusUpdate(order.id, 'served')}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded font-medium transition-colors"
            >
              Served
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <ChefHat className="w-10 h-10" />
          Kitchen Display System
        </h1>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-2">
            {['all', 'pending', 'preparing', 'ready'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  filter === status
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && ` (${groupedOrders[status]?.length || 0})`}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by table..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Order Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-2xl text-slate-400">No active orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-blue-400 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Pending ({groupedOrders.pending.length})
            </h2>
            <div>
              {groupedOrders.pending.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>

          {/* Preparing Column */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2">
              <ChefHat className="w-6 h-6" />
              Preparing ({groupedOrders.preparing.length})
            </h2>
            <div>
              {groupedOrders.preparing.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>

          {/* Ready Column */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              Ready ({groupedOrders.ready.length})
            </h2>
            <div>
              {groupedOrders.ready.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefKitchenDisplay;
