import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  DollarSign,
  CreditCard,
  Smartphone,
  Banknote,
  Globe,
  Percent,
  Users,
  Download,
  Check,
  X,
  AlertCircle,
  Tag,
  Calculator,
} from 'lucide-react';
import { billingAPI, ordersAPI, couponsAPI } from '../../../services/api';
import jsPDF from 'jspdf';

/**
 * BillingManager - Comprehensive billing and payment management
 * @component
 */
const BillingManager = () => {
  // State
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Form state
  const [billForm, setBillForm] = useState({
    order_id: null,
    tax_percentage: 5.0,
    notes: '',
  });

  const [couponCode, setCouponCode] = useState('');
  const [splitCount, setSplitCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'online', label: 'Online', icon: Globe },
  ];

  // Fetch data
  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await billingAPI.getAll();
      setBills(data);
    } catch (error) {
      showToast('Failed to fetch bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await ordersAPI.getAll({ status: 'completed' });
      // Filter orders that don't have bills
      const ordersWithoutBills = data.filter(
        order => !bills.some(bill => bill.order_id === order.id)
      );
      setOrders(ordersWithoutBills);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    if (bills.length > 0) {
      fetchOrders();
    }
  }, [bills]);

  // Toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Generate bill
  const handleGenerateBill = async () => {
    try {
      const newBill = await billingAPI.create(billForm);
      showToast('Bill generated successfully!', 'success');
      setIsGenerateModalOpen(false);
      fetchBills();
      fetchOrders();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to generate bill', 'error');
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!selectedBill || !couponCode) return;

    try {
      const updatedBill = await billingAPI.applyCoupon(selectedBill.id, couponCode);
      showToast('Coupon applied successfully!', 'success');
      setCouponCode('');
      setSelectedBill(updatedBill);
      fetchBills();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to apply coupon', 'error');
    }
  };

  // Remove coupon
  const handleRemoveCoupon = async () => {
    if (!selectedBill) return;

    try {
      const updatedBill = await billingAPI.removeCoupon(selectedBill.id);
      showToast('Coupon removed', 'success');
      setSelectedBill(updatedBill);
      fetchBills();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to remove coupon', 'error');
    }
  };

  // Split bill
  const handleSplitBill = async () => {
    if (!selectedBill) return;

    try {
      const updatedBill = await billingAPI.splitBill(selectedBill.id, splitCount);
      showToast(`Bill split among ${splitCount} people!`, 'success');
      setSelectedBill(updatedBill);
      fetchBills();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to split bill', 'error');
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (!selectedBill) return;

    try {
      const updatedBill = await billingAPI.updatePayment(selectedBill.id, {
        payment_method: paymentMethod,
        payment_status: 'paid',
      });
      showToast('Payment processed successfully!', 'success');
      setIsPaymentModalOpen(false);
      setSelectedBill(null);
      fetchBills();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to process payment', 'error');
    }
  };

  // Generate PDF Receipt
  const generatePDF = (bill) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Restaurant Receipt', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Bill #${bill.id}`, 20, 40);
    doc.text(`Date: ${new Date(bill.created_at).toLocaleDateString()}`, 20, 50);
    
    // Bill details
    doc.text('Items:', 20, 70);
    let yPos = 80;
    
    // Subtotal
    doc.text(`Subtotal:`, 20, yPos);
    doc.text(`₹${bill.subtotal.toFixed(2)}`, 150, yPos);
    yPos += 10;
    
    // Tax
    doc.text(`Tax (${bill.tax_percentage}%):`, 20, yPos);
    doc.text(`₹${bill.tax.toFixed(2)}`, 150, yPos);
    yPos += 10;
    
    // Discount
    if (bill.discount > 0) {
      doc.text(`Discount:`, 20, yPos);
      doc.text(`-₹${bill.discount.toFixed(2)}`, 150, yPos);
      yPos += 10;
    }
    
    // Total
    doc.setFontSize(14);
    doc.text(`Total:`, 20, yPos + 10);
    doc.text(`₹${bill.total.toFixed(2)}`, 150, yPos + 10);
    
    // Split info
    if (bill.split_count > 1) {
      doc.setFontSize(12);
      doc.text(`Split among ${bill.split_count} people:`, 20, yPos + 25);
      doc.text(`₹${bill.amount_per_person.toFixed(2)} per person`, 20, yPos + 35);
    }
    
    // Payment method
    if (bill.payment_method) {
      doc.text(`Payment Method: ${bill.payment_method.toUpperCase()}`, 20, yPos + 50);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for dining with us!', 105, 280, { align: 'center' });
    
    doc.save(`receipt_${bill.id}.pdf`);
  };

  // Statistics
  const stats = {
    total: bills.length,
    pending: bills.filter(b => b.payment_status === 'pending').length,
    paid: bills.filter(b => b.payment_status === 'paid').length,
    totalRevenue: bills
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total, 0),
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
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Billing & Payments</h1>
        <p className="text-slate-600">Manage bills, apply coupons, and process payments</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Bills</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <Receipt className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <AlertCircle className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Paid</p>
              <p className="text-2xl font-bold text-green-800">{stats.paid}</p>
            </div>
            <Check className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Revenue</p>
              <p className="text-2xl font-bold text-blue-800">₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Receipt size={20} />
          Generate Bill
        </button>
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Receipt size={64} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No bills found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bills.map((bill) => (
            <motion.div
              key={bill.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Bill Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-slate-800">Bill #{bill.id}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        bill.payment_status === 'paid'
                          ? 'bg-green-500 text-white'
                          : bill.payment_status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {bill.payment_status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Subtotal:</span>
                      <p className="font-bold">₹{bill.subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Tax ({bill.tax_percentage}%):</span>
                      <p className="font-bold">₹{bill.tax.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Discount:</span>
                      <p className="font-bold text-green-600">-₹{bill.discount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Total:</span>
                      <p className="font-bold text-lg">₹{bill.total.toFixed(2)}</p>
                    </div>
                  </div>

                  {bill.split_count > 1 && (
                    <div className="mt-2 text-sm text-blue-600">
                      <Users size={16} className="inline mr-1" />
                      Split among {bill.split_count} people: ₹{(bill.total / bill.split_count).toFixed(2)} each
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {bill.payment_status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedBill(bill);
                          setPaymentMethod('cash');
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <DollarSign size={18} />
                        Pay
                      </button>
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Calculator size={18} />
                        Manage
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => generatePDF(bill)}
                    className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                  >
                    <Download size={18} />
                    PDF
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Generate Bill Modal */}
      <AnimatePresence>
        {isGenerateModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGenerateModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">Generate Bill</h2>
                  <button
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-slate-600" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Order <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={billForm.order_id || ''}
                      onChange={(e) => setBillForm({ ...billForm, order_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select an order...</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                          Order #{order.id} - ₹{order.total_amount.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tax Percentage
                    </label>
                    <input
                      type="number"
                      value={billForm.tax_percentage}
                      onChange={(e) => setBillForm({ ...billForm, tax_percentage: parseFloat(e.target.value) })}
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={billForm.notes}
                      onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Add any notes..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setIsGenerateModalOpen(false)}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateBill}
                      disabled={!billForm.order_id}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedBill && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-2xl font-bold text-slate-800">Process Payment</h2>
                  <p className="text-slate-600">Bill #{selectedBill.id}</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-3xl font-bold text-center text-slate-800">
                      ₹{selectedBill.total.toFixed(2)}
                    </p>
                    {selectedBill.split_count > 1 && (
                      <p className="text-center text-sm text-slate-600 mt-2">
                        ₹{(selectedBill.total / selectedBill.split_count).toFixed(2)} per person
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.value}
                            onClick={() => setPaymentMethod(method.value)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              paymentMethod === method.value
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <Icon className="mx-auto mb-2" size={32} />
                            <p className="text-sm font-medium">{method.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayment}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <Check size={18} />
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage Bill Modal (Coupon & Split) */}
      <AnimatePresence>
        {selectedBill && !isPaymentModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBill(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="border-b border-slate-200 px-6 py-4 sticky top-0 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-800">Manage Bill #{selectedBill.id}</h2>
                    <button
                      onClick={() => setSelectedBill(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Apply Coupon */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Tag size={20} className="text-orange-500" />
                      Apply Coupon
                    </h3>
                    {selectedBill.coupon_id ? (
                      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                        <p className="text-green-700 font-medium mb-2">
                          Coupon Applied! Discount: ₹{selectedBill.discount.toFixed(2)}
                        </p>
                        <button
                          onClick={handleRemoveCoupon}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          Remove Coupon
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Split Bill */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Users size={20} className="text-blue-500" />
                      Split Bill
                    </h3>
                    <div className="space-y-3">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          value={splitCount}
                          onChange={(e) => setSplitCount(parseInt(e.target.value) || 1)}
                          min="1"
                          max="20"
                          className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-slate-600">people</span>
                        <button
                          onClick={handleSplitBill}
                          disabled={splitCount === selectedBill.split_count}
                          className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          Split
                        </button>
                      </div>
                      {splitCount > 1 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-blue-800 font-medium">
                            ₹{(selectedBill.total / splitCount).toFixed(2)} per person
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bill Summary */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3">Bill Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">₹{selectedBill.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({selectedBill.tax_percentage}%):</span>
                        <span className="font-medium">₹{selectedBill.tax.toFixed(2)}</span>
                      </div>
                      {selectedBill.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span className="font-medium">-₹{selectedBill.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>₹{selectedBill.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillingManager;
