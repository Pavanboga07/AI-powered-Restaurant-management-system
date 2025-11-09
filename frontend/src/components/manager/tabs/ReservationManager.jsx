import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  List,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { reservationsAPI, tablesAPI } from '../../../services/api';

/**
 * ReservationManager - Comprehensive reservation management
 * @component
 */
const ReservationManager = () => {
  // State
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'calendar'
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  // Wizard form data
  const [wizardData, setWizardData] = useState({
    date: '',
    time_slot: '',
    guests: 2,
    duration: 90,
    table_id: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500', textColor: 'text-green-700' },
    { value: 'seated', label: 'Seated', color: 'bg-blue-500', textColor: 'text-blue-700' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-500', textColor: 'text-gray-700' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-700' },
    { value: 'no_show', label: 'No Show', color: 'bg-orange-500', textColor: 'text-orange-700' },
  ];

  // Fetch data
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date_from = filterDate;
      
      const data = await reservationsAPI.getAll(params);
      setReservations(data);
    } catch (error) {
      showToast('Failed to fetch reservations', 'error');
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const data = await tablesAPI.getAll();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, [filterStatus, filterDate]);

  // Toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Get status info
  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  // Filter reservations by search term
  const filteredReservations = reservations.filter((reservation) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      reservation.customer_name?.toLowerCase().includes(term) ||
      reservation.customer_phone?.includes(term) ||
      reservation.customer_email?.toLowerCase().includes(term)
    );
  });

  // Statistics
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    today: reservations.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      return r.date === today;
    }).length,
  };

  // Reservation actions
  const handleConfirm = async (reservation) => {
    try {
      await reservationsAPI.confirm(reservation.id);
      showToast('Reservation confirmed!', 'success');
      fetchReservations();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to confirm', 'error');
    }
  };

  const handleCancel = async (reservation) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
      await reservationsAPI.cancel(reservation.id);
      showToast('Reservation cancelled!', 'success');
      fetchReservations();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to cancel', 'error');
    }
  };

  const handleCheckin = async (reservation) => {
    try {
      await reservationsAPI.checkin(reservation.id);
      showToast('Guest checked in!', 'success');
      fetchReservations();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to check in', 'error');
    }
  };

  // Wizard functions
  const openWizard = () => {
    resetWizard();
    setIsWizardOpen(true);
  };

  const resetWizard = () => {
    setWizardStep(1);
    setWizardData({
      date: '',
      time_slot: '',
      guests: 2,
      duration: 90,
      table_id: null,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_requests: '',
    });
    setAvailableSlots([]);
    setSelectedSlot(null);
    setSelectedTable(null);
    setFormErrors({});
  };

  // Step 1: Check availability
  const checkAvailability = async () => {
    if (!wizardData.date || !wizardData.guests) {
      showToast('Please select date and number of guests', 'error');
      return;
    }

    try {
      const response = await reservationsAPI.checkAvailability({
        date: wizardData.date,
        guests: wizardData.guests,
        duration: wizardData.duration,
      });
      setAvailableSlots(response.slots || []);
      setWizardStep(2);
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to check availability', 'error');
    }
  };

  // Step 2: Select time slot
  const selectTimeSlot = (slot) => {
    setSelectedSlot(slot);
    setWizardData({ ...wizardData, time_slot: slot.time_slot });
    setWizardStep(3);
  };

  // Step 3: Select table
  const selectTable = (table) => {
    setSelectedTable(table);
    setWizardData({ ...wizardData, table_id: table.id });
    setWizardStep(4);
  };

  // Step 4: Validate customer info
  const validateCustomerInfo = () => {
    const errors = {};

    if (!wizardData.customer_name || wizardData.customer_name.trim().length < 2) {
      errors.customer_name = 'Name must be at least 2 characters';
    }

    if (!wizardData.customer_phone || !/^\d{10}$/.test(wizardData.customer_phone.replace(/\D/g, ''))) {
      errors.customer_phone = 'Phone must be 10 digits';
    }

    if (wizardData.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardData.customer_email)) {
      errors.customer_email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit reservation
  const handleSubmitReservation = async () => {
    if (!validateCustomerInfo()) {
      showToast('Please fix form errors', 'error');
      return;
    }

    try {
      await reservationsAPI.create({
        date: wizardData.date,
        time_slot: wizardData.time_slot,
        guests: wizardData.guests,
        duration: wizardData.duration,
        table_id: wizardData.table_id,
        customer_name: wizardData.customer_name,
        customer_email: wizardData.customer_email || null,
        customer_phone: wizardData.customer_phone,
        special_requests: wizardData.special_requests || null,
      });
      showToast('Reservation created successfully!', 'success');
      setIsWizardOpen(false);
      fetchReservations();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create reservation', 'error');
    }
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
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Reservation Management</h1>
        <p className="text-slate-600">Manage customer reservations and bookings</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <Calendar className="text-slate-400" size={32} />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Confirmed</p>
              <p className="text-2xl font-bold text-green-800">{stats.confirmed}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Today</p>
              <p className="text-2xl font-bold text-blue-800">{stats.today}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Left: Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, email..."
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
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

            {/* Date Filter */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Right: View Toggle and Add Button */}
          <div className="flex gap-4">
            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  view === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-600'
                }`}
              >
                <List size={18} />
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  view === 'calendar' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-600'
                }`}
              >
                <Calendar size={18} />
                Calendar
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={openWizard}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              New Reservation
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : view === 'list' ? (
        /* List View */
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No reservations found</p>
            </div>
          ) : (
            filteredReservations.map((reservation) => {
              const statusInfo = getStatusInfo(reservation.status);
              const table = tables.find(t => t.id === reservation.table_id);

              return (
                <motion.div
                  key={reservation.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-800">
                          {reservation.customer_name}
                        </h3>
                        <span className={`px-3 py-1 ${statusInfo.color} text-white text-xs font-bold rounded-full`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{reservation.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{reservation.time_slot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{reservation.guests} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>Table #{table?.table_number || 'N/A'}</span>
                        </div>
                        {reservation.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={16} />
                            <span>{reservation.customer_phone}</span>
                          </div>
                        )}
                        {reservation.customer_email && (
                          <div className="flex items-center gap-2">
                            <Mail size={16} />
                            <span>{reservation.customer_email}</span>
                          </div>
                        )}
                      </div>

                      {reservation.special_requests && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">
                            <strong>Special Requests:</strong> {reservation.special_requests}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {reservation.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(reservation)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Confirm
                        </button>
                      )}
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckin(reservation)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <UserCheck size={18} />
                          Check In
                        </button>
                      )}
                      {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancel(reservation)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* Calendar View - Placeholder */
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Calendar view coming soon...</p>
          <p className="text-sm text-slate-400 mt-2">Use the list view to manage reservations</p>
        </div>
      )}

      {/* Reservation Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWizardOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">New Reservation</h2>
                    <p className="text-sm text-slate-600">Step {wizardStep} of 4</p>
                  </div>
                  <button
                    onClick={() => setIsWizardOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-slate-600" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            wizardStep >= step
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {step}
                        </div>
                        {step < 4 && (
                          <div
                            className={`flex-1 h-1 mx-2 ${
                              wizardStep > step ? 'bg-orange-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Date & Party</span>
                    <span>Time Slot</span>
                    <span>Table</span>
                    <span>Customer Info</span>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* Step 1: Date & Party Size */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Select Date and Party Size
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={wizardData.date}
                          onChange={(e) => setWizardData({ ...wizardData, date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Number of Guests <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={wizardData.guests}
                          onChange={(e) => setWizardData({ ...wizardData, guests: parseInt(e.target.value) })}
                          min="1"
                          max="20"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Duration (minutes)
                        </label>
                        <select
                          value={wizardData.duration}
                          onChange={(e) => setWizardData({ ...wizardData, duration: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                          <option value="120">2 hours</option>
                          <option value="150">2.5 hours</option>
                          <option value="180">3 hours</option>
                        </select>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={checkAvailability}
                          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                        >
                          Check Availability
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Select Time Slot */}
                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Select Time Slot
                      </h3>

                      {availableSlots.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                          <p className="text-slate-600">No available time slots for this date</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time_slot}
                              onClick={() => selectTimeSlot(slot)}
                              disabled={!slot.is_available}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                slot.is_available
                                  ? 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer'
                                  : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <div className="font-bold text-slate-800">{slot.time_slot}</div>
                              <div className="text-xs text-slate-600">
                                {slot.available_tables} tables
                              </div>
                              <div className="text-xs text-slate-600">
                                {slot.total_capacity} seats
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setWizardStep(1)}
                          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <ChevronLeft size={18} />
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Select Table */}
                  {wizardStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Select Table
                      </h3>

                      {selectedSlot && selectedSlot.available_tables > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {tables
                            .filter(t => t.capacity >= wizardData.guests && t.status === 'available')
                            .map((table) => (
                              <button
                                key={table.id}
                                onClick={() => selectTable(table)}
                                className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-all"
                              >
                                <div className="text-2xl font-bold text-slate-800">#{table.table_number}</div>
                                <div className="text-sm text-slate-600">
                                  <Users size={14} className="inline mr-1" />
                                  {table.capacity} seats
                                </div>
                                {table.location && (
                                  <div className="text-xs text-slate-500 capitalize">{table.location}</div>
                                )}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                          <p className="text-slate-600">No suitable tables available</p>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setWizardStep(2)}
                          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <ChevronLeft size={18} />
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Customer Info */}
                  {wizardStep === 4 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Customer Information
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={wizardData.customer_name}
                          onChange={(e) => setWizardData({ ...wizardData, customer_name: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            formErrors.customer_name
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-orange-500'
                          }`}
                          placeholder="John Doe"
                        />
                        {formErrors.customer_name && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.customer_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={wizardData.customer_phone}
                          onChange={(e) => setWizardData({ ...wizardData, customer_phone: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            formErrors.customer_phone
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-orange-500'
                          }`}
                          placeholder="1234567890"
                        />
                        {formErrors.customer_phone && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.customer_phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={wizardData.customer_email}
                          onChange={(e) => setWizardData({ ...wizardData, customer_email: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            formErrors.customer_email
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-orange-500'
                          }`}
                          placeholder="john@example.com"
                        />
                        {formErrors.customer_email && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.customer_email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Special Requests (Optional)
                        </label>
                        <textarea
                          value={wizardData.special_requests}
                          onChange={(e) => setWizardData({ ...wizardData, special_requests: e.target.value })}
                          rows="3"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Allergies, dietary restrictions, special occasions..."
                        />
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setWizardStep(3)}
                          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <ChevronLeft size={18} />
                          Back
                        </button>
                        <button
                          onClick={handleSubmitReservation}
                          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                        >
                          <Check size={18} />
                          Create Reservation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReservationManager;
