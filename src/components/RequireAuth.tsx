// src/components/RequireAuth.tsx
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Navigate, Outlet } from 'react-router-dom';

const RequireAuth = () => {
  // useSessionContext provides the current Supabase session.
  const { session, isLoading } = useSessionContext();

  // Display a brief loading state while checking the session
  if (isLoading) { 
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Checking session...
      </div>
    ); 
  }

  // If no session exists, redirect to the login page
  if (!session) {
    // Navigate handles the immediate redirection
    return <Navigate to="/login" replace />; 
  }

  // If a session exists, render the corresponding Route component (LobbyPage or GamePage)
  return <Outlet />;
};

export default RequireAuth;