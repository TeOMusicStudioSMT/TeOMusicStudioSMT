import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { isAdmin } = useAuth();
    
    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }
    
    return children;
};

export default ProtectedRoute;