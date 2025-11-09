import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, AlertTriangle, Award, Target, Clock, 
  Calendar, Download, Filter, RefreshCw
} from 'lucide-react';
import { analyticsAPI } from '../../../services/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Scatter, ScatterChart, ZAxis
} from 'recharts';

/**
 * Advanced Analytics Component
 * Deep dive analytics with predictive insights
 */
const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [peakHoursData, setPeakHoursData] = useState(null);
  const [menuPerformance, setMenuPerformance] = useState({ items: [], underperforming_items: [] });
  const [revenueForecast, setRevenueForecast] = useState([]);
  const [tableUtilization, setTableUtilization] = useState([]);
  const [customerInsights, setCustomerInsights] = useState(null);

  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

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
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      date_from: start.toISOString(),
      date_to: end.toISOString()
    };
  };

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [dateRange]);

  const fetchAdvancedAnalytics = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRange();
      
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        analyticsAPI.getPeakHoursDetailed(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getMenuPerformance(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getRevenueForecast(14),
        analyticsAPI.getTableUtilization(dateParams.date_from, dateParams.date_to),
        analyticsAPI.getCustomerInsights(dateParams.date_from, dateParams.date_to)
      ]);

      const [peakData, menuData, forecastData, tableData, customerData] = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.warn(`Advanced analytics API call ${index} failed:`, result.reason);
          return null;
        }
      });

      if (peakData) setPeakHoursData(peakData);
      if (menuData) setMenuPerformance(menuData);
      if (forecastData) setRevenueForecast(forecastData);
      if (tableData) setTableUtilization(tableData);
      if (customerData) setCustomerInsights(customerData);
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Generate CSV or PDF report
    const reportData = {
      date: new Date().toISOString(),
      dateRange,
      menuPerformance,
      tableUtilization,
      customerInsights
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Prepare heatmap data for peak hours
  const prepareHeatmapData = () => {
    if (!peakHoursData?.days) return [];
    
    const heatmap = [];
    peakHoursData.days.forEach(day => {
      day.hours.forEach(hour => {
        if (hour.order_count > 0) {
          heatmap.push({
            day: day.day_name,
            hour: `${hour.hour}:00`,
            orders: hour.order_count,
            revenue: hour.revenue
          });
        }
      });
    });
    return heatmap;
  };

  // Calculate performance score
  const calculatePerformanceScore = () => {
    if (!menuPerformance?.items?.length) return 0;
    
    const topItems = menuPerformance.items.slice(0, 5);
    const totalRevenue = menuPerformance.total_revenue || 0;
    if (totalRevenue === 0) return 0;
    
    const topItemsRevenue = topItems.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    const concentration = (topItemsRevenue / totalRevenue) * 100;
    
    // Score based on diversification (lower concentration is better)
    return Math.max(0, 100 - concentration);
  };

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h2>
          <p className="text-slate-400">Predictive insights and deep performance analysis</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchAdvancedAnalytics}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-all"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-all"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Date Range Selector & Refresh */}
      <div className="flex gap-2 items-center">
        {/* Refresh Button */}
        <button
          onClick={() => fetchAdvancedAnalytics()}
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
        
        {['7days', '30days', '90days'].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dateRange === range
                ? 'bg-primary-500 text-white'
                : 'bg-white/10 text-slate-400 hover:bg-white/20'
            }`}
          >
            {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-slate-300 text-sm">Menu Diversity Score</p>
              <p className="text-3xl font-bold text-white">{calculatePerformanceScore().toFixed(1)}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {calculatePerformanceScore() > 70 ? 'Well diversified menu' : 'Consider promoting more items'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Target className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-slate-300 text-sm">Customer Retention</p>
              <p className="text-3xl font-bold text-white">{customerInsights?.retention_rate?.toFixed(1) || 0}%</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {customerInsights?.retention_rate > 50 ? 'Excellent loyalty' : 'Room for improvement'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Award className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-slate-300 text-sm">Top Performers</p>
              <p className="text-3xl font-bold text-white">{menuPerformance?.items?.slice(0, 5).length || 0}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Items driving majority of revenue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-xl border border-orange-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-slate-300 text-sm">Underperforming Items</p>
              <p className="text-3xl font-bold text-white">{menuPerformance?.underperforming_items?.length || 0}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Items needing attention</p>
        </motion.div>
      </div>

      {/* Revenue Forecast */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">14-Day Revenue Forecast</h3>
            <p className="text-slate-400 text-sm">Predicted revenue based on historical trends</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Avg Daily Forecast</p>
            <p className="text-2xl font-bold text-white">
              ${revenueForecast.length > 0 ? (revenueForecast.reduce((sum, item) => sum + (item.forecasted_revenue || 0), 0) / revenueForecast.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={revenueForecast}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
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
            <Legend />
            <Area 
              type="monotone" 
              dataKey="forecasted_revenue" 
              fill="url(#colorForecast)" 
              stroke={COLORS.success}
              name="Forecasted Revenue ($)"
            />
            <Line 
              type="monotone" 
              dataKey="confidence" 
              stroke={COLORS.warning} 
              name="Confidence (%)"
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Hours Heatmap */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Peak Hours Analysis</h3>
        {peakHoursData?.days && (
          <div className="space-y-4">
            {peakHoursData.days.map(day => (
              <div key={day.day_name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold">{day.day_name}</h4>
                  <span className="text-slate-400 text-sm">
                    Peak: {day.peak_hour}:00 ({day.peak_orders} orders)
                  </span>
                </div>
                <div className="flex gap-1">
                  {day.hours.map(hour => {
                    const intensity = hour.order_count / day.peak_orders;
                    const bgColor = intensity > 0.7 ? 'bg-red-500' : 
                                    intensity > 0.4 ? 'bg-orange-500' : 
                                    intensity > 0.2 ? 'bg-yellow-500' : 
                                    intensity > 0 ? 'bg-green-500' : 'bg-slate-700';
                    
                    return (
                      <div
                        key={hour.hour}
                        className={`h-8 flex-1 ${bgColor} rounded transition-all hover:scale-105 cursor-pointer`}
                        title={`${hour.hour}:00 - ${hour.order_count} orders, $${hour.revenue.toFixed(2)}`}
                        style={{ opacity: intensity > 0 ? 0.5 + (intensity * 0.5) : 0.3 }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-700 rounded"></div>
                <span>No Orders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Peak</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Performance Matrix */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Table Performance Matrix</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              type="number" 
              dataKey="total_orders" 
              name="Total Orders" 
              stroke="#94a3b8"
              label={{ value: 'Total Orders', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="total_revenue" 
              name="Total Revenue" 
              stroke="#94a3b8"
              label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis type="number" dataKey="utilization_rate" range={[50, 400]} name="Utilization" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
              formatter={(value, name) => {
                if (name === 'Total Revenue') return `$${value.toFixed(2)}`;
                if (name === 'Utilization') return `${value.toFixed(1)}%`;
                return value;
              }}
            />
            <Legend />
            <Scatter 
              name="Tables" 
              data={tableUtilization} 
              fill={COLORS.purple}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Menu Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Star Performers */}
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Award className="text-green-500" size={24} />
            <h3 className="text-xl font-bold text-white">Star Performers</h3>
          </div>
          <div className="space-y-3">
            {menuPerformance?.items?.slice(0, 5).map((item, index) => (
              <div key={item.item_id} className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">#{index + 1} {item.name}</span>
                  <span className="text-green-400 text-sm font-semibold">{item.revenue_percentage}%</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>{item.total_sold} sold</span>
                  <span>${item.total_revenue.toFixed(2)}</span>
                </div>
                <div className="mt-2 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${item.revenue_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underperforming Items */}
        <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="text-orange-500" size={24} />
            <h3 className="text-xl font-bold text-white">Needs Attention</h3>
          </div>
          {menuPerformance.underperforming_items?.length > 0 ? (
            <div className="space-y-3">
              {menuPerformance.underperforming_items.slice(0, 5).map((item) => (
                <div key={item.item_id} className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold">{item.name}</span>
                      <p className="text-slate-400 text-sm">{item.category}</p>
                    </div>
                    <span className="text-orange-400 text-xs bg-orange-500/20 px-3 py-1 rounded-full">
                      No Sales
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>All menu items are performing well! 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Insights Summary */}
      <div className="bg-gradient-to-br from-primary-500/20 to-purple-500/20 backdrop-blur-xl border border-primary-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Customer Behavior Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-slate-300 text-sm mb-2">Repeat Customer Rate</p>
            <p className="text-4xl font-bold text-white mb-1">
              {((customerInsights?.repeat_customers / customerInsights?.total_customers * 100) || 0).toFixed(1)}%
            </p>
            <p className="text-slate-400 text-xs">
              {customerInsights?.repeat_customers || 0} of {customerInsights?.total_customers || 0} customers
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-300 text-sm mb-2">Average Orders per Customer</p>
            <p className="text-4xl font-bold text-white mb-1">
              {customerInsights?.avg_orders_per_customer?.toFixed(1) || 0}
            </p>
            <p className="text-slate-400 text-xs">Orders per returning customer</p>
          </div>
          <div className="text-center">
            <p className="text-slate-300 text-sm mb-2">New vs Returning</p>
            <p className="text-4xl font-bold text-white mb-1">
              {customerInsights?.new_customers || 0} / {customerInsights?.repeat_customers || 0}
            </p>
            <p className="text-slate-400 text-xs">New customers / Returning</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">AI-Powered Recommendations</h3>
        <div className="space-y-4">
          {calculatePerformanceScore() < 70 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="text-blue-400 mt-1" size={20} />
                <div>
                  <p className="text-white font-semibold mb-1">Diversify Menu Sales</p>
                  <p className="text-slate-400 text-sm">
                    Your top 5 items generate most revenue. Consider promoting other items through specials or combos.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {customerInsights?.retention_rate < 50 && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Target className="text-purple-400 mt-1" size={20} />
                <div>
                  <p className="text-white font-semibold mb-1">Improve Customer Retention</p>
                  <p className="text-slate-400 text-sm">
                    Launch a loyalty program or offer incentives for repeat visits to increase retention rate.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {menuPerformance.underperforming_items?.length > 3 && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-400 mt-1" size={20} />
                <div>
                  <p className="text-white font-semibold mb-1">Review Underperforming Items</p>
                  <p className="text-slate-400 text-sm">
                    {menuPerformance.underperforming_items.length} items haven't sold recently. Consider updating pricing, descriptions, or removing from menu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {peakHoursData?.days && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="text-green-400 mt-1" size={20} />
                <div>
                  <p className="text-white font-semibold mb-1">Optimize Staffing</p>
                  <p className="text-slate-400 text-sm">
                    Peak hours identified. Ensure adequate staff during {peakHoursData.days[0].peak_hour}:00 - {peakHoursData.days[0].peak_hour + 2}:00.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
