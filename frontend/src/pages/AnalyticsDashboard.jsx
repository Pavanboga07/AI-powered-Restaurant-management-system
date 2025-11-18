import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  DollarSign, Package, Users, ShoppingCart, Clock,
  BarChart3, PieChart, Activity, Zap
} from 'lucide-react';
import { mlAnalyticsAPI } from '../services/api';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await mlAnalyticsAPI.getAnalyticsOverview();
      setDashboardData(response);
      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[priority] || colors.low;
  };

  const getInsightIcon = (type) => {
    const icons = {
      warning: AlertTriangle,
      error: AlertTriangle,
      success: CheckCircle,
      info: Activity
    };
    const Icon = icons[type] || Activity;
    return <Icon className="w-5 h-5" />;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { insights, summary, details } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Analytics</h1>
        <p className="text-gray-600">Predictive insights and intelligent recommendations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Revenue Forecast (30d)</span>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{summary.forecasted_revenue_30d.toLocaleString()}
          </div>
          <div className="flex items-center mt-2 text-sm">
            {getTrendIcon(summary.revenue_trend)}
            <span className="ml-1 text-gray-600 capitalize">{summary.revenue_trend}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Items Need Reorder</span>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.items_need_reorder}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Out of {summary.inventory_items_forecasted} items
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">At-Risk Customers</span>
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.high_risk_customers}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            High churn risk
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Trending Items</span>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.trending_items}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Increasing demand
          </div>
        </div>
      </div>

      {/* Insights & Alerts */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Zap className="w-6 h-6 text-yellow-500 mr-2" />
          Key Insights & Recommendations
        </h2>
        <div className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-gray-600">No critical insights at this time. All systems running smoothly!</p>
          ) : (
            insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getPriorityColor(insight.priority)}`}
              >
                <div className="flex items-start">
                  <div className="mr-3">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{insight.message}</span>
                      <span className="text-xs uppercase font-bold">{insight.priority}</span>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{insight.action}</p>
                    {insight.items && (
                      <div className="text-sm opacity-80">
                        <strong>Items:</strong> {insight.items.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'inventory', 'demand', 'customers', 'revenue'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Revenue Forecast</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Forecasted (30 days)</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{details.revenue_forecast.forecasted_revenue?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(details.revenue_forecast.confidence * 100)?.toFixed(0) || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Peak Hours</h3>
                <div className="flex items-center space-x-4">
                  {details.peak_hours?.peak_hours?.map((hour) => (
                    <div key={hour} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                      {hour}:00
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Inventory Forecast</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Current Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Predicted Usage</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reorder Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trend</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(details.inventory_forecast).slice(0, 10).map(([id, item]) => (
                      <tr key={id}>
                        <td className="px-4 py-3 text-sm">{item.item_name}</td>
                        <td className="px-4 py-3 text-sm">{item.current_stock.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm">{item.predicted_usage.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={item.recommended_reorder > 0 ? 'text-orange-600 font-semibold' : 'text-gray-600'}>
                            {item.recommended_reorder.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center capitalize">
                            {getTrendIcon(item.trend)}
                            <span className="ml-1">{item.trend}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                            item.confidence > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Demand Tab */}
          {activeTab === 'demand' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Menu Item Demand Forecast</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(details.demand_forecast).slice(0, 8).map(([id, item]) => (
                  <div key={id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.item_name}</h4>
                      {getTrendIcon(item.trend)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Predicted Orders</p>
                        <p className="font-semibold text-blue-600">{item.predicted_orders.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Daily Avg</p>
                        <p className="font-semibold">{item.avg_daily_orders.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Peak hours: {item.peak_hours.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {details.customer_segments?.map((segment) => (
                    <div key={segment.segment} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{segment.segment}</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">Customers: <span className="font-semibold">{segment.customer_count}</span></p>
                        <p className="text-gray-600">Revenue: <span className="font-semibold">₹{segment.total_revenue?.toLocaleString()}</span></p>
                        <p className="text-gray-600">Avg Frequency: <span className="font-semibold">{segment.avg_frequency?.toFixed(1)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">High Churn Risk Customers</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Days Since Order</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Risk Score</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {details.top_churn_risks?.slice(0, 5).map((customer) => (
                        <tr key={customer.customer_id}>
                          <td className="px-4 py-3 text-sm">{customer.username}</td>
                          <td className="px-4 py-3 text-sm">{customer.days_since_last_order}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              customer.risk_level === 'High' ? 'bg-red-100 text-red-800' :
                              customer.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {(customer.churn_risk_score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{customer.total_orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">30-Day Revenue Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Forecasted Revenue</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{details.revenue_forecast.forecasted_revenue?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Daily Average</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{details.revenue_forecast.daily_avg_forecast?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Confidence Level</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {(details.revenue_forecast.confidence * 100)?.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Weekday Avg Revenue</p>
                      <p className="font-semibold">₹{details.revenue_forecast.weekday_avg_revenue?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Weekend Avg Revenue</p>
                      <p className="font-semibold">₹{details.revenue_forecast.weekend_avg_revenue?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchDashboardData}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
