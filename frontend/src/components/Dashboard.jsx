import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Orders', value: '156', icon: '📋', color: 'bg-blue-500' },
    { name: 'Active Tables', value: '12', icon: '🪑', color: 'bg-green-500' },
    { name: 'Menu Items', value: '45', icon: '🍽️', color: 'bg-orange-500' },
    { name: 'Reservations', value: '23', icon: '📅', color: 'bg-purple-500' },
  ];

  const quickActions = [
    { name: 'New Order', path: '/orders', icon: '➕', color: 'bg-primary-600' },
    { name: 'View Menu', path: '/menu', icon: '📖', color: 'bg-green-600' },
    { name: 'Manage Tables', path: '/tables', icon: '🪑', color: 'bg-blue-600' },
    { name: 'Reservations', path: '/reservations', icon: '📅', color: 'bg-purple-600' },
  ];

  // Check if user is manager or admin
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-slate-600 mt-2">
            Here's what's happening in your restaurant today.
          </p>
          
          {/* Manager Dashboard Link */}
          {isManagerOrAdmin && (
            <Link
              to="/manager"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg hover:shadow-xl"
            >
              <span className="text-xl">🎛️</span>
              <span className="font-semibold">Open Manager Dashboard</span>
              <span className="text-xl">→</span>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">{stat.name}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-4 rounded-lg text-3xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.path}
                className={`${action.color} text-white p-6 rounded-lg hover:opacity-90 transition-opacity`}
              >
                <div className="text-4xl mb-2">{action.icon}</div>
                <p className="text-lg font-semibold">{action.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-semibold text-slate-800">Order #1234 completed</p>
                <p className="text-sm text-slate-600">Table 5 - $45.50</p>
              </div>
              <span className="text-sm text-slate-500">5 min ago</span>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-semibold text-slate-800">New reservation</p>
                <p className="text-sm text-slate-600">John Doe - 4 people</p>
              </div>
              <span className="text-sm text-slate-500">15 min ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Menu item added</p>
                <p className="text-sm text-slate-600">Grilled Salmon - $24.99</p>
              </div>
              <span className="text-sm text-slate-500">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
