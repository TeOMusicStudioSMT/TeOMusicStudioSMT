import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Activity, Mic2 } from 'lucide-react'; // Import ikon
import BioResonanceEngine from './components/BioResonanceEngine';
import GhostCursor from './components/GhostCursor';
import HolographicCard from './components/HolographicCard';

function App() {
  // 'engine' | 'radio' | 'ai' | null
  const [activeModule, setActiveModule] = useState<string | null>(null);

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
                onClick={() => setActiveModule('engine')}
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
            className="w-full min-h-screen relative z-10 flex items-center justify-center"
          >
            {/* Tutaj ładujemy wybrany moduł. Na razie BioResonance dla testu */}
            {activeModule === 'engine' && <BioResonanceEngine />}

            {/* Placeholder dla innych modułów */}
            {activeModule === 'ai' && (
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">AI Session</h2>
                <p className="text-slate-400">Connecting to Gemini...</p>
              </div>
            )}

            <button
              onClick={() => setActiveModule(null)}
              className="fixed top-6 right-6 text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest z-50 bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md"
            >
              Exit Module
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;