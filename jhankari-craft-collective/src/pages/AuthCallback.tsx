import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          navigate('/?error=auth_failed');
          return;
        }

        if (data.session) {
          console.log('✅ OAuth callback successful, user:', data.session.user.email);
          navigate('/', { replace: true });
        } else {
          console.log('⚠️ No session found in callback');
          navigate('/?error=no_session');
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error);
        navigate('/?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-royal-purple to-royal-crimson rounded-full flex items-center justify-center mb-4">
          <span className="text-white text-2xl font-bold">झ</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
        <p className="text-muted-foreground">Please wait while we sign you in.</p>
        <div className="mt-4">
          <div className="w-8 h-8 border-4 border-royal-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
