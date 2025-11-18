import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  AlertTriangle,
  Edit2,
  ShoppingCart,
  Package
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../../services/api';

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const transactionTypes = [
    { value: 'all', label: 'All Types', icon: Activity },
    { value: 'purchase', label: 'Purchase', icon: ShoppingCart },
    { value: 'usage', label: 'Usage', icon: Minus },
    { value: 'wastage', label: 'Wastage', icon: AlertTriangle },
    { value: 'adjustment', label: 'Adjustment', icon: Edit2 }
  ];

  useEffect(() => {
    fetchTransactions();
  }, [filterType, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') params.transaction_type = filterType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/inventory/transactions', { params });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="text-green-600" size={20} />;
      case 'usage':
        return <Minus className="text-blue-600" size={20} />;
      case 'wastage':
        return <AlertTriangle className="text-red-600" size={20} />;
      case 'adjustment':
        return <Edit2 className="text-orange-600" size={20} />;
      default:
        return <Activity className="text-slate-600" size={20} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'usage':
        return 'bg-blue-100 text-blue-800';
      case 'wastage':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Transaction Type
            </label>
            <div className="flex flex-wrap gap-2">
              {transactionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
                      ${
                        filterType === type.value
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <Icon size={16} />
                    <span className="text-sm">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Activity className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-600">No transactions found</p>
          <p className="text-slate-500 text-sm mt-2">Transactions will appear here as inventory moves</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-700">
                        <Calendar size={14} className="mr-2 text-slate-400" />
                        {formatDate(transaction.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg mr-3">
                          <Package className="text-slate-600" size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {transaction.inventory_item?.name || 'Unknown Item'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {transaction.inventory_item?.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                        <span className="mr-1">{getTransactionIcon(transaction.transaction_type)}</span>
                        {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center font-semibold ${transaction.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.quantity >= 0 ? (
                          <TrendingUp size={16} className="mr-1" />
                        ) : (
                          <TrendingDown size={16} className="mr-1" />
                        )}
                        {Math.abs(transaction.quantity)} {transaction.inventory_item?.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.reference_type && transaction.reference_id ? (
                        <div className="text-sm text-slate-700">
                          <span className="text-slate-500">{transaction.reference_type}:</span>{' '}
                          #{transaction.reference_id}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 max-w-xs truncate">
                        {transaction.notes || '—'}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;
