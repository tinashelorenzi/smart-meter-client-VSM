import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        ...error,
        response: {
          data: {
            success: false,
            message: 'Network error. Please check your connection and try again.'
          }
        }
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            success: false,
            message: error.response.data?.message || 'Server error. Please try again later.'
          }
        }
      });
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// User meter endpoints
export const meterAPI = {
  getUserMeters: async () => {
    const response = await api.get('/meters/user');
    return response.data;
  },
  
  getMeterInfo: async (deviceId) => {
    const response = await api.get(`/meters/${deviceId}/info`);
    return response.data;
  },
  
  addMeter: async (meterData) => {
    const response = await api.post('/meters/add', meterData);
    return response.data;
  },
  
  topup: async (topupData) => {
    const response = await api.post('/topup', topupData);
    return response.data;
  },
};

// Admin endpoints
export const adminAPI = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  adminTopup: async (topupData) => {
    const response = await api.post('/admin/topup', topupData);
    return response.data;
  },

  getMeterDetails: async (deviceId) => {
    const response = await api.get(`/admin/meters/${deviceId}/details`);
    return response.data;
  },
  
  getMeters: async () => {
    const response = await api.get('/admin/meters');
    return response.data;
  },
  
  getTransactions: async (params = {}) => {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  getUserMeters: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/meters`);
    return response.data;
  },
  
  assignMeter: async (assignmentData) => {
    const response = await api.post('/admin/assign-meter', assignmentData);
    return response.data;
  },
  
  unassignMeter: async (assignmentData) => {
    const response = await api.delete('/admin/unassign-meter', { data: assignmentData });
    return response.data;
  },
  
  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },
  
  forceCompleteTransaction: async (transactionId) => {
    const response = await api.put(`/admin/transactions/${transactionId}/complete`);
    return response.data;
  },
  
  getUnassignedMeters: async () => {
    const response = await api.get('/admin/meters/unassigned');
    return response.data;
  },
  
  createMeter: async (meterData) => {
    const response = await api.post('/admin/meters/create', meterData);
    return response.data;
  },
};

// Utility endpoints
export const utilAPI = {
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
  
  testDatabase: async () => {
    const response = await api.get('/test-db');
    return response.data;
  },
};

export default api;