import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Activity, Mic2, ArrowLeft, Grid3x3, Scissors
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import BioResonanceEngine from './components/BioResonanceEngine';
import GravitonRadio from './components/GravitonRadio';
import GhostCursor from './components/GhostCursor';
import HolographicCard from './components/HolographicCard';
import AiSessionPanel from './components/AiSessionPanel';
import BitGridPanel from './components/BitGridPanel';
import RzezbaPanel from './components/RzezbaPanel';

interface TeleportParams {
  style: string;
  prompt: string;
  tags: string[];
  model: string;
  intensity: number;
  confidence: number;
  generationId: string;
}

function getInitialTeleport(): { params: TeleportParams | null; active: string | null } {
  if (typeof window === 'undefined') return { params: null, active: null };
  const query = new URLSearchParams(window.location.search);
  const style = query.get('style');
  const prompt = query.get('prompt');

  // Wejście wprost w moduł: /?modul=bity — pozwala Katedrze (i Joannie)
  // teleportować Suwerena od razu tam, gdzie trzeba, zamiast na landing.
  const modul = query.get('modul');
  const ZNANE_MODULY = ['ai', 'bity', 'rzezba', 'radio', 'engine'];
  if (modul && ZNANE_MODULY.includes(modul) && !style && !prompt) {
    return { params: null, active: modul };
  }

  if (style || prompt) {
    const tags = query.get('tags') ? (query.get('tags') || '').split(',') : [];
    const model = query.get('model') || 'v5';
    const intensity = query.get('intensity') ? parseFloat(query.get('intensity') || '1.0') : 1.0;
    const confidence = query.get('confidence') ? parseFloat(query.get('confidence') || '1.0') : 1.0;
    const generationId = query.get('generationId') || `gen_${Date.now()}`;

    return {
      params: {
        style: style || 'Ambient soundscape',
        prompt: prompt || 'Ambient background music',
        tags,
        model,
        intensity,
        confidence,
        generationId,
      },
      active: 'ai'
    };
  }
  return { params: null, active: null };
}

function App() {
  const initialData = getInitialTeleport();
  // 'engine' | 'radio' | 'ai' | null
  const [activeModule, setActiveModule] = useState<string | null>(initialData.active);
  // Stany AACL Teleportacji
  const [teleportParams] = useState<TeleportParams | null>(initialData.params);

  // Oczyść pasek URL bez odświeżania strony po zainicjalizowaniu
  useEffect(() => {
    if (initialData.params && typeof window !== 'undefined') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [initialData.params]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 relative overflow-x-hidden">
      
      {/* 🔔 POWIADOMIENIA TOAST 0.00G */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-mono text-xs',
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)'
          }
        }}
      />

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
                description="MiniMax-Music-3 DiT Executive Engine & Dynamic Lyricist."
                icon={Mic2}
                color="#f472b6" // Pink
                onClick={() => setActiveModule('ai')}
              />

              <HolographicCard
                title="Panel Bitów"
                description="Step-Grid 0.00G. Perkusja syntezowana, strojenie 432Hz."
                icon={Grid3x3}
                color="#00f3ff"
                onClick={() => setActiveModule('bity')}
              />

              <HolographicCard
                title="Rzeźba Audio"
                description="Cięcie, pętle, pasma i prawdziwe stemy (Demucs)."
                icon={Scissors}
                color="#5eead4"
                onClick={() => setActiveModule('rzezba')}
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
              System Status: <span className="text-green-500">Online</span> • MiniMax-Music-3 DiT • UZS Protocol Active
            </motion.div>

          </motion.div>
        ) : (
          <motion.div
            key="module"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full min-h-screen relative z-10 flex items-center justify-center p-4 md:p-6"
          >
            {/* ⚙️ MODUŁ BIO-REZONANSU */}
            {activeModule === 'engine' && <BioResonanceEngine />}

            {/* 🥁 PANEL BITÓW — sekwencer krokowy */}
            {activeModule === 'bity' && <BitGridPanel />}

            {/* ✂️ RZEŹBA AUDIO — cięcie, pętle, pasma, stemy */}
            {activeModule === 'rzezba' && <RzezbaPanel />}

            {/* 📻 GRAVITON RADIO — strumień z lokalnej biblioteki Katedry */}
            {activeModule === 'radio' && <GravitonRadio />}

            {/* 🔮 MODUŁ AI SESSION: MINIMAX-MUSIC-3 DIT EXECUTIVE BRAIN */}
            {activeModule === 'ai' && (
              <AiSessionPanel
                teleportParams={teleportParams}
                onClose={() => setActiveModule(null)}
              />
            )}

            {/* Przycisk powrotu do Menu */}
            <button
              onClick={() => setActiveModule(null)}
              className="fixed top-6 right-6 text-[10px] text-slate-400 hover:text-white transition-colors uppercase tracking-widest z-50 bg-black/60 px-4 py-2 rounded-full border border-purple-500/30 backdrop-blur-md flex items-center gap-1.5 hover:border-purple-400 font-mono shadow-lg"
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