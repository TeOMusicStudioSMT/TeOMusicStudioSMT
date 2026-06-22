import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Wind, Waves, Zap, Cpu } from 'lucide-react';

type BreathPhase = 'inhale' | 'exhale';

interface OscillatorConfig {
  type: OscillatorType;
  detune: number;
  gain: number;
}

const BioResonanceEngine: React.FC = () => {
  // --- STATE ---
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [breathSpeed, setBreathSpeed] = useState(6);
  const [breathDepth, setBreathDepth] = useState(0.7);
  const [currentHarmony, setCurrentHarmony] = useState(0);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [breathProgress, setBreathProgress] = useState(0);

  // --- SONIC SYNC STATE ---
  const [sonicFiles, setSonicFiles] = useState<{ name: string; path: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isSonicSync, setIsSonicSync] = useState<boolean>(false);
  const [sonicVectors, setSonicVectors] = useState<{ s: number; b: number; v: number; h: number }[]>([]);
  const [activeVector, setActiveVector] = useState<{ s: number; b: number; v: number; h: number } | null>(null);
  const startTimeRef = useRef<number>(0);

  // --- REFS ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // --- HARMONIES ---
  const harmonies = [
    [60, 64, 67, 72], // C Major
    [57, 60, 64, 69], // A Minor
    [62, 65, 69, 74], // D Minor
    [67, 71, 74, 79], // G Major
    [60, 63, 67, 70], // C Minor
  ];

  const oscillatorConfigs: OscillatorConfig[] = [
    { type: 'sine', detune: 0, gain: 0.4 },
    { type: 'triangle', detune: -7, gain: 0.3 },
    { type: 'sawtooth', detune: 12, gain: 0.2 },
  ];

  const midiToFreq = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

  // Pobieranie listy plików sonicznych z mostu Wiesio-Bridge
  useEffect(() => {
    const fetchSonicFiles = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3001/wiesio/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'LIST_DIRECTORY',
            payload: { target: 'SONIC' }
          })
        });
        const data = await response.json();
        if (data.success && data.files) {
          const files = data.files.filter((f: any) => f.type === 'file');
          setSonicFiles(files);
          if (files.length > 0) {
            setSelectedFile(files[0].name);
          }
        }
      } catch (err) {
        console.warn('[BioResonance] Nie udało się pobrać listy plików sonicznych:', err);
      }
    };
    fetchSonicFiles();
  }, []);

  // Wczytywanie wektorów z wybranego pliku sonicznego
  useEffect(() => {
    if (!selectedFile) return;
    const loadVectors = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3001/wiesio/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'READ_SONIC_VECTORS',
            payload: { filename: selectedFile }
          })
        });
        const data = await response.json();
        if (data.success && data.vectors) {
          setSonicVectors(data.vectors);
          setActiveVector(null);
        }
      } catch (err) {
        console.error('[BioResonance] Błąd wczytywania wektorów:', err);
      }
    };
    loadVectors();
  }, [selectedFile]);

  // Reset czasu startu przy włączeniu/wyłączeniu synchronizacji wektorowej
  useEffect(() => {
    if (isActive && !isMuted) {
      startTimeRef.current = Date.now();
    }
  }, [isSonicSync, isActive, isMuted]);

  // --- AUDIO LOGIC ---
  const initAudioContext = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = 0.3;
        filterRef.current = audioContextRef.current.createBiquadFilter();
        filterRef.current.type = 'lowpass';
        filterRef.current.frequency.value = 800;
        filterRef.current.Q.value = 5;
        filterRef.current.connect(masterGainRef.current);
        masterGainRef.current.connect(audioContextRef.current.destination);
      }
    } catch {
      // Audio Init Failed
    }
  }, []);

  const createOscillators = useCallback(() => {
    if (!audioContextRef.current || !filterRef.current) return;
    oscillatorsRef.current.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch { void 0; } });
    gainNodesRef.current.forEach(gain => gain.disconnect());
    oscillatorsRef.current = [];
    gainNodesRef.current = [];

    const baseFrequency = midiToFreq(harmonies[currentHarmony][0]);

    oscillatorConfigs.forEach((config) => {
      const osc = audioContextRef.current!.createOscillator();
      const gain = audioContextRef.current!.createGain();
      osc.type = config.type;
      osc.frequency.value = baseFrequency;
      osc.detune.value = config.detune;
      gain.gain.value = config.gain;
      osc.connect(gain);
      gain.connect(filterRef.current!);
      osc.start();
      oscillatorsRef.current.push(osc);
      gainNodesRef.current.push(gain);
    });
  }, [currentHarmony]);

  const updateBreathingLFO = useCallback(() => {
    if (!filterRef.current || !masterGainRef.current || isMuted || !audioContextRef.current) return;

    if (isSonicSync && sonicVectors.length > 0) {
      // Tryb synchronizacji wektorowej
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const currentSecond = elapsedSeconds % sonicVectors.length;
      const vec = sonicVectors[currentSecond];
      setActiveVector(vec);

      const normB = vec.b / 255;
      const normV = vec.v / 255;
      const normH = vec.h / 255;

      // 1. Częstotliwość odcięcia filtru modulowana przez Highs (h)
      const minCutoff = 200;
      const maxCutoff = 2500;
      const targetCutoff = minCutoff + ((maxCutoff - minCutoff) * normH * breathDepth);
      filterRef.current.frequency.exponentialRampToValueAtTime(Math.max(200, targetCutoff), audioContextRef.current.currentTime + 0.1);

      // 2. Głośność master modulowana przez Bass (b)
      const targetVolume = 0.15 + (0.35 * normB * breathDepth);
      masterGainRef.current.gain.exponentialRampToValueAtTime(Math.max(0.01, targetVolume), audioContextRef.current.currentTime + 0.1);

      // 3. Modulacja detune i gainu oscylatorów przez Vocals (v)
      if (oscillatorsRef.current.length >= 3 && gainNodesRef.current.length >= 3) {
        // Sine wave (oscillator 0) pozostaje stabilna
        // Triangle wave (oscillator 1) - detune rośnie z melodycznym v
        oscillatorsRef.current[1].detune.exponentialRampToValueAtTime(-7 + (normV * 40 * breathDepth), audioContextRef.current.currentTime + 0.1);
        gainNodesRef.current[1].gain.exponentialRampToValueAtTime(0.3 * (0.3 + 0.7 * normV), audioContextRef.current.currentTime + 0.1);

        // Sawtooth wave (oscillator 2) - detune maleje z melodycznym v
        oscillatorsRef.current[2].detune.exponentialRampToValueAtTime(12 - (normV * 40 * breathDepth), audioContextRef.current.currentTime + 0.1);
        gainNodesRef.current[2].gain.exponentialRampToValueAtTime(0.2 * (0.3 + 0.7 * normV), audioContextRef.current.currentTime + 0.1);
      }

      setBreathPhase(normB > 0.5 ? 'inhale' : 'exhale');
      setBreathProgress((Date.now() % 4000) / 4000);
    } else {
      // Tryb tradycyjnego LFO
      const now = Date.now();
      const cycleMs = breathSpeed * 1000;
      const position = (now % cycleMs) / cycleMs;
      const isInhaling = position < 0.5;
      setBreathPhase(isInhaling ? 'inhale' : 'exhale');
      setBreathProgress(position);

      const breathValue = Math.sin(position * Math.PI * 2);
      const minCutoff = 200;
      const maxCutoff = 2000;
      const targetCutoff = minCutoff + ((maxCutoff - minCutoff) * ((breathValue + 1) / 2) * breathDepth);

      filterRef.current.frequency.exponentialRampToValueAtTime(targetCutoff, audioContextRef.current!.currentTime + 0.1);

      const volumeRange = 0.2 * breathDepth;
      const targetVolume = 0.3 + (volumeRange * ((breathValue + 1) / 2));
      masterGainRef.current.gain.exponentialRampToValueAtTime(Math.max(0.01, targetVolume), audioContextRef.current!.currentTime + 0.1);

      // Przywróć domyślne gainy w trybie LFO
      if (gainNodesRef.current.length >= 3) {
        gainNodesRef.current[0].gain.value = 0.4;
        gainNodesRef.current[1].gain.value = 0.3;
        gainNodesRef.current[2].gain.value = 0.2;
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateBreathingLFO);
  }, [breathSpeed, breathDepth, isMuted, isSonicSync, sonicVectors]);

  const toggleMute = useCallback(() => {
    if (!isMuted) {
      if (masterGainRef.current) masterGainRef.current.gain.value = 0;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      oscillatorsRef.current.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch { void 0; } });
      setIsMuted(true);
      setIsActive(false);
    } else {
      initAudioContext();
      createOscillators();
      setIsMuted(false);
      setIsActive(true);
      startTimeRef.current = Date.now();
      updateBreathingLFO();
    }
  }, [isMuted, initAudioContext, createOscillators, updateBreathingLFO]);

  const harmonize = useCallback(() => setCurrentHarmony((prev) => (prev + 1) % harmonies.length), []);

  useEffect(() => { if (isActive && !isMuted) createOscillators(); }, [currentHarmony, isActive, isMuted, createOscillators]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      oscillatorsRef.current.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch { void 0; } });
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --- VISUAL MAGIC (Podkręcone wartości) ---
  const pulseMagnitude = 0.1 + (breathDepth * 0.6);
  const normB = activeVector ? activeVector.b / 255 : 0;
  const normV = activeVector ? activeVector.v / 255 : 0;
  const normH = activeVector ? activeVector.h / 255 : 0;

  const breathScale = isSonicSync && activeVector
    ? 1 + (normB * 0.4 + normV * 0.2) * breathDepth
    : 1 + (Math.sin(breathProgress * Math.PI * 2) * pulseMagnitude);

  const glowSize = isSonicSync && activeVector
    ? 30 + ((normB * 80 + normV * 70) * breathDepth)
    : 30 + (breathDepth * 150);

  const glowOpacity = isSonicSync && activeVector
    ? 0.3 + (normH * 0.6) * breathDepth
    : 0.3 + (breathDepth * 0.5);

  // Dynamiczny kolor HSL interpolujący od 180 (Cyan) do 300 (Magenta/Fuksja) w rytm wokalno-basowy
  const currentHue = isSonicSync && activeVector
    ? 180 + (normV * 60 + normB * 60)
    : (breathPhase === 'inhale' ? 180 : 300);

  const activeColor = `hsl(${currentHue}, 100%, 50%)`;
  const glowColor = `hsla(${currentHue}, 100%, 50%, ${glowOpacity})`;
  const innerGlowColor = `hsla(${currentHue}, 100%, 50%, ${glowOpacity * 0.5})`;

  return (
    <div className="bio-resonance-engine">
      <style>{`
                .bio-resonance-engine {
                    background: transparent;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    font-family: 'Inter', sans-serif;
                    color: #fff;
                    overflow: hidden;
                }
                .bre-container {
                    position: relative;
                    z-index: 1;
                    max-width: 600px;
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(5px);
                    border-radius: 40px;
                    padding: 40px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .bre-header { text-align: center; margin-bottom: 3rem; }
                .bre-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
                }
                .bre-subtitle { font-size: 1rem; color: #aaa; font-weight: 300; letter-spacing: 1px; }
                
                .bre-breath-visualizer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 3rem 0;
                    min-height: 350px; /* Zwiększone miejsce na glow */
                }

                .bre-breath-circle {
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%);
                    border: 2px solid;
                    /* Płynna zmiana koloru i cienia */
                    transition: border-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s linear;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    backdrop-filter: blur(2px);
                }

                .bre-phase-text { font-size: 1.5rem; font-weight: 700; text-transform: uppercase; text-shadow: 0 0 20px currentColor; }
                .bre-controls {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .bre-control-group { margin-bottom: 2rem; }
                .bre-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 600; color: #00ffff; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
                .bre-slider {
                    width: 100%; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.1); outline: none; -webkit-appearance: none; appearance: none;
                }
                .bre-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%); cursor: pointer; box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); transition: transform 0.2s;
                }
                .bre-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
                .bre-value { text-align: right; font-size: 0.85rem; color: #ff00ff; margin-top: 0.5rem; font-weight: 600; }
                .bre-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; }
                .bre-button { padding: 1rem 2rem; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                .bre-button-mute { background: ${isMuted ? 'linear-gradient(135deg, #ff00ff 0%, #ff0080 100%)' : 'linear-gradient(135deg, #00ffff 0%, #0080ff 100%)'}; color: #fff; box-shadow: 0 4px 15px ${isMuted ? 'rgba(255, 0, 255, 0.4)' : 'rgba(0, 255, 255, 0.4)'}; }
                .bre-button-mute:hover { transform: translateY(-2px); }
                .bre-button-harmonize { background: rgba(255, 255, 255, 0.1); color: #00ffff; border: 1px solid rgba(0, 255, 255, 0.3); }
                .bre-button-harmonize:hover { background: rgba(0, 255, 255, 0.2); transform: translateY(-2px); border-color: #00ffff; }
                .bre-button:active { transform: scale(0.98); }
            `}</style>

      <div className="bre-container">
        <div className="bre-header">
          <h1 className="bre-title">BioResonance Engine</h1>
          <p className="bre-subtitle">Ambient Pad · Breathing Synthesis</p>
        </div>

        <div className="bre-breath-visualizer">
          <motion.div
            className="bre-breath-circle"
            style={{
              transform: `scale(${isActive ? breathScale : 1})`,
              borderColor: activeColor,
              boxShadow: `0 0 ${isActive ? glowSize : 20}px ${glowColor}, inset 0 0 ${isActive ? glowSize / 2 : 10}px ${innerGlowColor}`
            }}
          >
            <div className="bre-phase-text" style={{ color: activeColor }}>
              {isSonicSync ? 'Resonance' : (breathPhase === 'inhale' ? 'Inhale' : 'Exhale')}
            </div>
            <div className="bre-phase-icon">
              <AnimatePresence mode="wait">
                {isSonicSync ? (
                  <motion.div key="resonance" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <Cpu size={32} style={{ color: activeColor, animationDuration: '6s' }} className="animate-spin" />
                  </motion.div>
                ) : breathPhase === 'inhale' ? (
                  <motion.div key="inhale" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <Wind size={32} color="#00ffff" />
                  </motion.div>
                ) : (
                  <motion.div key="exhale" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <Waves size={32} color="#ff00ff" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="bre-controls">
          <div className="bre-control-group">
            <label className="bre-label"><Wind size={16} /> Breath Speed</label>
            <input type="range" min="2" max="15" step="0.5" value={breathSpeed} onChange={(e) => setBreathSpeed(parseFloat(e.target.value))} className="bre-slider" disabled={isSonicSync} style={{ opacity: isSonicSync ? 0.3 : 1 }} />
            <div className="bre-value">{isSonicSync ? 'Auto (Sonic)' : `${breathSpeed.toFixed(1)}s`}</div>
          </div>
          <div className="bre-control-group">
            <label className="bre-label"><Waves size={16} /> Depth (Intensity)</label>
            <input type="range" min="0" max="1" step="0.05" value={breathDepth} onChange={(e) => setBreathDepth(parseFloat(e.target.value))} className="bre-slider" />
            <div className="bre-value">{(breathDepth * 100).toFixed(0)}%</div>
          </div>

          {/* SEKCJA SONIC SYNC */}
          <div className="bre-control-group border-t border-purple-500/20 pt-4 mt-4">
            <label className="bre-label flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Cpu size={16} /> Sonic Sync Mode</span>
              <input 
                type="checkbox" 
                checked={isSonicSync} 
                onChange={(e) => setIsSonicSync(e.target.checked)} 
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>
            
            {isSonicSync && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mt-3 text-left"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Select Sonic Vector:</span>
                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="w-full bg-slate-900/90 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {sonicFiles.length === 0 ? (
                      <option value="">Brak wektorów w _OtakOs_Sonic</option>
                    ) : (
                      sonicFiles.map(f => (
                        <option key={f.name} value={f.name}>
                          {f.name.replace('SonicVectors_', '').replace('.json', '').replace(/_/g, ' ')}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Neonowe wizualizatory paskowe dla aktywnych wektorów */}
                {activeVector && (
                  <div className="bg-black/40 p-3 rounded-lg border border-purple-500/10 space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>TIME STEP:</span>
                      <span className="text-cyan-400 font-bold">{activeVector.s}s / {sonicVectors.length}s</span>
                    </div>
                    {/* Bas */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>BASS (Pulse):</span>
                        <span className="text-pink-500 font-bold">{activeVector.b}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div className="bg-pink-500 h-full transition-all duration-300" style={{ width: `${(activeVector.b / 255) * 100}%` }} />
                      </div>
                    </div>
                    {/* Wokal */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>VOCALS (Melody):</span>
                        <span className="text-purple-400 font-bold">{activeVector.v}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div className="bg-purple-400 h-full transition-all duration-300" style={{ width: `${(activeVector.v / 255) * 100}%` }} />
                      </div>
                    </div>
                    {/* Wysokie */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>HIGHS (Air):</span>
                        <span className="text-cyan-400 font-bold">{activeVector.h}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${(activeVector.h / 255) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="bre-buttons">
            <button onClick={toggleMute} className="bre-button bre-button-mute">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />} {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button onClick={harmonize} className="bre-button bre-button-harmonize" disabled={isMuted} style={{ opacity: isMuted ? 0.5 : 1 }}>
              <Zap size={20} /> Harmonize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BioResonanceEngine;