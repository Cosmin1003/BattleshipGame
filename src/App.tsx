// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
import { type Session } from '@supabase/supabase-js';

// Importă paginile și componentele
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import RequireAuth from './components/RequireAuth';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  // Folosim useEffect pentru a prelua sesiunea inițială și a asculta schimbările
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    // SessionContextProvider înfășoară aplicația pentru a furniza starea de autentificare
    <SessionContextProvider supabaseClient={supabase} initialSession={session}>
      <BrowserRouter>
        <Routes>
          {/* Ruta Publică */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rute Protejate (accesibile doar dacă ești logat) */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<LobbyPage />} /> 
            <Route path="/game/:gameId" element={<GamePage />} /> {/* :gameId este codul camerei */}
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionContextProvider>
  );
}

export default App;