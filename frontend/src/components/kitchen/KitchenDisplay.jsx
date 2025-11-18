import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, User, AlertCircle, CheckCircle, Play, Check, 
  ChevronRight, Timer, TrendingUp, Flame, RefreshCw
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const KitchenDisplay = ({ stationId = null }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(stationId);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // WebSocket for real-time updates
  const { socket, isConnected, lastMessage } = useWebSocket('kitchen', user);

  // Fetch active orders
  const fetchOrders = useCallback(async () => {
    try {
      const params = selectedStation ? `?station_id=${selectedStation}` : '';
      const response = await api.get(`/api/kds/orders/active${params}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [selectedStation]);

  // Fetch stations
  const fetchStations = async () => {
    try {
      const response = await api.get('/api/kds/stations');
      setStations(response.data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/kds/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchStations(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchOrders]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('🍳 KDS received WebSocket message:', lastMessage.type);

    switch (lastMessage.type) {
      case 'new_order':
      case 'order_status_changed':
      case 'order_item_updated':
      case 'order_bumped':
        // Refresh orders on any kitchen-related update
        fetchOrders();
        fetchStats();
        break;
      default:
        break;
    }
  }, [lastMessage, fetchOrders]);

  // Start item preparation
  const startItem = async (itemId) => {
    try {
      await api.post(`/api/kds/items/${itemId}/start`);
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error starting item:', error);
    }
  };

  // Complete item preparation
  const completeItem = async (itemId) => {
    try {
      await api.post(`/api/kds/items/${itemId}/complete`);
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error completing item:', error);
    }
  };

  // Bump entire order
  const bumpOrder = async (orderId) => {
    try {
      await api.post(`/api/kds/orders/${orderId}/bump`);
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error bumping order:', error);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      preparing: 'bg-blue-100 text-blue-800 border-blue-300',
      ready: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Calculate time since order created
  const getTimeSince = (timestamp) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Get priority indicator
  const getPriorityIcon = (priority) => {
    if (priority >= 5) return <Flame className="w-4 h-4 text-red-500" />;
    if (priority >= 3) return <TrendingUp className="w-4 h-4 text-orange-500" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Kitchen Display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Bar */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Kitchen Display System</h1>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Station Filter */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedStation || 'all'}
              onChange={(e) => setSelectedStation(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => { fetchOrders(); fetchStats(); }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-gray-400 text-sm">Active Orders</div>
              <div className="text-2xl font-bold">{stats.total_active_orders}</div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
              <div className="text-yellow-400 text-sm">Pending Items</div>
              <div className="text-2xl font-bold text-yellow-300">{stats.total_pending_items}</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
              <div className="text-blue-400 text-sm">Preparing</div>
              <div className="text-2xl font-bold text-blue-300">{stats.total_preparing_items}</div>
            </div>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <div className="text-green-400 text-sm">Ready</div>
              <div className="text-2xl font-bold text-green-300">{stats.total_ready_items}</div>
            </div>
          </div>
        )}
      </header>

      {/* Orders Grid */}
      <main className="p-6">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">All Caught Up!</h2>
            <p className="text-gray-500">No active orders in the kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => {
              const allReady = order.order_items.every(item => item.prep_status === 'ready');
              const timeSince = getTimeSince(order.created_at);
              const isUrgent = Date.now() - new Date(order.created_at) > 900000; // 15+ minutes

              return (
                <div
                  key={order.id}
                  className={`bg-gray-800 rounded-lg border-2 transition-all ${
                    allReady 
                      ? 'border-green-500 shadow-lg shadow-green-500/20' 
                      : isUrgent 
                      ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' 
                      : 'border-gray-700'
                  }`}
                >
                  {/* Order Header */}
                  <div className={`p-4 border-b border-gray-700 ${
                    allReady ? 'bg-green-900/20' : isUrgent ? 'bg-red-900/20' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl font-bold text-blue-400">
                          #{order.id}
                        </span>
                        {order.table_number && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                            Table {order.table_number}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={isUrgent ? 'text-red-400 font-bold' : 'text-gray-400'}>
                          {timeSince}
                        </span>
                      </div>
                    </div>
                    
                    {order.customer_name && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{order.customer_name}</span>
                      </div>
                    )}
                    
                    {order.special_notes && (
                      <div className="mt-2 flex items-start space-x-2 p-2 bg-yellow-900/20 border border-yellow-700 rounded text-sm">
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-yellow-300">{order.special_notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="p-4 space-y-3">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border-2 ${getStatusColor(item.prep_status)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {getPriorityIcon(item.priority)}
                              <span className="font-bold text-lg">
                                {item.quantity}x {item.menu_item_name}
                              </span>
                            </div>
                            {item.station_name && selectedStation === null && (
                              <span className="text-xs opacity-75">
                                {item.station_name}
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-1">
                            {item.prep_status === 'pending' && (
                              <button
                                onClick={() => startItem(item.id)}
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                title="Start"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {item.prep_status === 'preparing' && (
                              <button
                                onClick={() => completeItem(item.id)}
                                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                title="Complete"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {item.prep_status === 'ready' && (
                              <CheckCircle className="w-8 h-8 text-green-400" />
                            )}
                          </div>
                        </div>

                        {item.special_instructions && (
                          <div className="mt-2 text-sm opacity-90 italic">
                            "{item.special_instructions}"
                          </div>
                        )}

                        {item.prep_start_time && (
                          <div className="mt-2 flex items-center space-x-2 text-xs opacity-75">
                            <Timer className="w-3 h-3" />
                            <span>
                              {Math.floor((Date.now() - new Date(item.prep_start_time)) / 60000)}m
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bump Button */}
                  {allReady && (
                    <div className="p-4 border-t border-gray-700">
                      <button
                        onClick={() => bumpOrder(order.id)}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center justify-center space-x-2 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                        <span>BUMP ORDER</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;
