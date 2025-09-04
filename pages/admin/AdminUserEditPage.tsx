

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, SubscriptionTier } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import { Trash2Icon } from '../../components/icons';

const AdminUserEditPage: React.FC = () => {
  const { userEmail } = ReactRouterDOM.useParams<{ userEmail: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { allUsers, updateUser, deleteUser } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const decodedEmail = userEmail ? decodeURIComponent(userEmail) : '';
    const foundUser = allUsers.find(u => u.email === decodedEmail);
    if (foundUser) {
        if (!user || user.email !== foundUser.email) {
            setUser(JSON.parse(JSON.stringify(foundUser)));
        }
    }
  }, [userEmail, allUsers, user]);

  if (!user) {
    return <NotFoundPage message="User not found" />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prev => {
        if (!prev) return null;
        if (name === 'points') {
            return { ...prev, points: parseInt(value, 10) || 0 };
        }
        return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      updateUser(user);
      toast.success(`${user.name}'s profile updated successfully!`);
      navigate('/admin/users');
    }
  };
  
  const handleDelete = () => {
      if (window.confirm(`Are you sure you want to permanently delete the user: ${user.name}? This action cannot be undone.`)) {
          deleteUser(user.email);
          toast.success(`User ${user.name} has been deleted.`);
          navigate('/admin/users');
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Edit User: <span className="text-brand-primary">{user.name}</span></h1>
        <button onClick={handleDelete} className="bg-red-500/20 text-red-400 font-semibold px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2">
            <Trash2Icon className="w-5 h-5"/>
            <span>Delete User</span>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-lg">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-brand-text-secondary cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Subscription Tier</label>
          <select
            name="tier"
            value={user.tier}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {Object.values(SubscriptionTier).map(tier => (
                <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">S.M.T. Points</label>
          <input
            type="number"
            name="points"
            value={user.points}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={() => navigate('/admin/users')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">
                Cancel
            </button>
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                Save Changes
            </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserEditPage;
