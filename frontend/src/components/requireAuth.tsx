import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

interface RequireAuthProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const userRole = user.role;
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === 'customer') {
        return <Navigate to="/dashboard/customer" replace />;
      } else if (userRole === 'vendor') {
        const path = user.vendor_type === 'Company' ? '/dashboard/company' : '/dashboard/individual';
        return <Navigate to={path} replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RequireAuth;