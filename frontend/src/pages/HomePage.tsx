
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, UsersIcon, ArrowRightIcon, StarIcon, YoutubeIcon, GridIcon, InfoIcon } from '../components/icons';
import { useContent } from '../hooks/useContent';
import { NewsArticle, Artist, DisplayTrack, SpotlightItem, Track, Release, SubscriptionTier, CurrentlyPlayingTrack } from '../types';
import toast from 'react-hot-toast';
import WavySeparator from '../components/WavySeparator';
// FIX: Import the refactored useRadioStation hook.
import { useRadioStation } from '../hooks/useRadioStation';


// FIX: Added missing isStreamableUrl helper function.
const isStreamableUrl = (url?: string): boolean => {
    if (!url) return false;
    const playableExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    const lowercasedUrl = url.toLowerCase();
    if (lowercasedUrl.startsWith('https://storage.googleapis.com/')) {
        return true;
    }
    return playableExtensions.some(ext => lowercasedUrl.endsWith(ext));
};

// FIX: Added missing useTilt hook definition.
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


const HeroButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; to?: string; isPrimary?: boolean; }> = ({ icon, label, onClick, to, isPrimary }) => {
    const commonClasses = "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out transform active:scale-90 shadow-lg";
    const primaryClasses = "bg-gradient-to-br from-brand-primary to-brand-secondary animate-button-pulse hover:shadow-brand-primary/40";
    const secondaryClasses = "bg-brand-surface/50 backdrop-blur-sm hover:bg-brand-surface";
   
    const content = (
        <div className="text-center group">
            <div className={`${commonClasses} ${isPrimary ? primaryClasses : secondaryClasses}`}>
                <div className="inline-block group-hover:animate-icon-jiggle">{icon}</div>
            </div>
            <span className="mt-3 block text-sm font-semibold text-white">{label}</span>
        </div>
    );
   
    if (to) {
        return <Link to={to}>{content}</Link>;
    }
   
    return <button onClick={onClick}>{content}</button>;
}


const StatItem: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center">
        <p className="text-4xl font-bold text-white">{value}</p>
        <p className="text-sm text-brand-text-secondary">{label}</p>
    </div>
);

const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
    const tiltRef = useTilt<HTMLAnchorElement>();
    return (
        <Link ref={tiltRef} to={`/artists/${artist.id}`} className="group relative overflow-hidden rounded-2xl block h-96 shadow-lg shadow-brand-primary/10">
            <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:bg-gradient-to-br from-brand-primary/80 to-brand-secondary/80 transition-all duration-300"></div>
            <div className="absolute bottom-0 left-0 p-6 w-full backdrop-blur-sm bg-black/30 rounded-b-2xl">
                <h3 className="text-2xl font-bold text-white">{artist.name}</h3>
                <p className="text-brand-accent">{artist.genre}</p>
            </div>
        </Link>
    )
};

