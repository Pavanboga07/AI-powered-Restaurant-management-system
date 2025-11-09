import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { chefAPI } from '../../services/api';
import { ChefHat, MessageSquare, ClipboardList, Package, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ChefKitchenDisplay from './ChefKitchenDisplay';
import ChefMessaging from './ChefMessaging';
import ChefShiftHandover from './ChefShiftHandover';

const ChefDashboard = () => {
  const [stats, setStats] = useState({
    active_orders: 0,
    orders_prepared_today: 0,
    avg_prep_time: 0,
    pending: 0
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchStats = async () => {
    try {
      const response = await chefAPI.getOrderStats();
      setStats(response?.data || response || {
        active_orders: 0,
        orders_prepared_today: 0,
        avg_prep_time: 0,
        pending: 0
      });
    } catch (error) {
      console.error('Error fetching chef stats:', error);
      // Set default stats on error to prevent blank screen
      setStats({
        active_orders: 0,
        orders_prepared_today: 0,
        avg_prep_time: 0,
        pending: 0
      });
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/chef', label: 'Kitchen Display', icon: ChefHat, end: true },
    { to: '/chef/messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
    { to: '/chef/handover', label: 'Shift Handover', icon: ClipboardList },
    { to: '/chef/inventory', label: 'Inventory', icon: Package }
  ];

  const statCards = [
    { label: 'Active Orders', value: stats.active_orders, color: 'bg-blue-500' },
    { label: 'Prepared Today', value: stats.orders_prepared_today, color: 'bg-green-500' },
    { label: 'Avg Prep Time', value: `${stats.avg_prep_time} min`, color: 'bg-yellow-500' },
    { label: 'Pending', value: stats.pending, color: 'bg-red-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 flex items-center">
              <ChefHat className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" />
              Chef Dashboard
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage kitchen operations</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right hidden sm:block">
              <p className="text-white font-semibold text-sm">{user?.username}</p>
              <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              <LogOut className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
              <div className={`${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
                <div className="text-white text-lg sm:text-xl font-bold">{stat.value}</div>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800 border-b border-gray-700 mb-4 sm:mb-6 rounded-lg overflow-x-auto">
          <nav className="flex min-w-max sm:min-w-0">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
                    isActive
                      ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-750'
                  }`
                }
              >
                <item.icon className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-1 sm:ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-gray-800 rounded-lg p-3 sm:p-6 border border-gray-700">
          <Routes>
            <Route index element={<ChefKitchenDisplay setUnreadMessages={setUnreadMessages} />} />
            <Route path="messages" element={<ChefMessaging setUnreadMessages={setUnreadMessages} />} />
            <Route path="handover" element={<ChefShiftHandover />} />
            <Route path="inventory" element={
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
                <p className="text-gray-400">Inventory management feature coming soon...</p>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ChefDashboard;
