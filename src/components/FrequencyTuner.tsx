/**
 * 🎛️ FrequencyTuner - Wersja Standalone dla TeO Music V2
 * 
 * Działa samodzielnie LUB łączy się z GravitonProvider z TeO_Genesis
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

type NoiseType = 'white' | 'brown' | 'pink';

interface FrequencyTunerProps {
  /** Poziom wibracji (0-100) - jeśli podłączony do Graviton, pobiera stamtąd */
  vibration?: number;
  /** Czy tuner jest aktywny domyślnie */
  defaultActive?: boolean;
  /** Typ szumu */
  noiseType?: NoiseType;
  /** Głośność (0-1) */
  volume?: number;
  /** Tryb demo - suwak ręczny */
  demoMode?: boolean;
}

/**
 * Generuje szum biały/pink/brown
 */
const createNoiseBuffer = (
  audioCtx: AudioContext, 
  type: NoiseType
): AudioBuffer => {
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179;
      b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520;
      b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522;
      b5 = -0.7616*b5 - w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    // Brown - głęboki, relaksujący
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * w) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  }
  return buffer;
};

export const FrequencyTuner: React.FC<FrequencyTunerProps> = ({
  vibration: externalVibration,
  defaultActive = false,
  noiseType = 'brown',
  volume = 0.25,
  demoMode = true,
}) => {
  // Stan wewnętrzny
  const [isPlaying, setIsPlaying] = useState(defaultActive);
  const [manualVibration, setManualVibration] = useState(50);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Użyj zewnętrznej wibracji lub ręcznej
  const vibration = externalVibration ?? manualVibration;
  
  // Refy audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 🔊 Init Audio Context
  // ═══════════════════════════════════════════════════════════════

  const initAudio = useCallback(() => {
    if (isInitialized || audioCtxRef.current) return;

    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
      
      // Gain
      gainRef.current = audioCtxRef.current.createGain();
      gainRef.current.gain.value = 0;
      
      // Filter - ciepły dźwięk
      filterRef.current = audioCtxRef.current.createBiquadFilter();
      filterRef.current.type = 'lowpass';
      filterRef.current.frequency.value = 400;
      filterRef.current.Q.value = 1;
      
      // LFO dla pulsacji
      lfoRef.current = audioCtxRef.current.createOscillator();
      lfoRef.current.type = 'sine';
      lfoRef.current.frequency.value = 1;
      
      lfoGainRef.current = audioCtxRef.current.createGain();
      lfoGainRef.current.gain.value = 0;
      
      // Połączenia
      lfoRef.current.connect(lfoGainRef.current);
      lfoGainRef.current.connect(filterRef.current.frequency);
      
      filterRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);
      
      lfoRef.current.start();
      setIsInitialized(true);
    } catch (e) {
      console.error('[FrequencyTuner] Init failed:', e);
    }
  }, [isInitialized]);

  // ═══════════════════════════════════════════════════════════════
  // ▶️ Start / ⏹️ Stop
  // ═══════════════════════════════════════════════════════════════

  const start = useCallback(() => {
    if (!audioCtxRef.current) initAudio();
    if (!audioCtxRef.current) return;

    try {
      // Stop existing
      if (noiseNodeRef.current) {
        try { noiseNodeRef.current.stop(); } catch {}
      }

      // Create new noise
      const buffer = createNoiseBuffer(audioCtxRef.current, noiseType);
      noiseNodeRef.current = audioCtxRef.current.createBufferSource();
      noiseNodeRef.current.buffer = buffer;
      noiseNodeRef.current.loop = true;
      noiseNodeRef.current.connect(filterRef.current!);
      noiseNodeRef.current.start();
      
      setIsPlaying(true);
    } catch (e) {
      console.error('[FrequencyTuner] Start error:', e);
    }
  }, [noiseType, initAudio]);

  const stop = useCallback(() => {
    if (noiseNodeRef.current) {
      try { noiseNodeRef.current.stop(); } catch {}
      noiseNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 🌊 Update na podstawie wibracji
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isPlaying || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Głośność bazowa
    const baseVol = volume * (vibration / 100);
    gainRef.current?.gain.linearRampToValueAtTime(baseVol, now + 0.15);

    // LFO speed (pulsacja)
    const pulseSpeed = 0.3 + (vibration / 100) * 3;
    lfoRef.current?.frequency.linearRampToValueAtTime(pulseSpeed, now + 0.15);

    // LFO depth
    const depth = (vibration / 100) * 0.5;
    lfoGainRef.current?.gain.linearRampToValueAtTime(depth * 150, now + 0.15);

    // Filter freq
    const filterFreq = 180 + (vibration * 7);
    filterRef.current?.frequency.linearRampToValueAtTime(filterFreq, now + 0.15);

  }, [vibration, volume, isPlaying]);

  // ═══════════════════════════════════════════════════════════════
  // 🔄 Toggle
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (isPlaying) start();
    else stop();
  }, [isPlaying, start, stop]);

  // ═══════════════════════════════════════════════════════════════
  // 🧹 Cleanup
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      stop();
      lfoRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, [stop]);

  // ═══════════════════════════════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div style={styles.container}>
      {/* Tytuł */}
      <div style={styles.header}>
        <span style={styles.icon}>🎛️</span>
        <span style={styles.title}>FrequencyTuner</span>
      </div>

      {/* Demo slider */}
      {demoMode && (
        <div style={styles.sliderSection}>
          <label style={styles.label}>Vibration: {vibration}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={vibration}
            onChange={(e) => setManualVibration(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
      )}

      {/* Status */}
      <div style={styles.statusRow}>
        <div style={{
          ...styles.statusDot,
          backgroundColor: isPlaying ? '#00ff88' : '#666',
          boxShadow: isPlaying ? '0 0 12px #00ff88' : 'none',
        }} />
        <span style={styles.statusText}>
          {isPlaying 
            ? `◉ ${noiseType === 'brown' ? 'Deep Brown' : noiseType} Noise — ${vibration}%`
            : '○ Cicho'}
        </span>
      </div>

      {/* Przycisk toggle */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        style={{
          ...styles.button,
          backgroundColor: isPlaying ? '#ff4757' : '#2ed573',
        }}
      >
        {isPlaying ? '⏹️ Stop' : '▶️ Start'}
      </button>

      {/* Info */}
      <div style={styles.info}>
        {isPlaying 
          ? `♫ Szum wibruje na ${vibration}% — rytm Twojej energii`
          : '○ Włącz, by usłyszeć głos wszechświata'}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 🎨 Style inline
// ═══════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    background: 'linear-gradient(145deg, #0d1117 0%, #161b22 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(100, 200, 255, 0.15)',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    color: '#e6edf3',
    maxWidth: '320px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#58a6ff',
  },
  sliderSection: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    marginBottom: '8px',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'linear-gradient(90deg, #238636 0%, #f0883e 50%, #ff4757 100%)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as any,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    padding: '10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  statusText: {
    fontSize: '12px',
    letterSpacing: '0.5px',
  },
  button: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  info: {
    marginTop: '12px',
    fontSize: '10px',
    opacity: 0.5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

export default FrequencyTuner;
