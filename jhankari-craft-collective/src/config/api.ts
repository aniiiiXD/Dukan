import axios from 'axios';

// Use the correct backend URL (your most recent deployment)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD 
    ? 'https://server2-6vsc774nb-princes-projects-53a1e3ae.vercel.app/api/v1'
    : 'http://localhost:3000/api/v1'
  );

console.log('🛠️ Running in', import.meta.env.MODE, 'mode');
console.log('📡 API Base URL:', API_BASE_URL);
console.log('🌐 Site URL:', window.location.origin);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for serverless cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for debugging
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use(request => {
    console.log('🔗 API Request:', request.method?.toUpperCase(), request.url);
    return request;
  });

  apiClient.interceptors.response.use(
    response => {
      console.log('✅ API Response:', response.status, response.config.url?.split('/').pop());
      return response;
    },
    error => {
      console.error('❌ API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
}
