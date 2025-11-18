import React, { useState } from 'react';
import { Bell, X, Check, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotificationBell Component
 * Displays notification bell icon with badge and dropdown list
 * Shows all unread and recent notifications with actions
 */
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAll 
  } = useNotifications();

  // Close dropdown when clicking outside
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Get notification icon color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info':
      default: return 'text-blue-400';
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="text-white" size={24} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Bell className="text-primary-400" size={20} />
                  <h3 className="text-white font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all read</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                      title="Clear all notifications"
                    >
                      <Trash2 size={14} />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-96">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="mx-auto mb-3 opacity-50" size={48} />
                    <p className="font-medium">No notifications</p>
                    <p className="text-sm mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 hover:bg-slate-700/50 transition-colors ${
                          !notification.read ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {notification.title && (
                              <h4 className={`text-white font-semibold text-sm mb-1 ${getNotificationColor(notification.type)}`}>
                                {notification.title}
                              </h4>
                            )}
                            <p className="text-slate-300 text-sm break-words">
                              {notification.message}
                            </p>
                            <p className="text-slate-500 text-xs mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-primary-400 hover:text-primary-300 hover:bg-primary-500/20 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => clearNotification(notification.id)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                              title="Remove notification"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-700 bg-slate-800/95 backdrop-blur-sm text-center">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
