import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { apiClient } from '@/config/api';
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

 // Update the auth state change handler
useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Initial session check:', session?.user?.email || 'No session');
    setSession(session);
    if (session?.user) {
      loadUserProfile(session.user.id);
    }
    setLoading(false);
  });

  // Listen for auth changes  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email || 'No user');
    setSession(session);
    setHasMergedCart(false);
    
    if (session?.user) {
      // For sign-in events, wait longer for the trigger to complete
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
}, []);


  const loadUserProfile = async (userId: string) => {
  try {
    // Add delay to allow database trigger to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Loading user profile for:', userId);
    const response = await apiClient.get(`/user/${userId}`);
    
    if (response.data.success) {
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('User profile loaded from API:', response.data.user.email);
      return;
    }
  } catch (error) {
    console.error('Error loading user profile from API:', error);
    
    // Fallback: Try direct Supabase query
    try {
      console.log('Trying fallback Supabase query...');
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbError) {
        console.error('Supabase query error:', dbError);
        // If user doesn't exist in public.users, trigger manual creation
        await createUserProfileManually(userId);
        return;
      }

      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User profile loaded from Supabase fallback:', userData.email);
      }
    } catch (dbError) {
      console.error('Fallback query failed:', dbError);
    }
  }
};

// Add this new function to manually create user profile
const createUserProfileManually = async (userId: string) => {
  try {
    // Get user data from auth.users via Supabase
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser.user) {
      console.error('Could not get auth user:', authError);
      return;
    }

    // Extract user data
    const email = authUser.user.email;
    const metadata = authUser.user.user_metadata || {};
    
    const userData = {
      id: userId,
      email: email,
      firstname: metadata.full_name?.split(' ')[0] || metadata.name?.split(' ')[0] || 'User',
      lastname: metadata.full_name?.split(' ').slice(1).join(' ') || metadata.name?.split(' ').slice(1).join(' ') || null,
      phonenumber: metadata.phone || null,
      isactive: true,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };

    // Insert into public.users via backend API
    const response = await apiClient.post('/user', userData);
    
    if (response.data.success) {
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('User profile created manually:', response.data.user.email);
    }
  } catch (error) {
    console.error('Manual user creation failed:', error);
  }
};





  // Merge guest cart
  useEffect(() => {
    async function tryMergeGuestCart() {
      if (!session?.user || !user) return;
      if (hasMergedCart) return;
      
      const guestCart: GuestCartItem[] = getGuestCart();
      if (guestCart.length === 0) return;

      try {
        console.log('🛒 Merging guest cart...');
        await apiClient.post('/cart/merge', { userId: user.id, items: guestCart });
        clearGuestCart();
        setHasMergedCart(true);
        console.log('✅ Cart merged successfully');
      } catch (e) {
        console.error('❌ Failed to merge guest cart:', e);
      }
    }
    tryMergeGuestCart();
  }, [session, user, hasMergedCart]);

  const signInWithGoogle = async (): Promise<boolean> => {
  try {
    console.log('Initiating Google sign-in...')
    // Use current origin for redirect
    const redirectTo = `${window.location.origin}/auth/callback`
    console.log('Redirect URL:', redirectTo)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (error) {
      console.error('Google sign in error:', error)
      return false
    }
    
    console.log('Redirecting to Google OAuth...')
    return true
  } catch (error) {
    console.error('Google sign in failed:', error)
    return false
  }
}


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
