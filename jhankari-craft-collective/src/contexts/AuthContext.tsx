import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import { useToast } from '../hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Function to manually refresh auth state
  const refreshAuth = async () => {
    try {
      console.log('🔄 Manually refreshing auth state...')
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error refreshing session:', error)
      } else if (currentSession) {
        console.log('✅ Session refreshed successfully:', currentSession.user.email)
        setSession(currentSession)
        setUser(currentSession.user)
      } else {
        console.log('🔍 No session found during refresh')
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Auth refresh error:', error)
    }
  }

  useEffect(() => {
    console.log('🔍 AuthContext initializing...')
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true)
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error getting initial session:', error)
        } else if (initialSession) {
          console.log('✅ Found existing session:', initialSession.user.email)
          setSession(initialSession)
          setUser(initialSession.user)
        } else {
          console.log('🔍 Initial session check: No session')
        }
      } catch (error) {
        console.error('❌ Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user')
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in successfully:', session.user.email)
          
          // Show success toast
          toast({
            title: "Welcome back!",
            description: `Signed in as ${session.user.email}`,
          })
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          
          // Clear local state
          setSession(null)
          setUser(null)
          
          toast({
            title: "Signed out",
            description: "You have been signed out successfully",
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed for user:', session.user.email)
          setSession(session)
          setUser(session.user)
        }
      }
    )

    // Also listen for storage changes (for cross-tab auth sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token') {
        console.log('🔄 Auth storage changed, refreshing...')
        refreshAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [toast])

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('🔄 Initiating Google sign-in...')
      
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log('🌐 Redirect URL:', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ Google sign in error:', error)
        toast({
          title: "Login failed",
          description: error.message || "Failed to initiate Google login",
          variant: "destructive"
        })
        return false
      }

      console.log('✅ Redirecting to Google OAuth...')
      return true
    } catch (error) {
      console.error('❌ Google sign in failed:', error)
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
      return false
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      console.log('🔄 Signing out...')
      setLoading(true)
      
      // Try to get current session first
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        // If session exists, attempt to sign out
        try {
          const { error } = await supabase.auth.signOut({ scope: 'local' })
          
          if (error) {
            // These errors are common with OAuth and can be safely ignored
            if (error.message.includes('Auth session missing') || 
                error.message.includes('session_not_found')) {
              console.log('ℹ️ Session already cleared on server (this is normal)')
            } else {
              console.warn('⚠️ Sign out API warning (continuing anyway):', error.message)
            }
          } else {
            console.log('✅ Server sign out successful')
          }
        } catch (serverError: any) {
          // Suppress common OAuth errors but log unexpected ones
          if (!serverError.message?.includes('Auth session missing')) {
            console.warn('⚠️ Server sign out issue (continuing with local cleanup):', serverError.message)
          }
        }
      } else {
        console.log('ℹ️ No active session found, clearing local state only')
      }
      
      // Always clear local state regardless of server response
      setSession(null)
      setUser(null)
      
      // Clear any stored auth data
      if (typeof window !== 'undefined') {
        try {
          // Clear Supabase auth data
          localStorage.removeItem('supabase.auth.token')
          
          // Clear any other auth-related storage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.auth')) {
              localStorage.removeItem(key)
            }
          })
          
          // Clear session storage
          sessionStorage.clear()
        } catch (storageError) {
          console.log('ℹ️ Storage cleanup completed')
        }
      }
      
      console.log('✅ User signed out successfully')
      
    } catch (error: any) {
      // Only log unexpected errors
      if (!error.message?.includes('Auth session missing')) {
        console.error('❌ Unexpected sign out error:', error)
      }
      
      // Still clear local state even if there are errors
      setSession(null)
      setUser(null)
      
      // Clear stored data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('supabase.auth.token')
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.auth')) {
              localStorage.removeItem(key)
            }
          })
          sessionStorage.clear()
        } catch {
          // Silent cleanup
        }
      }
      
      console.log('✅ Local state cleared despite server issues')
      
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
