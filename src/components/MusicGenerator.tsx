/**
 * 🎵 MusicGenerator - Generator Muzyki w Music V2
 * 
 * "Gdzie Jason spotyka BoBa"
 * 
 * Odbiera parametry z Huba (teleport)
 * Wysyła do Suno
 * Zwraca link do utworu
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { generateMusic } from '../lib/sunoGenerator';

interface MusicParams {
  style: string;
  tags: string[];
  model: 'v3' | 'v4' | 'v5';
  prompt: string;
  generationId?: string;
}

interface MusicGeneratorProps {
  /** Parametry z Huba */
  initialParams?: MusicParams;
  /** Callback po udanej generacji */
  onComplete?: (result: { audioUrl: string; title: string }) => void;
}

export const MusicGenerator: React.FC<MusicGeneratorProps> = ({ 
  initialParams,
  onComplete 
}) => {
  const [params, setParams] = useState<MusicParams>(initialParams || {
    style: 'Synthwave',
    tags: ['retro', 'electronic'],
    model: 'v5',
    prompt: 'A synthwave track',
    generationId: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ audioUrl: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    
    console.log('[MusicGenerator] 🎵 Rozpoczynam generowanie:', params);
    
    const response = await generateMusic({
      prompt: params.prompt,
      style: params.style,
      tags: params.tags,
      model: params.model,
      title: `${params.style} - ${params.generationId || Date.now()}`,
    });
    
    if (response.success) {
      console.log('[MusicGenerator] ✅ Sukces:', response);
      setResult({
        audioUrl: response.audioUrl || '',
        title: response.title || params.style,
      });
      onComplete?.({
        audioUrl: response.audioUrl || '',
        title: response.title || params.style,
      });
    } else {
      console.error('[MusicGenerator] ❌ Błąd:', response.error);
      setError(response.error || 'Błąd generowania');
    }
    
    setIsGenerating(false);
  }, [params, onComplete]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-purple-500/30">
      <h2 className="text-2xl font-bold text-purple-300 mb-6">
        🎵 Generator Muzyki
      </h2>
      
      {/* Parametry */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm text-slate-400">Styl</label>
          <input
            type="text"
            value={params.style}
            onChange={(e) => setParams({ ...params, style: e.target.value })}
            className="w-full bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
          />
        </div>
        
        <div>
          <label className="text-sm text-slate-400">Tagi</label>
          <input
            type="text"
            value={params.tags.join(', ')}
            onChange={(e) => setParams({ ...params, tags: e.target.value.split(',').map(t => t.trim()) })}
            className="w-full bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
          />
        </div>
        
        <div>
          <label className="text-sm text-slate-400">Prompt</label>
          <textarea
            value={params.prompt}
            onChange={(e) => setParams({ ...params, prompt: e.target.value })}
            className="w-full bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white h-24"
          />
        </div>
        
        <div>
          <label className="text-sm text-slate-400">Model</label>
          <select
            value={params.model}
            onChange={(e) => setParams({ ...params, model: e.target.value as 'v3' | 'v4' | 'v5' })}
            className="w-full bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white"
          >
            <option value="v3">Suno v3</option>
            <option value="v4">Suno v4</option>
            <option value="v5">Suno v5</option>
          </select>
        </div>
      </div>
      
      {/* Przycisk GENERUJ */}
      <motion.button
        onClick={handleGenerate}
        disabled={isGenerating}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 rounded-xl font-bold text-lg ${
          isGenerating 
            ? 'bg-slate-700 text-slate-400' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
        }`}
      >
        {isGenerating ? '🔮 Generuję...' : '⚡ GENERUJ'}
      </motion.button>
      
      {/* Wynik */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-900/30 border border-green-500/30 rounded-xl"
        >
          <h3 className="text-green-300 font-bold mb-2">✅ Utwór wygenerowany!</h3>
          <p className="text-slate-300 mb-2">{result.title}</p>
          <audio controls className="w-full">
            <source src={result.audioUrl} type="audio/mpeg" />
          </audio>
        </motion.div>
      )}
      
      {/* Błąd */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl"
        >
          <h3 className="text-red-300 font-bold mb-2">❌ Błąd</h3>
          <p className="text-slate-300">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

export default MusicGenerator;
