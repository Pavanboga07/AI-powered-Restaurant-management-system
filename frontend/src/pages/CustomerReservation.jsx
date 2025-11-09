import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  User,
  MessageSquare,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { reservationsAPI } from '../services/api';

/**
 * CustomerReservation - Public self-service booking page
 * @component
 */
const CustomerReservation = () => {
  // State
  const [currentStep, setCurrentStep] = useState(1); // 1: Date/Party, 2: Time, 3: Info, 4: Confirmation
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [confirmationData, setConfirmationData] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    date: '',
    guests: 2,
    duration: 90,
    time_slot: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Get minimum date (today)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get maximum date (90 days from now)
  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  };

  // Step 1: Check availability
  const handleCheckAvailability = async () => {
    if (!formData.date || !formData.guests) {
      setFormErrors({ date: 'Please select a date and number of guests' });
      return;
    }

    try {
      setLoading(true);
      const response = await reservationsAPI.checkAvailability({
        date: formData.date,
        guests: formData.guests,
        duration: formData.duration,
      });
      setAvailableSlots(response.slots || []);
      setCurrentStep(2);
      setFormErrors({});
    } catch (error) {
      setFormErrors({ date: 'Failed to check availability. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select time slot
  const handleSelectTimeSlot = (slot) => {
    if (!slot.is_available) return;
    setFormData({ ...formData, time_slot: slot.time_slot });
    setCurrentStep(3);
  };

  // Step 3: Validate customer info
  const validateCustomerInfo = () => {
    const errors = {};

    if (!formData.customer_name || formData.customer_name.trim().length < 2) {
      errors.customer_name = 'Name must be at least 2 characters';
    }

    const phoneDigits = formData.customer_phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      errors.customer_phone = 'Phone must be 10 digits';
    }

    if (formData.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit reservation
  const handleSubmitReservation = async () => {
    if (!validateCustomerInfo()) return;

    try {
      setLoading(true);
      const response = await reservationsAPI.create({
        date: formData.date,
        time_slot: formData.time_slot,
        guests: formData.guests,
        duration: formData.duration,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone,
        special_requests: formData.special_requests || null,
      });
      setConfirmationData(response);
      setCurrentStep(4);
    } catch (error) {
      setFormErrors({
        submit: error.response?.data?.detail || 'Failed to create reservation. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleNewReservation = () => {
    setFormData({
      date: '',
      guests: 2,
      duration: 90,
      time_slot: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      special_requests: '',
    });
    setFormErrors({});
    setAvailableSlots([]);
    setConfirmationData(null);
    setCurrentStep(1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="mx-auto mb-4" size={48} />
            <h1 className="text-5xl font-bold mb-4">Reserve Your Table</h1>
            <p className="text-xl text-orange-100">
              Book your dining experience in just a few simple steps
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          {currentStep < 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                          currentStep >= step
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {step}
                      </div>
                    </div>
                    {step < 3 && (
                      <div
                        className={`flex-1 h-2 mx-4 rounded-full transition-all ${
                          currentStep > step ? 'bg-orange-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between text-sm text-slate-600 font-medium">
                <span className={currentStep === 1 ? 'text-orange-600' : ''}>Date & Party</span>
                <span className={currentStep === 2 ? 'text-orange-600' : ''}>Time Selection</span>
                <span className={currentStep === 3 ? 'text-orange-600' : ''}>Your Information</span>
              </div>
            </div>
          )}

          {/* Step 1: Date and Party Size */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Calendar className="text-orange-500" size={32} />
                Select Date & Party Size
              </h2>

              <div className="space-y-6">
                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Reservation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full px-6 py-4 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                  {formErrors.date && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {formErrors.date}
                    </p>
                  )}
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Number of Guests <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => setFormData({ ...formData, guests: num })}
                        className={`py-4 rounded-xl font-bold text-lg transition-all ${
                          formData.guests === num
                            ? 'bg-orange-500 text-white shadow-lg scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Dining Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { value: 60, label: '1 hour' },
                      { value: 90, label: '1.5 hours' },
                      { value: 120, label: '2 hours' },
                      { value: 150, label: '2.5 hours' },
                      { value: 180, label: '3 hours' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, duration: option.value })}
                        className={`py-3 rounded-xl font-medium transition-all ${
                          formData.duration === option.value
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={handleCheckAvailability}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Checking Availability...
                    </>
                  ) : (
                    <>
                      Check Availability
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Time Slot Selection */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="mb-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors mb-4"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <Clock className="text-orange-500" size={32} />
                  Select Time Slot
                </h2>
                <p className="text-slate-600 mt-2">
                  {formatDate(formData.date)} • {formData.guests} guests
                </p>
              </div>

              {availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle size={64} className="mx-auto text-orange-400 mb-4" />
                  <p className="text-xl text-slate-600 mb-2">No Available Time Slots</p>
                  <p className="text-slate-500">Please try a different date or party size</p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Choose Different Date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {availableSlots.map((slot) => (
                    <motion.button
                      key={slot.time_slot}
                      whileHover={slot.is_available ? { scale: 1.05 } : {}}
                      whileTap={slot.is_available ? { scale: 0.95 } : {}}
                      onClick={() => handleSelectTimeSlot(slot)}
                      disabled={!slot.is_available}
                      className={`p-6 rounded-xl font-bold text-lg transition-all ${
                        slot.is_available
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 text-green-700 hover:shadow-lg cursor-pointer'
                          : 'bg-slate-100 border-2 border-slate-300 text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="text-xl mb-2">{slot.time_slot}</div>
                      {slot.is_available ? (
                        <>
                          <div className="text-xs font-normal">
                            {slot.available_tables} tables
                          </div>
                          <div className="text-xs font-normal">
                            {slot.total_capacity} seats
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-normal">Fully Booked</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Customer Information */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="mb-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors mb-4"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <User className="text-orange-500" size={32} />
                  Your Information
                </h2>
                <p className="text-slate-600 mt-2">
                  {formatDate(formData.date)} • {formData.time_slot} • {formData.guests} guests
                </p>
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="John Doe"
                    className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      formErrors.customer_name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  />
                  {formErrors.customer_name && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {formErrors.customer_name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="1234567890"
                      className={`w-full pl-14 pr-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        formErrors.customer_phone
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 focus:ring-orange-500 focus:border-orange-500'
                      }`}
                    />
                  </div>
                  {formErrors.customer_phone && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {formErrors.customer_phone}
                    </p>
                  )}
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="john@example.com"
                      className={`w-full pl-14 pr-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        formErrors.customer_email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 focus:ring-orange-500 focus:border-orange-500'
                      }`}
                    />
                  </div>
                  {formErrors.customer_email && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {formErrors.customer_email}
                    </p>
                  )}
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 text-slate-400" size={20} />
                    <textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      rows="4"
                      placeholder="Dietary restrictions, allergies, special occasions..."
                      className="w-full pl-14 pr-6 py-4 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Submit Error */}
                {formErrors.submit && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <span>{formErrors.submit}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmitReservation}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creating Reservation...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Confirm Reservation
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && confirmationData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={48} className="text-white" />
              </motion.div>

              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                Reservation Confirmed!
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We've received your reservation and will send you a confirmation shortly.
              </p>

              {/* Reservation Details */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8 text-left">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Reservation Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Calendar size={20} className="text-orange-500" />
                    <span className="font-medium">{formatDate(confirmationData.date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Clock size={20} className="text-orange-500" />
                    <span className="font-medium">{confirmationData.time_slot}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Users size={20} className="text-orange-500" />
                    <span className="font-medium">{confirmationData.guests} guests</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <User size={20} className="text-orange-500" />
                    <span className="font-medium">{confirmationData.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone size={20} className="text-orange-500" />
                    <span className="font-medium">{confirmationData.customer_phone}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600">
                  Please arrive 10 minutes before your reservation time.
                </p>
                <button
                  onClick={handleNewReservation}
                  className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Make Another Reservation
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerReservation;
