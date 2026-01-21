import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Wind, Waves, Zap } from 'lucide-react';

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
    if (!filterRef.current || !masterGainRef.current || isMuted) return;
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

    animationFrameRef.current = requestAnimationFrame(updateBreathingLFO);
  }, [breathSpeed, breathDepth, isMuted]);

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
  // Większa amplituda pulsowania
  const pulseMagnitude = 0.1 + (breathDepth * 0.6);
  const breathScale = 1 + (Math.sin(breathProgress * Math.PI * 2) * pulseMagnitude);

  // Potężniejszy Glow (nawet do 150px)
  const glowSize = 30 + (breathDepth * 150);
  const glowOpacity = 0.3 + (breathDepth * 0.5);

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
              borderColor: breathPhase === 'inhale' ? '#00ffff' : '#ff00ff',
              boxShadow: `0 0 ${isActive ? glowSize : 20}px ${breathPhase === 'inhale' ? `rgba(0, 255, 255, ${glowOpacity})` : `rgba(255, 0, 255, ${glowOpacity})`}, inset 0 0 ${isActive ? glowSize / 2 : 10}px ${breathPhase === 'inhale' ? `rgba(0, 255, 255, ${glowOpacity * 0.5})` : `rgba(255, 0, 255, ${glowOpacity * 0.5})`}`
            }}
          >
            <div className="bre-phase-text" style={{ color: breathPhase === 'inhale' ? '#00ffff' : '#ff00ff' }}>
              {breathPhase === 'inhale' ? 'Inhale' : 'Exhale'}
            </div>
            <div className="bre-phase-icon">
              <AnimatePresence mode="wait">
                {breathPhase === 'inhale' ? (
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
            <input type="range" min="2" max="15" step="0.5" value={breathSpeed} onChange={(e) => setBreathSpeed(parseFloat(e.target.value))} className="bre-slider" />
            <div className="bre-value">{breathSpeed.toFixed(1)}s</div>
          </div>
          <div className="bre-control-group">
            <label className="bre-label"><Waves size={16} /> Depth (Intensity)</label>
            <input type="range" min="0" max="1" step="0.05" value={breathDepth} onChange={(e) => setBreathDepth(parseFloat(e.target.value))} className="bre-slider" />
            <div className="bre-value">{(breathDepth * 100).toFixed(0)}%</div>
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