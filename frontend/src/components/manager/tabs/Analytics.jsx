import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Calendar, 
  Clock, ChefHat, Table2, TrendingDown, Award, Target,
  PieChart, Activity, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { analyticsAPI, billingAPI } from '../../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

/**
 * Analytics Tab Component with Advanced Analytics
 * @component
 */
const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [ordersByHour, setOrdersByHour] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [tableUtilization, setTableUtilization] = useState([]);
  const [customerInsights, setCustomerInsights] = useState(null);
  const [revenueForecast, setRevenueForecast] = useState([]);
  const [peakHours, setPeakHours] = useState(null);
  const [menuPerformance, setMenuPerformance] = useState([]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'];

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();
    
    switch(dateRange) {
      case 'today':
        start = new Date();
        break;
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return {
      date_from: start.toISOString(),
      date_to: end.toISOString()
    };
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, [dateRange]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRange();
      
      // Fetch all analytics data in parallel with individual error handling
      const results = await Promise.allSettled([
        analyticsAPI.getDashboardStats(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getRevenueTrend('daily', dateParams.date_from, dateParams.date_to),
        analyticsAPI.getPopularItems(dateParams.date_from, dateParams.date_to, 10),
        analyticsAPI.getCategoryPerformance(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getOrdersByHour(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getStaffPerformance(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getTableUtilization(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getCustomerInsights(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getRevenueForecast(7),
        analyticsAPI.getPeakHoursDetailed(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getMenuPerformance(dateParams.date_from, dateParams.date_to)
      ]);

      // Extract successful results, use empty defaults for failed ones
      const [
        dashboardData,
        trendData,
        itemsData,
        categoryData,
        hourlyData,
        staffData,
        tableData,
        customerData,
        forecastData,
        peakData,
        menuData
      ] = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn(`Analytics API call ${index} failed:`, result.reason);
          return null;
        }
      });

      if (dashboardData) setStats(dashboardData);
      if (trendData) setRevenueTrend(trendData.data || []);
      if (itemsData) setPopularItems(itemsData.items || []);
      if (categoryData) setCategoryPerformance(categoryData.categories || []);
      if (hourlyData) setOrdersByHour(hourlyData.data || []);
      if (staffData) setStaffPerformance(staffData.staff || []);
      if (tableData) setTableUtilization(tableData.tables || []);
      if (customerData) setCustomerInsights(customerData);
      if (forecastData) setRevenueForecast(forecastData.forecast || []);
      if (peakData) setPeakHours(peakData);
      if (menuData) setMenuPerformance(menuData.items || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, change, positive }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6 hover:border-primary-500/50 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-500/20 rounded-lg">
          <Icon className="text-primary-500" size={24} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            positive ? 'text-green-500' : 'text-red-500'
          }`}>
            {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats?.total_revenue?.toFixed(2) || '0.00'}`}
          change={stats?.revenue_change_percent}
          positive={stats?.revenue_change_percent >= 0}
        />
        <StatCard 
          icon={Users}
          label="Total Orders"
          value={stats?.total_orders || 0}
          change={stats?.orders_change_percent}
          positive={stats?.orders_change_percent >= 0}
        />
        <StatCard 
          icon={TrendingUp}
          label="Average Order Value"
          value={`$${stats?.average_order_value?.toFixed(2) || '0.00'}`}
        />
        <StatCard 
          icon={Award}
          label="Top Item"
          value={stats?.top_selling_item || 'N/A'}
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueTrend}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularItems.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="total_quantity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Category Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={categoryPerformance}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage_of_total }) => `${category}: ${percentage_of_total}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_revenue"
              >
                {categoryPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Hour */}
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="order_count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Forecast */}
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">7-Day Revenue Forecast</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueForecast}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="forecasted_revenue" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorForecast)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderStaffPerformance = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white">Staff Performance</h3>
      
      {/* Staff Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffPerformance.map((staff, index) => (
          <motion.div
            key={staff.staff_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-500/20 rounded-lg">
                <ChefHat className="text-primary-500" size={24} />
              </div>
              <div>
                <h4 className="text-white font-semibold">{staff.staff_name}</h4>
                <p className="text-slate-400 text-sm">Staff Member</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Orders Handled:</span>
                <span className="text-white font-semibold">{staff.total_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Revenue:</span>
                <span className="text-white font-semibold">${staff.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Service Time:</span>
                <span className="text-white font-semibold">{staff.avg_service_time.toFixed(1)}m</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Staff Performance Chart */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h4 className="text-xl font-bold text-white mb-6">Orders Comparison</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={staffPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="staff_name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="total_orders" fill="#3b82f6" name="Total Orders" radius={[8, 8, 0, 0]} />
            <Bar dataKey="total_revenue" fill="#10b981" name="Revenue ($)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTableAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white">Table Utilization</h3>
      
      {/* Table Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tableUtilization.slice(0, 8).map((table, index) => (
          <motion.div
            key={table.table_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Table2 className="text-primary-500" size={20} />
                <span className="text-white font-semibold">Table {table.table_number}</span>
              </div>
              <span className="text-slate-400 text-sm">Cap: {table.capacity}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Orders:</span>
                <span className="text-white">{table.total_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Revenue:</span>
                <span className="text-white">${table.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Utilization:</span>
                <span className="text-primary-500 font-semibold">{table.utilization_rate.toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Performance Chart */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h4 className="text-xl font-bold text-white mb-6">Revenue by Table</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={tableUtilization}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="table_number" stroke="#94a3b8" label={{ value: 'Table Number', position: 'insideBottom', offset: -5 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="total_revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderCustomerInsights = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white">Customer Insights</h3>
      
      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users}
          label="Total Customers"
          value={customerInsights?.total_customers || 0}
        />
        <StatCard 
          icon={TrendingUp}
          label="Repeat Customers"
          value={customerInsights?.repeat_customers || 0}
        />
        <StatCard 
          icon={Target}
          label="Retention Rate"
          value={`${customerInsights?.retention_rate?.toFixed(1) || 0}%`}
        />
        <StatCard 
          icon={Activity}
          label="Avg Orders/Customer"
          value={customerInsights?.avg_orders_per_customer?.toFixed(1) || 0}
        />
      </div>

      {/* Top Customers */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h4 className="text-xl font-bold text-white mb-6">Top Customers</h4>
        <div className="space-y-3">
          {customerInsights?.top_customers?.map((customer, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-500 font-bold">{index + 1}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{customer.customer_name}</p>
                  <p className="text-slate-400 text-sm">{customer.total_orders} orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">${customer.total_spent.toFixed(2)}</p>
                <p className="text-slate-400 text-sm">Total Spent</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMenuAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white">Menu Performance</h3>
      
      {/* Top Performers */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h4 className="text-xl font-bold text-white mb-6">Best Performing Items</h4>
        <div className="space-y-3">
          {menuPerformance.slice(0, 10).map((item, index) => (
            <div 
              key={item.item_id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-500 font-bold">{index + 1}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{item.name}</p>
                  <p className="text-slate-400 text-sm">{item.category} • ${item.price}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">${item.total_revenue.toFixed(2)}</p>
                <p className="text-slate-400 text-sm">{item.total_sold} sold ({item.revenue_percentage}%)</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Performance Chart */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h4 className="text-xl font-bold text-white mb-6">Revenue Distribution</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={menuPerformance.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={150} />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="total_revenue" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h2>
          <p className="text-slate-400">Comprehensive insights into your restaurant's performance</p>
        </div>

        {/* Date Range Selector & Refresh */}
        <div className="flex gap-2 items-center">
          {/* Refresh Button */}
          <button
            onClick={() => fetchAllAnalytics()}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              loading
                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            }`}
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {['today', '7days', '30days', '90days'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-slate-400 hover:bg-white/20'
              }`}
            >
              {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'staff', label: 'Staff Performance', icon: ChefHat },
          { id: 'tables', label: 'Table Analytics', icon: Table2 },
          { id: 'customers', label: 'Customer Insights', icon: Users },
          { id: 'menu', label: 'Menu Performance', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-slate-400 hover:bg-white/20'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'staff' && renderStaffPerformance()}
          {activeTab === 'tables' && renderTableAnalytics()}
          {activeTab === 'customers' && renderCustomerInsights()}
          {activeTab === 'menu' && renderMenuAnalytics()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Analytics;
