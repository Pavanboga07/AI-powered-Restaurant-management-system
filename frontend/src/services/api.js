import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/json', { username, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// Menu API
export const menuAPI = {
  getAll: async (params = {}) => {
    // params can include: category, search, sort_by, sort_order, skip, limit
    const response = await api.get('/menu', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  create: async (itemData) => {
    const response = await api.post('/menu', itemData);
    return response.data;
  },

  update: async (id, itemData) => {
    const response = await api.put(`/menu/${id}`, itemData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },

  toggleAvailability: async (id) => {
    const response = await api.patch(`/menu/${id}/toggle`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/menu/categories/list');
    return response.data;
  },

  bulkCreate: async (items) => {
    const response = await api.post('/menu/batch', items);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/menu/stats/summary');
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/orders', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  create: async (orderData) => {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/orders/${id}/status`, { status });
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/api/orders/${id}`);
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get('/api/orders/stats/summary', { params });
    return response.data;
  },
};

// Tables API
export const tablesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/tables', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/tables/${id}`);
    return response.data;
  },

  create: async (tableData) => {
    const response = await api.post('/api/tables', tableData);
    return response.data;
  },

  update: async (id, tableData) => {
    const response = await api.put(`/api/tables/${id}`, tableData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/tables/${id}`);
    return response.data;
  },

  markForCleaning: async (id) => {
    const response = await api.post(`/api/tables/${id}/mark-for-cleaning`);
    return response.data;
  },

  completeCleaning: async (id) => {
    const response = await api.post(`/api/tables/${id}/complete-cleaning`);
    return response.data;
  },
};

// Reservations API
export const reservationsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/reservations', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/reservations/${id}`);
    return response.data;
  },

  create: async (reservationData) => {
    const response = await api.post('/api/reservations', reservationData);
    return response.data;
  },

  update: async (id, reservationData) => {
    const response = await api.put(`/api/reservations/${id}`, reservationData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/reservations/${id}`);
    return response.data;
  },

  checkAvailability: async (availabilityData) => {
    const response = await api.post('/api/reservations/availability', availabilityData);
    return response.data;
  },

  confirm: async (id) => {
    const response = await api.post(`/api/reservations/${id}/confirm`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/api/reservations/${id}/cancel`);
    return response.data;
  },

  checkin: async (id) => {
    const response = await api.post(`/api/reservations/${id}/checkin`);
    return response.data;
  },
};

// Billing API
export const billingAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/billing', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/billing/${id}`);
    return response.data;
  },

  getByOrder: async (orderId) => {
    const response = await api.get(`/api/billing/order/${orderId}`);
    return response.data;
  },

  create: async (billData) => {
    const response = await api.post('/api/billing', billData);
    return response.data;
  },

  applyCoupon: async (billId, couponCode) => {
    const response = await api.post(`/api/billing/${billId}/apply-coupon`, { coupon_code: couponCode });
    return response.data;
  },

  removeCoupon: async (billId) => {
    const response = await api.delete(`/api/billing/${billId}/remove-coupon`);
    return response.data;
  },

  splitBill: async (billId, splitCount) => {
    const response = await api.post(`/api/billing/${billId}/split`, { split_count: splitCount });
    return response.data;
  },

  updatePayment: async (billId, paymentData) => {
    const response = await api.put(`/api/billing/${billId}/payment`, paymentData);
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get('/api/billing/stats/summary', { params });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/billing/${id}`);
    return response.data;
  },
};

// Coupons API
export const couponsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/coupons', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/coupons/${id}`);
    return response.data;
  },

  create: async (couponData) => {
    const response = await api.post('/api/coupons', couponData);
    return response.data;
  },

  update: async (id, couponData) => {
    const response = await api.put(`/api/coupons/${id}`, couponData);
    return response.data;
  },

  toggle: async (id) => {
    const response = await api.patch(`/api/coupons/${id}/toggle`);
    return response.data;
  },

  validate: async (code, orderTotal) => {
    const response = await api.post('/api/coupons/validate', { code, order_total: orderTotal });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/coupons/stats/summary');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/coupons/${id}`);
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/reviews', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/reviews/${id}`);
    return response.data;
  },

  create: async (reviewData) => {
    const response = await api.post('/api/reviews', reviewData);
    return response.data;
  },

  update: async (id, reviewData) => {
    const response = await api.put(`/api/reviews/${id}`, reviewData);
    return response.data;
  },

  moderate: async (id, status) => {
    const response = await api.patch(`/api/reviews/${id}/moderate`, { status });
    return response.data;
  },

  markHelpful: async (id) => {
    const response = await api.post(`/api/reviews/${id}/helpful`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/reviews/stats/summary');
    return response.data;
  },

  getMenuItemRating: async (menuItemId) => {
    const response = await api.get(`/api/reviews/menu-item/${menuItemId}/rating`);
    return response.data;
  },

  getTopRated: async (limit = 10) => {
    const response = await api.get('/api/reviews/menu-items/top-rated', { params: { limit } });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/reviews/${id}`);
    return response.data;
  },
};

// ============ Analytics API ============
export const analyticsAPI = {
  getDashboardStats: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/dashboard', { params });
    return response.data;
  },

  getRevenueTrend: async (period = 'daily', dateFrom = null, dateTo = null) => {
    const params = { period };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/revenue-trend', { params });
    return response.data;
  },

  getPopularItems: async (dateFrom = null, dateTo = null, limit = 10) => {
    const params = { limit };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/popular-items', { params });
    return response.data;
  },

  getOrdersByHour: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/orders-by-hour', { params });
    return response.data;
  },

  getCategoryPerformance: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/category-performance', { params });
    return response.data;
  },

  getPaymentMethods: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/payment-methods', { params });
    return response.data;
  },

  // Advanced Analytics
  getStaffPerformance: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/staff-performance', { params });
    return response.data;
  },

  getTableUtilization: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/table-utilization', { params });
    return response.data;
  },

  getCustomerInsights: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/customer-insights', { params });
    return response.data;
  },

  getRevenueForecast: async (days = 7) => {
    const response = await api.get('/api/analytics/revenue-forecast', { params: { days } });
    return response.data;
  },

  getPeakHoursDetailed: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/api/analytics/peak-hours-detailed', { params });
    return response.data;
  },

  getMenuPerformance: async (dateFrom = null, dateTo = null, category = null) => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (category) params.category = category;
    const response = await api.get('/api/analytics/menu-performance', { params });
    return response.data;
  },
};

// ============ QR Code API ============
export const qrAPI = {
  getTableQR: async (tableId) => {
    const response = await api.get(`/api/qr/table/${tableId}`);
    return response.data;
  },

  generateBatch: async (tableIds) => {
    const response = await api.post('/api/qr/batch', { table_ids: tableIds });
    return response.data;
  },

  checkIn: async (tableId, data) => {
    const response = await api.post(`/api/qr/checkin/${tableId}`, data);
    return response.data;
  },
};

// ============ Shifts API ============
export const shiftsAPI = {
  create: async (shiftData) => {
    const response = await api.post('/api/shifts', shiftData);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/api/shifts', { params });
    return response.data;
  },

  getWeekly: async (weekStart = null) => {
    const params = {};
    if (weekStart) params.week_start = weekStart;
    const response = await api.get('/api/shifts/weekly', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/shifts/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/shifts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/shifts/${id}`);
    return response.data;
  },

  checkConflict: async (shiftData) => {
    const response = await api.post('/api/shifts/check-conflict', shiftData);
    return response.data;
  },
};

