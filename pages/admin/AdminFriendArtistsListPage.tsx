import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';
import { FriendArtist } from '../../types';

const AdminFriendArtistsListPage: React.FC = () => {
  const { friendArtists, deleteFriendArtist } = useContent();

  const handleDelete = (friend: FriendArtist) => {
    if (window.confirm(`Are you sure you want to delete "${friend.name}"?`)) {
      deleteFriendArtist(friend.id);
      toast.success('Friend deleted successfully!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Friends & Collaborators</h1>
        <ReactRouterDOM.Link to="/admin/friends/new" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90">
          Add New Friend
        </ReactRouterDOM.Link>
      </div>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {friendArtists.map(friend => (
            <div key={friend.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src={friend.imageUrl} alt={friend.name} className="w-16 h-16 rounded-md object-cover" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{friend.name}</h2>
                  <p className="text-sm text-brand-text-secondary">{friend.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <ReactRouterDOM.Link to={`/admin/friends/${friend.id}/edit`} className="text-brand-primary hover:text-white">
                  Edit
                </ReactRouterDOM.Link>
                <button onClick={() => handleDelete(friend)} className="text-red-500 hover:text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
           {friendArtists.length === 0 && (
            <p className="text-brand-text-secondary text-center py-4">No friends or collaborators have been added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFriendArtistsListPage;
