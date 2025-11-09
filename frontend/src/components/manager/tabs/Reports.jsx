import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Calendar, TrendingUp, DollarSign, 
  ShoppingCart, Users, Package, Filter, RefreshCw, Printer
} from 'lucide-react';
import { analyticsAPI } from '../../../services/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

/**
 * Reports Component
 * Generate detailed reports on sales, inventory, and performance
 */
const Reports = () => {
  console.log('Reports component rendering');
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('30days');
  const [reportData, setReportData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', icon: DollarSign },
    { id: 'menu', name: 'Menu Performance', icon: Package },
    { id: 'revenue', name: 'Revenue Trends', icon: TrendingUp },
    { id: 'summary', name: 'Executive Summary', icon: FileText }
  ];

  const dateRanges = [
    { id: '7days', label: '7 Days' },
    { id: '30days', label: '30 Days' },
    { id: '90days', label: '90 Days' },
    { id: 'ytd', label: 'Year to Date' }
  ];

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();
    
    switch(dateRange) {
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      case 'ytd':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      date_from: start.toISOString(),
      date_to: end.toISOString()
    };
  };

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRange();
      
      // Fetch different data based on report type
      const results = await Promise.allSettled([
        analyticsAPI.getDashboardStats(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getRevenueTrend('daily', dateParams.date_from, dateParams.date_to),
        analyticsAPI.getMenuPerformance(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getCategoryPerformance(dateParams.date_from, dateParams.date_to)
      ]);

      const [dashData, revData, menuPerf, catPerf] = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn(`Report API call ${index} failed:`, result.reason);
          return null;
        }
      });

      if (dashData) setDashboardStats(dashData);
      if (revData && revData.data) setRevenueData(revData.data);
      if (menuPerf && menuPerf.items) setMenuData(menuPerf.items);
      if (catPerf && catPerf.categories) setCategoryData(catPerf.categories);

      setReportData({
        dashboard: dashData,
        revenue: revData,
        menu: menuPerf,
        category: catPerf
      });
    } catch (error) {
      console.error('Error generating report:', error);
      // Set empty data to prevent crashes
      setDashboardStats(null);
      setRevenueData([]);
      setMenuData([]);
      setCategoryData([]);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Restaurant Analytics Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`${reportTypes.find(t => t.id === reportType)?.name} - ${dateRanges.find(d => d.id === dateRange)?.label}`, 14, 32);
    
    // Report Date
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 70, 32);
    
    let yPos = 50;
    
    // Dashboard Summary
    if (dashboardStats) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('Summary Statistics', 14, yPos);
      yPos += 10;
      
      const summaryData = [
        ['Total Revenue', `$${(dashboardStats?.total_revenue || 0).toFixed(2)}`],
        ['Total Orders', (dashboardStats?.total_orders || 0).toString()],
        ['Average Order Value', `$${(dashboardStats?.avg_order_value || 0).toFixed(2)}`],
        ['Revenue Growth', `${(dashboardStats?.revenue_growth_percent || 0) > 0 ? '+' : ''}${(dashboardStats?.revenue_growth_percent || 0).toFixed(1)}%`]
      ];
      
      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Report-specific content
    if (reportType === 'sales' && revenueData.length > 0) {
      doc.setFontSize(16);
      doc.text('Revenue Trend', 14, yPos);
      yPos += 10;
      
      const revenueTable = revenueData.slice(0, 10).map(item => [
        item?.date || 'N/A',
        `$${(item?.revenue || 0).toFixed(2)}`,
        (item?.orders_count || 0).toString()
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Revenue', 'Orders']],
        body: revenueTable,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    if (reportType === 'menu' && menuData.length > 0) {
      doc.setFontSize(16);
      doc.text('Top Menu Items', 14, yPos);
      yPos += 10;
      
      const menuTable = menuData.slice(0, 15).map(item => [
        item?.name || 'N/A',
        (item?.total_sold || 0).toString(),
        `$${(item?.total_revenue || 0).toFixed(2)}`,
        `${(item?.revenue_percentage || 0).toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Item Name', 'Sold', 'Revenue', '% of Total']],
        body: menuTable,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    if (dashboardStats) {
      const summaryData = [
        ['Restaurant Analytics Report'],
        [''],
        ['Report Type', reportTypes.find(t => t.id === reportType)?.name || 'N/A'],
        ['Date Range', dateRanges.find(d => d.id === dateRange)?.label || 'N/A'],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['Summary Statistics'],
        ['Total Revenue', dashboardStats?.total_revenue || 0],
        ['Total Orders', dashboardStats?.total_orders || 0],
        ['Average Order Value', dashboardStats?.avg_order_value || 0],
        ['Revenue Growth', `${dashboardStats?.revenue_growth_percent || 0}%`]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }
    
    // Revenue Data Sheet
    if (revenueData.length > 0) {
      const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Trend');
    }
    
    // Menu Performance Sheet
    if (menuData.length > 0) {
      const menuSheet = XLSX.utils.json_to_sheet(menuData);
      XLSX.utils.book_append_sheet(workbook, menuSheet, 'Menu Performance');
    }
    
    // Category Performance Sheet
    if (categoryData.length > 0) {
      const categorySheet = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Performance');
    }
    
    XLSX.writeFile(workbook, `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const printReport = () => {
    window.print();
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h2>
          <p className="text-slate-400">Generate comprehensive reports on your restaurant performance</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateReport}
            disabled={loading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              loading
                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
            Refresh
          </button>
          <button
            onClick={printReport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-all"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            onClick={exportToPDF}
            disabled={!reportData}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={18} />
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            disabled={!reportData}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Type Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-3">
              <Filter className="inline mr-2" size={18} />
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reportTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`p-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      reportType === type.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} />
                    {type.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-3">
              <Calendar className="inline mr-2" size={18} />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {dateRanges.map(range => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    dateRange === range.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats Summary */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <DollarSign className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-slate-300 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white">${(dashboardStats?.total_revenue || 0).toFixed(2)}</p>
              </div>
            </div>
            <p className={`text-sm ${(dashboardStats?.revenue_growth_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(dashboardStats?.revenue_growth_percent || 0) >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats?.revenue_growth_percent || 0).toFixed(1)}% vs previous period
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <ShoppingCart className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-slate-300 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-white">{dashboardStats?.total_orders || 0}</p>
              </div>
            </div>
            <p className={`text-sm ${(dashboardStats?.orders_growth_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(dashboardStats?.orders_growth_percent || 0) >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats?.orders_growth_percent || 0).toFixed(1)}% vs previous period
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TrendingUp className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-slate-300 text-sm">Avg Order Value</p>
                <p className="text-3xl font-bold text-white">${(dashboardStats?.avg_order_value || 0).toFixed(2)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Per order average
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-xl border border-orange-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Package className="text-orange-400" size={24} />
              </div>
              <div>
                <p className="text-slate-300 text-sm">Active Menu Items</p>
                <p className="text-3xl font-bold text-white">{menuData?.length || 0}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Items with sales
            </p>
          </motion.div>
        </div>
      )}

      {/* Report Content */}
      {reportType === 'sales' && revenueData.length === 0 && !loading && (
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-12 text-center">
          <FileText className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-slate-400 text-lg mb-2">No revenue data available for the selected period</p>
          <p className="text-slate-500 text-sm">Try selecting a different date range or check if there are any orders in the system</p>
        </div>
      )}
      
      {reportType === 'sales' && revenueData.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Sales Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData}>
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
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Revenue ($)"
              />
              <Line
                type="monotone"
                dataKey="orders_count"
                stroke="#10b981"
                strokeWidth={2}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'menu' && menuData.length === 0 && !loading && (
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-12 text-center">
          <Package className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-slate-400 text-lg mb-2">No menu performance data available for the selected period</p>
          <p className="text-slate-500 text-sm">No items were sold during this period</p>
        </div>
      )}
      
      {reportType === 'menu' && menuData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Menu Items */}
          <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Top Selling Items</h3>
            <div className="space-y-3">
              {menuData.slice(0, 10).map((item, index) => (
                <div key={item?.item_id || index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary-400">#{index + 1}</span>
                    <div>
                      <p className="text-white font-semibold">{item?.name || 'N/A'}</p>
                      <p className="text-slate-400 text-sm">{item?.total_sold || 0} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${(item?.total_revenue || 0).toFixed(2)}</p>
                    <p className="text-slate-400 text-sm">{(item?.revenue_percentage || 0).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Revenue by Category</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry?.category || 'N/A'}: ${(entry?.revenue_percentage || 0).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="total_revenue"
                  nameKey="category"
                >
                  {categoryData.map((entry, index) => (
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
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {reportType === 'revenue' && revenueData.length === 0 && !loading && (
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-12 text-center">
          <TrendingUp className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-slate-400 text-lg mb-2">No revenue trend data available for the selected period</p>
          <p className="text-slate-500 text-sm">Try selecting a different date range</p>
        </div>
      )}
      
      {reportType === 'revenue' && revenueData.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Revenue Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={revenueData}>
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
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'summary' && (
        <div className="space-y-6">
          {/* Revenue Trend */}
          <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Revenue Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.slice(-14)}>
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
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Items & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top 5 Items</h3>
              <div className="space-y-2">
                {menuData.slice(0, 5).map((item, index) => (
                  <div key={item?.item_id || index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-white">#{index + 1} {item?.name || 'N/A'}</span>
                    <span className="text-primary-400 font-semibold">${(item?.total_revenue || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top Categories</h3>
              <div className="space-y-2">
                {categoryData.slice(0, 5).map((cat, index) => (
                  <div key={cat?.category || index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-white">{cat?.category || 'N/A'}</span>
                    <span className="text-primary-400 font-semibold">${(cat?.total_revenue || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
