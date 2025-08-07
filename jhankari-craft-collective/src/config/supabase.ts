// ==========================================
// IMPORTS & TYPE DEFINITIONS
// ==========================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==========================================
// ENVIRONMENT VARIABLES VALIDATION
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
}

// ==========================================
// SINGLETON SUPABASE CLIENT
// ==========================================
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance with proper configuration
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'jhankari-auth-token',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'jhankari-frontend',
      },
    },
  });

  return supabaseInstance;
};

// ==========================================
// DEFAULT EXPORT FOR BACKWARD COMPATIBILITY
// ==========================================
export const supabase = getSupabaseClient();

// ==========================================
// API CONFIGURATION
// ==========================================
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const api = {
  products: `${API_BASE_URL}/products`,
  users: `${API_BASE_URL}/user`,
  cart: `${API_BASE_URL}/cart`,
  orders: `${API_BASE_URL}/orders`,
  auth: `${API_BASE_URL}/auth`,
  signin: `${API_BASE_URL}/user/signin`,
} as const;

// ==========================================
// ENVIRONMENT INFO (FOR DEBUGGING)
// ==========================================
export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  environment: import.meta.env.MODE || 'development',
} as const;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
export const resetSupabaseInstance = (): void => {
  supabaseInstance = null;
};

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};
