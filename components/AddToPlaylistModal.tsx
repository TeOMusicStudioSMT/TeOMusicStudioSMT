
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserPlaylist } from '../types';
import { XIcon, PlusCircleIcon, PlaylistIcon } from './icons';
import toast from 'react-hot-toast';

interface AddToPlaylistModalProps {
    trackId: string;
    onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ trackId, onClose }) => {
    const { user, createUserPlaylist, updateUserPlaylist } = useAuth();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

    const userPlaylists = user?.playlists || [];

    const handleAddTrack = (playlist: UserPlaylist) => {
        if (playlist.trackIds.includes(trackId)) {
            toast.error(`Track is already in "${playlist.title}".`);
            return;
        }
        const newTrackIds = [...playlist.trackIds, trackId];
        updateUserPlaylist(playlist.id, { trackIds: newTrackIds });
        toast.success(`Added to "${playlist.title}"!`);
        onClose();
    };

    const handleCreateAndAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPlaylistTitle.trim()) return;
        
        // Create a new playlist
        const newPlaylist: UserPlaylist = {
            id: `user_pl_${Date.now()}`,
            title: newPlaylistTitle,
            description: '',
            trackIds: [trackId] // Add the track immediately
        };

        const updatedUser = { ...user, playlists: [...(user.playlists || []), newPlaylist] };
        // We call updateUser directly here because createUserPlaylist doesn't return the new playlist object
        // and we need to add the track to it in one go. A better approach would be to refactor contexts,
        // but for this implementation this is cleaner.
        const { updateUser } = useAuth();
        updateUser(updatedUser);
        
        toast.success(`Created playlist "${newPlaylistTitle}" and added track!`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[101] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-bg rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Add to Playlist</h3>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white"><XIcon /></button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                    {userPlaylists.map(playlist => (
                        <button key={playlist.id} onClick={() => handleAddTrack(playlist)} className="w-full text-left p-3 bg-brand-surface rounded-lg hover:bg-brand-primary transition-colors flex items-center gap-3">
                            <PlaylistIcon className="w-5 h-5 text-brand-text-secondary" />
                            <span className="text-white">{playlist.title}</span>
                        </button>
                    ))}
                </div>
                {showCreateForm ? (
                    <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-4 border-t border-brand-surface">
                        <input
                            type="text"
                            value={newPlaylistTitle}
                            onChange={e => setNewPlaylistTitle(e.target.value)}
                            placeholder="New playlist name..."
                            className="w-full bg-brand-dark rounded-lg px-3 py-2 text-white"
                        />
                        <button type="submit" className="w-full bg-brand-primary py-2 rounded-lg font-semibold">Create & Add</button>
                    </form>
                ) : (
                    <button onClick={() => setShowCreateForm(true)} className="w-full mt-2 pt-2 border-t border-brand-surface flex items-center justify-center gap-2 text-brand-primary hover:text-white">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Create new playlist</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
