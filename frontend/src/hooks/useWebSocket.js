import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

/**
 * Custom hook for WebSocket connection with automatic reconnection
 * Integrates with existing backend WebSocket (backend/app/websocket.py)
 * 
 * @param {string} room - Room to join (manager, chef, staff, customer)
 * @param {Object} user - Current user object with id and role
 * @returns {Object} Socket instance, connection status, and last message
 */
export const useWebSocket = (room, user) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // Don't connect if user or room not provided
    if (!user || !room) {
      console.log('⏸️ WebSocket: Waiting for user and room');
      return;
    }

    console.log(`🔌 Initializing WebSocket connection for room: ${room}`);

    // Connect to existing backend WebSocket server
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('access_token'),
        user_id: user.id,
        role: user.role
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      setIsConnected(true);
      
      // Join the appropriate room based on user role
      socket.emit('join_room', { 
        room, 
        user_id: user.id, 
        role: user.role,
        username: user.username || user.email || `user_${user.id}`
      });
      console.log(`📍 Joined room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    // Event listeners for real-time updates
    socket.on('new_order', (data) => {
      console.log('🔔 New order received:', data);
      setLastMessage({ type: 'new_order', data, timestamp: Date.now() });
      toast.info(`🆕 New Order #${data.order_id}`, {
        position: 'top-right',
        autoClose: 5000
      });
    });

    socket.on('order_status_changed', (data) => {
      console.log('🔄 Order status changed:', data);
      setLastMessage({ type: 'order_status_changed', data, timestamp: Date.now() });
      toast.success(`📦 Order #${data.order_id} is now ${data.new_status}`, {
        position: 'top-right',
        autoClose: 4000
      });
    });

    socket.on('table_status_changed', (data) => {
      console.log('🪑 Table status changed:', data);
      setLastMessage({ type: 'table_status_changed', data, timestamp: Date.now() });
      toast.info(`🪑 Table ${data.table_number} is now ${data.new_status}`, {
        position: 'top-right',
        autoClose: 3000
      });
    });

    socket.on('inventory_low', (data) => {
      console.log('⚠️ Low inventory alert:', data);
      setLastMessage({ type: 'inventory_low', data, timestamp: Date.now() });
      toast.warning(`⚠️ Low stock: ${data.inventory?.item_name || 'Unknown item'}`, {
        position: 'top-right',
        autoClose: 6000
      });
    });

    socket.on('custom_notification', (data) => {
      console.log('📬 Custom notification:', data);
      setLastMessage({ type: 'custom_notification', data, timestamp: Date.now() });
      toast.info(data.message || 'New notification', {
        position: 'top-right',
        autoClose: 5000
      });
    });

    socket.on('reservation_update', (data) => {
      console.log('📅 Reservation updated:', data);
      setLastMessage({ type: 'reservation_update', data, timestamp: Date.now() });
      toast.info(`📅 Reservation #${data.reservation_id} updated`, {
        position: 'top-right',
        autoClose: 4000
      });
    });

    // Cleanup function
    return () => {
      if (socket.connected) {
        console.log(`👋 Leaving room: ${room}`);
        socket.emit('leave_room', { room, user_id: user.id });
        socket.disconnect();
      }
    };
  }, [room, user]);

  // Helper method to emit custom events
  const emit = (eventName, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(eventName, data);
      console.log(`📤 Emitted event: ${eventName}`, data);
    } else {
      console.warn('⚠️ Cannot emit event: Socket not connected');
    }
  };

  return { 
    socket: socketRef.current, 
    isConnected, 
    lastMessage,
    emit
  };
};

export default useWebSocket;
