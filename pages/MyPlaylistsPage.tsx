
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import * as ReactRouterDOM from 'react-router-dom';
import { UserPlaylist } from '../types';
import { PlaylistIcon, XIcon, PlayIcon, Trash2Icon, MoreHorizontalIcon } from '../components/icons';
import toast from 'react-hot-toast';

const CreatePlaylistModal: React.FC<{
    onClose: () => void;
    onCreate: (title: string, description: string) => void;
}> = ({ onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Playlist title is required.");
            return;
        }
        onCreate(title, description);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-bg rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Create New Playlist</h3>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="My Awesome Mix"
                        className="w-full bg-brand-surface rounded-lg px-4 py-2 text-white placeholder-brand-text-secondary"
                    />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="A short description for your playlist..."
                        className="w-full bg-brand-surface rounded-lg px-4 py-2 text-white placeholder-brand-text-secondary min-h-[80px]"
                        rows={3}
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-brand-surface px-4 py-2 rounded-lg hover:opacity-80">Cancel</button>
                        <button type="submit" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PlaylistCard: React.FC<{ playlist: UserPlaylist }> = ({ playlist }) => {
    const navigate = ReactRouterDOM.useNavigate();
    const { allTracksMap, playPlaylist } = useContent();
    const { deleteUserPlaylist } = useAuth();

    const tracks = playlist.trackIds.map(id => allTracksMap.get(id)).filter(Boolean);

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (tracks.length > 0) {
            playPlaylist(tracks);
            toast.success(`Playing "${playlist.title}"`);
        } else {
            toast.error("This playlist is empty.");
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the playlist "${playlist.title}"?`)) {
            deleteUserPlaylist(playlist.id);
        }
    };

    const coverImages = tracks.slice(0, 4).map(t => t?.coverImageUrl);

    return (
        <div onClick={() => navigate(`/my-playlists/${playlist.id}`)} className="bg-brand-surface rounded-lg p-4 flex flex-col group hover:shadow-lg hover:shadow-brand-primary/20 transition-all cursor-pointer hover:-translate-y-1">
            <div className="relative aspect-square w-full bg-brand-dark rounded-md mb-4 grid grid-cols-2 grid-rows-2 overflow-hidden">
                {coverImages.length > 0 ? (
                    coverImages.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full h-full object-cover" />
                    ))
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center col-span-2 row-span-2">
                        <PlaylistIcon className="w-1/3 h-1/3 text-brand-surface" />
                    </div>
                )}
            </div>
            <div className="flex-grow">
                <h3 className="text-lg font-bold text-white truncate">{playlist.title}</h3>
                <p className="text-sm text-brand-text-secondary">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-primary/10">
                <div className="flex items-center gap-2">
                    <button onClick={handlePlay} className="p-2 bg-brand-primary/20 text-brand-primary rounded-full hover:bg-brand-primary hover:text-white transition-colors"><PlayIcon className="w-4 h-4" /></button>
                </div>
                <button onClick={handleDelete} className="p-2 text-brand-text-secondary hover:text-red-500 transition-colors"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

const MyPlaylistsPage: React.FC = () => {
    const { user, createUserPlaylist } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    if (!user) {
        return <ReactRouterDOM.Navigate to="/signin" replace />;
    }

    const userPlaylists = user.playlists || [];

    return (
        <div className="bg-brand-bg min-h-screen">
            {isCreateModalOpen && <CreatePlaylistModal onClose={() => setIsCreateModalOpen(false)} onCreate={createUserPlaylist} />}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-5xl font-extrabold text-white">My Playlists</h1>
                        <p className="text-lg text-brand-text-secondary mt-2">Your personal collection of curated tracks.</p>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-brand-primary text-white font-semibold px-5 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                        <PlaylistIcon className="w-5 h-5" />
                        <span>Create New Playlist</span>
                    </button>
                </div>

                {userPlaylists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {userPlaylists.map(playlist => (
                            <PlaylistCard key={playlist.id} playlist={playlist} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-brand-surface rounded-lg">
                        <PlaylistIcon className="w-16 h-16 text-brand-text-secondary mx-auto mb-4" />
                        <p className="text-2xl text-white">No playlists yet.</p>
                        <p className="text-brand-text-secondary mt-2">Click "Create New Playlist" to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPlaylistsPage;
