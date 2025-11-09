import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  Users,
  MapPin,
  Grid,
} from 'lucide-react';
import { tablesAPI } from '../../../services/api';

/**
 * TableManager - Table management component
 * @component
 */
const TableManager = () => {
  // State
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: '',
    location: 'indoor',
    status: 'available',
  });

  const [formErrors, setFormErrors] = useState({});

  // Status options with colors
  const statusOptions = [
    { value: 'available', label: 'Available', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' },
    { value: 'occupied', label: 'Occupied', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' },
    { value: 'reserved', label: 'Reserved', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-gray-500', textColor: 'text-gray-700', bgLight: 'bg-gray-50' },
  ];

  const locationOptions = ['indoor', 'outdoor', 'window', 'patio', 'private'];

  // Fetch tables
  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tablesAPI.getAll({ status: filterStatus || undefined });
      setTables(data);
      setFilteredTables(data);
    } catch (error) {
      showToast('Failed to fetch tables', 'error');
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [filterStatus]);

  // Toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.table_number || formData.table_number <= 0) {
      errors.table_number = 'Table number must be greater than 0';
    }

    if (!formData.capacity || formData.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix form errors', 'error');
      return;
    }

    try {
      const tableData = {
        ...formData,
        table_number: parseInt(formData.table_number),
        capacity: parseInt(formData.capacity),
      };

      if (editingTable) {
        await tablesAPI.update(editingTable.id, tableData);
        showToast('Table updated successfully!', 'success');
      } else {
        await tablesAPI.create(tableData);
        showToast('Table created successfully!', 'success');
      }

      setIsModalOpen(false);
      resetForm();
      fetchTables();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Operation failed', 'error');
      console.error('Error saving table:', error);
    }
  };

  // Handle delete
  const handleDelete = async (table) => {
    if (!window.confirm(`Are you sure you want to delete Table #${table.table_number}?`)) {
      return;
    }

    try {
      await tablesAPI.delete(table.id);
      showToast('Table deleted successfully!', 'success');
      fetchTables();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete table', 'error');
      console.error('Error deleting table:', error);
    }
  };

  // Open modal for creating
  const openCreateModal = () => {
    resetForm();
    setEditingTable(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (table) => {
    setFormData({
      table_number: table.table_number.toString(),
      capacity: table.capacity.toString(),
      location: table.location || 'indoor',
      status: table.status,
    });
    setEditingTable(table);
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      table_number: '',
      capacity: '',
      location: 'indoor',
      status: 'available',
    });
    setFormErrors({});
  };

  // Get status info
  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  // Statistics
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="p-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Table Management</h1>
        <p className="text-slate-600">Manage restaurant tables and seating arrangements</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Tables</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <Grid className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Available</p>
              <p className="text-2xl font-bold text-green-800">{stats.available}</p>
            </div>
            <Check className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Occupied</p>
              <p className="text-2xl font-bold text-red-800">{stats.occupied}</p>
            </div>
            <Users className="text-red-500" size={32} />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Reserved</p>
              <p className="text-2xl font-bold text-blue-800">{stats.reserved}</p>
            </div>
            <MapPin className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Table
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Grid size={64} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No tables found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const statusInfo = getStatusInfo(table.status);
            
            return (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${statusInfo.bgLight} border-2 ${statusInfo.color.replace('bg-', 'border-')} rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow`}
              >
                {/* Table Number */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-slate-800">#{table.table_number}</div>
                  <div className={`inline-block mt-2 px-3 py-1 ${statusInfo.color} text-white text-xs font-bold rounded-full`}>
                    {statusInfo.label}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-center gap-2 text-slate-700">
                    <Users size={16} />
                    <span className="text-sm">Capacity: {table.capacity}</span>
                  </div>
                  {table.location && (
                    <div className="flex items-center justify-center gap-2 text-slate-700">
                      <MapPin size={16} />
                      <span className="text-sm capitalize">{table.location}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEditModal(table)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(table)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Modal Header */}
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingTable ? 'Edit Table' : 'Add Table'}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-slate-600" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-4">
                    {/* Table Number */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Table Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.table_number}
                        onChange={(e) =>
                          setFormData({ ...formData, table_number: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          formErrors.table_number
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:ring-orange-500'
                        }`}
                        placeholder="1"
                      />
                      {formErrors.table_number && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.table_number}</p>
                      )}
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Capacity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          formErrors.capacity
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-300 focus:ring-orange-500'
                        }`}
                        placeholder="4"
                      />
                      {formErrors.capacity && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.capacity}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Location
                      </label>
                      <select
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {locationOptions.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc.charAt(0).toUpperCase() + loc.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      {editingTable ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableManager;