const TrackCard: React.FC<{ track: CurrentlyPlayingTrack; onPlay: (track: CurrentlyPlayingTrack) => void }> = ({ track, onPlay }) => {
    const tiltRef = useTilt<HTMLDivElement>();
    const canPlay = isStreamableUrl(track.sourceUrl);

    const handlePlayClick = () => {
        if (canPlay) {
            onPlay(track);
        } else {
            toast.error("This track is not available for streaming right now.");
        }
    };

    return (
        <div ref={tiltRef} className="bg-brand-surface/50 rounded-lg p-4 flex items-center space-x-4 hover:bg-brand-surface shadow-lg">
            <img src={track.coverImageUrl} alt={track.title} className="w-20 h-20 rounded-md object-cover" />
            <div className="flex-grow">
                <h4 className="font-semibold text-white">{track.title}</h4>
                <p className="text-sm text-brand-text-secondary">{track.artistName}</p>
            </div>
            <button onClick={handlePlayClick} className={`p-3 rounded-full transition-colors ${
                canPlay
                ? 'bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white'
                : 'bg-brand-dark/50 text-brand-text-secondary/50 cursor-not-allowed'
            }`}>
                <PlayIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const NewsCard: React.FC<{ article: NewsArticle, index: number }> = ({ article, index }) => {
    const tiltRef = useTilt<HTMLAnchorElement>();
    return (
        <Link ref={tiltRef} to={`/news/${index}`} className="bg-brand-surface/50 rounded-lg overflow-hidden group shadow-lg flex flex-col">
            <div className="overflow-hidden">
                <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <p className="text-sm text-brand-text-secondary mb-2">{article.date}</p>
                <h3 className="text-xl font-bold text-white mb-2 flex-grow">{article.title}</h3>
                <p className="text-brand-text-secondary text-sm">{article.summary}</p>
            </div>
        </Link>
    )
};

const getYouTubeEmbedUrl = (url: string, autoplay: boolean = false) => {
    if(!url) return null;
    try {
        const videoUrl = new URL(url);
        let videoId = videoUrl.searchParams.get('v');
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1' : ''}`;
        }
        if (videoUrl.hostname === 'youtu.be') {
            videoId = videoUrl.pathname.slice(1);
            return `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1' : ''}`;
        }
    } catch (error) {
        console.error("Invalid YouTube URL", error);
        return null;
    }
    return null;
};

const FeaturedVideo: React.FC = () => {
    const { featuredVideoUrls } = useContent();
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!featuredVideoUrls || featuredVideoUrls.length === 0) return null;
   
    const currentVideoUrl = featuredVideoUrls[currentIndex];
    const embedUrl = getYouTubeEmbedUrl(currentVideoUrl);

    if (!embedUrl) return (
        <div className="container mx-auto px-4 text-center">
             <p className="text-red-400">Invalid Featured Video URL provided in settings.</p>
        </div>
    );
   
    const goToPrevious = () => setCurrentIndex(prev => (prev === 0 ? featuredVideoUrls.length - 1 : prev - 1));
    // FIX: Corrected logic to go to the next video instead of previous.
    const goToNext = () => setCurrentIndex(prev => (prev === featuredVideoUrls.length - 1 ? 0 : prev + 1));

    return (
        <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow animate-text-pulse-weight">Featured Video</h2>
                <WavySeparator />
                <p className="text-lg text-brand-text-secondary mt-2">Our latest premiere</p>
            </div>
            <div className="relative">
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-2xl shadow-brand-primary/20">
                    <iframe
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
                 {featuredVideoUrls.length > 1 && (
                    <>
                        <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">
                            &#10094;
                        </button>
                        <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">
                             &#10095;
                        </button>
                    </>
                 )}
            </div>
        </div>
    )
}

const VideoModal: React.FC<{ videoUrl: string, onClose: () => void }> = ({ videoUrl, onClose }) => {
    const embedUrl = getYouTubeEmbedUrl(videoUrl, true);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 300); // transition duration
    };

    if (!embedUrl) return null;

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
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                ></iframe>
            </div>
        </div>
    );
};

interface EnrichedSpotlightItem {
    item: SpotlightItem;
    track: Track | null;
    release: Release | null;
    artist: Artist | null;
}

