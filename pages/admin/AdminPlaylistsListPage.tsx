import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';

const AdminPlaylistsListPage: React.FC = () => {
  const { playlists, deletePlaylist } = useContent();

  const handleDelete = (playlistId: string) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylist(playlistId);
      toast.success('Playlist deleted!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Playlists</h1>
        <ReactRouterDOM.Link to="/admin/playlists/new" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90">
          Add New Playlist
        </ReactRouterDOM.Link>
      </div>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {playlists.map(playlist => (
            <div key={playlist.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src={playlist.coverImageUrl} alt={playlist.title} className="w-16 h-16 rounded-md object-cover" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{playlist.title}</h2>
                  <p className="text-sm text-brand-text-secondary">{playlist.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <ReactRouterDOM.Link to={`/admin/playlists/${playlist.id}/edit`} className="text-brand-primary hover:text-white">
                  Edit
                </ReactRouterDOM.Link>
                <button onClick={() => handleDelete(playlist.id)} className="text-red-500 hover:text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPlaylistsListPage;
