import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { Playlist, PlaylistCategory } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import ImageGenerationInput from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';

const AdminPlaylistEditPage: React.FC = () => {
  const { playlistId } = ReactRouterDOM.useParams<{ playlistId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { playlists, addPlaylist, updatePlaylist, artists } = useContent();
  
  const isEditing = playlistId !== undefined;
  const originalPlaylist = isEditing ? playlists.find(p => p.id === playlistId) : null;

  const getNewPlaylist = (): Playlist => ({
    id: `pl_${Date.now()}`,
    title: '',
    description: '',
    coverImageUrl: '',
    trackIds: [],
    category: PlaylistCategory.TEO_OFFICIAL,
    externalUrl: '',
  });

  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    if (isEditing) {
      if (originalPlaylist && (!playlist || playlist.id !== originalPlaylist.id)) {
        setPlaylist({ ...originalPlaylist });
      }
    } else {
      if (!playlist) {
        setPlaylist(getNewPlaylist());
      }
    }
  }, [playlistId, playlists, playlist, isEditing, originalPlaylist]);

  if (!playlist) {
      return isEditing ? <NotFoundPage message="Playlist not found" /> : <div>Loading...</div>;
  }
  
  const handleValueChange = (name: keyof Playlist, value: string) => {
    setPlaylist(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    handleValueChange(name as keyof Playlist, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist) return;

    if (isEditing) {
      updatePlaylist(playlist);
      toast.success('Playlist updated successfully!');
    } else {
      addPlaylist(playlist);
      toast.success('Playlist added successfully!');
    }
    navigate('/admin/playlists');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        {isEditing ? `Edit Playlist: ${playlist.title}` : 'Add New Playlist'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Title</label>
          <input type="text" name="title" value={playlist.title} onChange={handleChange} className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
         <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Category</label>
           <select 
                name="category" 
                value={playlist.category} 
                onChange={handleChange} 
                className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
             {Object.values(PlaylistCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
             ))}
           </select>
        </div>
        <TextGenerationInput
            label="Description"
            value={playlist.description}
            onValueChange={(newValue) => handleValueChange('description', newValue)}
            placeholder="A short, catchy description for the playlist..."
            generationContext={{ title: playlist.title, category: playlist.category }}
            minHeight="100px"
        />
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Cover Image URL</label>
          <ImageGenerationInput
            value={playlist.coverImageUrl}
            onValueChange={(newValue) => handleValueChange('coverImageUrl', newValue)}
            placeholder="https://... or generate"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">External URL (to Spotify, YouTube, etc.)</label>
          <input type="text" name="externalUrl" value={playlist.externalUrl || ''} onChange={handleChange} placeholder="https://..." className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/playlists')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">Cancel</button>
          <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">Save Playlist</button>
        </div>
      </form>
    </div>
  );
};

export default AdminPlaylistEditPage;
