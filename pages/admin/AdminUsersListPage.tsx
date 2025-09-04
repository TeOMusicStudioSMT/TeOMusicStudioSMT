

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowRightIcon, StarIcon, CrownIcon, UserPlusIcon, Trash2Icon } from '../../components/icons';
import { SubscriptionTier } from '../../types';
import toast from 'react-hot-toast';

const AdminUsersListPage: React.FC = () => {
  const { allUsers, deleteUser } = useAuth();

  const handleDelete = (email: string, name: string) => {
      if (window.confirm(`Are you sure you want to permanently delete the user: ${name}? This action cannot be undone.`)) {
          deleteUser(email);
          toast.success(`User ${name} has been deleted.`);
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Users</h1>
        <ReactRouterDOM.Link to="/admin/users/new" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90 flex items-center gap-2">
          <UserPlusIcon className="w-5 h-5"/>
          <span>Create New User</span>
        </ReactRouterDOM.Link>
      </div>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {allUsers.map(user => (
            <div key={user.email} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-brand-primary overflow-hidden`}>
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : user.avatarInitial}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{user.name}</h2>
                  <p className="text-sm text-brand-text-secondary">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                    <div className="flex items-center justify-end space-x-1 font-semibold text-white">
                        <span>{user.tier}</span>
                        {user.tier === SubscriptionTier.PREMIUM && <StarIcon className="w-4 h-4 text-brand-accent" />}
                        {user.tier === SubscriptionTier.VIP && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <p className="text-sm text-brand-text-secondary">{user.points.toLocaleString()} Points</p>
                </div>
                <div className="flex items-center space-x-4">
                    <ReactRouterDOM.Link
                      to={`/admin/users/${encodeURIComponent(user.email)}/edit`}
                      className="flex items-center space-x-2 text-brand-primary hover:text-white transition-colors"
                    >
                      <span>Edit</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </ReactRouterDOM.Link>
                    <button onClick={() => handleDelete(user.email, user.name)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10" title={`Delete ${user.name}`}>
                        <Trash2Icon className="w-5 h-5" />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersListPage;
