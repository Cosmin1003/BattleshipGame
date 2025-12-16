// src/components/RequireAuth.tsx
import { useSession } from '@supabase/auth-helpers-react';
import { Navigate, Outlet } from 'react-router-dom';

const RequireAuth = () => {
  // useSession oferă sesiunea Supabase curentă.
  const session = useSession(); 

  // Afișăm o stare de loading scurtă în timpul verificării
  if (session === undefined) { 
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>; 
  }

  // Dacă nu există sesiune, redirecționează la login
  if (!session) {
    // Navigate face redirecționarea imediată
    return <Navigate to="/login" replace />; 
  }

  // Dacă există sesiune, afișează componenta Route corespunzătoare (LobbyPage sau GamePage)
  return <Outlet />;
};

export default RequireAuth;