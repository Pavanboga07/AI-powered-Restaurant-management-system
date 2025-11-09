import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Clock, CheckCircle, Loader2, 
  ChefHat, Truck, Home, AlertCircle
} from 'lucide-react';
import { customerAPI } from '../../services/api';
import { useSearchParams } from 'react-router-dom';

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (orderId) {
      trackOrder();
    }
  }, [orderId]);

  useEffect(() => {
    if (!autoRefresh || !orderId) return;

    const interval = setInterval(() => {
      trackOrder(true); // Silent refresh
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, orderId]);

  const trackOrder = async (silent = false) => {
    if (!orderId) {
      setError('Please enter an order ID');
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await customerAPI.trackOrder(
        parseInt(orderId), 
        customerEmail || null
      );
      setOrderData(data);
    } catch (err) {
      console.error('Error tracking order:', err);
      setError(err.response?.data?.detail || 'Order not found. Please check your order ID.');
      setOrderData(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    trackOrder();
  };

  const getStatusStep = (status) => {
    const steps = {
      'pending': 0,
      'confirmed': 1,
      'preparing': 2,
      'ready': 3,
      'out_for_delivery': 4,
      'completed': 5,
    };
    return steps[status] || 0;
  };

  const orderStatuses = [
    { 
      key: 'pending', 
      label: 'Order Received', 
      icon: Package,
      description: 'Your order has been placed'
    },
    { 
      key: 'confirmed', 
      label: 'Confirmed', 
      icon: CheckCircle,
      description: 'Order confirmed by restaurant'
    },
    { 
      key: 'preparing', 
      label: 'Preparing', 
      icon: ChefHat,
      description: 'Chef is preparing your food'
    },
    { 
      key: 'ready', 
      label: 'Ready', 
      icon: Clock,
      description: 'Order is ready'
    },
    { 
      key: 'out_for_delivery', 
      label: 'Out for Delivery', 
      icon: Truck,
      description: 'On the way to you'
    },
    { 
      key: 'completed', 
      label: 'Delivered', 
      icon: Home,
      description: 'Order delivered successfully'
    },
  ];

  const currentStep = orderData ? getStatusStep(orderData.status) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Track Your Order</h1>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID *
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your order ID (e.g., 12345)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional - for guest orders)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Tracking...
                </>
              ) : (
                'Track Order'
              )}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        {orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Order Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Order #{orderData.order_id}
                  </h2>
                  <p className="text-gray-600">
                    Placed on {new Date(orderData.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${orderData.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Auto-refresh toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Auto-refresh every 10 seconds</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-8">Order Progress</h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ 
                      height: `${(currentStep / (orderStatuses.length - 1)) * 100}%` 
                    }}
                    transition={{ duration: 0.5 }}
                    className="bg-orange-500 w-full"
                  />
                </div>

                {/* Status Steps */}
                <div className="space-y-8">
                  {orderStatuses.map((status, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const Icon = status.icon;

                    return (
                      <motion.div
                        key={status.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-start gap-4"
                      >
                        {/* Icon */}
                        <div
                          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-400'
                          } ${
                            isCurrent ? 'ring-4 ring-orange-200 scale-110' : ''
                          }`}
                        >
                          {isCurrent && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              className="absolute inset-0 border-2 border-orange-300 border-t-transparent rounded-full"
                            />
                          )}
                          <Icon className="w-7 h-7" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-2">
                          <h4 className={`font-semibold text-lg ${
                            isCompleted ? 'text-gray-800' : 'text-gray-400'
                          }`}>
                            {status.label}
                          </h4>
                          <p className={`text-sm ${
                            isCompleted ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {status.description}
                          </p>
                          {isCurrent && orderData.estimated_time && (
                            <div className="mt-2 inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                              <Clock className="w-4 h-4" />
                              Est. {orderData.estimated_time} minutes
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Order Items</h3>
              
              <div className="space-y-3">
                {orderData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-red-200 rounded-lg flex items-center justify-center">
                        <span>🍽️</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.menu_item?.name || 'Item'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Delivery Information</h3>
              
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Name:</span> {orderData.customer_name}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!orderData && !loading && !error && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Track Your Order
            </h3>
            <p className="text-gray-500">
              Enter your order ID above to track your order in real-time
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
