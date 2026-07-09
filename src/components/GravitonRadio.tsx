/**
 * 📻 GravitonRadio — prawdziwe radio z lokalnej biblioteki Katedry.
 *
 * Strumieniuje utwory z _OtakOs_Muzyka przez Wiesio-Bridge
 * (GET_LOCAL_PLAYLIST → http://127.0.0.1:3001/music/...).
 * Auto-next, shuffle, wizualizator Web Audio. Gdy most offline —
 * czytelny komunikat zamiast atrapy.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Play, Pause, SkipForward, SkipBack, Shuffle, WifiOff, ListMusic } from 'lucide-react';

interface RadioTrack {
  id: string;
  title: string;
  audio_url: string;
  filename: string;
  tags?: string;
}

const BRIDGE = 'http://127.0.0.1:3001';
const BAR_COUNT = 24;

const GravitonRadio: React.FC = () => {
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bridgeOffline, setBridgeOffline] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(4));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const currentTrack = tracks[currentIndex] ?? null;

  // ── Playlist z mostu ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BRIDGE}/api/bridge/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'GET_LOCAL_PLAYLIST' }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          setTracks(data.tracks);
        } else {
          setBridgeOffline(true);
        }
      } catch {
        setBridgeOffline(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Audio element + analyser (leniwie, po pierwszym Play) ────────
  const ensureAudioGraph = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.crossOrigin = 'anonymous';
      audioRef.current = el;
    }
    if (!audioCtxRef.current && audioRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const src = ctx.createMediaElementSource(audioRef.current);
      src.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = src;
    }
    audioCtxRef.current?.resume().catch(() => {});
  }, []);

  // ── Pętla wizualizatora ──────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      if (analyser && isPlaying) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
        setBars(Array.from({ length: BAR_COUNT }, (_, i) => 4 + (data[i * step] / 255) * 44));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying]);

  // ── Sterowanie odtwarzaniem ──────────────────────────────────────
  const playTrack = useCallback((index: number) => {
    if (!tracks.length) return;
    ensureAudioGraph();
    const el = audioRef.current!;
    const track = tracks[((index % tracks.length) + tracks.length) % tracks.length];
    setCurrentIndex(((index % tracks.length) + tracks.length) % tracks.length);
    if (el.src !== track.audio_url) {
      el.src = track.audio_url;
      el.load();
    }
    el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [tracks, ensureAudioGraph]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    ensureAudioGraph();
    const el = audioRef.current!;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else if (el.src) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      playTrack(currentIndex);
    }
  }, [currentTrack, isPlaying, currentIndex, playTrack, ensureAudioGraph]);

  const next = useCallback(() => playTrack(currentIndex + 1), [playTrack, currentIndex]);
  const prev = useCallback(() => playTrack(currentIndex - 1), [playTrack, currentIndex]);
  const shuffle = useCallback(() => {
    if (tracks.length < 2) return;
    let idx = currentIndex;
    while (idx === currentIndex) idx = Math.floor(Math.random() * tracks.length);
    playTrack(idx);
  }, [tracks.length, currentIndex, playTrack]);

  // Auto-next po zakończeniu utworu (radio nie milknie)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => playTrack(currentIndex + 1);
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, [playTrack, currentIndex]);

  // Sprzątanie przy odmontowaniu
  useEffect(() => () => {
    audioRef.current?.pause();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
  }, []);

  // ── UI ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="text-center text-slate-400 font-mono text-sm animate-pulse">
        📡 Strojenie do częstotliwości Katedry...
      </div>
    );
  }

  if (bridgeOffline) {
    return (
      <div className="max-w-md mx-auto text-center bg-slate-950/80 border border-purple-500/30 rounded-2xl p-10 font-mono">
        <WifiOff className="w-10 h-10 text-slate-600 mx-auto mb-4" />
        <h3 className="text-purple-300 font-bold mb-2">Most Wiesio-Bridge milczy</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Graviton Radio gra Twoją lokalną bibliotekę (<span className="text-purple-400">_OtakOs_Muzyka</span>)
          przez most na <span className="text-cyan-400">127.0.0.1:3001</span>.<br />
          Odpal Katedrę (START_KATEDRA.bat) i wróć tutaj.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-950/80 border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] p-8 font-mono">
      {/* Nagłówek */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-purple-400">
          <Radio className="w-5 h-5 animate-pulse" />
          <h2 className="text-sm font-bold tracking-widest uppercase">Graviton Radio · 0.00G</h2>
        </div>
        <button
          onClick={() => setShowPlaylist(p => !p)}
          className={`p-2 rounded-lg border transition-colors ${showPlaylist ? 'border-cyan-400/60 text-cyan-300 bg-cyan-950/30' : 'border-white/10 text-slate-500 hover:text-white'}`}
          title="Playlista"
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </div>

      {/* Wizualizator */}
      <div className="flex items-end justify-center gap-1 h-14 mb-6">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-2 rounded-t bg-gradient-to-t from-purple-600 to-cyan-400 transition-[height] duration-75"
            style={{ height: `${isPlaying ? h : 4}px`, opacity: isPlaying ? 0.9 : 0.25 }}
          />
        ))}
      </div>

      {/* Aktualny utwór */}
      <div className="text-center mb-6 min-h-[3rem]">
        <div className="text-white font-bold truncate">{currentTrack?.title ?? '—'}</div>
        <div className="text-[10px] text-slate-500 mt-1">
          {currentIndex + 1} / {tracks.length} · {currentTrack?.tags ?? 'local'}
        </div>
      </div>

      {/* Sterowanie */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={shuffle} className="p-3 text-slate-400 hover:text-cyan-300 transition-colors" title="Losowy utwór">
          <Shuffle className="w-4 h-4" />
        </button>
        <button onClick={prev} className="p-3 text-slate-300 hover:text-white transition-colors" title="Poprzedni">
          <SkipBack className="w-5 h-5" />
        </button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={togglePlay}
          className="p-5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-full text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all"
          title={isPlaying ? 'Pauza' : 'Graj'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </motion.button>
        <button onClick={next} className="p-3 text-slate-300 hover:text-white transition-colors" title="Następny">
          <SkipForward className="w-5 h-5" />
        </button>
        <div className="w-10" />
      </div>

      {/* Playlista */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6"
          >
            <div className="max-h-64 overflow-y-auto space-y-1 pr-2 border-t border-purple-500/20 pt-4">
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => playTrack(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-colors ${
                    i === currentIndex
                      ? 'bg-purple-900/40 text-cyan-300 border border-purple-500/40'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  {i === currentIndex && isPlaying ? '▶ ' : ''}{t.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GravitonRadio;
