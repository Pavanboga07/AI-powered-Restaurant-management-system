import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, 
  AlertCircle, CheckCircle, Download, RefreshCw, X, Clock, User 
} from 'lucide-react';
import { shiftsAPI, authAPI } from '../../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SHIFT_TYPES = {
  morning: { label: 'Morning', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', time: '6:00 AM - 2:00 PM' },
  afternoon: { label: 'Afternoon', color: 'bg-orange-100 text-orange-800 border-orange-300', time: '2:00 PM - 10:00 PM' },
  evening: { label: 'Evening', color: 'bg-purple-100 text-purple-800 border-purple-300', time: '6:00 PM - 12:00 AM' },
  night: { label: 'Night', color: 'bg-blue-100 text-blue-800 border-blue-300', time: '10:00 PM - 6:00 AM' }
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EmployeeScheduling = () => {
  const [weeklySchedule, setWeeklySchedule] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    shift_type: 'morning',
    start_time: '06:00',
    end_time: '14:00'
  });

  useEffect(() => {
    fetchWeeklySchedule();
  }, [currentWeekStart]);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  const fetchWeeklySchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shiftsAPI.getWeekly(currentWeekStart);
      setWeeklySchedule(data);
      setEmployees(data.employees);
    } catch (err) {
      setError('Failed to load schedule');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (employeeId, date) => {
    setEditingShift(null);
    setFormData({
      employee_id: employeeId,
      date: date,
      shift_type: 'morning',
      start_time: '06:00',
      end_time: '14:00'
    });
    setShowModal(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);
    setFormData({
      employee_id: shift.employee_id,
      date: shift.date,
      shift_type: shift.shift_type,
      start_time: shift.start_time,
      end_time: shift.end_time
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShift(null);
    setFormData({
      employee_id: '',
      date: '',
      shift_type: 'morning',
      start_time: '06:00',
      end_time: '14:00'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Check for conflicts first
      const conflictCheck = await shiftsAPI.checkConflict(formData);
      if (conflictCheck.has_conflict) {
        setError(`Conflict detected: ${conflictCheck.message}`);
        setLoading(false);
        return;
      }

      if (editingShift) {
        await shiftsAPI.update(editingShift.id, formData);
        setSuccess('Shift updated successfully');
      } else {
        await shiftsAPI.create(formData);
        setSuccess('Shift created successfully');
      }

      closeModal();
      fetchWeeklySchedule();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save shift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      setLoading(true);
      await shiftsAPI.delete(shiftId);
      setSuccess('Shift deleted successfully');
      fetchWeeklySchedule();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete shift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (direction) => {
    const current = new Date(currentWeekStart);
    current.setDate(current.getDate() + (direction * 7));
    setCurrentWeekStart(getMonday(current));
  };

  const getShiftForDay = (employeeId, date) => {
    if (!weeklySchedule) return [];
    return weeklySchedule.shifts.filter(
      shift => shift.employee_id === employeeId && shift.date === date
    );
  };

  const exportToPDF = () => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Employee Schedule', 14, 15);
      
      // Week range
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Week: ${weeklySchedule.week_start} to ${weeklySchedule.week_end}`, 14, 22);

      // Prepare table data
      const headers = [['Employee', ...DAYS_OF_WEEK]];
      const rows = employees.map(emp => {
        const row = [emp.username];
        for (let i = 0; i < 7; i++) {
          const date = new Date(weeklySchedule.week_start);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          const shifts = getShiftForDay(emp.id, dateStr);
          
          const shiftText = shifts.map(s => 
            `${SHIFT_TYPES[s.shift_type].label}\n${s.start_time}-${s.end_time}`
          ).join('\n');
          
          row.push(shiftText || '-');
        }
        return row;
      });

      pdf.autoTable({
        head: headers,
        body: rows,
        startY: 28,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' }
        }
      });

      pdf.save(`schedule-${weeklySchedule.week_start}.pdf`);
      setSuccess('Schedule exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export PDF');
      console.error(err);
    }
  };

  const updateShiftType = (type) => {
    const times = {
      morning: { start_time: '06:00', end_time: '14:00' },
      afternoon: { start_time: '14:00', end_time: '22:00' },
      evening: { start_time: '18:00', end_time: '00:00' },
      night: { start_time: '22:00', end_time: '06:00' }
    };
    setFormData({ ...formData, shift_type: type, ...times[type] });
  };

  if (loading && !weeklySchedule) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Scheduling</h2>
            <p className="text-gray-600 mt-1">
              {weeklySchedule && `${weeklySchedule.week_start} to ${weeklySchedule.week_end}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => changeWeek(-1)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentWeekStart(getMonday(new Date()))}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
              >
                This Week
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => changeWeek(1)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchWeeklySchedule}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>

            {weeklySchedule && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export PDF</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </motion.div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(SHIFT_TYPES).map(([key, shift]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${shift.color.split(' ')[0]}`}></div>
              <span className="text-sm text-gray-700">{shift.label}</span>
              <span className="text-xs text-gray-500">({shift.time})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Grid */}
      {weeklySchedule && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b sticky left-0 bg-gray-50 z-10">
                    Employee
                  </th>
                  {DAYS_OF_WEEK.map((day, index) => {
                    const date = new Date(weeklySchedule.week_start);
                    date.setDate(date.getDate() + index);
                    const dateStr = date.toISOString().split('T')[0];
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    return (
                      <th key={day} className={`px-4 py-3 text-center text-sm font-semibold border-b min-w-[150px] ${isToday ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}>
                        <div>{day}</div>
                        <div className="text-xs font-normal text-gray-600 mt-1">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white border-r">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {employee.username}
                      </div>
                    </td>
                    {DAYS_OF_WEEK.map((day, index) => {
                      const date = new Date(weeklySchedule.week_start);
                      date.setDate(date.getDate() + index);
                      const dateStr = date.toISOString().split('T')[0];
                      const shifts = getShiftForDay(employee.id, dateStr);
                      const isToday = dateStr === new Date().toISOString().split('T')[0];

                      return (
                        <td key={day} className={`px-2 py-2 ${isToday ? 'bg-blue-50/50' : ''}`}>
                          <div className="space-y-1">
                            {shifts.map((shift) => (
                              <motion.div
                                key={shift.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`${SHIFT_TYPES[shift.shift_type].color} px-2 py-1 rounded border text-xs group relative`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div>
                                    <div className="font-semibold">{SHIFT_TYPES[shift.shift_type].label}</div>
                                    <div className="text-xs opacity-75">{shift.start_time} - {shift.end_time}</div>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditModal(shift)}
                                      className="p-1 hover:bg-white/50 rounded"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(shift.id)}
                                      className="p-1 hover:bg-white/50 rounded"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openAddModal(employee.id, dateStr)}
                              className="w-full py-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Plus className="w-4 h-4 mx-auto" />
                            </motion.button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Shift Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingShift ? 'Edit Shift' : 'Add Shift'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee
                    </label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={editingShift}
                    >
                      <option value="">Select employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.username}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shift Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(SHIFT_TYPES).map(([key, shift]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateShiftType(key)}
                          className={`p-3 rounded-lg border-2 font-medium transition-all ${
                            formData.shift_type === key
                              ? shift.color
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {shift.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : editingShift ? 'Update' : 'Create'}
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

export default EmployeeScheduling;
