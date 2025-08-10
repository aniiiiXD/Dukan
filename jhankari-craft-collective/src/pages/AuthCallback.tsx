import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { useAuth } from '../contexts/AuthContext'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...')
        console.log('🔍 Current URL:', window.location.href)
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.slice(1))
        
        const code = urlParams.get('code') || hashParams.get('code')
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token')
        
        console.log('🔍 Found params:', { 
          code: !!code, 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken,
          fullUrl: window.location.href
        })
        
        if (code) {
          console.log('✅ Authorization code found, exchanging for session...')
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('❌ Auth callback error:', error)
            navigate('/?error=auth_failed', { replace: true })
            return
          }
          
          if (data.session && data.user) {
            console.log('✅ OAuth callback successful, user:', data.user.email)
            
            // Force session refresh to ensure frontend recognizes the user
            await supabase.auth.refreshSession()
            
            // Small delay to ensure auth context updates
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 1000)
            
          } else {
            console.log('❌ No session found in callback')
            navigate('/?error=no_session', { replace: true })
          }
        } else if (accessToken) {
          console.log('✅ Access token found, setting session...')
          
          // Try to get user with the access token
          const { data: { user }, error } = await supabase.auth.getUser(accessToken)
          
          if (error || !user) {
            console.error('❌ Error getting user with token:', error)
            navigate('/?error=token_invalid', { replace: true })
            return
          }
          
          console.log('✅ User found with token:', user.email)
          
          // Force session refresh
          await supabase.auth.refreshSession()
          
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 1000)
          
        } else {
          console.log('❌ No authorization code or token found')
          console.log('🔍 URL search params:', window.location.search)
          console.log('🔍 URL hash:', window.location.hash)
          navigate('/?error=no_code', { replace: true })
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error)
        navigate('/?error=callback_failed', { replace: true })
      }
    }

    // Delay execution to ensure URL parameters are fully loaded
    const timer = setTimeout(handleAuthCallback, 500)
    
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-royal-purple to-royal-crimson rounded-full flex items-center justify-center mb-4">
          <span className="text-white text-2xl font-bold">J</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
        <p className="text-muted-foreground">Please wait while we sign you in.</p>
        <div className="mt-4">
          <div className="w-8 h-8 border-4 border-royal-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        {/* Debug info for testing */}
        <div className="mt-4 text-xs text-gray-500">
          <p>URL: {window.location.href}</p>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
