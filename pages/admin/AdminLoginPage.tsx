import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const { adminLogin, isAdmin } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  if (isAdmin) {
    return <ReactRouterDOM.Navigate to="/admin/jason-dashboard" replace />;
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(password)) {
      navigate('/admin/jason-dashboard');
      toast.success('Login Successful!');
    } else {
      toast.error('Incorrect Password');
    }
  };

  return (
    <div className="bg-brand-dark min-h-screen flex items-center justify-center p-4" style={{
      backgroundImage: `radial-gradient(circle at top left, rgba(138, 66, 219, 0.2) 0%, transparent 30%), radial-gradient(circle at bottom right, rgba(217, 74, 140, 0.2) 0%, transparent 30%)`
    }}>
      <div className="w-full max-w-sm mx-auto bg-brand-bg rounded-2xl shadow-2xl shadow-brand-primary/10 p-8">
        <h1 className="text-2xl font-bold text-center text-white">S.M.T. Control Room</h1>
        <p className="text-center text-brand-text-secondary mb-8">Admin Access</p>
        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Enter admin password"
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg text-lg hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
