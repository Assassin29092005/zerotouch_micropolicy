import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth Service
export const authService = {
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async login(credentials, isAdmin = false) {
    try {
      const endpoint = isAdmin ? '/admin/login' : '/auth/login';
      const response = await api.post(endpoint, credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Policy Service
export const policyService = {
  async getPolicyTypes() {
    try {
      const response = await api.get('/policies/types');
      return response;
    } catch (error) {
      throw error;
    }
  },

  async purchasePolicy(policyData) {
    try {
      const response = await api.post('/policies/purchase', policyData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getMyPolicies() {
    try {
      const response = await api.get('/policies/my-policies');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Admin Service
export const adminService = {
  async getDashboardData() {
    try {
      const response = await api.get('/admin/dashboard');
      return response;
    } catch (error) {
      throw error;
    }
  },

  async simulateEvent(eventData) {
    try {
      const response = await api.post('/admin/simulate-event', eventData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getUsers() {
    try {
      const response = await api.get('/admin/users');
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getEvents() {
    try {
      const response = await api.get('/admin/events');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default api;
