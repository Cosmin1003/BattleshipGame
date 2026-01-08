// src/pages/LoginPage.tsx
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const LoginPage = () => {
  const session = useSession(); 
  const supabase = useSupabaseClient(); 
  const navigate = useNavigate(); 

  // If the user is already logged in, navigate to the home page
  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  if (session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Redirecting...
      </div>
    ); 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-4 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-center text-white">Battleship Login</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['google']} 
          redirectTo={`battleship-game-alpha.vercel.app`} 
          socialLayout="horizontal"
        />
      </div>
    </div>
  );
};

export default LoginPage;