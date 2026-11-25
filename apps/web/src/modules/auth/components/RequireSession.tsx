import { useAuth } from '@clerk/react';
import { Navigate, Outlet } from 'react-router-dom';

export function RequireSession() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });

  if (!isLoaded) return <div className="auth" aria-busy="true" />;
  if (!isSignedIn) return <Navigate to="/auth/sign-in" replace />;
  return <Outlet />;
}
