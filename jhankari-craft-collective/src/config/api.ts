// Environment detection
const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

// Environment-specific configuration
const config = {
  development: {
    apiBaseUrl: 'http://localhost:3000/api/v1',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    siteUrl: 'http://localhost:5173',
    siteName: 'Jhankari (Dev)',
    debug: true,
    timeout: 10000
  },
  production: {
    apiBaseUrl: 'https://api.jhankari.com/api/v1',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    siteUrl: 'https://jhankari.com',
    siteName: 'Jhankari Craft Collective',
    debug: false,
    timeout: 30000
  }
};

const currentConfig = config[environment] || config.development;

// Export environment-aware configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || currentConfig.apiBaseUrl;

export const SITE_CONFIG = {
  name: currentConfig.siteName,
  url: currentConfig.siteUrl,
  environment: environment,
  debug: currentConfig.debug,
  description: 'Authentic Rajasthani Crafts and Textiles',
  social: {
    twitter: '@jhankari_crafts',
    instagram: '@jhankari.crafts',
    facebook: 'jhankari.crafts'
  }
};

export const SUPABASE_CONFIG = {
  url: currentConfig.supabaseUrl,
  anonKey: currentConfig.supabaseAnonKey
};

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: currentConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Environment-aware error handling
apiClient.interceptors.request.use((config) => {
  if (currentConfig.debug) {
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (currentConfig.debug) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (currentConfig.debug) {
      console.error('❌ API Error:', error.response?.data || error.message);
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      if (environment === 'development') {
        console.warn('🔓 Authentication required in development');
      }
      // Don't auto-redirect in dev mode for debugging
      if (environment === 'production') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Environment indicator for development
if (currentConfig.debug) {
  console.log(`🛠️ Running in ${environment} mode`);
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log(`🌐 Site URL: ${currentConfig.siteUrl}`);
}
