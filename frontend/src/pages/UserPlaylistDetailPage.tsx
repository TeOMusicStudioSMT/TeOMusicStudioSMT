

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// FIX: Corrected import path to be explicitly relative.
import { useAuth } from '../hooks/useAuth';
// FIX: Corrected import path to be explicitly relative.
import { useContent } from '../hooks/useContent';
// FIX: Corrected import path to be explicitly relative.
import { UserPlaylist, CurrentlyPlayingTrack } from '../types';
// FIX: Corrected import path to be explicitly relative.
import NotFoundPage from './NotFoundPage';
// FIX: Corrected import path to be explicitly relative.
import { PlayIcon, Trash2Icon } from '../components/icons';
import toast from 'react-hot-toast';

const UserPlaylistDetailPage: React.FC = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const { user, updateUserPlaylist } = useAuth();
    const { allTracksMap, playPlaylist } = useContent();

    const [playlist, setPlaylist] = useState<UserPlaylist | null>(null);
    const [tracks, setTracks] = useState<CurrentlyPlayingTrack[]>([]);
    const [editableTitle, setEditableTitle] = useState('');
    const [editableDescription, setEditableDescription] = useState('');

    useEffect(() => {
        const foundPlaylist = user?.playlists?.find(p => p.id === playlistId);
        if (foundPlaylist) {
            setPlaylist(foundPlaylist);
            setEditableTitle(foundPlaylist.title);
            setEditableDescription(foundPlaylist.description);
            const playlistTracks = foundPlaylist.trackIds
                .map(id => allTracksMap.get(id))
                .filter((t): t is CurrentlyPlayingTrack => t !== undefined);
            setTracks(playlistTracks);
        } else {
            setPlaylist(null);
        }
    }, [playlistId, user, allTracksMap]);

    const handleSaveDetails = () => {
        if (!playlist) return;
        updateUserPlaylist(playlist.id, { title: editableTitle, description: editableDescription });
        toast.success("Playlist details updated!");
    };

    const handleRemoveTrack = (trackIdToRemove: string) => {
        if (!playlist) return;
        const newTrackIds = playlist.trackIds.filter(id => id !== trackIdToRemove);
        updateUserPlaylist(playlist.id, { trackIds: newTrackIds });
        toast.success("Track removed from playlist.");
    };
    
    const handlePlayAll = () => {
        if (tracks.length > 0) {
            playPlaylist(tracks);
        } else {
            toast.error("This playlist is empty.");
        }
    };

    if (!user) {
        return <NotFoundPage message="Please log in to view your playlists." />;
    }
    if (!playlist) {
        return <NotFoundPage message="Playlist not found." />;
    }

    const coverImages = tracks.slice(0, 4).map(t => t?.coverImageUrl);

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <Link to="/my-playlists" className="text-brand-primary hover:text-white mb-8 inline-block">&larr; Back to My Playlists</Link>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-1/3 flex-shrink-0">
                        <div className="aspect-square w-full bg-brand-dark rounded-lg grid grid-cols-2 grid-rows-2 overflow-hidden mb-4 shadow-lg">
                           {coverImages.map((url, i) => <img key={i} src={url} alt="" className="w-full h-full object-cover" />)}
                        </div>
                        <input
                            type="text"
                            value={editableTitle}
                            onChange={e => setEditableTitle(e.target.value)}
                            onBlur={handleSaveDetails}
                            className="w-full bg-transparent text-3xl font-bold text-white mb-2 focus:outline-none focus:bg-brand-surface rounded-md p-1"
                        />
                        <textarea
                            value={editableDescription}
                            onChange={e => setEditableDescription(e.target.value)}
                            onBlur={handleSaveDetails}
                            className="w-full bg-transparent text-brand-text-secondary focus:outline-none focus:bg-brand-surface rounded-md p-1 resize-none"
                            rows={3}
                        />
                         <button onClick={handlePlayAll} className="w-full mt-4 bg-brand-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                            <PlayIcon className="w-5 h-5" /> Play All
                        </button>
                    </div>
                    <div className="w-full md:w-2/3 bg-brand-dark p-4 rounded-lg">
                       {tracks.length > 0 ? (
                           <div className="space-y-2">
                               {tracks.map((track, index) => (
                                   <div key={track.id} className="p-3 hover:bg-brand-surface/50 rounded-lg flex items-center justify-between gap-4">
                                       <div className="flex items-center gap-4">
                                           <span className="text-brand-text-secondary">{index + 1}</span>
                                           <img src={track.coverImageUrl} alt={track.title} className="w-12 h-12 rounded-md object-cover"/>
                                           <div>
                                               <p className="font-semibold text-white">{track.title}</p>
                                               <p className="text-sm text-brand-text-secondary">{track.artistName}</p>
                                           </div>
                                       </div>
                                       <button onClick={() => handleRemoveTrack(track.id)} className="p-2 text-brand-text-secondary hover:text-red-500"><Trash2Icon className="w-5 h-5"/></button>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <p className="text-center text-brand-text-secondary py-12">This playlist is empty. Add some tracks!</p>
                       )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPlaylistDetailPage;