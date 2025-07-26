export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const api = {
  products: `${API_BASE_URL}/products`,
  users: `${API_BASE_URL}/user`,
  cart: `${API_BASE_URL}/cart`,
  orders: `${API_BASE_URL}/order`,
  signin: `${API_BASE_URL}/user/signin`,
  health: `http://localhost:3000/health`
};

// Axios instance with base configuration
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
