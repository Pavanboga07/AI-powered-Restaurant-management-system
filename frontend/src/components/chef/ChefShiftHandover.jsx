import React, { useState, useEffect } from 'react';
import { chefAPI } from '../../services/api';
import { ClipboardList, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ChefShiftHandover = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [handoverHistory, setHandoverHistory] = useState([]);
  const [latestHandover, setLatestHandover] = useState(null);
  const [formData, setFormData] = useState({
    shift_date: new Date().toISOString().split('T')[0],
    shift_type: 'morning',
    prep_work_completed: '',
    low_stock_items: '',
    pending_tasks: '',
    incidents: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHandoverHistory();
    }
    fetchLatestHandover();
  }, [activeTab]);

  const fetchHandoverHistory = async () => {
    try {
      const data = await chefAPI.getHandoverHistory();
      setHandoverHistory(data);
    } catch (error) {
      console.error('Failed to fetch handover history:', error);
    }
  };

  const fetchLatestHandover = async () => {
    try {
      const data = await chefAPI.getLatestHandover();
      setLatestHandover(data);
    } catch (error) {
      // No handover found is okay
      console.log('No previous handover found');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await chefAPI.createHandover(formData);
      alert('Shift handover report created successfully');
      setFormData({
        shift_date: new Date().toISOString().split('T')[0],
        shift_type: 'morning',
        prep_work_completed: '',
        low_stock_items: '',
        pending_tasks: '',
        incidents: '',
      });
      fetchLatestHandover();
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to create handover:', error);
      alert('Failed to create handover report');
    } finally {
      setSubmitting(false);
    }
  };

  const HandoverCard = ({ handover, isLatest = false }) => (
    <div className={`card p-6 ${isLatest ? 'border-2 border-primary-500' : ''}`}>
      {isLatest && (
        <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
          Latest Handover
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">
            {new Date(handover.shift_date).toLocaleDateString()}
          </h3>
          <p className="text-sm text-slate-600">
            {handover.shift_type.charAt(0).toUpperCase() + handover.shift_type.slice(1)} Shift
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>{handover.chef?.full_name || handover.chef?.username}</p>
          <p>{new Date(handover.created_at).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {handover.prep_work_completed && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h4 className="font-semibold">Prep Work Completed</h4>
            </div>
            <p className="text-slate-700 pl-6">{handover.prep_work_completed}</p>
          </div>
        )}

        {handover.low_stock_items && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h4 className="font-semibold">Low Stock Items</h4>
            </div>
            <p className="text-slate-700 pl-6">{handover.low_stock_items}</p>
          </div>
        )}

        {handover.pending_tasks && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold">Pending Tasks</h4>
            </div>
            <p className="text-slate-700 pl-6">{handover.pending_tasks}</p>
          </div>
        )}

        {handover.incidents && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h4 className="font-semibold">Incidents / Notes</h4>
            </div>
            <p className="text-slate-700 pl-6">{handover.incidents}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <ClipboardList className="w-8 h-8" />
        Shift Handover
      </h1>

      {/* Latest Handover Alert */}
      {latestHandover && activeTab === 'create' && (
        <div className="mb-6">
          <HandoverCard handover={latestHandover} isLatest />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'create'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Create New Handover
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          View History
        </button>
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Shift Date</label>
                <input
                  type="date"
                  value={formData.shift_date}
                  onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Shift Type</label>
                <select
                  value={formData.shift_type}
                  onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Prep Work Completed
              </label>
              <textarea
                value={formData.prep_work_completed}
                onChange={(e) => setFormData({ ...formData, prep_work_completed: e.target.value })}
                rows="3"
                className="input-field resize-none"
                placeholder="List all prep work completed during shift..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Low Stock Items
              </label>
              <textarea
                value={formData.low_stock_items}
                onChange={(e) => setFormData({ ...formData, low_stock_items: e.target.value })}
                rows="3"
                className="input-field resize-none"
                placeholder="List items running low that need restocking..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pending Tasks
              </label>
              <textarea
                value={formData.pending_tasks}
                onChange={(e) => setFormData({ ...formData, pending_tasks: e.target.value })}
                rows="3"
                className="input-field resize-none"
                placeholder="List tasks that need to be completed in next shift..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Incidents / Additional Notes
              </label>
              <textarea
                value={formData.incidents}
                onChange={(e) => setFormData({ ...formData, incidents: e.target.value })}
                rows="3"
                className="input-field resize-none"
                placeholder="Note any incidents, equipment issues, or other important information..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Submitting...' : 'Create Handover Report'}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {handoverHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No handover reports found
            </div>
          ) : (
            handoverHistory.map((handover) => (
              <HandoverCard key={handover.id} handover={handover} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ChefShiftHandover;
