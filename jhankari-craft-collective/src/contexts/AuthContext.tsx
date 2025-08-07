// ==========================================
// IMPORTS & TYPE DEFINITIONS
// ==========================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/config/supabase';
import { apiClient } from '@/config/api';
import {
  getGuestCart,
  clearGuestCart,
  GuestCartItem
} from '@/utils/cart';

// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================
const supabase = getSupabaseClient();

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
  firstname?: string; // For backward compatibility
  lastname?: string;  // For backward compatibility
  phonenumber?: string; // For backward compatibility
}

interface AuthContextType {
  user: User | null;
  session: any;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

// ==========================================
// CONTEXT CREATION
// ==========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// AUTH PROVIDER COMPONENT
// ==========================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasMergedCart, setHasMergedCart] = useState(false);

  // ==========================================
  // USER PROFILE MANAGEMENT FUNCTIONS
  // ==========================================
  const createUserProfileManually = useCallback(async (userId: string) => {
    try {
      console.log('🔧 Creating user profile manually for:', userId);

      // Get user data from Supabase auth
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        console.error('Could not get auth user:', authError);
        return;
      }

      // Extract user data from auth metadata
      const email = authUser.user.email;
      const metadata = authUser.user.user_metadata || {};
      
      const userData = {
        id: userId,
        email: email,
        firstname: metadata.full_name?.split(' ')[0] || metadata.name?.split(' ')[0] || 'User',
        lastname: metadata.full_name?.split(' ').slice(1).join(' ') || metadata.name?.split(' ').slice(1).join(' ') || '',
        phonenumber: metadata.phone || '',
        isactive: true,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      // Create user via backend API
      const response = await apiClient.post('/user', userData);
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ User profile created manually:', response.data.user.email);
      }
    } catch (error) {
      console.error('❌ Manual user creation failed:', error);
    }
  }, []);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      // Add delay to allow database trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('📋 Loading user profile for:', userId);
      const response = await apiClient.get(`/user/${userId}`);
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ User profile loaded from API:', response.data.user.email);
        return;
      }
    } catch (error) {
      console.error('❌ Error loading user profile from API:', error);
      
      // Fallback: Try direct Supabase query
      try {
        console.log('🔄 Trying fallback Supabase query...');
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (dbError) {
          console.error('Supabase query error:', dbError);
          // If user doesn't exist, create manually
          await createUserProfileManually(userId);
          return;
        }

        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ User profile loaded from Supabase fallback:', userData.email);
        }
      } catch (dbError) {
        console.error('❌ Fallback query failed:', dbError);
        // Last resort: create user manually
        await createUserProfileManually(userId);
      }
    }
  }, [createUserProfileManually]);

  // ==========================================
  // CART MANAGEMENT FUNCTIONS
  // ==========================================
  const tryMergeGuestCart = useCallback(async () => {
    if (!user || !user.id || hasMergedCart) return;

    try {
      console.log('🛒 Merging guest cart...');
      
      const guestCartItems = getGuestCart();
      
      if (!guestCartItems || guestCartItems.length === 0) {
        console.log('No guest cart items to merge');
        setHasMergedCart(true);
        return;
      }

      console.log(`Merging ${guestCartItems.length} guest cart items`);

      // Make the merge request with proper data structure
      const response = await apiClient.post('/cart/merge', {
        userId: user.id,
        guestCartItems: guestCartItems
      });

      if (response.data.success) {
        console.log('✅ Guest cart merged successfully');
        clearGuestCart();
        setHasMergedCart(true);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to merge guest cart:', error);
      
      // Set merged to true even on error to prevent infinite loops
      setHasMergedCart(true);
      
      // Don't show error to user if it's just an empty cart issue
      if (error.response?.data?.code !== 'MISSING_REQUIRED_FIELDS') {
        console.error('Unexpected cart merge error:', error.response?.data);
      }
    }
  }, [user, hasMergedCart]);

  // ==========================================
  // AUTHENTICATION FUNCTIONS
  // ==========================================
  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔐 Initiating Google sign-in...');
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        return false;
      }
      
      console.log('✅ Redirecting to Google OAuth...');
      return true;
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🔓 Logging out user...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setHasMergedCart(false);
      localStorage.removeItem('user');
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }, []);

  // ==========================================
  // AUTH STATE EFFECTS
  // ==========================================
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session?.user?.email || 'No session');
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      setSession(session);
      setHasMergedCart(false); // Reset cart merge status on auth change
      
      if (session?.user) {
        // Delay loading for sign-in events to allow backend triggers to complete
        const delay = event === 'SIGNED_IN' ? 3000 : 1000;
        setTimeout(() => {
          loadUserProfile(session.user.id);
        }, delay);
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  // ==========================================
  // CART MERGE EFFECT
  // ==========================================
  useEffect(() => {
    if (session?.user && user && !hasMergedCart) {
      // Small delay to ensure user profile is loaded
      const timer = setTimeout(() => {
        tryMergeGuestCart();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [session, user, hasMergedCart, tryMergeGuestCart]);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================
  const contextValue: AuthContextType = {
    user,
    session,
    isAuthenticated: !!session?.user,
    loading,
    signInWithGoogle,
    logout,
  };

  // ==========================================
  // RENDER PROVIDER
  // ==========================================
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// CUSTOM HOOK
// ==========================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ==========================================
// UTILITY EXPORTS
// ==========================================
export { supabase };
export type { User, AuthContextType };