// Chef API
export const chefAPI = {
  // Order Management
  getActiveOrders: async () => {
    const response = await api.get('/api/chef/orders/active');
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/api/chef/orders/${orderId}/status`, { status });
    return response.data;
  },

  getOrderStats: async () => {
    const response = await api.get('/api/chef/orders/stats');
    return response.data;
  },

  // Menu Control
  toggleMenuItem: async (menuItemId, isAvailable) => {
    const response = await api.patch(`/api/chef/menu/${menuItemId}/toggle`, { is_available: isAvailable });
    return response.data;
  },

  getMenuItems: async () => {
    const response = await api.get('/api/chef/menu/items');
    return response.data;
  },

  // Messaging
  sendMessage: async (messageData) => {
    const response = await api.post('/api/chef/messages', messageData);
    return response.data;
  },

  getMessages: async () => {
    const response = await api.get('/api/chef/messages');
    return response.data;
  },

  markMessageRead: async (messageId) => {
    const response = await api.patch(`/api/chef/messages/${messageId}/read`);
    return response.data;
  },

  // Shift Handover
  createHandover: async (handoverData) => {
    const response = await api.post('/api/chef/shift-handover', handoverData);
    return response.data;
  },

  getLatestHandover: async () => {
    const response = await api.get('/api/chef/shift-handover/latest');
    return response.data;
  },

  getHandoverHistory: async () => {
    const response = await api.get('/api/chef/shift-handover/history');
    return response.data;
  },
};

// ============ Staff API ============
export const staffAPI = {
  // Order operations
  getOrderStats: async () => {
    const response = await api.get('/api/staff/orders/stats');
    return response.data;
  },

  getTodaysOrders: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/staff/orders/today', { params: { skip, limit } });
    return response.data;
  },

  getOrdersByStatus: async (status, skip = 0, limit = 100) => {
    const response = await api.get(`/api/staff/orders/status/${status}`, { params: { skip, limit } });
    return response.data;
  },

  searchOrders: async (searchTerm, skip = 0, limit = 20) => {
    const response = await api.get('/api/staff/orders/search', { params: { q: searchTerm, skip, limit } });
    return response.data;
  },

  // Table operations
  getAllTables: async () => {
    const response = await api.get('/api/staff/tables');
    return response.data;
  },

  getTablesByStatus: async (status) => {
    const response = await api.get(`/api/staff/tables/status/${status}`);
    return response.data;
  },

  getTableDetails: async (tableId) => {
    const response = await api.get(`/api/staff/tables/${tableId}/details`);
    return response.data;
  },

  updateTableStatus: async (tableId, status) => {
    const response = await api.put(`/api/staff/tables/${tableId}/status`, null, { params: { status } });
    return response.data;
  },

  // Service requests
  createServiceRequest: async (requestData) => {
    const response = await api.post('/api/staff/service-requests', requestData);
    return response.data;
  },

  getServiceRequests: async (status = null, skip = 0, limit = 100) => {
    const params = { skip, limit };
    if (status) params.status = status;
    const response = await api.get('/api/staff/service-requests', { params });
    return response.data;
  },

  getMyServiceRequests: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/staff/service-requests/my', { params: { skip, limit } });
    return response.data;
  },

  updateServiceRequest: async (requestId, updateData) => {
    const response = await api.put(`/api/staff/service-requests/${requestId}`, updateData);
    return response.data;
  },

  assignServiceRequest: async (requestId, staffId) => {
    const response = await api.put(`/api/staff/service-requests/${requestId}/assign/${staffId}`);
    return response.data;
  },

  getPendingRequestsCount: async () => {
    const response = await api.get('/api/staff/service-requests/stats/pending');
    return response.data;
  },

  // Customer operations
  searchCustomers: async (searchTerm, skip = 0, limit = 20) => {
    const response = await api.get('/api/staff/customers/search', { params: { q: searchTerm, skip, limit } });
    return response.data;
  },

  getCustomerByPhone: async (phone) => {
    const response = await api.get(`/api/staff/customers/phone/${phone}`);
    return response.data;
  },

  getCustomerOrderHistory: async (customerId, skip = 0, limit = 10) => {
    const response = await api.get(`/api/staff/customers/${customerId}/orders`, { params: { skip, limit } });
    return response.data;
  },

  // Reservation operations
  getTodaysReservations: async () => {
    const response = await api.get('/api/staff/reservations/today');
    return response.data;
  },

  getUpcomingReservations: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/staff/reservations/upcoming', { params: { skip, limit } });
    return response.data;
  },

  checkInReservation: async (reservationId, tableId) => {
    const response = await api.put(`/api/staff/reservations/${reservationId}/check-in`, null, { params: { table_id: tableId } });
    return response.data;
  },

  // Messaging
  sendMessage: async (messageData) => {
    const response = await api.post('/api/staff/messages', messageData);
    return response.data;
  },

  getMessages: async (messageType = null, skip = 0, limit = 50) => {
    const params = { skip, limit };
    if (messageType) params.message_type = messageType;
    const response = await api.get('/api/staff/messages', { params });
    return response.data;
  },

  markMessageRead: async (messageId) => {
    const response = await api.put(`/api/staff/messages/${messageId}/read`);
    return response.data;
  },
};

// ==================== CUSTOMER API (Phase 3) ====================
export const customerAPI = {
  // Menu Browsing
  browseMenu: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.diet_type) params.append('diet_type', filters.diet_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.available_only !== undefined) params.append('available_only', filters.available_only);
    if (filters.skip) params.append('skip', filters.skip);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/api/customer/menu?${params.toString()}`);
    return response.data;
  },

  getMenuCategories: async () => {
    const response = await api.get('/api/customer/menu/categories');
    return response.data;
  },

  getFeaturedItems: async (limit = 6) => {
    const response = await api.get('/api/customer/menu/featured', { params: { limit } });
    return response.data;
  },

  getMenuItemDetails: async (itemId) => {
    const response = await api.get(`/api/customer/menu/${itemId}`);
    return response.data;
  },

  searchMenu: async (searchTerm, skip = 0, limit = 20) => {
    const response = await api.get('/api/customer/menu/search', { 
      params: { q: searchTerm, skip, limit } 
    });
    return response.data;
  },

  // Favorites
  addFavorite: async (menuItemId) => {
    const response = await api.post('/api/customer/favorites', { menu_item_id: menuItemId });
    return response.data;
  },

  removeFavorite: async (menuItemId) => {
    const response = await api.delete(`/api/customer/favorites/${menuItemId}`);
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get('/api/customer/favorites');
    return response.data;
  },

  checkIfFavorited: async (menuItemId) => {
    const response = await api.get(`/api/customer/favorites/check/${menuItemId}`);
    return response.data;
  },

  // Online Ordering
  placeOrder: async (orderData) => {
    const response = await api.post('/api/customer/orders', orderData);
    return response.data;
  },

  getMyOrders: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/customer/orders', { params: { skip, limit } });
    return response.data;
  },

  trackOrder: async (orderId, customerEmail = null) => {
    const params = customerEmail ? { customer_email: customerEmail } : {};
    const response = await api.get(`/api/customer/orders/${orderId}/track`, { params });
    return response.data;
  },

  // Customer Profile
  getProfile: async () => {
    const response = await api.get('/api/customer/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/api/customer/profile', profileData);
    return response.data;
  },

  // Reviews
  createReview: async (reviewData) => {
    const response = await api.post('/api/customer/reviews', reviewData);
    return response.data;
  },

  getMyReviews: async (skip = 0, limit = 20) => {
    const response = await api.get('/api/customer/reviews/my', { params: { skip, limit } });
    return response.data;
  },

  // Recommendations
  getRecommendations: async (limit = 6) => {
    const response = await api.get('/api/customer/recommendations', { params: { limit } });
    return response.data;
  },
};

export default api;
