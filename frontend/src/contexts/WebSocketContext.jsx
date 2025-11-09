import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:8000/ws';
const RECONNECT_INTERVAL = 3000; // 3 seconds

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Get user from localStorage
  const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  // Connect to WebSocket
  const connect = useCallback(() => {
    const user = getUser();
    
    if (!user) {
      console.log('No user found, skipping WebSocket connection');
      return;
    }

    // Don't create multiple connections
    if (socketRef.current?.connected) {
      console.log('Already connected');
      return;
    }

    console.log('Connecting to WebSocket...', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: RECONNECT_INTERVAL,
      reconnectionAttempts: Infinity,
      autoConnect: true,
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setSocket(newSocket);

      // Join room based on user role
      newSocket.emit('join_room', {
        user_id: user.id,
        role: user.role,
        username: user.username,
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Room events
    newSocket.on('room_joined', (data) => {
      console.log('Successfully joined room:', data);
      addToast({
        type: 'success',
        message: `Connected to ${data.room}`,
      });
    });

    newSocket.on('error', (data) => {
      console.error('WebSocket error:', data);
      addToast({
        type: 'error',
        message: data.message || 'WebSocket error occurred',
      });
    });

    return newSocket;
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Auto-connect on mount and user change
  useEffect(() => {
    const user = getUser();
    if (user) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [connect, disconnect]);

  // Subscribe to an event
  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      console.log(`Subscribed to event: ${event}`);
    }
  }, []);

  // Unsubscribe from an event
  const unsubscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
      console.log(`Unsubscribed from event: ${event}`);
    }
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      console.log(`Emitted event: ${event}`, data);
    } else {
      console.warn('Cannot emit event, socket not connected');
    }
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Add toast notification
  const addToast = useCallback((toast) => {
    const newToast = {
      id: Date.now(),
      duration: 5000, // 5 seconds default
      ...toast,
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, newToast.duration);
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to all notification events
  useEffect(() => {
    if (!socket) return;

    // New order event
    socket.on('new_order', (data) => {
      console.log('New order received:', data);
      addNotification({
        type: 'new_order',
        title: 'New Order',
        message: data.message,
        data: data.order,
      });
      addToast({
        type: 'info',
        message: `🍽️ ${data.message}`,
      });
    });

    // Order ready event
    socket.on('order_ready', (data) => {
      console.log('Order ready:', data);
      addNotification({
        type: 'order_ready',
        title: 'Order Ready',
        message: data.message,
        data: data.order,
      });
      addToast({
        type: 'success',
        message: `✅ ${data.message}`,
      });
    });

    // Order status changed event
    socket.on('order_status_changed', (data) => {
      console.log('Order status changed:', data);
      addNotification({
        type: 'order_status_changed',
        title: 'Order Update',
        message: data.message,
        data: data.order,
      });
    });

    // Inventory low event
    socket.on('inventory_low', (data) => {
      console.log('Inventory low:', data);
      addNotification({
        type: 'inventory_low',
        title: 'Low Inventory Alert',
        message: data.message,
        data: data.inventory,
        severity: 'warning',
      });
      addToast({
        type: 'warning',
        message: `⚠️ ${data.message}`,
      });
    });

    // Table updated event
    socket.on('table_updated', (data) => {
      console.log('Table updated:', data);
      addNotification({
        type: 'table_updated',
        title: 'Table Update',
        message: data.message,
        data: data.table,
      });
    });

    // Reservation created event
    socket.on('reservation_created', (data) => {
      console.log('Reservation created:', data);
      addNotification({
        type: 'reservation_created',
        title: 'New Reservation',
        message: data.message,
        data: data.reservation,
      });
      addToast({
        type: 'info',
        message: `📅 ${data.message}`,
      });
    });

    // Custom notifications
    socket.on('custom_notification', (data) => {
      console.log('Custom notification:', data);
      addNotification({
        type: 'custom',
        title: data.title || 'Notification',
        message: data.message,
        data: data.data,
      });
    });

    // Cleanup listeners
    return () => {
      socket.off('new_order');
      socket.off('order_ready');
      socket.off('order_status_changed');
      socket.off('inventory_low');
      socket.off('table_updated');
      socket.off('reservation_created');
      socket.off('custom_notification');
    };
  }, [socket, addNotification, addToast]);

  const value = {
    socket,
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    emit,
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
    toasts,
    addToast,
    removeToast,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
