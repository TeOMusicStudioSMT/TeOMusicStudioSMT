
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../hooks/useAuth';
import { PlayIcon, MusicNoteIcon, LockIcon, CrownIcon, MoreHorizontalIcon, PlusCircleIcon } from '../components/icons';
import NotFoundPage from './NotFoundPage';
import { Track, Release, SubscriptionTier, Artist } from '../types';
import toast from 'react-hot-toast';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const tierOrder: Record<SubscriptionTier, number> = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.BASIC]: 1,
    [SubscriptionTier.PREMIUM]: 2,
    [SubscriptionTier.VIP]: 3,
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


const TrackItem: React.FC<{ track: Track, release: Release, artist: Artist }> = ({ track, release, artist }) => {
    const { playTrack } = useContent();
    const { user } = useAuth();
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    
    const requiredTier = track.accessTier || SubscriptionTier.FREE;
    const userTier = user?.tier || SubscriptionTier.FREE;
    const hasAccess = tierOrder[userTier] >= tierOrder[requiredTier];
    const canPlay = hasAccess && isStreamableUrl(track.sourceUrl);

    const handlePlayClick = () => {
        if (!hasAccess) {
            toast.error(`You need ${requiredTier} or higher to play this track.`);
            return;
        }
        if (!isStreamableUrl(track.sourceUrl)) {
            toast.error('This track is not available for in-app streaming.');
            return;
        }
        playTrack(track, release, artist);
    };
    
    return (
        <>
        {isPlaylistModalOpen && <AddToPlaylistModal trackId={track.id} onClose={() => setIsPlaylistModalOpen(false)} />}
        <div className="border-t border-brand-surface/50 p-3 hover:bg-brand-surface/30 transition-colors duration-200 group">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                         <span className={`text-brand-text truncate ${!canPlay ? 'opacity-50' : ''}`}>{track.title}</span>
                         {requiredTier !== SubscriptionTier.FREE && (
                             <div className="flex items-center text-xs px-2 py-0.5 rounded-full bg-brand-surface flex-shrink-0">
                                {requiredTier === SubscriptionTier.VIP ? <CrownIcon className="w-3 h-3 text-yellow-400 mr-1"/> : <LockIcon className="w-3 h-3 text-brand-accent mr-1"/>}
                                <span className="text-brand-text-secondary">{requiredTier}</span>
                            </div>
                         )}
                    </div>
                    {track.description && (
                        <p className="text-xs text-brand-text-secondary mt-1">{track.description}</p>
                    )}
                </div>
                <div className="flex items-center">
                    {user && (
                         <button onClick={() => setIsPlaylistModalOpen(true)} className="ml-4 p-2 rounded-full text-brand-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Add to playlist">
                            <PlusCircleIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={handlePlayClick} className={`ml-2 p-2 rounded-full transition-colors flex-shrink-0 ${
                        canPlay
                        ? 'text-brand-primary hover:bg-brand-primary hover:text-white'
                        : 'text-brand-text-secondary/30 cursor-not-allowed'
                    }`}>
                        <PlayIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};


const CollapsibleReleaseItem: React.FC<{ release: Release, artist: Artist, isExpanded: boolean, onToggle: () => void }> = ({ release, artist, isExpanded, onToggle }) => (
    <div className="bg-brand-surface/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md">
        <button onClick={onToggle} className="w-full p-4 flex items-center space-x-4 bg-brand-surface/80 hover:bg-brand-surface transition-colors duration-200 text-left">
            <img src={release.coverImageUrl} alt={release.title} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-grow">
                <p className="text-sm font-bold text-brand-primary uppercase tracking-widest">{release.type}</p>
                <h3 className="font-bold text-white text-2xl">{release.title}</h3>
            </div>
             <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
        </button>
        {isExpanded && (
            <div className="flex flex-col">
                {release.tracks.length > 0 ? (
                    release.tracks.map((track, index) => 
                        <div key={track.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 75}ms` }}>
                             <TrackItem track={track} release={release} artist={artist} />
                        </div>
                    )
                ) : (
                    <p className="p-4 text-brand-text-secondary text-sm">No tracks in this release yet.</p>
                )}
            </div>
        )}
    </div>
);

const ArtistProfilePage: React.FC = () => {
    const { artists } = useContent();
    const { artistId } = ReactRouterDOM.useParams();
    const [expandedReleaseId, setExpandedReleaseId] = useState<string | null>(null);

    if (!artistId) {
        return <NotFoundPage message="Artist Not Found" subMessage="No artist ID was provided in the URL." />;
    }

    const artist = artists.find(a => a.id === artistId);

    if (!artist) {
        return <NotFoundPage message="Artist Not Found" subMessage={`We couldn't find an artist with the ID "${artistId}".`} />;
    }

    return (
        <div className="bg-brand-dark text-white">
            {/* Header Image */}
            <div
                className="h-[50vh] bg-cover bg-center relative"
                style={{ backgroundImage: `url(${artist.headerImageUrl})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
                {/* Artist Info */}
                <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-8 animate-bloom-in" style={{ animationDelay: '100ms' }}>
                    <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-48 h-48 rounded-full object-cover border-4 border-brand-dark shadow-lg flex-shrink-0"
                    />
                    <div className="flex-grow text-center md:text-left">
                        <p className="text-sm font-bold text-brand-primary uppercase tracking-widest">CoAI Artist</p>
                        <h1 className="text-5xl md:text-7xl font-extrabold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow">{artist.name}</h1>
                        <p className="text-xl text-brand-text-secondary mt-1">{artist.genre}</p>
                    </div>
                </div>

                {/* Spotify Embed */}
                {artist.spotifyArtistEmbedUrl && (
                    <div className="mt-12 animate-bloom-in" style={{ animationDelay: '200ms' }}>
                        <iframe
                            style={{ borderRadius: '12px' }}
                            src={artist.spotifyArtistEmbedUrl}
                            width="100%"
                            height="152"
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            title={`${artist.name} on Spotify`}
                        ></iframe>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Bio Column */}
                    <div className="lg:col-span-1 animate-bloom-in" style={{ animationDelay: '300ms' }}>
                        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3 animate-neon-glow"><MusicNoteIcon className="w-6 h-6 text-brand-primary" /> Biography</h2>
                        <div className="bg-brand-bg p-6 rounded-lg space-y-4 text-brand-text-secondary">
                          <p className="whitespace-pre-wrap leading-relaxed">{artist.bio}</p>
                        </div>
                    </div>
                    
                    {/* Discography Column */}
                    <div className="lg:col-span-2 animate-bloom-in" style={{ animationDelay: '400ms' }}>
                        <h2 className="text-3xl font-bold mb-4 animate-neon-glow">Discography</h2>
                        <div className="space-y-6">
                            {artist.discography.length > 0 ? (
                                artist.discography.map(release => (
                                    <CollapsibleReleaseItem 
                                        key={release.id} 
                                        release={release} 
                                        artist={artist}
                                        isExpanded={expandedReleaseId === release.id}
                                        onToggle={() => setExpandedReleaseId(prevId => prevId === release.id ? null : release.id)}
                                    />
                                ))
                            ) : (
                                <p className="text-brand-text-secondary">No releases found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Gallery Section */}
                <div className="mt-16 animate-bloom-in" style={{ animationDelay: '500ms' }}>
                    <h2 className="text-3xl font-bold mb-4 animate-neon-glow">Gallery</h2>
                    {artist.gallery.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {artist.gallery.map((imgSrc, index) => (
                                <div key={index} className="aspect-w-3 aspect-h-2 bg-brand-surface rounded-lg overflow-hidden">
                                    <img src={imgSrc} alt={`${artist.name} gallery image ${index + 1}`} className="w-full h-full object-cover shadow-lg hover:scale-105 transition-transform duration-300" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-brand-text-secondary">No gallery images available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArtistProfilePage;