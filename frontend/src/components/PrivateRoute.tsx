import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
  roles: string[];
}

export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  if (!token || !role || !roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
