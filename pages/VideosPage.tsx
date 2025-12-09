import React, { useState, useEffect } from 'react';
import { useContent } from '../hooks/useContent';
import { SmtVideo } from '../types';
import { PlayIcon } from '../components/icons';
import WavySeparator from '../components/WavySeparator';

const getYouTubeEmbedUrl = (url: string, autoplay: boolean = false) => {
    if(!url) return null;
    try {
        const videoUrl = new URL(url);
        let videoId = videoUrl.searchParams.get('v');
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1&mute=1' : ''}`;
        }
        if (videoUrl.hostname === 'youtu.be') {
            videoId = videoUrl.pathname.slice(1);
            return `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1&mute=1' : ''}`;
        }
    } catch (error) {
        console.error("Invalid YouTube URL", error);
        return null;
    }
    return null;
};

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
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                ></iframe>
            </div>
        </div>
    );
};

const VideoCard: React.FC<{ video: SmtVideo; onPlay: (url: string) => void }> = ({ video, onPlay }) => {
    return (
        <div onClick={() => onPlay(video.videoUrl)} className="group cursor-pointer animate-fade-in-up">
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayIcon className="w-16 h-16 text-white" />
                </div>
            </div>
            <div className="mt-4">
                <h3 className="font-bold text-white text-lg truncate">{video.title}</h3>
                <p className="text-brand-text-secondary text-sm">{video.artistName}</p>
                <p className="text-xs text-brand-text-secondary mt-1">{video.releaseDate}</p>
            </div>
        </div>
    );
};

const VideosPage: React.FC = () => {
    const { smtVideos } = useContent();
    const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

    return (
         <div className="bg-brand-bg min-h-screen">
             {playingVideoUrl && <VideoModal videoUrl={playingVideoUrl} onClose={() => setPlayingVideoUrl(null)} />}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                 <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-white animate-fade-in-up">Music Videos</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-2 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Visual journeys through our sonic universe.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {smtVideos.map((video, index) => (
                        <div key={video.id} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                            <VideoCard video={video} onPlay={setPlayingVideoUrl} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideosPage;
