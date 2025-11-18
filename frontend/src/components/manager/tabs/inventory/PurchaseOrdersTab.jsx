import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  ShoppingCart,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  Trash2,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../../services/api';

const PurchaseOrdersTab = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery: '',
    notes: '',
    items: []
  });
  const [receivedQuantities, setReceivedQuantities] = useState({});

  const statuses = [
    { value: 'all', label: 'All', icon: FileText, color: 'slate' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'blue' },
    { value: 'received', label: 'Received', icon: Truck, color: 'green' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
  ];

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchInventoryItems();
  }, [filterStatus]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.get('/inventory/purchase-orders', { params });
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/inventory/suppliers', { params: { is_active: true } });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await api.get('/inventory/items', { params: { is_active: true } });
      setInventoryItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item to the purchase order');
      return;
    }

    try {
      await api.post('/inventory/purchase-orders', formData);
      toast.success('Purchase order created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error(error.response?.data?.detail || 'Failed to create purchase order');
    }
  };

  const handleReceivePO = async () => {
    try {
      await api.post(`/inventory/purchase-orders/${selectedPO.id}/receive`, receivedQuantities);
      toast.success('Purchase order received and inventory updated');
      setShowReceiveModal(false);
      setSelectedPO(null);
      setReceivedQuantities({});
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      toast.error('Failed to receive purchase order');
    }
  };

  const handleCancelPO = async (poId) => {
    if (!window.confirm('Are you sure you want to cancel this purchase order?')) return;
    
    try {
      await api.post(`/inventory/purchase-orders/${poId}/cancel`);
      toast.success('Purchase order cancelled');
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      toast.error('Failed to cancel purchase order');
    }
  };

  const addItemToPO = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { inventory_item_id: '', quantity: 0, unit_cost: 0 }
      ]
    });
  };

  const removeItemFromPO = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updatePOItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'inventory_item_id' ? Number(value) : parseFloat(value) || 0;
    setFormData({ ...formData, items: newItems });
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      expected_delivery: '',
      notes: '',
      items: []
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = statuses.find(s => s.value === status) || statuses[0];
    const Icon = statusConfig.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-800`}>
        <Icon size={12} className="mr-1" />
        {statusConfig.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPOCost = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const Icon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
                  ${
                    filterStatus === status.value
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <Icon size={16} />
                <span className="text-sm">{status.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Create PO</span>
        </button>
      </div>

      {/* Purchase Orders List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : purchaseOrders.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <ShoppingCart className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-600">No purchase orders found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Create your first purchase order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseOrders.map((po) => (
            <motion.div
              key={po.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-slate-900">{po.po_number}</div>
                  <div className="text-sm text-slate-600">{po.supplier?.name}</div>
                </div>
                {getStatusBadge(po.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar size={14} className="mr-2" />
                  {formatDate(po.order_date)}
                </div>
                {po.expected_delivery && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Truck size={14} className="mr-2" />
                    Expected: {formatDate(po.expected_delivery)}
                  </div>
                )}
                <div className="flex items-center text-sm font-semibold text-slate-900">
                  <DollarSign size={14} className="mr-2" />
                  ₹{po.total_cost?.toFixed(2) || '0.00'}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Package size={14} className="mr-2" />
                  {po.items?.length || 0} item{po.items?.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    setSelectedPO(po);
                    setShowViewModal(true);
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>
                
                {po.status === 'pending' && (
                  <button
                    onClick={() => handleCancelPO(po.id)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={16} />
                    <span>Cancel</span>
                  </button>
                )}
                
                {(po.status === 'confirmed' || po.status === 'pending') && (
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      // Initialize received quantities with ordered quantities
                      const initialQuantities = {};
                      po.items?.forEach(item => {
                        initialQuantities[item.id] = item.quantity;
                      });
                      setReceivedQuantities(initialQuantities);
                      setShowReceiveModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle size={16} />
                    <span>Receive</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Create Purchase Order</h2>
              </div>

              <form onSubmit={handleCreatePO} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Supplier *
                    </label>
                    <select
                      required
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_delivery}
                      onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Add any special instructions or notes..."
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Order Items *
                    </label>
                    <button
                      type="button"
                      onClick={addItemToPO}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg">
                      <p className="text-slate-600">No items added yet</p>
                      <button
                        type="button"
                        onClick={addItemToPO}
                        className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Add your first item
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <select
                              required
                              value={item.inventory_item_id}
                              onChange={(e) => updatePOItem(index, 'inventory_item_id', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            >
                              <option value="">Select item</option>
                              {inventoryItems.map(invItem => (
                                <option key={invItem.id} value={invItem.id}>
                                  {invItem.name} ({invItem.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0.01"
                              placeholder="Quantity"
                              value={item.quantity || ''}
                              onChange={(e) => updatePOItem(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              placeholder="Unit Cost"
                              value={item.unit_cost || ''}
                              onChange={(e) => updatePOItem(index, 'unit_cost', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItemFromPO(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Cost */}
                {formData.items.length > 0 && (
                  <div className="flex justify-between items-center p-4 bg-primary-50 rounded-lg">
                    <span className="font-semibold text-slate-900">Total Order Cost:</span>
                    <span className="text-2xl font-bold text-primary-700">₹{totalPOCost.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Create Purchase Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View PO Modal */}
      <AnimatePresence>
        {showViewModal && selectedPO && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedPO.po_number}</h2>
                    <p className="text-slate-600">{selectedPO.supplier?.name}</p>
                  </div>
                  {getStatusBadge(selectedPO.status)}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">Order Date</div>
                    <div className="font-medium">{formatDate(selectedPO.order_date)}</div>
                  </div>
                  {selectedPO.expected_delivery && (
                    <div>
                      <div className="text-sm text-slate-600">Expected Delivery</div>
                      <div className="font-medium">{formatDate(selectedPO.expected_delivery)}</div>
                    </div>
                  )}
                  {selectedPO.actual_delivery && (
                    <div>
                      <div className="text-sm text-slate-600">Actual Delivery</div>
                      <div className="font-medium">{formatDate(selectedPO.actual_delivery)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-slate-600">Total Cost</div>
                    <div className="font-bold text-lg">₹{selectedPO.total_cost?.toFixed(2)}</div>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Notes</div>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-700">{selectedPO.notes}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-slate-700 mb-3">Order Items</div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Item</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Unit Cost</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Total</th>
                          {selectedPO.status === 'received' && (
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Received</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedPO.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm">{item.inventory_item?.name}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              {item.quantity} {item.inventory_item?.unit}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">₹{item.unit_cost}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              ₹{(item.quantity * item.unit_cost).toFixed(2)}
                            </td>
                            {selectedPO.status === 'received' && (
                              <td className="px-4 py-3 text-sm text-right text-green-600">
                                {item.received_quantity} {item.inventory_item?.unit}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedPO(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receive PO Modal */}
      <AnimatePresence>
        {showReceiveModal && selectedPO && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Receive Purchase Order</h2>
                <p className="text-slate-600 mt-1">{selectedPO.po_number}</p>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Enter the actual quantity received for each item. Inventory will be updated accordingly.
                </p>

                <div className="space-y-3">
                  {selectedPO.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{item.inventory_item?.name}</div>
                        <div className="text-sm text-slate-600">
                          Ordered: {item.quantity} {item.inventory_item?.unit}
                        </div>
                      </div>
                      <div className="w-40">
                        <label className="block text-xs text-slate-600 mb-1">Received Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={receivedQuantities[item.id] || 0}
                          onChange={(e) => setReceivedQuantities({
                            ...receivedQuantities,
                            [item.id]: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowReceiveModal(false);
                      setSelectedPO(null);
                      setReceivedQuantities({});
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReceivePO}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PurchaseOrdersTab;
