import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useContent } from '../hooks/useContent';
import { Playlist, PlaylistCategory, CurrentlyPlayingTrack } from '../types';
import { PlayIcon, MusicNoteIcon } from '../components/icons';
import toast from 'react-hot-toast';
import WavySeparator from '../components/WavySeparator';

const getYouTubeEmbedUrl = (url: string, autoplay: boolean = false) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1' : ''}`;
    }
    console.error("Invalid YouTube URL, could not extract video ID:", url);
    return null;
};

const VideoModal: React.FC<{ videoUrl: string, onClose: () => void }> = ({ videoUrl, onClose }) => {
    const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoUrl, true), [videoUrl]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!embedUrl) {
            toast.error("Invalid video URL provided.");
            onClose();
        }
    }, [embedUrl, onClose]);
    
    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 300); // transition duration
    };


    if (!embedUrl) {
        return null;
    }

    return (
        <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
            onClick={handleClose}
        >
            <div 
                className={`relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl shadow-brand-primary/20 transition-all duration-300 ease-in-out ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
                onClick={(e) => e.stopPropagation()}
            >
                 <button onClick={handleClose} className="absolute -top-10 right-0 text-white text-3xl font-bold">&times;</button>
                 <iframe
                    src={embedUrl}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                ></iframe>
            </div>
        </div>
    );
};

const SunoEmbedModal: React.FC<{ playlistUrl: string, onClose: () => void }> = ({ playlistUrl, onClose }) => {
    const embedUrl = useMemo(() => {
        try {
            const fullUrl = playlistUrl.startsWith('http') ? playlistUrl : `https://${playlistUrl}`;
            const urlObject = new URL(fullUrl);
            
            if (urlObject.hostname.includes('suno.com') && urlObject.pathname.startsWith('/playlist/')) {
                const playlistId = urlObject.pathname.split('/')[2];
                if (playlistId) {
                    return `https://suno.com/embed/playlist/${playlistId}`;
                }
            }
        } catch (e) {
            console.error("Error parsing Suno URL:", e);
        }
        
        console.error("Invalid Suno URL, could not extract playlist ID:", playlistUrl);
        return null;
    }, [playlistUrl]);

    useEffect(() => {
        if (!embedUrl) {
            toast.error("Invalid Suno playlist URL.");
            onClose();
        }
    }, [embedUrl, onClose]);

    if (!embedUrl) {
        return null;
    }
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full max-w-4xl h-[600px] bg-brand-bg shadow-2xl shadow-brand-primary/20" onClick={(e) => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute -top-10 right-0 text-white text-3xl font-bold">&times;</button>
                 <iframe
                    src={embedUrl}
                    title="Suno Playlist Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-full h-full rounded-lg"
                ></iframe>
            </div>
        </div>
    );
};


const isYouTubeUrl = (url?: string): boolean => {
    if (!url) return false;
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(url);
};

const isStreamableUrl = (url?: string): boolean => {
    if (!url) return false;
    const playableExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    const lowercasedUrl = url.toLowerCase();
    if (lowercasedUrl.startsWith('https://storage.googleapis.com/')) {
        return true;
    }
    return playableExtensions.some(ext => lowercasedUrl.endsWith(ext));
};

const useTilt = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { left, top, width, height } = el.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;

            const rotateY = x * 20;
            const rotateX = -y * 20;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            el.style.boxShadow = `${-x * 15}px ${-y * 15}px 30px -5px rgba(0,0,0,0.3)`;
        };

        const handleMouseLeave = () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            el.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
        };
        
        el.style.transition = 'transform 0.2s, box-shadow 0.2s';
        el.style.willChange = 'transform, box-shadow';
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return ref;
};


