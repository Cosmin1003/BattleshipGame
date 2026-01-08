import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
import { type Session } from '@supabase/supabase-js';

// Import pages and components
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import RequireAuth from './components/RequireAuth';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  // Use useEffect to fetch the initial session and listen for auth changes
  useEffect(() => {
    // Get the session that might already exist in local storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth events (Sign In, Sign Out, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Cleanup: unsubscribe when the app component is destroyed
    return () => subscription.unsubscribe();
  }, []);

  return (
    // SessionContextProvider wraps the app to provide auth state to all hooks (like useSession)
    <SessionContextProvider supabaseClient={supabase} initialSession={session}>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes (only accessible if logged in) */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<LobbyPage />} /> 
            {/* :gameId represents the dynamic room code */}
            <Route path="/game/:gameId" element={<GamePage />} /> 
          </Route>
        </Routes>
      </BrowserRouter>
      <Analytics />
    </SessionContextProvider>
  );
}

export default App;