const SpotlightSection: React.FC<{ onPlay: (videoUrl: string) => void }> = ({ onPlay }) => {
    const { artists, spotlightItems } = useContent();
   
    const enrichedSpotlightItems = useMemo((): EnrichedSpotlightItem[] => {
        return spotlightItems
            .map(item => {
                if (!item.trackId) return { item, track: null, release: null, artist: null };
               
                for (const artist of artists) {
                    for (const release of artist.discography) {
                        const track = release.tracks.find(t => t.id === item.trackId);
                        if (track) {
                            return { item, track, release, artist };
                        }
                    }
                }
                return { item, track: null, release: null, artist: null };
            })
            .filter(enriched => enriched.track && enriched.release && enriched.artist);
    }, [artists, spotlightItems]);

    if (enrichedSpotlightItems.length === 0) return null;

    return (
        <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow animate-text-pulse-weight">S.M.T. Spotlight</h2>
                <WavySeparator />
                <p className="text-lg text-brand-text-secondary mt-2">Our hand-picked featured music videos</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {enrichedSpotlightItems.map(({item, track, release, artist}) => {
                    if(!track || !release || !artist) return null;
                   
                    const playUrl = item.videoUrl || track.sourceUrl;

                    return (
                        <div key={track.id} className="group cursor-pointer" onClick={() => playUrl && onPlay(playUrl)}>
                            <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                                 <img src={release.coverImageUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <PlayIcon className="w-16 h-16 text-white" />
                                 </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold text-white text-lg">{track.title}</h3>
                                <p className="text-brand-text-secondary text-sm">{artist.name}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const WavyText: React.FC<{ text: string }> = ({ text }) => {
    return (
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow animate-neon-glow">
            {text.split('').map((char, index) => (
                <span
                    key={index}
                    className="inline-block"
                    style={{
                        animation: 'wavyText 2s ease-in-out infinite',
                        animationDelay: `${index * 0.05}s`,
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </h1>
    );
};


const HomePage: React.FC = () => {
    const { artists, news, trendingTracks, playPlaylist, heroBackgroundImage, portalUrl, allTracksMap } = useContent();
    const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

    const sectionRefs = {
        artists: useRef<HTMLElement>(null),
        trending: useRef<HTMLElement>(null),
        news: useRef<HTMLElement>(null),
        spotlight: useRef<HTMLElement>(null),
        videos: useRef<HTMLElement>(null),
    };
   
    const palettes = {
        default: ['#1A1625', '#8A42DB', '#D94A8C', '#3D91E6', '#1A1625'],
        artists: ['#0D0B14', '#242038', '#3D91E6', '#1A1625', '#0D0B14'], // Subdued, introspective
        trending: ['#1A1625', '#8A42DB', '#D94A8C', '#3D91E6', '#1A1625'], // Default dynamic
        news: ['#242038', '#3D91E6', '#1A1625', '#0D0B14', '#242038'], // Calm, informative
        spotlight: ['#1A1625', '#D94A8C', '#f9a8d4', '#8A42DB', '#1A1625'], // Dynamic, bright
        videos: ['#1A1625', '#D94A8C', '#f9a8d4', '#8A42DB', '#1A1625'], // Dynamic, bright
    };
   
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            let activeSection: keyof typeof palettes | 'default' = 'default';
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = (entry.target as HTMLElement).dataset.sectionId as keyof typeof palettes;
                    activeSection = sectionId;
                }
            });
            const palette = palettes[activeSection] || palettes.default;
            for (let i = 0; i < palette.length; i++) {
                document.documentElement.style.setProperty(`--grad-c${i+1}`, palette[i]);
            }
        }, { threshold: 0.3, rootMargin: "-20% 0px -20% 0px" });
   
        Object.values(sectionRefs).forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });
   
        return () => {
            Object.values(sectionRefs).forEach(ref => {
                if (ref.current) observer.unobserve(ref.current);
            });
            const defaultPalette = palettes.default;
            for (let i = 0; i < defaultPalette.length; i++) {
                document.documentElement.style.setProperty(`--grad-c${i+1}`, defaultPalette[i]);
            }
        };
    }, [sectionRefs]);

    const { fetchAndPlayRadio, isLoading } = useRadioStation();

const handlePlayRadio = () => {
    fetchAndPlayRadio();
};

const handlePlayTrendingTrack = (track: CurrentlyPlayingTrack) => {
    playPlaylist([track]);
};

    return (
        <div className="bg-brand-dark">
            {playingVideoUrl && <VideoModal videoUrl={playingVideoUrl} onClose={() => setPlayingVideoUrl(null)} />}

            {/* Hero Section */}
            <section
                className="relative bg-cover bg-center h-[90vh] flex items-center justify-center text-center text-white overflow-hidden"
                style={{ backgroundImage: `url(${heroBackgroundImage})` }}
            >
                <div className="absolute inset-0 bg-black/60"></div>
                 {/* Floating dots */}
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-brand-primary/50" style={{
                        width: `${Math.random() * 8 + 4}px`,
                        height: `${Math.random() * 8 + 4}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `float 25s ease-in-out infinite`,
                        animationDelay: `${Math.random() * -25}s`
                    }}></div>
                ))}
                <div className="relative z-10 p-4">
                    <WavyText text="TeO Music Studio" />
                    <p className="text-lg md:text-xl text-brand-text-secondary mb-4">TeO-CONGLOMERATE of all Life in creation</p>
                    <p className="max-w-3xl mx-auto text-base md:text-lg text-brand-text mb-8">
                        At TeO Music Studio, we're pioneering the future of music through artificial intelligence and human creativity. Our revolutionary CoAI artists represent a new era of musical expression, each with unique personalities and distinctive sounds that push the boundaries of what's possible.
                    </p>
                    <div className="flex items-center justify-center space-x-8 mb-16">
                        <HeroButton
                            label="S.M.T. RADIO"
                            icon={isLoading ? <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <PlayIcon className="w-10 h-10 text-white"/>} 
                            onClick={handlePlayRadio}
                            isPrimary
                        />
                        <HeroButton
                            label="Meet Artists"
                            icon={<UsersIcon className="w-10 h-10 text-white"/>}
                            to="/artists"
                        />
                        <HeroButton
                            label="The Wave"
                            icon={<GridIcon className="w-10 h-10 text-white"/>}
                            to="/constellation"
                        />
                    </div>
                     <div className="flex justify-center items-center space-x-8 md:space-x-16">
                        <StatItem value={String(artists.length)} label="CoAI Artists" />
                        <StatItem value={String(allTracksMap.size)} label="Tracks" />
                        <StatItem value={String(artists.reduce((acc, a) => acc + a.discography.length, 0))} label="Releases" />
                        <StatItem value="1.2K+" label="Views" />
                    </div>
                </div>
            </section>
           
            {/* Featured Artists */}
            <section ref={sectionRefs.artists} data-section-id="artists" className="py-20 bg-brand-bg" style={{ perspective: '1000px' }}>
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4 bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow animate-text-pulse-weight">Featured CoAI Artists</h2>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mb-12 max-w-2xl mx-auto">Meet our revolutionary CoAI artists, each with their own unique personality and musical style</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                        {artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
                    </div>
                    <Link to="/artists" className="inline-flex items-center space-x-2 text-brand-primary hover:text-white transition-colors duration-200">
                        <span>View All Artists</span>
                        <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                </div>
            </section>
           
            {/* Trending Tracks */}
            <section ref={sectionRefs.trending} data-section-id="trending" className="py-20 bg-brand-dark">
                 <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4 bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow animate-text-pulse-weight">Trending Tracks</h2>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mb-12 max-w-2xl mx-auto">Discover the most popular tracks from our CoAI artists</p>
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-1 gap-6 mb-12 text-left">
                        {trendingTracks.map(track => <TrackCard key={track.id} track={track} onPlay={handlePlayTrendingTrack} />)}
                    </div>
                    <Link to="/artists" className="inline-flex items-center space-x-2 text-brand-primary hover:text-white transition-colors duration-200">
                        <span>Browse All Music</span>
                        <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                </div>
            </section>
           
            {/* Latest News */}
            <section ref={sectionRefs.news} data-section-id="news" className="py-20 bg-brand-bg">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow animate-text-pulse-weight">Latest News</h2>
                        <WavySeparator />
                        <p className="text-lg text-brand-text-secondary mt-2">Stay updated with the latest from TeO Music Studio</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.slice(0, 3).map((article, index) => <NewsCard key={index} article={article} index={index} />)}
                    </div>
                    {news.length > 3 && (
                         <div className="text-center mt-12">
                            <Link to="/news" className="inline-flex items-center space-x-2 text-brand-primary hover:text-white transition-colors duration-200">
                                <span>Browse All News</span>
                                <ArrowRightIcon className="w-5 h-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>
           
            {/* Spotlight Section */}
            <section ref={sectionRefs.spotlight} data-section-id="spotlight" className="py-20 bg-brand-dark">
                <SpotlightSection onPlay={setPlayingVideoUrl}/>
            </section>

             {/* Featured Video Section */}
            <section ref={sectionRefs.videos} data-section-id="videos" className="py-20 bg-brand-bg">
                <FeaturedVideo />
            </section>

            {/* Interactive Portal */}
            <section className="py-20 bg-brand-dark text-center">
                <h2 className="text-3xl font-bold text-white mb-8 animate-pulse" style={{ fontFamily: 'monospace' }}>...To YourSelf....</h2>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-block relative w-48 h-48 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse"></div>
                    <div className="absolute inset-0 rounded-full animate-spin-slow">
                        <div className="absolute h-1/2 w-1/2 top-0 left-0 bg-gradient-to-br from-brand-primary to-transparent rounded-full opacity-70"></div>
                        <div className="absolute h-1/4 w-1/4 bottom-0 right-0 bg-gradient-to-tl from-brand-secondary to-transparent rounded-full opacity-50"></div>
                    </div>
                    <div className="absolute inset-2 bg-brand-dark rounded-full"></div>
                    <div className="absolute inset-4 border-2 border-brand-primary/50 rounded-full animate-portal-pulse"></div>
                    <div className="absolute inset-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-lg tracking-widest uppercase group-hover:scale-110 group-hover:tracking-wider transition-all duration-300">Enter</span>
                    </div>
                </a>
            </section>
           
            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-brand-primary/80 to-brand-secondary/80">
                <div className="container mx-auto px-4 text-center text-white">
                    <h2 className="text-4xl font-bold mb-4 bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow">Ready to Experience the Future of Music?</h2>
                    <p className="text-lg mb-8">Join thousands of music lovers discovering revolutionary CoAI-generated tracks</p>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link to="/subscriptions" className="flex items-center space-x-2 bg-white text-brand-dark font-semibold px-8 py-3 rounded-full text-lg hover:bg-gray-200 transition-colors">
                            <StarIcon className="w-6 h-6" />
                            <span>View Tiers</span>
                        </Link>
                        <a href="https://www.youtube.com/channel/UCFGMuAEBRjmXSNmb6CdKbCg" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-red-600 text-white font-semibold px-8 py-3 rounded-full text-lg hover:bg-red-700 transition-colors">
                            <YoutubeIcon className="w-6 h-6" />
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
