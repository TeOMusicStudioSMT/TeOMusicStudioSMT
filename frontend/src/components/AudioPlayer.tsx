import React, { useRef, useEffect, useState } from 'react';
import { useContent } from '../hooks/useContent';
import { PlayFilledIcon, PauseFilledIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, ChevronUpIcon, ChevronDownIcon, LayersIcon, Volume1Icon, Volume2Icon, VolumeXIcon } from './icons';
import toast from 'react-hot-toast';
import { VISUALIZER_THEMES } from '../constants';
import Visualizer from './Visualizer';

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const isStreamableUrl = (url?: string): boolean => {
    if (!url) return false;
    const playableExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    const lowercasedUrl = url.toLowerCase();
    
    if (lowercasedUrl.startsWith('https://storage.googleapis.com/') ||
        playableExtensions.some(ext => lowercasedUrl.includes(ext))) {
        return true;
    }
    
    return false;
}

const AudioPlayer: React.FC = () => {
    const { currentTrack, playNext, playPrevious, clearCurrentTrack } = useContent();
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const filterNodeRef = useRef<BiquadFilterNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTheme, setActiveTheme] = useState(Object.keys(VISUALIZER_THEMES)[0]);
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
    const themePickerRef = useRef<HTMLDivElement>(null);
    
    const [volume, setVolume] = useState<number>(() => {
        const savedVolume = localStorage.getItem('smt-player-volume');
        return savedVolume !== null ? parseFloat(savedVolume) : 1;
    });
    const [volumeBeforeMute, setVolumeBeforeMute] = useState(1);

    useEffect(() => {
        localStorage.setItem('smt-player-volume', volume.toString());
        const gain = gainNodeRef.current;
        const context = audioContextRef.current;
        if (gain && context) {
            gain.gain.setTargetAtTime(volume, context.currentTime, 0.02);
        }
    }, [volume]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themePickerRef.current && !themePickerRef.current.contains(event.target as Node)) {
                setIsThemePickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        
        if (!audioContextRef.current) {
            try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)({});
                audioContextRef.current = context;
                gainNodeRef.current = context.createGain();
                filterNodeRef.current = context.createBiquadFilter();
                analyserNodeRef.current = context.createAnalyser();
                
                filterNodeRef.current.type = 'lowpass';
                filterNodeRef.current.frequency.value = 22050;
                
                gainNodeRef.current.gain.value = volume;
                gainNodeRef.current.connect(filterNodeRef.current);
                filterNodeRef.current.connect(analyserNodeRef.current);
                analyserNodeRef.current.connect(context.destination);
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const connectWebAudio = () => {
            if (audioContextRef.current && gainNodeRef.current && !sourceNodeRef.current) {
                try {
                    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
                    sourceNodeRef.current.connect(gainNodeRef.current);
                } catch (e) {
                    if (e instanceof DOMException && e.name === 'InvalidStateError') {
                        console.warn("Web Audio API source node already exists for this element.");
                    } else {
                        console.error("Error connecting audio element to Web Audio API.", e);
                    }
                }
            }
        };
        
        const handleCanPlay = async () => {
            connectWebAudio();
            try {
                if (audioContextRef.current?.state === 'suspended') {
                   await audioContextRef.current.resume();
                }
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error("Autoplay failed:", error);
                setIsPlaying(false);
                toast.error("Playback blocked. Please click play to start.", { id: 'not-allowed' });
            }
        };
        
        if (currentTrack && isStreamableUrl(currentTrack.sourceUrl)) {
            if (audio.src !== currentTrack.sourceUrl) {
                audio.src = currentTrack.sourceUrl;
                audio.load();
                setCurrentTime(0);
                setDuration(0);
                setIsPlaying(false);
                
                audio.addEventListener('canplay', handleCanPlay, { once: true });
            } else if (isPlaying) {
                audio.play().catch(console.error);
            }
        } else {
            audio.pause();
            audio.src = '';
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            if (currentTrack && !isStreamableUrl(currentTrack.sourceUrl)) {
                toast.error(`"${currentTrack.title}" is not a direct audio file and cannot be played. Skipping.`, { id: 'stream-error', duration: 4000 });
                clearCurrentTrack();
            }
        }

        return () => {
            if (audio) {
                audio.removeEventListener('canplay', handleCanPlay);
            }
        };
    }, [currentTrack, clearCurrentTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => { if (isFinite(audio.duration)) setDuration(audio.duration); };
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => playNext();
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        
        const handleAudioError = (e: Event) => {
            const mediaError = (e.target as HTMLAudioElement).error;
            if (!mediaError) return;
            console.error("Audio Element Error:", `Code: ${mediaError.code}, Message: ${mediaError.message || 'No message.'}`);
            toast.error(`"${currentTrack?.title || 'This track'}" is unplayable. Skipping.`, { duration: 4000 });
            setIsPlaying(false);
            setTimeout(() => playNext(), 500);
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleAudioError);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('error', handleAudioError);
        };
    }, [playNext, currentTrack]);

    const handlePlayPause = () => {
        const audio = audioRef.current;
        const context = audioContextRef.current;
        if (!audio || !audio.currentSrc) return;

        if (context && context.state === 'suspended') {
            context.resume();
        }
        
        if (isPlaying) {
            audio.pause();
        } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    const error = err as DOMException;
                     if (error.name === 'NotAllowedError') {
                        toast.error("Playback blocked by browser. Please click play to start.", { id: 'not-allowed' });
                    } else {
                        toast.error("Playback failed. Please try another track.");
                    }
                    setIsPlaying(false);
                });
            }
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const time = Number(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };

    const toggleMute = () => {
        if (volume > 0) {
            setVolumeBeforeMute(volume);
            setVolume(0);
        } else {
            setVolume(volumeBeforeMute > 0 ? volumeBeforeMute : 1);
        }
    };

    const VolumeIcon = () => {
        if (volume === 0) return <VolumeXIcon className="w-6 h-6"/>;
        if (volume <= 0.5) return <Volume1Icon className="w-6 h-6"/>;
        return <Volume2Icon className="w-6 h-6"/>;
    };

    if (!currentTrack) return null;

    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col text-white animate-fade-in-up">
                <Visualizer 
                    themeImages={VISUALIZER_THEMES[activeTheme]} 
                    analyserNode={analyserNodeRef.current} 
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/10 rounded-full" aria-label="Collapse player"><ChevronDownIcon className="w-6 h-6"/></button>
                        <div className="relative" ref={themePickerRef}>
                            <button onClick={() => setIsThemePickerOpen(p => !p)} className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-full" aria-label="Change visualizer theme"><LayersIcon className="w-5 h-5"/> <span className="text-sm font-semibold">{activeTheme}</span></button>
                            {isThemePickerOpen && (
                                <div className="absolute bottom-full right-0 mb-2 bg-brand-surface rounded-lg p-2 shadow-lg w-48">
                                    {Object.keys(VISUALIZER_THEMES).map(themeName => (
                                        <button key={themeName} onClick={() => { setActiveTheme(themeName); setIsThemePickerOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-md ${activeTheme === themeName ? 'bg-brand-primary' : 'hover:bg-brand-dark'}`}>
                                            {themeName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={clearCurrentTrack} className="p-2 hover:bg-white/10 rounded-full" aria-label="Close player"><XIcon className="w-6 h-6"/></button>
                    </div>
                    {/* Main Content */}
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <img src={currentTrack.coverImageUrl} alt={currentTrack.releaseTitle} className="w-64 h-64 md:w-80 md:h-80 rounded-lg object-cover shadow-2xl shadow-black/50 mb-8" />
                        <h2 className="text-3xl md:text-5xl font-bold">{currentTrack.title}</h2>
                        <p className="text-lg md:text-xl text-brand-text-secondary mt-2">{currentTrack.artistName}</p>
                    </div>
                    {/* Footer Controls */}
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="w-full flex items-center gap-4 text-xs">
                            <span className="w-10 text-right">{formatTime(currentTime)}</span>
                            <div className="relative w-full h-3 flex items-center group">
                                <div className="absolute w-full h-1 bg-white/20 rounded-full top-1/2 -translate-y-1/2">
                                    <div 
                                        className="h-full bg-white rounded-full"
                                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <input
                                    type="range"
                                    value={currentTime}
                                    max={duration || 0}
                                    onChange={handleProgressChange}
                                    className="w-full h-full progress-slider light"
                                    aria-label="Seek progress"
                                />
                            </div>
                            <span className="w-10">{formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="w-1/4"></div>
                            <div className="flex items-center justify-center gap-8">
                                <button onClick={playPrevious} className="text-brand-text-secondary hover:text-white transition-colors" aria-label="Play previous track"><ChevronLeftIcon className="w-8 h-8"/></button>
                                <button onClick={handlePlayPause} className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform" aria-label={isPlaying ? 'Pause' : 'Play'}>
                                    {isPlaying ? <PauseFilledIcon className="w-8 h-8" /> : <PlayFilledIcon className="w-8 h-8 ml-1" />}
                                </button>
                                <button onClick={playNext} className="text-brand-text-secondary hover:text-white transition-colors" aria-label="Play next track"><ChevronRightIcon className="w-8 h-8"/></button>
                            </div>
                            <div className="w-1/4 flex items-center justify-end gap-2 text-white">
                                <button onClick={toggleMute} aria-label="Toggle mute"><VolumeIcon /></button>
                                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer range-thumb-light" aria-label="Volume control" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-brand-bg/90 backdrop-blur-sm border-t border-brand-primary/20 p-4">
                <audio ref={audioRef} crossOrigin="anonymous"/>
                <div className="container mx-auto flex items-center justify-between gap-4">
                    {/* Track Info & Expand */}
                    <div className="flex items-center gap-3 w-1/3">
                        <button onClick={() => setIsExpanded(true)} className="p-1 text-brand-text-secondary hover:text-white transition-colors" aria-label="Expand player"><ChevronUpIcon className="w-5 h-5"/></button>
                        <img src={currentTrack.coverImageUrl} alt={currentTrack.releaseTitle} className="w-16 h-16 rounded-md object-cover" />
                        <div className="truncate">
                            <p className="font-bold text-white truncate">{currentTrack.title}</p>
                            <p className="text-sm text-brand-text-secondary truncate">{currentTrack.artistName}</p>
                        </div>
                    </div>

                    {/* Player Controls */}
                    <div className="flex flex-col items-center justify-center gap-2 w-1/2">
                        <div className="flex items-center gap-4">
                            <button onClick={playPrevious} className="text-brand-text-secondary hover:text-white transition-colors" aria-label="Play previous track"><ChevronLeftIcon className="w-6 h-6"/></button>
                            <button onClick={handlePlayPause} className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-primary text-white hover:scale-105 transition-transform" aria-label={isPlaying ? 'Pause' : 'Play'}>
                                {isPlaying ? <PauseFilledIcon className="w-6 h-6" /> : <PlayFilledIcon className="w-6 h-6 ml-0.5" />}
                            </button>
                            <button onClick={playNext} className="text-brand-text-secondary hover:text-white transition-colors" aria-label="Play next track"><ChevronRightIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="w-full flex items-center gap-2">
                            <span className="text-xs text-brand-text-secondary w-10 text-right">{formatTime(currentTime)}</span>
                             <div className="relative w-full h-3 flex items-center group">
                                <div className="absolute w-full h-1 bg-brand-surface rounded-full top-1/2 -translate-y-1/2">
                                    <div 
                                        className="h-full bg-brand-primary rounded-full group-hover:bg-brand-secondary transition-colors"
                                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <input
                                    type="range"
                                    value={currentTime}
                                    max={duration || 0}
                                    onChange={handleProgressChange}
                                    className="w-full h-full progress-slider"
                                    aria-label="Seek progress"
                                />
                            </div>
                            <span className="text-xs text-brand-text-secondary w-10">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Volume & Close */}
                    <div className="w-1/3 flex justify-end items-center gap-2">
                        <button onClick={toggleMute} className="text-brand-text-secondary hover:text-white transition-colors" aria-label="Toggle mute">
                            <VolumeIcon />
                        </button>
                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-24 h-1 bg-brand-surface rounded-lg appearance-none cursor-pointer range-thumb" aria-label="Volume control" />
                        <button onClick={clearCurrentTrack} className="text-brand-text-secondary hover:text-white transition-colors" aria-label="Close player"><XIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
            <style>{`
                /* Styles for Volume Slider */
                .range-thumb { -webkit-appearance: none; appearance: none; background: transparent; }
                .range-thumb::-webkit-slider-runnable-track { background-color: #242038; height: 0.25rem; border-radius: 0.5rem; }
                .range-thumb::-moz-range-track { background-color: #242038; height: 0.25rem; border-radius: 0.5rem; }
                .range-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: #F0F0F0; cursor: pointer; border-radius: 50%; margin-top: -5px; box-shadow: 0 0 5px rgba(240, 240, 240, 0.5); }
                .range-thumb::-moz-range-thumb { width: 14px; height: 14px; background: #F0F0F0; cursor: pointer; border-radius: 50%; border: none; box-shadow: 0 0 5px rgba(240, 240, 240, 0.5); }
                .range-thumb:hover::-webkit-slider-thumb { background: #8A42DB; box-shadow: 0 0 8px rgba(138, 66, 219, 0.7); }
                .range-thumb:hover::-moz-range-thumb { background: #8A42DB; box-shadow: 0 0 8px rgba(138, 66, 219, 0.7); }

                /* Styles for Expanded Player Volume Slider */
                .range-thumb-light { -webkit-appearance: none; background-color: transparent; }
                .range-thumb-light::-webkit-slider-runnable-track { background-color: rgba(255,255,255,0.2); height: 0.25rem; border-radius: 0.5rem; }
                .range-thumb-light::-moz-range-track { background-color: rgba(255,255,255,0.2); height: 0.25rem; border-radius: 0.5rem; }
                .range-thumb-light::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: #FFFFFF; cursor: pointer; border-radius: 50%; margin-top: -5px; box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
                .range-thumb-light::-moz-range-thumb { width: 14px; height: 14px; background: #FFFFFF; cursor: pointer; border-radius: 50%; border: none; box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
                
                /* Styles for new Progress Bar slider */
                .progress-slider { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
                .progress-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 1rem; height: 1rem; border-radius: 50%; background: #F0F0F0; margin-top: -6px; opacity: 0; transition: opacity 0.2s, transform 0.2s; transform: scale(0.8); }
                .progress-slider::-moz-range-thumb { width: 1rem; height: 1rem; border-radius: 50%; background: #F0F0F0; border: none; opacity: 0; transition: opacity 0.2s, transform 0.2s; transform: scale(0.8); }
                .progress-slider.light::-webkit-slider-thumb { background: #FFFFFF; }
                .progress-slider.light::-moz-range-thumb { background: #FFFFFF; }
                .group:hover .progress-slider::-webkit-slider-thumb { opacity: 1; transform: scale(1); box-shadow: 0 0 10px rgba(138, 66, 219, 0.7); }
                .group:hover .progress-slider::-moz-range-thumb { opacity: 1; transform: scale(1); box-shadow: 0 0 10px rgba(138, 66, 219, 0.7); }
            `}</style>
        </>
    );
};

export default AudioPlayer;
