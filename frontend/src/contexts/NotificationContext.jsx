import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Notification Context for managing in-app notifications
 * Integrates with react-toastify for toast notifications
 * Provides notification state management across the application
 */
const NotificationContext = createContext();

/**
 * Custom hook to access notification context
 * @throws {Error} If used outside NotificationProvider
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

/**
 * NotificationProvider Component
 * Wraps the application to provide notification functionality
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Add a new notification to the list and show toast
   * @param {Object} notification - Notification object with type, title, message
   */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification based on type
    const toastOptions = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.message, toastOptions);
        break;
      case 'info':
      default:
        toast.info(notification.message, toastOptions);
    }

    console.log('📢 Notification added:', newNotification);
  }, []);

  /**
   * Mark a specific notification as read
   * @param {number} id - Notification ID
   */
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    console.log(`✅ Notification ${id} marked as read`);
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    console.log('✅ All notifications marked as read');
  }, []);

  /**
   * Remove a specific notification
   * @param {number} id - Notification ID
   */
  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    console.log(`🗑️ Notification ${id} cleared`);
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    console.log('🗑️ All notifications cleared');
  }, []);

  /**
   * Get count of unread notifications
   */
  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * Get recent notifications (last 50)
   */
  const recentNotifications = notifications.slice(0, 50);

  const value = {
    notifications: recentNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    unreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 99999 }}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
