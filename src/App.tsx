import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TeleportGate } from './components/TeleportGate';
import { Music, Mic2, Radio } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-teo-dark text-white flex flex-col items-center justify-center p-4">
        <TeleportGate />
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#334155', color: '#fff' } }} />

        <header className="mb-12 text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-teo-primary to-teo-accent rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-teo-primary/20 animate-pulse-slow">
            <Music size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            TeO Music Studio V2
          </h1>
          <p className="text-slate-400">Epoch 1: Genesis Node Initialization</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Karta AI */}
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-teo-primary transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-colors">
                <Mic2 className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold">AI Session</h2>
            </div>
            <p className="text-slate-400">Collaborate with Gemini agents to compose new realities.</p>
          </div>

          {/* Karta Radia */}
          <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-teo-accent transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                <Radio className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold">Graviton Radio</h2>
            </div>
            <p className="text-slate-400">Tune into the frequencies of the network.</p>
          </div>
        </div>

        <footer className="mt-16 text-slate-600 text-sm">
          System Status: <span className="text-green-500">Online</span> • UZ$ Protocol Active
        </footer>
      </div>
    </Router>
  )
}

export default App;