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
  const [viewingBillDetails, setViewingBillDetails] = useState(null); // For detailed bill view
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
      // Fetch orders with status=completed or status=ready for billing
      const data = await ordersAPI.getAll();
      // Filter orders that are completed/ready and don't have bills yet
      const ordersWithoutBills = data.filter(
        order => (order.status === 'completed' || order.status === 'ready' || order.status === 'served') && 
        !bills.some(bill => bill.order_id === order.id)
      );
      setOrders(ordersWithoutBills);
      console.log('Orders available for billing:', ordersWithoutBills.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to fetch orders', 'error');
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
    
    // Header with restaurant name
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Restaurant Receipt', 105, 20, { align: 'center' });
    
    // Bill info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Bill #${bill.id}`, 20, 35);
    doc.text(`Date: ${new Date(bill.created_at).toLocaleDateString()} ${new Date(bill.created_at).toLocaleTimeString()}`, 20, 42);
    if (bill.order?.table?.table_number) {
      doc.text(`Table: ${bill.order.table.table_number}`, 20, 49);
    }
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);
    
    // Items header
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Items', 20, 65);
    doc.text('Qty', 130, 65);
    doc.text('Price', 155, 65);
    doc.text('Total', 180, 65, { align: 'right' });
    
    doc.setLineWidth(0.3);
    doc.line(20, 68, 190, 68);
    
    // Items list
    let yPos = 76;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    if (bill.order && bill.order.order_items && bill.order.order_items.length > 0) {
      bill.order.order_items.forEach((item) => {
        const itemName = item.menu_item?.name || 'Unknown Item';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const total = quantity * price;
        
        // Wrap item name if too long
        const maxWidth = 100;
        const nameLines = doc.splitTextToSize(itemName, maxWidth);
        
        doc.text(nameLines[0], 20, yPos);
        doc.text(quantity.toString(), 130, yPos);
        doc.text(`₹${price.toFixed(2)}`, 155, yPos);
        doc.text(`₹${total.toFixed(2)}`, 190, yPos, { align: 'right' });
        
        yPos += 8;
        
        // Add page if needed
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      });
    } else {
      doc.text('No items available', 20, yPos);
      yPos += 8;
    }
    
    // Separator before totals
    yPos += 5;
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Subtotal
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal:', 130, yPos);
    doc.text(`₹${bill.subtotal.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 8;
    
    // Tax
    doc.text(`Tax (${bill.tax_percentage}%):`, 130, yPos);
    doc.text(`₹${bill.tax.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 8;
    
    // Discount
    if (bill.discount > 0) {
      doc.text('Discount:', 130, yPos);
      doc.text(`-₹${bill.discount.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 8;
    }
    
    // Total with emphasis
    yPos += 3;
    doc.setLineWidth(0.5);
    doc.line(130, yPos, 190, yPos);
    yPos += 8;
    
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 130, yPos);
    doc.text(`₹${bill.total.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 10;
    
    // Split info
    if (bill.split_count > 1) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Split among ${bill.split_count} people: ₹${(bill.total / bill.split_count).toFixed(2)} per person`, 130, yPos);
      yPos += 8;
    }
    
    // Payment info
    if (bill.payment_method) {
      doc.setFont(undefined, 'normal');
      doc.text(`Payment: ${bill.payment_method.toUpperCase()}`, 130, yPos);
      yPos += 5;
    }
    
    doc.text(`Status: ${bill.payment_status.toUpperCase()}`, 130, yPos);
    
    // Notes
    if (bill.notes) {
      yPos += 10;
      doc.setFontSize(9);
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      const notesLines = doc.splitTextToSize(bill.notes, 170);
      doc.text(notesLines, 20, yPos);
    }
    
    // Footer
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Thank you for dining with us!', 105, 280, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Visit us again soon!', 105, 287, { align: 'center' });
    
    doc.save(`receipt_bill_${bill.id}.pdf`);
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
    <div className="min-h-screen bg-slate-50 p-6">
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
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setViewingBillDetails(bill)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Receipt size={18} />
                    View Details
                  </button>
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
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
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
                    {orders.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                        <p className="text-sm font-medium">No orders available for billing</p>
                        <p className="text-xs mt-1">Make sure orders are marked as 'completed', 'ready', or 'served'</p>
                      </div>
                    ) : (
                      <select
                        value={billForm.order_id || ''}
                        onChange={(e) => setBillForm({ ...billForm, order_id: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select an order...</option>
                        {orders.map((order) => (
                          <option key={order.id} value={order.id}>
                            Order #{order.id} - Table {order.table?.table_number || 'N/A'} - ₹{(order.total_amount || 0).toFixed(2)} ({order.status})
                          </option>
                        ))}
                      </select>
                    )}
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

      {/* Bill Details View Modal */}
      <AnimatePresence>
        {viewingBillDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingBillDetails(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-4 sticky top-0 bg-white z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Bill Details #{viewingBillDetails.id}</h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {new Date(viewingBillDetails.created_at).toLocaleDateString()} {new Date(viewingBillDetails.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingBillDetails(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Order Info */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600 block">Bill ID</span>
                        <span className="font-bold text-lg">#{viewingBillDetails.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">Order ID</span>
                        <span className="font-bold text-lg">#{viewingBillDetails.order_id}</span>
                      </div>
                      {viewingBillDetails.order?.table?.table_number && (
                        <div>
                          <span className="text-slate-600 block">Table</span>
                          <span className="font-bold text-lg">{viewingBillDetails.order.table.table_number}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-600 block">Status</span>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                            viewingBillDetails.payment_status === 'paid'
                              ? 'bg-green-500 text-white'
                              : viewingBillDetails.payment_status === 'pending'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {viewingBillDetails.payment_status.toUpperCase()}
                        </span>
                      </div>
                      {viewingBillDetails.payment_method && (
                        <div>
                          <span className="text-slate-600 block">Payment Method</span>
                          <span className="font-bold">{viewingBillDetails.payment_method.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Receipt size={20} className="text-orange-500" />
                      Order Items
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Item</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Qty</th>
                            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Price</th>
                            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {viewingBillDetails.order?.order_items?.length > 0 ? (
                            viewingBillDetails.order.order_items.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800">
                                    {item.menu_item?.name || 'Unknown Item'}
                                  </div>
                                  {item.menu_item?.category && (
                                    <div className="text-xs text-slate-500">{item.menu_item.category}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">{item.quantity || 1}</td>
                                <td className="px-4 py-3 text-right">₹{(item.price || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-bold">
                                  ₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                No items found in this order
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bill Calculation */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Calculator size={20} className="text-orange-500" />
                      Bill Summary
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-bold">₹{viewingBillDetails.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Tax ({viewingBillDetails.tax_percentage}%)</span>
                        <span className="font-bold">₹{viewingBillDetails.tax.toFixed(2)}</span>
                      </div>
                      {viewingBillDetails.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span className="font-bold">-₹{viewingBillDetails.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-300 pt-3 flex justify-between">
                        <span className="text-lg font-bold text-slate-800">Total Amount</span>
                        <span className="text-2xl font-bold text-orange-600">
                          ₹{viewingBillDetails.total.toFixed(2)}
                        </span>
                      </div>
                      {viewingBillDetails.split_count > 1 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Users size={18} />
                            <span className="font-medium">
                              Split among {viewingBillDetails.split_count} people: 
                              <span className="ml-2 text-lg font-bold">
                                ₹{(viewingBillDetails.total / viewingBillDetails.split_count).toFixed(2)} each
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {viewingBillDetails.notes && (
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">Notes</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-slate-700">
                        {viewingBillDetails.notes}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => generatePDF(viewingBillDetails)}
                      className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Download size={20} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => setViewingBillDetails(null)}
                      className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                    >
                      Close
                    </button>
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
