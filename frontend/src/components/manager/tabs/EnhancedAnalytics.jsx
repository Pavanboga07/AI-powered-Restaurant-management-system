import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Award,
  Download,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { analyticsAPI } from '../../../services/api';
import { useTranslation } from 'react-i18next';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const EnhancedAnalytics = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [customDates, setCustomDates] = useState({ from: '', to: '' });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [popularItems, setPopularItems] = useState(null);
  const [ordersByHour, setOrdersByHour] = useState(null);
  const [categoryPerformance, setCategoryPerformance] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(null);

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    let from, to = today.toISOString();

    switch (dateRange) {
      case 'today':
        from = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        from = new Date(today.setDate(today.getDate() - 7)).toISOString();
        break;
      case 'month':
        from = new Date(today.setMonth(today.getMonth() - 1)).toISOString();
        break;
      case 'year':
        from = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString();
        break;
      case 'custom':
        from = customDates.from ? new Date(customDates.from).toISOString() : null;
        to = customDates.to ? new Date(customDates.to).toISOString() : null;
        break;
      default:
        from = new Date(today.setDate(today.getDate() - 7)).toISOString();
    }

    return { from, to };
  };

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { from, to } = getDateRange();

      const [stats, revenue, items, hours, categories, payments] = await Promise.all([
        analyticsAPI.getDashboardStats(from, to),
        analyticsAPI.getRevenueTrend(dateRange === 'today' ? 'daily' : dateRange === 'year' ? 'monthly' : 'daily', from, to),
        analyticsAPI.getPopularItems(from, to, 10),
        analyticsAPI.getOrdersByHour(from, to),
        analyticsAPI.getCategoryPerformance(from, to),
        analyticsAPI.getPaymentMethods(from, to),
      ]);

      setDashboardStats(stats);
      setRevenueTrend(revenue);
      setPopularItems(items);
      setOrdersByHour(hours);
      setCategoryPerformance(categories);
      setPaymentMethods(payments);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customDates]);

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Restaurant Analytics Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Period: ${dateRange.toUpperCase()}`, 14, 36);

    // Dashboard Stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 46);
    doc.autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `$${dashboardStats?.total_revenue || 0}`],
        ['Total Orders', dashboardStats?.total_orders || 0],
        ['Average Order Value', `$${dashboardStats?.average_order_value || 0}`],
        ['Revenue Change', `${dashboardStats?.revenue_change_percent || 0}%`],
        ['Top Selling Item', dashboardStats?.top_selling_item || 'N/A'],
      ],
    });

    // Popular Items
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Top Selling Items', 14, 22);
    doc.autoTable({
      startY: 26,
      head: [['Item', 'Category', 'Quantity', 'Revenue']],
      body: popularItems?.items.map(item => [
        item.name,
        item.category,
        item.total_quantity,
        `$${item.total_revenue}`,
      ]) || [],
    });

    // Category Performance
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Category Performance', 14, 22);
    doc.autoTable({
      startY: 26,
      head: [['Category', 'Revenue', 'Quantity', 'Orders', '% of Total']],
      body: categoryPerformance?.categories.map(cat => [
        cat.category,
        `$${cat.total_revenue}`,
        cat.total_quantity,
        cat.order_count,
        `${cat.percentage_of_total}%`,
      ]) || [],
    });

    doc.save(`analytics-report-${Date.now()}.pdf`);
  };

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Dashboard Stats Sheet
    const statsData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${dashboardStats?.total_revenue || 0}`],
      ['Total Orders', dashboardStats?.total_orders || 0],
      ['Average Order Value', `$${dashboardStats?.average_order_value || 0}`],
      ['Revenue Change %', `${dashboardStats?.revenue_change_percent || 0}%`],
      ['Orders Change %', `${dashboardStats?.orders_change_percent || 0}%`],
      ['Top Selling Item', dashboardStats?.top_selling_item || 'N/A'],
      ['Active Tables', dashboardStats?.active_tables || 0],
      ['Pending Orders', dashboardStats?.pending_orders || 0],
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Summary');

    // Revenue Trend Sheet
    if (revenueTrend?.data) {
      const revenueData = [
        ['Date', 'Revenue', 'Orders'],
        ...revenueTrend.data.map(item => [item.date, item.revenue, item.orders_count]),
      ];
      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Trend');
    }

    // Popular Items Sheet
    if (popularItems?.items) {
      const itemsData = [
        ['Item', 'Category', 'Quantity', 'Revenue', 'Orders'],
        ...popularItems.items.map(item => [
          item.name,
          item.category,
          item.total_quantity,
          item.total_revenue,
          item.order_count,
        ]),
      ];
      const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Popular Items');
    }

    // Category Performance Sheet
    if (categoryPerformance?.categories) {
      const categoryData = [
        ['Category', 'Revenue', 'Quantity', 'Orders', '% of Total'],
        ...categoryPerformance.categories.map(cat => [
          cat.category,
          cat.total_revenue,
          cat.total_quantity,
          cat.order_count,
          cat.percentage_of_total,
        ]),
      ];
      const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories');
    }

    XLSX.writeFile(workbook, `analytics-report-${Date.now()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.enhancedAnalytics')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.overview')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('analytics.exportPDF')}
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('analytics.exportExcel')}
          </button>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div className="flex gap-2">
            {['today', 'week', 'month', 'year', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(`analytics.${range}`).charAt(0).toUpperCase() + t(`analytics.${range}`).slice(1)}
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex gap-2 ml-4">
              <input
                type="date"
                value={customDates.from}
                onChange={(e) => setCustomDates({ ...customDates, from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <span className="self-center">to</span>
              <input
                type="date"
                value={customDates.to}
                onChange={(e) => setCustomDates({ ...customDates, to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 opacity-80" />
            {dashboardStats?.revenue_change_percent >= 0 ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-sm font-medium opacity-90">{t('dashboard.totalRevenue')}</h3>
          <p className="text-3xl font-bold mt-2">${dashboardStats?.total_revenue || 0}</p>
          <p className="text-sm mt-2 opacity-80">
            {dashboardStats?.revenue_change_percent >= 0 ? '+' : ''}
            {dashboardStats?.revenue_change_percent || 0}% {t('analytics.revenueChange')}
          </p>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-10 h-10 opacity-80" />
            {dashboardStats?.orders_change_percent >= 0 ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-sm font-medium opacity-90">{t('dashboard.totalOrders')}</h3>
          <p className="text-3xl font-bold mt-2">{dashboardStats?.total_orders || 0}</p>
          <p className="text-sm mt-2 opacity-80">
            {dashboardStats?.orders_change_percent >= 0 ? '+' : ''}
            {dashboardStats?.orders_change_percent || 0}% {t('analytics.ordersChange')}
          </p>
        </motion.div>

        {/* Average Order Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 opacity-80" />
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium opacity-90">{t('dashboard.averageOrderValue')}</h3>
          <p className="text-3xl font-bold mt-2">${dashboardStats?.average_order_value || 0}</p>
          <p className="text-sm mt-2 opacity-80">Per transaction</p>
        </motion.div>

        {/* Top Selling Item */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Award className="w-10 h-10 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90">{t('dashboard.topSellingItems')}</h3>
          <p className="text-2xl font-bold mt-2 truncate">
            {dashboardStats?.top_selling_item || 'N/A'}
          </p>
          <p className="text-sm mt-2 opacity-80">{t('menu.popular')}</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend - Area Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.revenueTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueTrend?.data || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Count - Line Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Count Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders_count"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Hour - Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Orders by Hour (Peak: {ordersByHour?.peak_hour}:00)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByHour?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="order_count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution - Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryPerformance?.categories || []}
                dataKey="total_revenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.category}: ${entry.percentage_of_total}%`}
              >
                {(categoryPerformance?.categories || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods - Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethods?.data || []}
                dataKey="count"
                nameKey="payment_method"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={(entry) => `${entry.payment_method}: ${entry.percentage}%`}
              >
                {(paymentMethods?.data || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Selling Items - Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularItems?.items || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_quantity" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(popularItems?.items || []).slice(0, 5).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.total_quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${item.total_revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Performance Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(categoryPerformance?.categories || []).map((cat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${cat.total_revenue}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${cat.percentage_of_total}%` }}
                          />
                        </div>
                        <span>{cat.percentage_of_total}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;
