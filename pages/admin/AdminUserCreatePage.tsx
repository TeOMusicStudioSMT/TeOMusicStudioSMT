
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, SubscriptionTier } from '../../types';
import toast from 'react-hot-toast';

const AdminUserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { createUser } = useAuth();
  
  const [newUser, setNewUser] = useState({
      name: '',
      email: '',
      tier: SubscriptionTier.FREE,
      points: 100,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => {
        if (name === 'points') {
            return { ...prev, points: parseInt(value, 10) || 0 };
        }
        return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
        toast.error("Name and Email are required.");
        return;
    }

    const success = createUser(newUser);
    if (success) {
      toast.success(`User "${newUser.name}" created successfully!`);
      navigate('/admin/users');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Create New User</h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-lg">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Full Name</label>
          <input
            type="text"
            name="name"
            value={newUser.name}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="User's full name"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Email</label>
          <input
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Subscription Tier</label>
          <select
            name="tier"
            value={newUser.tier}
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
            value={newUser.points}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={() => navigate('/admin/users')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">
                Cancel
            </button>
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                Create User
            </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserCreatePage;
