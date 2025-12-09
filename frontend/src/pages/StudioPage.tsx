
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useContent } from '../hooks/useContent';
import { musicAgent } from '../services/musicAgentService';
import { Artist, WorldData } from '../types';
import Visualizer from '../components/Visualizer';
import { 
    MicIcon, 
    BrainCircuitIcon, 
    ActivityIcon, 
    SlidersIcon, 
    PlayIcon, 
    CpuIcon, 
    WifiIcon,
    Volume2Icon
} from '../components/icons';
import toast from 'react-hot-toast';

// --- LOCAL COMPONENTS ---

const Fader: React.FC<{ 
    label: string; 
    value: number; 
    onChange: (val: number) => void; 
    color: 'purple' | 'cyan' | 'pink' 
}> = ({ label, value, onChange, color }) => {
    const colorClass = color === 'purple' ? 'accent-brand-primary' : color === 'cyan' ? 'accent-brand-blue' : 'accent-brand-secondary';
    const glowClass = color === 'purple' ? 'shadow-[0_0_10px_#8A42DB]' : color === 'cyan' ? 'shadow-[0_0_10px_#3D91E6]' : 'shadow-[0_0_10px_#D94A8C]';

    return (
        <div className="flex flex-col h-full items-center space-y-4 group">
            <div className="relative h-64 w-12 bg-brand-dark/50 rounded-full border border-white/10 flex justify-center p-1">
                <div 
                    className={`absolute bottom-1 w-2 rounded-full transition-all duration-300 ${color === 'purple' ? 'bg-brand-primary' : color === 'cyan' ? 'bg-brand-blue' : 'bg-brand-secondary'} ${glowClass}`} 
                    style={{ height: `${value}%`, opacity: 0.5 }} 
                />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={`absolute w-64 h-12 -rotate-90 origin-center top-[106px] bg-transparent cursor-pointer appearance-none z-10 opacity-0 hover:opacity-100`}
                    style={{ width: '256px' }} // Match container height
                />
                 {/* Custom Thumb Visualization */}
                <div 
                    className={`absolute w-10 h-6 rounded-sm bg-white shadow-lg transition-all duration-75 pointer-events-none border-2 border-black`}
                    style={{ bottom: `calc(${value}% - 12px)` }}
                >
                    <div className={`w-full h-full opacity-50 ${color === 'purple' ? 'bg-brand-primary' : color === 'cyan' ? 'bg-brand-blue' : 'bg-brand-secondary'}`}></div>
                </div>
            </div>
            <div className="text-center space-y-1">
                <span className="text-xs font-mono text-brand-text-secondary uppercase tracking-widest">{label}</span>
                <div className="font-mono text-xl font-bold text-white">{value}</div>
            </div>
        </div>
    );
};

const AgentCard: React.FC<{ 
    artist: Artist; 
    isSelected: boolean; 
    isActive: boolean; 
    onClick: () => void 
}> = ({ artist, isSelected, isActive, onClick }) => (
    <div 
        onClick={onClick}
        className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer group overflow-hidden ${
            isSelected 
            ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_15px_rgba(138,66,219,0.3)]' 
            : 'bg-brand-surface/30 border-white/5 hover:border-brand-primary/50 hover:bg-brand-surface/50'
        }`}
    >
        <div className="flex items-center gap-4 z-10 relative">
            <div className="relative">
                <img src={artist.imageUrl} alt={artist.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                {isActive && isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                )}
            </div>
            <div className="flex-grow">
                <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-brand-text-secondary group-hover:text-white'}`}>
                    {artist.name}
                </h3>
                <p className="text-xs text-brand-text-secondary font-mono">{artist.genre}</p>
            </div>
            {isSelected && <CpuIcon className="w-5 h-5 text-brand-primary animate-pulse" />}
        </div>
        {/* Scanning line effect for active agent */}
        {isSelected && isActive && (
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent w-full h-full animate-scan"></div>
        )}
    </div>
);

// --- MAIN COMPONENT ---

