/**
 * 🎵 SunoGenerator - Generator Muzyki
 * 
 * "Serce Muzyczne TeO"
 * 
 * Funkcje:
 * - Generowanie muzyki przez Suno API
 * - Pobieranie kluczy z Kibla
 * - Raportowanie do Wir26HeartBeat
 */

import { getSunoCookie } from '../../TeO_Genesis/lib/kibel';

interface SunoParams {
  prompt: string;
  style: string;
  tags: string[];
  model: 'v3' | 'v4' | 'v5';
  title?: string;
}

interface SunoResult {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  title?: string;
  error?: string;
  details?: any;
}

/**
 * Generuj muzykę przez Suno
 */
export async function generateMusic(params: SunoParams): Promise<SunoResult> {
  const sunoCookie = getSunoCookie();
  
  console.log('[SunoGenerator] 🎵 Generowanie muzyki:', params);
  console.log('[SunoGenerator] 🔑 Cookie present:', !!sunoCookie);
  
  if (!sunoCookie) {
    return { success: false, error: 'Brak klucza Suno w Kibel' };
  }
  
  try {
    // Pełny prompt dla Suno
    const fullPrompt = `${params.prompt} [${params.tags.join(', ')}] | Style: ${params.style}`;
    
    // Wyslij przez proxy
    const response = await fetch('/api/suno/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sunoCookie,
        'Authorization': `Bearer ${sunoCookie}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        model_version: params.model,
        tags: params.tags,
        title: params.title || `${params.style} - ${Date.now()}`,
      }),
    });

    console.log('[SunoGenerator] 📡 Status:', response.status, response.statusText);
    
    const responseData = await response.json();
    console.log('[SunoGenerator] 📥 Response:', responseData);

    if (!response.ok) {
      return { 
        success: false, 
        error: `Status ${response.status}: ${response.statusText}`, 
        details: responseData 
      };
    }

    return {
      success: true,
      audioUrl: responseData.audio_url || responseData.url,
      duration: responseData.duration || 180,
      title: responseData.title || params.title,
      details: responseData,
    };
  } catch (error) {
    console.error('[SunoGenerator] ❌ Błąd:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Sprawdź status konta Suno
 */
export async function checkSunoStatus(): Promise<{ active: boolean; plan?: string }> {
  const sunoCookie = getSunoCookie();
  
  if (!sunoCookie) {
    return { active: false };
  }
  
  try {
    const response = await fetch('/api/suno/api/user', {
      headers: {
        'Cookie': sunoCookie,
        'Authorization': `Bearer ${sunoCookie}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { active: true, plan: data.subscription?.plan };
    }
    
    return { active: false };
  } catch {
    return { active: false };
  }
}
