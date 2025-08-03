import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { apiClient, SITE_CONFIG } from '@/config/api';
import {
  getGuestCart,
  clearGuestCart,
  GuestCartItem
} from '@/utils/cart';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  session: any;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasMergedCart, setHasMergedCart] = useState(false);

  // Get initial session/user on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      setSession(session);
      setHasMergedCart(false);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const response = await apiClient.get(`/user/${userId}`);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ User profile loaded:', response.data.user.email);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Merge guest cart into user cart after login
  useEffect(() => {
    async function tryMergeGuestCart() {
      if (!session?.user || !user) return;
      if (hasMergedCart) return; // Prevent multiple merges
      const guestCart: GuestCartItem[] = getGuestCart();
      if (guestCart.length === 0) return;

      try {
        await apiClient.post('/cart/merge', { userId: user.id, items: guestCart });
        clearGuestCart();
        setHasMergedCart(true);
        console.log('Cart merged after login');
      } catch (e) {
        console.error('Failed to merge guest cart:', e);
      }
    }
    tryMergeGuestCart();
  }, [session, user, hasMergedCart]);

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('🔐 Initiating Google sign-in...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${SITE_CONFIG.url}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Google sign in failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🔓 Logging out user...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem('user');
      setHasMergedCart(false);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!session?.user,
      loading,
      signInWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
