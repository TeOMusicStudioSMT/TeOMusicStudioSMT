import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Play, Pause, Download,
  Terminal, Cpu, Disc3, RefreshCw, Layers,
  Volume2, VolumeX, ShieldCheck, Flame, Compass, HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';
import ModelCatalogPanel from './ModelCatalogPanel';
import {
  generateMiniMaxMusic,
  generateHarmonic432HzTone,
  reportBreathEconomyReward,
  type MiniMaxModelVariant,
  type MusicEngine,
  type MusicGenerationResult
} from '../services/minimaxAudioService';

interface AiSessionPanelProps {
  teleportParams?: {
    style: string;
    prompt: string;
    tags: string[];
    model: string;
    intensity: number;
    confidence: number;
    generationId: string;
  } | null;
  onClose?: () => void;
}

const PRESET_VIBES = [
  { label: '🌌 432Hz Quantum Ambient', style: 'Ambient, 432Hz, Ethereal, Deep Space Drone', bpm: 72, key: 'A Minor (432Hz)' },
  { label: '⚡ Cyberpunk Synthwave', style: 'Dark Synthwave, Cyberpunk 2077, 80s Analog Leads', bpm: 124, key: 'D Minor' },
  { label: '☕ Neon Lo-Fi Beats', style: 'Chill Lo-Fi Hip Hop, Rainy Neon Tokyo, Vinyl Crackle', bpm: 85, key: 'C Major 7' },
  { label: '🫁 Oddech Zero-G', style: 'Bio-Resonance Meditation, Harmonic Flutes, Theta Waves', bpm: 60, key: 'F# Lydian' },
  { label: '🎹 Chopin in Matrix', style: 'Neo-Classical Cinematic Piano, Orchestral Hybrid Climax', bpm: 110, key: 'E Minor' },
];

const KEYS = [
  'A Minor (432Hz)',
  'C Major',
  'D Minor',
  'E Phrygian',
  'F# Lydian',
  'G Dorian',
  '528Hz Solfeggio Harmonic',
];

