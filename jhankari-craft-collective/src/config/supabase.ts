import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const api = {
  products: `${API_BASE_URL}/products`,
  users: `${API_BASE_URL}/user`,
  cart: `${API_BASE_URL}/cart`,
  orders: `${API_BASE_URL}/order`,
  signin: `${API_BASE_URL}/user/signin`,
};
