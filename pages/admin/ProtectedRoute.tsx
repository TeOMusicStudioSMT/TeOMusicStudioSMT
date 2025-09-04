import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    // Redirect them to the /admin/login page, but save the current location they were
    // trying to go to. This is a good practice for UX, though not fully implemented here.
    return <ReactRouterDOM.Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
