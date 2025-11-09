import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  Percent,
  DollarSign,
  Calendar,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { couponsAPI } from '../../../services/api';

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    min_order_value: 0,
    max_discount: '',
    max_uses: '',
    expiry_date: '',
    active: true,
  });

  const [formErrors, setFormErrors] = useState({});

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponsAPI.getAll();
      setCoupons(data);
      const statsData = await couponsAPI.getStats();
      setStats(statsData);
    } catch (error) {
      showToast('Failed to fetch coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code || formData.code.length < 3) {
      errors.code = 'Code must be at least 3 characters';
    }
    if (!formData.value || formData.value <= 0) {
      errors.value = 'Value must be greater than 0';
    }
    if (formData.type === 'percentage' && formData.value > 100) {
      errors.value = 'Percentage cannot exceed 100';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: parseFloat(formData.value),
        min_order_value: parseFloat(formData.min_order_value) || 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expiry_date: formData.expiry_date || null,
      };

      if (editingCoupon) {
        await couponsAPI.update(editingCoupon.id, couponData);
        showToast('Coupon updated successfully!', 'success');
      } else {
        await couponsAPI.create(couponData);
        showToast('Coupon created successfully!', 'success');
      }

      setIsModalOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await couponsAPI.toggle(coupon.id);
      showToast(`Coupon ${coupon.active ? 'deactivated' : 'activated'}!`, 'success');
      fetchCoupons();
    } catch (error) {
      showToast('Failed to toggle coupon', 'error');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;

    try {
      await couponsAPI.delete(coupon.id);
      showToast('Coupon deleted!', 'success');
      fetchCoupons();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete', 'error');
    }
  };

  const openEditModal = (coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value.toString(),
      min_order_value: coupon.min_order_value || 0,
      max_discount: coupon.max_discount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      active: coupon.active,
    });
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      min_order_value: 0,
      max_discount: '',
      max_uses: '',
      expiry_date: '',
      active: true,
    });
    setFormErrors({});
    setEditingCoupon(null);
  };

  return (
    <div className="p-6">
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
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Coupon Management</h1>
        <p className="text-slate-600">Create and manage discount coupons</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-slate-600">Total Coupons</p>
            <p className="text-2xl font-bold">{stats.total_coupons}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-green-700">Active</p>
            <p className="text-2xl font-bold text-green-800">{stats.active_coupons}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-blue-700">Redemptions</p>
            <p className="text-2xl font-bold text-blue-800">{stats.total_redemptions}</p>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-orange-700">Discount Given</p>
            <p className="text-2xl font-bold text-orange-800">₹{stats.total_discount_given.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <motion.div
              key={coupon.id}
              layout
              className={`rounded-lg shadow-md p-6 ${
                coupon.active ? 'bg-white' : 'bg-slate-100 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="text-orange-500" size={20} />
                    <h3 className="text-xl font-bold">{coupon.code}</h3>
                  </div>
                  {coupon.description && (
                    <p className="text-sm text-slate-600">{coupon.description}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    coupon.active
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-500 text-white'
                  }`}
                >
                  {coupon.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  {coupon.type === 'percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                  <span className="font-bold text-lg">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`} OFF
                  </span>
                </div>
                {coupon.min_order_value > 0 && (
                  <p className="text-sm text-slate-600">Min order: ₹{coupon.min_order_value}</p>
                )}
                {coupon.max_discount && (
                  <p className="text-sm text-slate-600">Max discount: ₹{coupon.max_discount}</p>
                )}
                {coupon.max_uses && (
                  <p className="text-sm text-slate-600">
                    Uses: {coupon.current_uses}/{coupon.max_uses}
                  </p>
                )}
                {coupon.expiry_date && (
                  <p className="text-sm text-slate-600">
                    Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(coupon)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  {coupon.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEditModal(coupon)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(coupon)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
                  <h2 className="text-2xl font-bold">{editingCoupon ? 'Edit' : 'Create'} Coupon</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="SAVE20"
                    />
                    {formErrors.code && <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="2"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Value <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder={formData.type === 'percentage' ? '10' : '100'}
                      />
                      {formErrors.value && <p className="text-sm text-red-500 mt-1">{formErrors.value}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Order Value</label>
                      <input
                        type="number"
                        value={formData.min_order_value}
                        onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Max Discount</label>
                      <input
                        type="number"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Uses</label>
                      <input
                        type="number"
                        value={formData.max_uses}
                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date</label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium">Active</label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 border rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      {editingCoupon ? 'Update' : 'Create'}
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

export default CouponManager;