const PlaylistCard: React.FC<{ item: Playlist, onPlayVideo: (url: string) => void, onPlaySuno: (url: string) => void }> = ({ item, onPlayVideo, onPlaySuno }) => {
    const { playPlaylist, allTracksMap } = useContent();
    const tiltRef = useTilt<HTMLDivElement>();
    const isVideo = isYouTubeUrl(item.externalUrl);
    const isSunoPlaylist = item.externalUrl && item.externalUrl.includes('suno.com');
    
    const playableTrackIds = useMemo(() => 
        item.trackIds.filter(id => {
            const track = allTracksMap.get(id);
            return track && isStreamableUrl(track.sourceUrl);
        })
    , [item.trackIds, allTracksMap]);

    const canPlayInApp = playableTrackIds.length > 0;

    const handlePlayInApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canPlayInApp) return;

        const tracksToPlay: CurrentlyPlayingTrack[] = playableTrackIds
            .map(trackId => allTracksMap.get(trackId))
            .filter((t): t is CurrentlyPlayingTrack => t !== undefined);

        if (tracksToPlay.length > 0) {
            playPlaylist(tracksToPlay);
            toast.success(`Playing playlist: ${item.title}`);
        } else {
            toast.error("Could not find playable tracks for this playlist.");
        }
    };

    const getHost = (url?: string) => {
        if (!url) return 'Link';
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Link';
        }
    }

    return (
        <div ref={tiltRef} className="group bg-brand-surface rounded-lg overflow-hidden shadow-lg flex flex-col">
            <div className="aspect-w-1 aspect-h-1 overflow-hidden relative">
                <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="text-brand-text-secondary mt-2 text-sm flex-grow min-h-[60px]">
                    {item.description}
                </p>
                <div className="mt-4 pt-4 border-t border-brand-primary/10 space-y-2">
                   {isSunoPlaylist && item.externalUrl ? (
                        <>
                            <button
                                onClick={() => onPlaySuno(item.externalUrl!)}
                                className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <MusicNoteIcon className="w-5 h-5" />
                                Play on TeO
                            </button>
                            <a 
                                href={item.externalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full block text-center bg-brand-surface text-brand-text-secondary font-semibold py-2 rounded-lg hover:bg-brand-dark transition-colors"
                            >
                               Open on {getHost(item.externalUrl)}
                            </a>
                        </>
                    ) : isVideo ? (
                        <button
                            onClick={() => item.externalUrl && onPlayVideo(item.externalUrl)}
                             className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition-opacity"
                        >
                            <PlayIcon className="w-5 h-5" />
                           Watch Video
                        </button>
                    ) : canPlayInApp ? (
                        <button 
                            onClick={handlePlayInApp}
                            className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <MusicNoteIcon className="w-5 h-5" />
                            Play in App
                        </button>
                    ) : item.externalUrl && item.externalUrl !== '#' ? (
                         <a 
                            href={item.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full block text-center bg-brand-surface text-brand-text-secondary font-semibold py-2 rounded-lg hover:bg-brand-dark transition-colors"
                        >
                           Open on {getHost(item.externalUrl)}
                        </a>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const PlaylistSection: React.FC<{ title: string, playlists: Playlist[], onPlayVideo: (url: string) => void, onPlaySuno: (url: string) => void }> = ({ title, playlists, onPlayVideo, onPlaySuno }) => {
    if (playlists.length === 0) {
        return null;
    }
    return (
        <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 animate-neon-glow">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {playlists.map(item => (
                    <PlaylistCard key={item.id} item={item} onPlayVideo={onPlayVideo} onPlaySuno={onPlaySuno}/>
                ))}
            </div>
        </section>
    );
};

const PlaylistsPage: React.FC = () => {
    const { playlists } = useContent();
    const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
    const [playingSunoPlaylistUrl, setPlayingSunoPlaylistUrl] = useState<string | null>(null);

    const categoryOrder = [
        PlaylistCategory.TEO_OFFICIAL,
        PlaylistCategory.SMT_SELECTS,
        PlaylistCategory.SHOWCASE,
        PlaylistCategory.OCCASIONAL,
        PlaylistCategory.USER_PLAYLISTS,
    ];

    const groupedPlaylists = useMemo(() => {
        const groups: Record<string, Playlist[]> = {};
        for (const category of categoryOrder) {
            groups[category] = [];
        }

        playlists.forEach(p => {
            if (p.category && groups[p.category]) {
                groups[p.category].push(p);
            } else {
                if (!groups['Other']) groups['Other'] = [];
                groups['Other'].push(p);
            }
        });
        return groups;
    }, [playlists]);

    return (
        <div className="bg-brand-bg min-h-screen">
            {playingVideoUrl && <VideoModal videoUrl={playingVideoUrl} onClose={() => setPlayingVideoUrl(null)} />}
            {playingSunoPlaylistUrl && <SunoEmbedModal playlistUrl={playingSunoPlaylistUrl} onClose={() => setPlayingSunoPlaylistUrl(null)} />}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-extrabold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow">Curated Playlists</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Explore hand-picked collections of tracks from our artists and community, perfect for any mood or occasion.
                    </p>
                </div>
                
                {playlists.length > 0 ? (
                    <div>
                        {categoryOrder.map(category => (
                            <PlaylistSection
                                key={category}
                                title={category}
                                playlists={groupedPlaylists[category] || []}
                                onPlayVideo={setPlayingVideoUrl}
                                onPlaySuno={setPlayingSunoPlaylistUrl}
                            />
                        ))}
                         {groupedPlaylists['Other'] && groupedPlaylists['Other'].length > 0 && (
                             <PlaylistSection
                                title="Other"
                                playlists={groupedPlaylists['Other']}
                                onPlayVideo={setPlayingVideoUrl}
                                onPlaySuno={setPlayingSunoPlaylistUrl}
                            />
                         )}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-2xl text-white">No playlists yet.</p>
                        <p className="text-brand-text-secondary mt-2">Our curators are busy compiling new collections. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistsPage;