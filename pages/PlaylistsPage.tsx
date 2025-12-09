import React, { useMemo } from 'react';
import { useContent } from '../hooks/useContent';
import { Playlist, PlaylistCategory } from '../types';
import { PlayIcon } from '../components/icons';
import WavySeparator from '../components/WavySeparator';
import toast from 'react-hot-toast';

const PlaylistCard: React.FC<{ playlist: Playlist }> = ({ playlist }) => {
    const { playPlaylist, allTracksMap } = useContent();

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (playlist.externalUrl) {
            window.open(playlist.externalUrl, '_blank');
            return;
        }
        
        const tracks = playlist.trackIds.map(id => allTracksMap.get(id)).filter(Boolean);
        if (tracks && tracks.length > 0) {
            playPlaylist(tracks);
            toast.success(`Playing "${playlist.title}"`);
        } else {
            toast.error("This playlist is empty or contains unavailable tracks.");
        }
    };

    return (
        <div onClick={handlePlay} className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-transform duration-300 hover:-translate-y-2">
            <img src={playlist.coverImageUrl} alt={playlist.title} className="w-full h-full object-cover aspect-square" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div>
                    <h3 className="font-bold text-white text-lg">{playlist.title}</h3>
                    <p className="text-sm text-brand-text-secondary line-clamp-3">{playlist.description}</p>
                </div>
                <div className="self-end">
                    <button className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white transform transition-transform group-hover:scale-110">
                        <PlayIcon className="w-6 h-6 ml-1" />
                    </button>
                </div>
            </div>
             <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent group-hover:opacity-0 transition-opacity">
                <h3 className="font-bold text-white text-lg truncate">{playlist.title}</h3>
            </div>
        </div>
    );
};

const PlaylistsPage: React.FC = () => {
    const { playlists } = useContent();

    const categorizedPlaylists = useMemo(() => {
        return playlists.reduce((acc, playlist) => {
            const category = playlist.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(playlist);
            return acc;
        }, {} as Record<PlaylistCategory, Playlist[]>);
    }, [playlists]);

    const categoryOrder: PlaylistCategory[] = [
        PlaylistCategory.TEO_OFFICIAL,
        PlaylistCategory.SMT_SELECTS,
        PlaylistCategory.SHOWCASE,
        PlaylistCategory.OCCASIONAL,
        PlaylistCategory.USER_PLAYLISTS
    ];

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                 <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-white animate-fade-in-up">Curated Playlists</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-2 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Soundscapes for every moment, crafted by our artists and community.
                    </p>
                </div>

                {categoryOrder.map(category => (
                    categorizedPlaylists[category] && (
                        <div key={category} className="mb-12">
                            <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-brand-primary/20 pb-2">{category}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {categorizedPlaylists[category].map(playlist => (
                                    <PlaylistCard key={playlist.id} playlist={playlist} />
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default PlaylistsPage;
