import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ThumbsUp,
  Check,
  X,
  AlertCircle,
  Filter,
  TrendingUp,
  Award,
} from 'lucide-react';
import { reviewsAPI } from '../../../services/api';

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
  ];

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? { status: filterStatus } : {};
      const data = await reviewsAPI.getAll(params);
      setReviews(data);
      const statsData = await reviewsAPI.getStats();
      setStats(statsData);
    } catch (error) {
      showToast('Failed to fetch reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterStatus]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleModerate = async (reviewId, status) => {
    try {
      await reviewsAPI.moderate(reviewId, status);
      showToast(`Review ${status}!`, 'success');
      fetchReviews();
    } catch (error) {
      showToast('Failed to moderate review', 'error');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;

    try {
      await reviewsAPI.delete(reviewId);
      showToast('Review deleted!', 'success');
      fetchReviews();
    } catch (error) {
      showToast('Failed to delete review', 'error');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
          />
        ))}
      </div>
    );
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
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Review Management</h1>
        <p className="text-slate-600">Moderate customer reviews and ratings</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-slate-600">Total Reviews</p>
            <p className="text-2xl font-bold">{stats.total_reviews}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending_reviews}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-green-700">Approved</p>
            <p className="text-2xl font-bold text-green-800">{stats.approved_reviews}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-md p-4">
            <p className="text-sm text-red-700">Rejected</p>
            <p className="text-2xl font-bold text-red-800">{stats.rejected_reviews}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-md p-4">
            <Award className="text-blue-500 mb-2" size={24} />
            <p className="text-sm text-blue-700">Avg Rating</p>
            <p className="text-2xl font-bold text-blue-800">{stats.average_rating.toFixed(1)} ⭐</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Star size={64} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {renderStars(review.rating)}
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        review.status === 'approved'
                          ? 'bg-green-500 text-white'
                          : review.status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {review.status.toUpperCase()}
                    </span>
                  </div>

                  {review.title && <h3 className="text-lg font-bold text-slate-800 mb-2">{review.title}</h3>}

                  {review.comment && <p className="text-slate-700 mb-3">{review.comment}</p>}

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>By: {review.customer_name || 'Anonymous'}</span>
                    {review.menu_item && <span>• {review.menu_item.name}</span>}
                    <span>• {new Date(review.created_at).toLocaleDateString()}</span>
                    {review.helpful_count > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={14} />
                        {review.helpful_count}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleModerate(review.id, 'approved')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                      >
                        <Check size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerate(review.id, 'rejected')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                      >
                        <X size={18} />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewManager;