const SonicOpsCenter: React.FC = () => {
    const { artists, isLiveMode, toggleLiveMode, agentState, updateAgentState } = useContent();
    const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
    
    // Parameters
    const [intensity, setIntensity] = useState(50);
    const [entropy, setEntropy] = useState(25);
    const [harmony, setHarmony] = useState(75);
    
    // Local Audio Context for Visualizer (Silent Driver)
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    
    // Mocks
    const visualizerThemes = useMemo(() => [
        'https://picsum.photos/seed/matrix/1920/1080',
        'https://picsum.photos/seed/cyber-grid/1920/1080'
    ], []);

    // Initialize Local Audio for Visualization
    useEffect(() => {
        if (!audioContextRef.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            
            // Create silent oscillator to drive visualizer if needed, 
            // or we can just use it to capture data if we route something.
            // For this demo, we'll create a dummy connection to allow the visualizer component to mount 
            // and render *something* (noise or silence). 
            // To make it look cool without playing sound, we connect to analyser but NOT destination.
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(analyser);
            
            // Don't connect to ctx.destination to keep it silent on the dashboard, 
            // assuming the global player handles the actual sound. 
            // However, to make the visualizer react, we need signal.
            // Let's modulate the frequency based on "Entropy" to show visual feedback.
            
            osc.start();
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            oscRef.current = osc;
        }

        return () => {
            oscRef.current?.stop();
            audioContextRef.current?.close();
            audioContextRef.current = null;
        };
    }, []);

    // Update "Sound" based on sliders (Visual feedback only)
    useEffect(() => {
        if (oscRef.current && audioContextRef.current) {
            const now = audioContextRef.current.currentTime;
            // Map slider values to frequency/type for visualizer reaction
            const freq = 50 + (intensity * 5) + (harmony * 2);
            oscRef.current.frequency.exponentialRampToValueAtTime(freq, now + 0.1);
            
            // If entropy is high, wobble it
            if (entropy > 50) {
               oscRef.current.detune.setValueAtTime(Math.random() * 100 * (entropy/10), now);
            }
        }
        
        // Debounced API call simulation
        const timer = setTimeout(() => {
            if (selectedArtistId && isLiveMode) {
                musicAgent.generateStream(
                    `Dashboard Update: Int:${intensity} Ent:${entropy} Harm:${harmony}`,
                    agentState.currentMood
                ).then(newState => updateAgentState(newState));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [intensity, entropy, harmony, selectedArtistId, isLiveMode]); // eslint-disable-line

    const handleSyncWithUniverse = () => {
        toast.loading("Scanning TeO Narrative Matrix...", { id: 'sync' });
        
        // Simulation of fetching data
        setTimeout(() => {
            const mockWorldData: WorldData = {
                location: Math.random() > 0.5 ? 'Crystal Caves' : 'Neon Slums',
                magicDensity: 'High',
                dangerLevel: Math.floor(Math.random() * 10),
            };
            
            const newState = musicAgent.syncWithUniverse(mockWorldData);
            
            // Update UI sliders based on "received" parameters
            if (newState.parameters) {
                setIntensity(newState.parameters.tempo > 100 ? 80 : 30);
                setEntropy(newState.parameters.complexity);
                setHarmony(mockWorldData.location === 'Crystal Caves' ? 90 : 40);
            }
            
            updateAgentState({
                ...newState,
                lastPrompt: `Synced with ${mockWorldData.location}`
            });
            
            toast.success(`Synced: ${mockWorldData.location}`, { id: 'sync', icon: '🌌' });
        }, 1500);
    };

    const handleToggleActivation = () => {
        if (!selectedArtistId) {
            toast.error("Select an agent first.");
            return;
        }
        const newState = !isLiveMode;
        toggleLiveMode(newState);
        
        if (newState) {
             // Start visualizer noise
             if (audioContextRef.current?.state === 'suspended') {
                 audioContextRef.current.resume();
             }
        }
        
        updateAgentState({ 
            isActive: newState, 
            generationStatus: newState ? 'thinking' : 'idle' 
        });
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-black text-brand-text p-4 lg:p-8 font-sans">
            {/* HEADER */}
            <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight flex items-center gap-4">
                        <ActivityIcon className="w-10 h-10 text-brand-primary animate-pulse" />
                        SONIC OPS CENTER
                    </h1>
                    <p className="text-brand-text-secondary font-mono mt-2 text-sm tracking-wider">
                        // GEN_SYS_V2.4 // CONNECTED // LATENCY: 12ms
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-8 text-xs font-mono text-brand-blue/80">
                    <div className="flex items-center gap-2"><WifiIcon className="w-4 h-4"/> UPLINK: STABLE</div>
                    <div className="flex items-center gap-2"><CpuIcon className="w-4 h-4"/> CORE LOAD: {Math.floor(intensity * 0.8 + entropy * 0.1)}%</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                
                {/* LEFT PANEL: AGENT ROSTER */}
                <div className="lg:col-span-3 flex flex-col gap-4 bg-brand-dark/50 rounded-2xl p-4 border border-white/5 shadow-inner h-[600px] lg:h-auto overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-bold text-brand-text-secondary uppercase tracking-widest flex items-center gap-2">
                            <MicIcon className="w-4 h-4"/> Active Agents
                        </h2>
                        <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded">{artists.length} ONLINE</span>
                    </div>
                    
                    <div className="space-y-3">
                        {artists.map(artist => (
                            <AgentCard 
                                key={artist.id}
                                artist={artist}
                                isSelected={selectedArtistId === artist.id}
                                isActive={selectedArtistId === artist.id && isLiveMode}
                                onClick={() => setSelectedArtistId(artist.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* CENTER PANEL: VISUALIZER & SYNC */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    {/* Visualizer Window */}
                    <div className="relative flex-grow bg-black rounded-2xl border-2 border-brand-primary/30 overflow-hidden shadow-[0_0_30px_rgba(138,66,219,0.1)] min-h-[300px]">
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-brand-blue">
                            <span className="w-2 h-2 bg-brand-blue rounded-full animate-ping"></span>
                            VISUAL_FEED_01
                        </div>
                        <Visualizer 
                            themeImages={visualizerThemes} 
                            analyserNode={analyserRef.current} 
                            variant="gravitational"
                        />
                        
                        {/* Status Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {!isLiveMode && (
                                <div className="text-center space-y-2 backdrop-blur-sm bg-black/40 p-6 rounded-xl border border-white/10">
                                    <p className="text-brand-text-secondary font-mono text-sm">SYSTEM STANDBY</p>
                                    <h3 className="text-2xl font-bold text-white">WAITING FOR ACTIVATION</h3>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activation & Sync Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleToggleActivation}
                            className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 group ${
                                isLiveMode 
                                ? 'bg-red-500/10 border-red-500 hover:bg-red-500/20' 
                                : 'bg-brand-surface border-brand-primary/30 hover:bg-brand-primary/10 hover:border-brand-primary'
                            }`}
                        >
                            {isLiveMode ? <Volume2Icon className="w-8 h-8 text-red-500"/> : <PlayIcon className="w-8 h-8 text-brand-primary"/>}
                            <span className={`font-mono font-bold ${isLiveMode ? 'text-red-500' : 'text-brand-primary'}`}>
                                {isLiveMode ? 'TERMINATE STREAM' : 'INITIATE AGENT'}
                            </span>
                        </button>

                        <button 
                            onClick={handleSyncWithUniverse}
                            disabled={!isLiveMode}
                            className="relative p-6 rounded-xl border border-brand-blue/30 bg-brand-surface/50 overflow-hidden group hover:border-brand-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-brand-blue/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                                <BrainCircuitIcon className="w-8 h-8 text-brand-blue group-hover:animate-spin-slow"/>
                                <span className="font-mono font-bold text-brand-blue">SYNC WITH UNIVERSE</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: CONTROL DECK */}
                <div className="lg:col-span-3 bg-brand-surface/20 rounded-2xl p-6 border border-white/5 flex flex-col">
                    <div className="flex items-center gap-2 mb-8 text-brand-text-secondary uppercase tracking-widest font-bold text-xs">
                        <SlidersIcon className="w-4 h-4"/> Parameter Control
                    </div>

                    <div className="flex-grow flex justify-between px-4">
                        <Fader 
                            label="Intensity" 
                            value={intensity} 
                            onChange={setIntensity} 
                            color="purple" 
                        />
                        <Fader 
                            label="Entropy" 
                            value={entropy} 
                            onChange={setEntropy} 
                            color="cyan" 
                        />
                        <Fader 
                            label="Harmony" 
                            value={harmony} 
                            onChange={setHarmony} 
                            color="pink" 
                        />
                    </div>

                    <div className="mt-8 p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-xs text-brand-text-secondary space-y-2">
                        <div className="flex justify-between">
                            <span>STATUS:</span>
                            <span className={isLiveMode ? "text-green-400" : "text-red-400"}>{isLiveMode ? "LIVE" : "OFFLINE"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>MOOD:</span>
                            <span className="text-white">{agentState.currentMood}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>TEMPO:</span>
                            <span className="text-brand-primary">{agentState.parameters.tempo} BPM</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 mt-2 text-[10px] text-white/30 truncate">
                            LAST CMD: {agentState.lastPrompt || "N/A"}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SonicOpsCenter;
