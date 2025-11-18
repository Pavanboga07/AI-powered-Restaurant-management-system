import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Repeat, Plus, Edit2, Trash2, Power, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { recurringReservationsAPI } from '../services/api';

const RecurringReservations = () => {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPattern, setEditingPattern] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [generatedReservations, setGeneratedReservations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    pattern_type: 'weekly',
    day_of_week: 0, // Monday
    time: '19:00',
    guests: 2,
    special_requests: '',
    end_date: null
  });

  const daysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  const patternTypes = [
    { value: 'weekly', label: 'Weekly', description: 'Every week on the same day' },
    { value: 'biweekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Same day each month' }
  ];

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const data = await recurringReservationsAPI.getAll();
      setPatterns(data);
    } catch (err) {
      setError('Failed to load recurring reservations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPattern) {
        await recurringReservationsAPI.update(editingPattern.id, formData);
        setSuccess('Pattern updated successfully');
      } else {
        await recurringReservationsAPI.create(formData);
        setSuccess('Pattern created successfully');
      }
      
      setShowAddForm(false);
      setEditingPattern(null);
      resetForm();
      fetchPatterns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save pattern');
      setTimeout(() => setError(''), 3000);
    }
  };

  const togglePattern = async (patternId) => {
    try {
      await recurringReservationsAPI.toggle(patternId);
      setSuccess('Pattern toggled successfully');
      fetchPatterns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to toggle pattern');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deletePattern = async (patternId) => {
    if (!confirm('Delete this recurring pattern? Future auto-generated reservations will be cancelled.')) return;
    
    try {
      await recurringReservationsAPI.delete(patternId, true);
      setSuccess('Pattern deleted successfully');
      fetchPatterns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete pattern');
      setTimeout(() => setError(''), 3000);
    }
  };

  const editPattern = (pattern) => {
    setEditingPattern(pattern);
    setFormData({
      pattern_type: pattern.pattern_type,
      day_of_week: pattern.day_of_week,
      time: pattern.time,
      guests: pattern.guests,
      special_requests: pattern.special_requests || '',
      end_date: pattern.end_date || null
    });
    setShowAddForm(true);
  };

  const viewGeneratedReservations = async (patternId) => {
    try {
      const data = await recurringReservationsAPI.getGeneratedReservations(patternId);
      setGeneratedReservations(data);
      setSelectedPattern(patternId);
    } catch (err) {
      setError('Failed to load generated reservations');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      pattern_type: 'weekly',
      day_of_week: 0,
      time: '19:00',
      guests: 2,
      special_requests: '',
      end_date: null
    });
  };

  const getPatternDescription = (pattern) => {
    const dayName = daysOfWeek.find(d => d.value === pattern.day_of_week)?.label;
    const patternLabel = patternTypes.find(p => p.value === pattern.pattern_type)?.label;
    
    return `${patternLabel} on ${dayName}s at ${pattern.time} for ${pattern.guests} guests`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recurring reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recurring Reservations</h1>
          <p className="text-gray-600">Set up automatic reservations for your regular dining schedule</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Add Pattern Button */}
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingPattern(null);
              resetForm();
            }}
            className="mb-6 flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Create Recurring Pattern</span>
          </button>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingPattern ? 'Edit' : 'Create New'} Recurring Pattern
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pattern Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pattern Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {patternTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, pattern_type: type.value })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.pattern_type === type.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Repeat className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-gray-900">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Day of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Day of Week *
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* End Date (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">Leave empty for indefinite pattern</p>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Any preferences or special requirements..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPattern(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingPattern ? 'Update' : 'Create'} Pattern
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Patterns List */}
        {patterns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recurring Patterns Yet</h3>
            <p className="text-gray-600 mb-6">
              Create a recurring pattern to automatically reserve your favorite table every week!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
                  pattern.is_active ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                {/* Pattern Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {pattern.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        pattern.is_active ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {pattern.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">{getPatternDescription(pattern)}</p>
                    {pattern.end_date && (
                      <p className="text-sm text-gray-600 mt-1">
                        Ends: {new Date(pattern.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => togglePattern(pattern.id)}
                      className={`p-2 rounded-lg ${
                        pattern.is_active ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                      } hover:opacity-80`}
                      title={pattern.is_active ? 'Disable' : 'Enable'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editPattern(pattern)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePattern(pattern.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pattern Details */}
                {pattern.special_requests && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">{pattern.special_requests}</p>
                  </div>
                )}

                {/* View Generated Reservations */}
                <button
                  onClick={() => viewGeneratedReservations(pattern.id)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">View Generated Reservations</span>
                </button>

                {/* Show Generated Reservations */}
                {selectedPattern === pattern.id && generatedReservations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Reservations</h4>
                    <div className="space-y-2">
                      {generatedReservations.slice(0, 5).map((reservation) => (
                        <div
                          key={reservation.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <span className="text-gray-700">
                            {new Date(reservation.reservation_datetime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {reservation.status}
                          </span>
                        </div>
                      ))}
                      {generatedReservations.length > 5 && (
                        <p className="text-xs text-gray-500 text-center pt-2">
                          +{generatedReservations.length - 5} more reservations
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            How Recurring Reservations Work
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Reservations are automatically created 30 days in advance</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>You can enable/disable patterns anytime without deleting them</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Set an end date to automatically stop the pattern after a certain time</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Deleting a pattern will cancel all future auto-generated reservations</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecurringReservations;