export const AiSessionPanel: React.FC<AiSessionPanelProps> = ({
  teleportParams,
  onClose
}) => {
  // --- Stan Formularza ---
  const [prompt, setPrompt] = useState(teleportParams?.prompt || 'Ethereal ambient soundscape with warm analog synthesizers and floating spatial echoes');
  const [style, setStyle] = useState(teleportParams?.style || 'Cyber-Ambient 0.00G');
  const [lyrics, setLyrics] = useState(
`[Intro]
Cisza w przestrzeni zero grawitacji...

[Verse 1]
Światło faluje w tonacji A,
Oddech pulsuje, muzyka trwa.

[Chorus]
Zero zero G, harmoniczny stan,
Wiesio i Jason prowadzą ten plan!

[Outro]
Rezonans 432Hz wybrzmiewa w nieskończoność.`
  );
  const [bpm, setBpm] = useState<number>(90);
  const [keySignature, setKeySignature] = useState<string>('A Minor (432Hz)');
  const [duration, setDuration] = useState<number>(60);

  // --- Silnik i Wariant ---
  const [engine, setEngine] = useState<MusicEngine>('minimax-dit');
  const [modelVariant, setModelVariant] = useState<MiniMaxModelVariant>('int8');
  const [cfgScale, setCfgScale] = useState<number>(7.0);
  const [diffusionSteps, setDiffusionSteps] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'prompt' | 'lyrics' | 'params' | 'models'>('prompt');
  /** null = jeszcze nie wiem (most nie odpowiedział), false = brak wag, true = komplet */
  const [modelsReady, setModelsReady] = useState<boolean | null>(null);

  // --- Stan Generacji ---
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<MusicGenerationResult | null>(null);

  // --- Stan Odtwarzacza i Audio ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isStagingTeledysk, setIsStagingTeledysk] = useState<boolean>(false);
  const [grvBalance, setGrvBalance] = useState<number>(() => {
    return parseInt(localStorage.getItem('teo_grv_balance') || '1200', 10);
  });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Synchronizacja parametrów z teleportu AACL jeśli dostarczone
  useEffect(() => {
    if (teleportParams) {
      if (teleportParams.prompt) setPrompt(teleportParams.prompt);
      if (teleportParams.style) setStyle(teleportParams.style);
      if (teleportParams.intensity) {
        setCfgScale(Math.min(15, Math.max(2, parseFloat((7.0 * teleportParams.intensity).toFixed(1)))));
      }
    }
  }, [teleportParams]);

  // Auto-scroll logów
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Synchronizacja tagów strukturalnych do tekstu
  const insertTag = (tag: string) => {
    setLyrics(prev => prev + `\n\n[${tag}]\n`);
  };

  // Tap Tempo Handler
  const handleTapTempo = () => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.slice(-3), now];
    if (tapTimesRef.current.length > 1) {
      const diffs: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        diffs.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const calculatedBpm = Math.min(220, Math.max(40, Math.round(60000 / avgDiff)));
      setBpm(calculatedBpm);
      toast.success(`🥁 Tap Tempo: ${calculatedBpm} BPM`, {
        icon: '🥁',
        style: { background: '#1e1b4b', color: '#c084fc', border: '1px solid #7e22ce' }
      });
    }
  };

  // Obsługa generowania
  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgressPct(0);
    setLogs([]);
    setResult(null);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      if (engine === 'synth-432') {
        // Natychmiastowy generator harmoniczny 432Hz
        setLogs([
          '🎛️ [Lokalny Rezonator 432Hz] Inicjalizacja Web Audio DSP...',
          '🧬 Synteza fali harmonicznej A=432Hz + Solfeggio 528Hz...',
          '✅ Renderowanie bufora PCM w zerowej grawitacji...'
        ]);
        await new Promise(r => setTimeout(r, 600));
        const audioUrl = generateHarmonic432HzTone(duration, 432);
        
        await reportBreathEconomyReward('Harmoniczny Rezonans 432Hz', 100);
        setGrvBalance(prev => {
          const next = prev + 100;
          localStorage.setItem('teo_grv_balance', next.toString());
          return next;
        });

        toast.custom((t) => (
          <div className={`${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all max-w-md w-full bg-slate-900/95 border border-purple-500/40 shadow-2xl rounded-xl p-4 flex items-center gap-3 text-white backdrop-blur-xl`}>
            <div className="p-2 bg-purple-600/30 rounded-lg text-purple-300">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="font-bold text-sm text-purple-200">🫁 Ekonomia Oddechu: +100 GRV</p>
              <p className="text-xs text-slate-400">Wygenerowano falę 432Hz • Zapisano do _OtakOs_Muzyka</p>
            </div>
          </div>
        ), { duration: 4000 });

        setResult({
          success: true,
          audioUrl,
          title: `Rezonans_432Hz_${Date.now()}.wav`,
          duration,
          savedPath: `_OtakOs_Muzyka/Rezonans_432Hz_${Date.now()}.wav`,
          engine: 'synth-432',
          modelVariant: 'int8',
          grvEarned: 100
        });
        setIsGenerating(false);
        return;
      }

      // Generacja MiniMax-Music-3 (lub Suno/Udio Bridge)
      const res = await generateMiniMaxMusic(
        {
          prompt,
          lyrics,
          style,
          bpm,
          keySignature,
          durationSeconds: duration,
          modelVariant,
          engine,
          cfgScale,
          steps: diffusionSteps,
          targetFolder: '_OtakOs_Muzyka',
          title: `${style.slice(0, 15)} - MiniMax_${modelVariant.toUpperCase()}`
        },
        (prog) => {
          setProgressPct(prog.percentage);
          setCurrentStage(prog.stage);
          setLogs(prev => [...prev, prog.log]);
        }
      );

      if (res.success) {
        setResult(res);
        setGrvBalance(prev => {
          const next = prev + 100;
          localStorage.setItem('teo_grv_balance', next.toString());
          return next;
        });

        toast.custom((t) => (
          <div className={`${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all max-w-md w-full bg-gradient-to-r from-purple-950/95 to-slate-900/95 border border-purple-500/50 shadow-2xl rounded-2xl p-4 flex items-center gap-4 text-white backdrop-blur-2xl`}>
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
              <Flame className="w-6 h-6 animate-pulse text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-white">✨ Muzyczny Mózg Wykonany!</p>
                <span className="text-[10px] font-mono bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">+100 GRV</span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">{res.title}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">📁 Folder: _OtakOs_Muzyka</p>
            </div>
          </div>
        ), { duration: 5000 });
      } else {
        toast.error(res.error || 'Błąd generacji MiniMax-Music-3');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Błąd krytyczny generacji';
      toast.error(msg);
      setLogs(prev => [...prev, `❌ Błąd: ${msg}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Zarządzanie Odtwarzaczem Audio
  useEffect(() => {
    if (!result?.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(result.audioUrl);
    } else {
      audioRef.current.src = result.audioUrl;
      audioRef.current.load();
    }

    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration || duration);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [result, isMuted, volume, duration]);

  // Sterowanie play/pause
  const togglePlay = () => {
    if (!audioRef.current || !result) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error('Audio play error:', e);
        setIsPlaying(false);
      });
    }
  };

  // Wizualizacja fal dźwiękowych (Canvas Oscilloscope / Waveform)
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const numBars = 48;
    const barWidth = width / numBars - 2;

    for (let i = 0; i < numBars; i++) {
      const x = i * (barWidth + 2);
      // Animacja dynamiczna zależna od stanu odtwarzania i generacji
      let barHeight = 6;
      if (isPlaying) {
        const time = Date.now() * 0.005;
        barHeight = Math.sin(i * 0.3 + time) * 20 + Math.cos(i * 0.15 - time * 1.5) * 15 + 30;
      } else if (isGenerating) {
        const time = Date.now() * 0.008;
        barHeight = Math.abs(Math.sin(i * 0.2 + time)) * 35 + 8;
      } else {
        barHeight = (Math.sin(i * 0.4) * 0.5 + 0.5) * 16 + 6;
      }

      // Gradient 0.00G (Cyjan -> Fiolet -> Róż)
      const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
      grad.addColorStop(0.6, 'rgba(236, 72, 153, 0.8)');
      grad.addColorStop(1, 'rgba(34, 211, 238, 1)');

      ctx.fillStyle = grad;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    }

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, [isPlaying, isGenerating]);

  useEffect(() => {
    drawWaveform();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [drawWaveform]);

  // Pobranie pliku z nagrodą WYNIK
  const handleDownload = async () => {
    if (!result) return;
    try {
      const res = await fetch(result.audioUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('💾 Utwór pobrany i zachowany w _OtakOs_Muzyka!', {
        icon: '💾',
        style: { background: '#0f172a', color: '#38bdf8', border: '1px solid #0284c7' }
      });
    } catch {
      window.open(result.audioUrl, '_blank');
    }
  };

  // Eksport do Katedry (Kreator Teledysku)
  const handleCreateTeledysk = async () => {
    if (!result) return;
    setIsStagingTeledysk(true);
    try {
      const res = await fetch('http://127.0.0.1:3001/api/teledysk/stage-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: result.audioUrl, title: result.title }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Błąd mostu Katedry');

      const hubHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5176'
        : '';
      const q = new URLSearchParams({ openTeledysk: '1', audioFile: data.audioFile, title: result.title });
      window.open(`${hubHost}/?${q.toString()}`, '_blank');
      toast.success('🎬 Otwarto Kreator Teledysku w Katedrze!');
    } catch (e: unknown) {
      console.warn('Błąd Katedry:', e);
      toast.error('Błąd połączenia z Katedrą Teledysku');
    } finally {
      setIsStagingTeledysk(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-950/90 border border-purple-500/30 rounded-3xl shadow-[0_0_80px_rgba(168,85,247,0.2)] overflow-hidden font-sans backdrop-blur-2xl flex flex-col my-4">
      
      {/* 🧭 TOP HUD BAR */}
      <div className="px-6 py-4 border-b border-purple-500/20 bg-black/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/40 rounded-xl text-purple-300 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wider uppercase text-white flex items-center gap-2">
                MiniMax-Music-3 <span className="text-xs px-2 py-0.5 bg-purple-900/60 border border-purple-400/40 text-purple-300 rounded-full font-mono">DiT Core 0.00G</span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Muzyczny Mózg Wykonawczy • Most: <span className="text-emerald-400">127.0.0.1:3001</span> • Folder: <span className="text-purple-300 font-bold">_OtakOs_Muzyka</span>
            </p>
          </div>
        </div>

        {/* Ekonomia Oddechu Status */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-900/80 border border-amber-500/30 rounded-full flex items-center gap-2 text-xs font-mono text-amber-300">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Oddech: <strong className="text-white">{grvBalance} GRV</strong></span>
          </div>

          <div className="px-3 py-1.5 bg-purple-950/60 border border-purple-500/30 rounded-full flex items-center gap-2 text-xs font-mono text-purple-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>0.00G UZS Synced</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 transition-colors"
            >
              Zamknij
            </button>
          )}
        </div>
      </div>

      {/* 🎛️ GŁÓWNA SIATKA ROBOCZA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1">
        
        {/* LEWY PANEL (7 KOLUMN): Prompt, Lyrics, BPM & HUD Wyboru */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-purple-500/20 flex flex-col space-y-6 overflow-y-auto max-h-[78vh]">
          
          {/* Szybkie Presety Stylów */}
          <div>
            <label className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2 flex items-center gap-1.5 font-mono">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Szybka Inspiracja (Presety Brzmienia)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_VIBES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setStyle(preset.style);
                    setBpm(preset.bpm);
                    setKeySignature(preset.key);
                    toast.success(`Załadowano styl: ${preset.label}`, { duration: 1500 });
                  }}
                  className="text-[11px] px-3 py-1.5 bg-slate-900/80 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/60 rounded-xl text-slate-300 hover:text-white transition-all font-mono"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model & Engine Selector HUD */}
          <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5 uppercase">
                <Disc3 className="w-4 h-4 text-pink-400 animate-spin" />
                <span>Wybór Silnika Muzycznego</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">DiT Tensor Architecture</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* MiniMax DiT */}
              <button
                onClick={() => setEngine('minimax-dit')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  engine === 'minimax-dit'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>MiniMax-Music-3</span>
                  <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded">DiT</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Lokalna dyfuzja MiniMax</p>
              </button>

              {/* Suno / Udio Bridge */}
              <button
                onClick={() => setEngine('suno-udio-bridge')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  engine === 'suno-udio-bridge'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Suno/Udio Bridge</span>
                  <span className="text-[9px] bg-pink-500/30 text-pink-200 px-1.5 py-0.5 rounded">v5</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Most Chmurowy Suno/Udio</p>
              </button>

              {/* 432Hz Bio-Synth */}
              <button
                onClick={() => setEngine('synth-432')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  engine === 'synth-432'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Syntezator 432Hz</span>
                  <span className="text-[9px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.5 rounded">DSP</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Czyste Fale Harmoniczne</p>
              </button>
            </div>

            {/* Wariant Precyzji MiniMax (int8 / fp16 / fp32) */}
            {engine === 'minimax-dit' && (
              <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400 font-mono">Wariant Wyciszenia (VRAM):</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setModelVariant('int8'); setDiffusionSteps(30); }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                      modelVariant === 'int8'
                        ? 'bg-purple-600 text-white border-purple-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    int8 (2.5 GB • Szybki)
                  </button>
                  <button
                    onClick={() => { setModelVariant('fp16'); setDiffusionSteps(50); }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                      modelVariant === 'fp16'
                        ? 'bg-purple-600 text-white border-purple-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    fp16 (4.9 GB • Wysoka Jakość)
                  </button>
                  <button
                    onClick={() => { setModelVariant('fp32'); setDiffusionSteps(80); }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                      modelVariant === 'fp32'
                        ? 'bg-purple-600 text-white border-purple-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    fp32 (Studio Master)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Zakładki Edytora: Prompt / Tekst Piosenki (Lyrics) / Parametry */}
          <div className="flex border-b border-purple-500/20 gap-4">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`pb-2 text-xs font-bold font-mono tracking-wider uppercase transition-colors border-b-2 ${
                activeTab === 'prompt'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Studio Prompt & Styl
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`pb-2 text-xs font-bold font-mono tracking-wider uppercase transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'lyrics'
                  ? 'border-pink-400 text-pink-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>Edytor Tekstu & Struktury</span>
              <span className="text-[9px] bg-pink-900/60 text-pink-300 px-1.5 rounded">Zwrotki/Refren</span>
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`pb-2 text-xs font-bold font-mono tracking-wider uppercase transition-colors border-b-2 ${
                activeTab === 'params'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              BPM / Tonacja / Dyfuzja
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`pb-2 text-xs font-bold font-mono tracking-wider uppercase transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'models'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Katalog Modeli</span>
              {/* Kropka ostrzegawcza: wagi niekompletne = generacja nie ruszy */}
              {modelsReady === false && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                  title="Brakuje wag modeli — generacja nie ruszy"
                />
              )}
            </button>
          </div>

          {/* TAB 1: Prompt i Styl */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-mono mb-1 block">Opis Brzmienia (Soundscape Prompt):</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Opisz nastrój, instrumentarium, tempo, wokal i atmosferę..."
                  className="w-full bg-slate-900/90 border border-purple-500/30 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400 h-28 resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-mono mb-1 block">Gatunek i Paleta Dźwiękowa (Style Palette):</label>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-900/90 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Edytor Tekstu i Struktury */}
          {activeTab === 'lyrics' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-mono">Wstaw znaczniki aranżacji:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Intro', 'Verse 1', 'Verse 2', 'Chorus', 'Drop', 'Bridge', 'Outro'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => insertTag(tag)}
                      className="text-[10px] px-2.5 py-1 bg-slate-900 hover:bg-pink-900/40 border border-pink-500/30 rounded-md text-pink-300 font-mono transition-colors"
                    >
                      + [{tag}]
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Wpisz tekst piosenki ze znacznikami [Verse], [Chorus] itp."
                className="w-full bg-slate-900/90 border border-pink-500/30 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-400 h-44 resize-none font-mono scrollbar-thin"
              />
            </div>
          )}

          {/* TAB 3: Parametry BPM, Tonacja i Dyfuzja */}
          {activeTab === 'params' && (
            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-2 gap-4">
                {/* BPM z Tap Tempo */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-purple-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Tempo (BPM):</span>
                    <button
                      onClick={handleTapTempo}
                      className="text-[10px] px-2 py-0.5 bg-purple-600/40 hover:bg-purple-600 text-purple-200 border border-purple-400/40 rounded transition-all active:scale-95"
                    >
                      🥁 Tap Tempo
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="40" max="200" step="1"
                      value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))}
                      className="flex-1 accent-purple-500 bg-slate-800 rounded-lg h-1.5"
                    />
                    <span className="text-sm font-bold text-white w-10 text-right">{bpm}</span>
                  </div>
                </div>

                {/* Tonacja (Key Signature) */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-purple-500/20">
                  <label className="text-xs text-slate-400 block mb-2">Tonacja / Skala:</label>
                  <select
                    value={keySignature}
                    onChange={(e) => setKeySignature(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {KEYS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Czas Trwania */}
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-purple-500/20">
                <div className="flex justify-between items-center mb-2 text-xs">
                  <span className="text-slate-400">Czas Trwania Utworu:</span>
                  <span className="text-purple-300 font-bold">{duration} sek. ({Math.floor(duration/60)}m {duration%60}s)</span>
                </div>
                <div className="flex gap-2">
                  {[15, 30, 60, 120, 180, 240].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`flex-1 py-1 text-xs rounded-lg border transition-all ${
                        duration === d
                          ? 'bg-purple-600 text-white border-purple-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Guidance & Steps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>CFG Guidance:</span>
                    <span className="text-white font-bold">{cfgScale}</span>
                  </div>
                  <input
                    type="range" min="1" max="20" step="0.5"
                    value={cfgScale} onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 bg-slate-800 rounded-lg h-1.5"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Kroki Dyfuzji (Steps):</span>
                    <span className="text-white font-bold">{diffusionSteps}</span>
                  </div>
                  <input
                    type="range" min="10" max="100" step="5"
                    value={diffusionSteps} onChange={(e) => setDiffusionSteps(parseInt(e.target.value))}
                    className="w-full accent-purple-500 bg-slate-800 rounded-lg h-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Katalog Modeli — realny stan wag na dysku + pobieranie */}
          {activeTab === 'models' && (
            <ModelCatalogPanel onReadyChange={setModelsReady} />
          )}

          {/* PRZYCISK URUCHOMIENIA GENERACJI */}
          <motion.button
            onClick={handleGenerate}
            disabled={isGenerating}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl font-mono ${
              isGenerating
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-purple-500/20'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                <span>Przetwarzanie w Rezonansie 0.00G ({progressPct}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                <span>Uruchom Muzyczny Mózg MiniMax-Music-3</span>
              </>
            )}
          </motion.button>

        </div>

        {/* PRAWY PANEL (5 KOLUMN): Pipeline Status, Konsola i Odtwarzacz z Wizualizacją */}
        <div className="lg:col-span-5 p-6 bg-black/60 flex flex-col justify-between space-y-6">
          
          {/* PIPELINE STATUS HUD */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">PIPELINE TELEMETRY</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Stan: <span className="text-cyan-400 font-bold uppercase">{currentStage}</span>
              </div>
            </div>

            {/* Pasek Postępu Generacji */}
            {isGenerating && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Synteza DiT Latent:</span>
                  <span className="text-purple-300 font-bold">{progressPct}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-purple-500/30">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Konsola Logów na Żywo */}
            <div className="bg-slate-950 border border-purple-500/20 rounded-xl p-3.5 h-44 overflow-y-auto space-y-1.5 font-mono text-[10px] text-emerald-400 scrollbar-thin">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <Layers className="w-6 h-6 text-slate-700" />
                  <span>Czekam na sygnał inicjacji syntezy audio...</span>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* ODTWARZACZ AUDIO I WIZUALIZATOR FAL DŹWIĘKOWYCH */}
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
            
            {/* Canvas Wizualizatora Fal */}
            <div className="w-full h-16 bg-black/70 rounded-xl border border-purple-500/20 overflow-hidden relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={380}
                height={64}
                className="w-full h-full"
              />
              {!result && !isGenerating && (
                <div className="absolute text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Oscyloskop Czuwania 0.00G
                </div>
              )}
            </div>

            {/* Tytuł i Stan */}
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate font-mono">
                  {result ? result.title : 'Gotowy do Odtwarzania'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {result ? `Model: MiniMax-Music-3 (${result.modelVariant.toUpperCase()})` : 'Czekam na wygenerowanie utworu'}
                </p>
              </div>

              {result && (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  +100 GRV
                </span>
              )}
            </div>

            {/* Pasek Odtwarzania i Czas */}
            {result && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(audioDuration / 60)}:{(Math.floor(audioDuration % 60)).toString().padStart(2, '0')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={audioDuration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const nextTime = parseFloat(e.target.value);
                    setCurrentTime(nextTime);
                    if (audioRef.current) {
                      audioRef.current.currentTime = nextTime;
                    }
                  }}
                  className="w-full accent-pink-500 bg-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Przyciski Sterowania */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  disabled={!result}
                  className={`p-3 rounded-full text-white transition-all shadow-lg ${
                    !result
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isPlaying
                      ? 'bg-pink-600 hover:bg-pink-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                  title={isPlaying ? 'Pauza' : 'Odtwórz'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                {/* Głośność */}
                <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl">
                  <button
                    onClick={() => setIsMuted(prev => !prev)}
                    disabled={!result}
                    className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (isMuted) setIsMuted(false);
                      if (audioRef.current) audioRef.current.volume = v;
                    }}
                    className="w-14 accent-purple-400 bg-slate-700 rounded-lg h-1 appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Akcje Eksportu */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!result}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-mono"
                  title="Pobierz plik audio"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Pobierz</span>
                </button>

                <button
                  onClick={handleCreateTeledysk}
                  disabled={!result || isStagingTeledysk}
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md"
                  title="Stwórz teledysk w Katedrze"
                >
                  {isStagingTeledysk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>🎬 Katedra Teledysk</span>}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AiSessionPanel;
