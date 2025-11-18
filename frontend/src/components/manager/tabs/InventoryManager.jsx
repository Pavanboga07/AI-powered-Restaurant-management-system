import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Users,
  FileText,
  Activity,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import ItemsTab from './inventory/ItemsTab';
import SuppliersTab from './inventory/SuppliersTab';
import TransactionsTab from './inventory/TransactionsTab';
import RecipesTab from './inventory/RecipesTab';
import PurchaseOrdersTab from './inventory/PurchaseOrdersTab';

const InventoryManager = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [stats, setStats] = useState({
    total_items: 0,
    total_value: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_suppliers: 0,
    pending_purchase_orders: 0
  });

  const tabs = [
    { id: 'items', label: 'Inventory Items', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'recipes', label: 'Recipes', icon: FileText },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'items':
        return <ItemsTab onStatsUpdate={setStats} />;
      case 'suppliers':
        return <SuppliersTab />;
      case 'transactions':
        return <TransactionsTab />;
      case 'recipes':
        return <RecipesTab />;
      case 'purchase-orders':
        return <PurchaseOrdersTab />;
      default:
        return <ItemsTab onStatsUpdate={setStats} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
        <p className="text-slate-600 mt-1">
          Manage your restaurant inventory, suppliers, and purchase orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Items</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total_items}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Package className="text-primary-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.total_value.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{stats.low_stock_count}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_count}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600 font-medium'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
