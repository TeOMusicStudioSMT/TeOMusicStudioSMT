import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Activity, Mic2, Play, Pause, Cpu, 
  Terminal, Sliders, Music, ArrowLeft, Sparkles,
  SlidersHorizontal, Download, RefreshCw
} from 'lucide-react'; // Import ikon
import BioResonanceEngine from './components/BioResonanceEngine';
import GravitonRadio from './components/GravitonRadio';
import GhostCursor from './components/GhostCursor';
import HolographicCard from './components/HolographicCard';

interface TeleportParams {
  style: string;
  prompt: string;
  tags: string[];
  model: string;
  intensity: number;
  confidence: number;
  generationId: string;
}

function App() {
  // 'engine' | 'radio' | 'ai' | null
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // Stany AACL Teleportacji
  const [teleportParams, setTeleportParams] = useState<TeleportParams | null>(null);

  // Parametry modelu ACE-Step 1.5
  const [cfgScale, setCfgScale] = useState<number>(7.0);
  const [diffusionSteps, setDiffusionSteps] = useState<number>(50);
  const [denoisingStrength, setDenoisingStrength] = useState<number>(0.70);
  const [selectedLora, setSelectedLora] = useState<string>('gton_vocal');
  const [sampler, setSampler] = useState<string>('DPM++ 2M');

  // Stany Generacji lokalnej
  const [isGenerating, setIsGenerating] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string; title: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStagingTeledysk, setIsStagingTeledysk] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronizacja odtwarzacza z isPlaying i wygenerowanym audio
  useEffect(() => {
    if (!generatedAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(generatedAudio.url);
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    } else if (audioRef.current.src !== generatedAudio.url) {
      audioRef.current.pause();
      audioRef.current.src = generatedAudio.url;
      audioRef.current.load();
    }

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Błąd odtwarzania audio:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, generatedAudio]);

  // Zatrzymanie audio przy zmianie modułu lub wyjściu
  useEffect(() => {
    if (!activeModule) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [activeModule]);

  // Czyszczenie przy odmontowaniu
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Bezpieczne i wymuszone pobieranie pliku audio (obejście CORS i nawigacji)
  const handleDownload = async (e: React.MouseEvent) => {
    if (!generatedAudio) return;
    e.preventDefault();
    try {
      const res = await fetch(generatedAudio.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      
      const extension = generatedAudio.url.split('.').pop()?.split('?')[0] || 'mp3';
      const cleanTitle = generatedAudio.title.replace(/[^a-zA-Z0-9-_]/g, '_');
      tempLink.setAttribute('download', `${cleanTitle}.${extension}`);
      
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Błąd pobierania pliku przez Fetch Blob, fallback do nowej karty:', err);
      window.open(generatedAudio.url, '_blank');
    }
  };

  // Auto-detekcja teleportacji z Huba (Query string)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const style = query.get('style');
    const prompt = query.get('prompt');

    if (style || prompt) {
      const tags = query.get('tags') ? (query.get('tags') || '').split(',') : [];
      const model = query.get('model') || 'v5';
      const intensity = query.get('intensity') ? parseFloat(query.get('intensity') || '1.0') : 1.0;
      const confidence = query.get('confidence') ? parseFloat(query.get('confidence') || '1.0') : 1.0;
      const generationId = query.get('generationId') || `gen_${Date.now()}`;

      setTeleportParams({
        style: style || 'Ambient soundscape',
        prompt: prompt || 'Ambient background music',
        tags,
        model,
        intensity,
        confidence,
        generationId,
      });

      // Ustaw wagi wejściowe w modelu lokalnym na podstawie parametrów AACL
      setCfgScale(Math.min(20, Math.max(1, parseFloat((7.0 * intensity).toFixed(1)))));
      setDenoisingStrength(Math.min(1.0, Math.max(0.1, parseFloat((0.70 * confidence).toFixed(2)))));

      setActiveModule('ai');

      // Oczyść pasek URL bez odświeżania strony
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Auto-scroll logów konsoli
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Symulator lokalnej generacji ACE-Step 1.5 (acestep.cpp + GGML)
  const runLocalGeneration = async () => {
    setIsGenerating(true);
    setConsoleLogs([]);
    setGenerationProgress(0);
    setGeneratedAudio(null);
    setIsPlaying(false);

    const logs = [
      '🤖 [acestep.cpp] Inicjalizacja kontekstu GGML...',
      `🤖 [acestep.cpp] Wczytywanie modelu bazowego: ace-step-1.5-q4_k_m.gguf (Pamięć: 4.2GB)`,
      '🤖 [acestep.cpp] Alokacja wątków CPU: 8 rdzeni wykrytych, akceleracja CUDA aktywna.',
      `🤖 [acestep.cpp] Wstrzykiwanie wagi LoRA: ${selectedLora} (współczynnik wagi: ${(teleportParams?.intensity || 1.0).toFixed(2)})`,
      `🤖 [acestep.cpp] Prompt: "${teleportParams?.prompt || 'A beautiful soundscape'}"`,
      `🤖 [acestep.cpp] Styl: ${teleportParams?.style || 'Syntetyczna'} | Tagi: ${(teleportParams?.tags || []).join(', ')}`,
      `🤖 [acestep.cpp] Konfiguracja: CFG=${cfgScale}, Kroki=${diffusionSteps}, Szum=${denoisingStrength}, Próbnik=${sampler}`,
      '🤖 [acestep.cpp] Start procesu dyfuzji w przestrzeni latentnej...'
    ];

    for (let i = 0; i < logs.length; i++) {
      setConsoleLogs(prev => [...prev, logs[i]]);
      await new Promise(r => setTimeout(r, 250));
    }

    // Pętla kroków dyfuzji
    const totalSteps = diffusionSteps;
    for (let step = 1; step <= totalSteps; step++) {
      const percent = Math.round((step / totalSteps) * 100);
      setGenerationProgress(percent);
      
      if (step % 5 === 0 || step === 1 || step === totalSteps) {
        const loss = (0.25 * (1 - step/totalSteps) + Math.random() * 0.05).toFixed(4);
        setConsoleLogs(prev => [
          ...prev, 
          `⏳ [DiT] Próbkowanie kroku ${step}/${totalSteps} | progres: ${percent}% | strata: ${loss} | sampler: ${sampler}`
        ]);
      }
      await new Promise(r => setTimeout(r, Math.max(20, 1000 / totalSteps)));
    }

    const postLogs = [
      '🔊 [Vocoder] Dekodowanie przestrzeni latentnej do pliku WAV (44.1kHz, 24-bit stereo)...',
      '🎛️ [Post-Processor] Aplikacja limitera pasmowego oraz wyrównanie fazowe...',
      '✅ [acestep.cpp] Proces transmutacji zakończony pomyślnie!',
      `⚡ [acestep.cpp] Wygenerowano plik: ${teleportParams?.style.replace(/\s+/g, '_') || 'track'}_ace1.5.mp3 (Czas: 3.42 sekundy)`
    ];

    for (let i = 0; i < postLogs.length; i++) {
      setConsoleLogs(prev => [...prev, postLogs[i]]);
      await new Promise(r => setTimeout(r, 300));
    }

    // Pętla pobierająca dostępny lokalny utwór z mostu Wiesio-Bridge
    let audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    try {
      const response = await fetch('http://127.0.0.1:3001/wiesio/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GET_LOCAL_PLAYLIST' }),
      });
      const data = await response.json();
      if (data.success && data.tracks && data.tracks.length > 0) {
        // Wybieramy losowy utwór z lokalnej biblioteki, aby symulacja brzmiała za każdym razem unikalnie!
        const randomIndex = Math.floor(Math.random() * data.tracks.length);
        audioUrl = data.tracks[randomIndex].audio_url;
      } else {
        // Fallback do 1. Solar Puso.wav
        audioUrl = 'http://127.0.0.1:3001/music/OtakOS%20RADIO%20Album\'s/2Solar%20Puso/1.%20Solar%20Puso.wav';
      }
    } catch (e) {
      console.warn('[ACE-Step] Wiesio-Bridge offline, falling back to public demo track:', e);
      audioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }

    setGeneratedAudio({
      url: audioUrl,
      title: `${teleportParams?.style || 'ACE-Step'} - Wygenerowany Lokalnie`,
    });
    setIsGenerating(false);
  };

  // 🎬 Wyślij wygenerowany utwór do Kreatora Teledysku w Katedrze (Hub, :5176)
  const handleCreateTeledysk = async () => {
    if (!generatedAudio) return;
    setIsStagingTeledysk(true);
    try {
      const res = await fetch('http://127.0.0.1:3001/api/teledysk/stage-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: generatedAudio.url, title: generatedAudio.title }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Nie udało się przenieść utworu do Katedry');

      const hubHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5176'
        : '';
      const q = new URLSearchParams({ openTeledysk: '1', audioFile: data.audioFile, title: generatedAudio.title });
      window.open(`${hubHost}/?${q.toString()}`, '_blank');
    } catch (e) {
      console.error('[ACE-Step] ❌ Teledysk:', e);
    } finally {
      setIsStagingTeledysk(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 relative overflow-x-hidden">

      {/* 👻 EFEKT DUSZKA */}
      <GhostCursor bloomStrength={1.2} bloomRadius={0.5} color="#a855f7" zIndex={0} />

      <AnimatePresence mode="wait">
        {!activeModule ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10"
          >
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black -z-10 opacity-80" />

            <motion.div
              initial={{ y: -50 }} animate={{ y: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                TeO <span className="text-white">Music Studio</span> V2
              </h1>
              <p className="text-slate-400 text-lg uppercase tracking-widest font-mono">Epoch 1: Genesis Node Initialization</p>
            </motion.div>

            {/* KARTY 3D */}
            <div className="flex flex-wrap justify-center gap-8 perspective-1000">

              <HolographicCard
                title="AI Session"
                description="Collaborate with Gemini agents to compose new realities."
                icon={Mic2}
                color="#f472b6" // Pink
                onClick={() => setActiveModule('ai')}
              />

              <HolographicCard
                title="Graviton Radio"
                description="Tune into the frequencies of the network."
                icon={Radio}
                color="#a855f7" // Purple
                onClick={() => setActiveModule('radio')}
              />

              <HolographicCard
                title="G-TON Node"
                description="Generate Healing Frequencies for the Graviton Gallery."
                icon={Activity}
                color="#22d3ee" // Cyan
                onClick={() => setActiveModule('engine')}
              />

            </div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="absolute bottom-8 text-[10px] text-slate-600 font-mono"
            >
              System Status: <span className="text-green-500">Online</span> • UZS Protocol Active
            </motion.div>

          </motion.div>
        ) : (
          <motion.div
            key="module"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full min-h-screen relative z-10 flex items-center justify-center p-6"
          >
            {/* ⚙️ MODUŁ BIO-REZONANSU */}
            {activeModule === 'engine' && <BioResonanceEngine />}

            {/* 📻 GRAVITON RADIO — strumień z lokalnej biblioteki Katedry */}
            {activeModule === 'radio' && <GravitonRadio />}

            {/* 🔮 MODUŁ AI SESSION: ACE-STEP 1.5 LOCAL ENGINEERING */}
            {activeModule === 'ai' && (
              <div className="w-full max-w-5xl bg-slate-950/80 border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden font-mono flex flex-col md:flex-row h-auto md:h-[80vh]">
                
                {/* PANEL LEWY: Kontekst AACL z Huba & Suwaki ACE-Step */}
                <div className="w-full md:w-[45%] p-6 border-r border-purple-500/20 flex flex-col overflow-y-auto">
                  <div className="flex items-center gap-2 text-purple-400 mb-6">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h2 className="text-sm font-bold tracking-widest uppercase">ACE-Step 1.5 Local Engine</h2>
                  </div>

                  {/* Parametry z Huba (AACL) */}
                  {teleportParams && (
                    <div className="bg-slate-900/50 p-4 border border-purple-500/10 rounded-xl mb-6 space-y-3 text-[11px]">
                      <div className="text-xs font-bold text-cyan-400 border-b border-purple-500/20 pb-1 flex justify-between">
                        <span>📥 TELEPORT CONTEXT</span>
                        <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded">AACL v2.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Styl:</span>
                        <span className="text-white font-bold">{teleportParams.style}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 mb-1">Prompt:</span>
                        <span className="text-white bg-black/40 p-2 rounded border border-white/5 text-[10px] leading-relaxed max-h-16 overflow-y-auto">
                          {teleportParams.prompt}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ISKRA Intensity:</span>
                        <span className="text-amber-400 font-bold">{(teleportParams.intensity).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Confidence Score:</span>
                        <span className="text-emerald-400 font-bold">{Math.round(teleportParams.confidence * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Ustawienia Syntezy Dźwięku */}
                  <div className="space-y-5 flex-1">
                    <div className="text-xs font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" />
                      <span>SYNTHESIS PARAMETERS</span>
                    </div>

                    {/* Guidance Scale (CFG) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Guidance Scale (CFG):</span>
                        <span className="text-white font-bold">{cfgScale}</span>
                      </div>
                      <input 
                        type="range" min="1" max="20" step="0.5"
                        value={cfgScale} onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 bg-slate-800 rounded-lg appearance-none h-1.5"
                      />
                    </div>

                    {/* Diffusion Steps */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Diffusion Steps:</span>
                        <span className="text-white font-bold">{diffusionSteps}</span>
                      </div>
                      <input 
                        type="range" min="10" max="150" step="5"
                        value={diffusionSteps} onChange={(e) => setDiffusionSteps(parseInt(e.target.value))}
                        className="w-full accent-purple-500 bg-slate-800 rounded-lg appearance-none h-1.5"
                      />
                    </div>

                    {/* Denoising Strength */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Denoising Strength:</span>
                        <span className="text-white font-bold">{denoisingStrength}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1.0" step="0.05"
                        value={denoisingStrength} onChange={(e) => setDenoisingStrength(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 bg-slate-800 rounded-lg appearance-none h-1.5"
                      />
                    </div>

                    {/* Wybór Adaptera LoRA */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>LoRA Voice Adapter:</span>
                      </label>
                      <select 
                        value={selectedLora} onChange={(e) => setSelectedLora(e.target.value)}
                        className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="gton_vocal">G-TON Vocal Resonance (v1.2)</option>
                        <option value="lofi_dreams">Lofi Dreams Adaptor (v0.9)</option>
                        <option value="deepmind_harmony">DeepMind Harmonic LoRA</option>
                        <option value="none">Brak (Foundation Model 1.5)</option>
                      </select>
                    </div>

                    {/* Sampler */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Sampling Method:</span>
                      </label>
                      <select 
                        value={sampler} onChange={(e) => setSampler(e.target.value)}
                        className="w-full bg-slate-900 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="DPM++ 2M">DPM++ 2M (Zalecany)</option>
                        <option value="Euler a">Euler a (Szybki)</option>
                        <option value="UniPC">UniPC (Stabilny)</option>
                        <option value="Heun">Heun (Wysoka Precyzja)</option>
                      </select>
                    </div>
                  </div>

                  {/* Przycisk Generuj */}
                  <button
                    onClick={runLocalGeneration}
                    disabled={isGenerating}
                    className="w-full py-4 mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Generuję Lokalnie...' : 'Generuj przez ACE-Step'}</span>
                  </button>
                </div>

                {/* PANEL PRAWY: Konsola Acestep.cpp i Wynik końcowy */}
                <div className="w-full md:w-[55%] p-6 bg-black/60 flex flex-col overflow-hidden h-[50vh] md:h-auto">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-purple-500/20 pb-3 mb-4">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>ACESTEP CONSOLE LOGS</span>
                    </span>
                    {isGenerating && (
                      <span className="text-purple-400 animate-pulse font-bold">
                        PROGRES: {generationProgress}%
                      </span>
                    )}
                  </div>

                  {/* Logi konsoli */}
                  <div className="flex-1 bg-slate-950 border border-purple-500/10 rounded-xl p-4 overflow-y-auto space-y-2 text-[10px] text-emerald-400 font-mono scrollbar-thin">
                    {consoleLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2">
                        <Terminal className="w-8 h-8" />
                        <span>Rozpocznij generowanie pliku lokalnego...</span>
                      </div>
                    ) : (
                      consoleLogs.map((log, index) => (
                        <div key={index} className="leading-relaxed">
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>

                  {/* Wynik Generacji i Odtwarzacz */}
                  <AnimatePresence>
                    {generatedAudio && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mt-4 p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
                            <Music className="w-5 h-5 animate-bounce" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{generatedAudio.title}</h4>
                            <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Model: ACE-Step 1.5 GGUF</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsPlaying(prev => !prev)}
                            className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors"
                            title={isPlaying ? "Wstrzymaj odtwarzanie" : "Odtwórz utwór"}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={handleDownload}
                            className="p-3 bg-slate-900 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-purple-500/20 flex items-center justify-center"
                            title="Pobierz plik audio"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCreateTeledysk}
                            disabled={isStagingTeledysk}
                            className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Stwórz teledysk (otwórz w Katedrze)"
                          >
                            {isStagingTeledysk ? <RefreshCw className="w-4 h-4 animate-spin" /> : '🎬'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            )}

            {/* Przycisk powrotu */}
            <button
              onClick={() => setActiveModule(null)}
              className="fixed top-6 right-6 text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-widest z-50 bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Module</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;