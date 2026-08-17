/**
 * 🎵 MiniMax-Music-3 — REALNA generacja przez Wiesio-Bridge
 * TeO_Music_V2
 *
 * ZASADA 0.00G: żadnej symulacji. Ten plik albo naprawdę odpala model przez most
 * (który odpala ComfyUI na wagach z TeO_Music_V2/models/), albo mówi wprost czego
 * brakuje. Nie ma tu udawanych kroków dyfuzji ani podmienionego utworu z biblioteki.
 *
 * Poprzednia wersja tego pliku była atrapą: pętla setTimeout wypisywała fałszywe
 * "DiT Step 12/30 | Loss: 0.2841", a potem losowała gotowy plik z lokalnej biblioteki
 * albo odtwarzała demo z soundhelix.com. Zostało to usunięte świadomie.
 */

export type MiniMaxModelVariant = 'int8' | 'fp16' | 'fp32';
export type MusicEngine = 'minimax-dit' | 'suno-udio-bridge' | 'synth-432';

export interface MusicGenerationRequest {
  title?: string;
  prompt: string;
  lyrics?: string;
  style: string;
  bpm: number;
  keySignature: string;
  durationSeconds: number;
  modelVariant: MiniMaxModelVariant;
  engine: MusicEngine;
  seed?: number;
  cfgScale?: number;
  steps?: number;
  targetFolder?: string;
}

export interface GenerationProgressCallback {
  (progress: {
    step: number;
    totalSteps: number;
    stage: string;
    percentage: number;
    loss?: number;
    log: string;
  }): void;
}

export interface MusicGenerationResult {
  success: boolean;
  audioUrl: string;
  title: string;
  duration: number;
  savedPath: string;
  engine: MusicEngine;
  modelVariant: MiniMaxModelVariant;
  grvEarned: number;
  waveform?: number[];
  error?: string;
  /** Konkretne kroki do odblokowania silnika — pokazywane w logach panelu. */
  hints?: string[];
}

export interface BreathEconomyRewardResult {
  success: boolean;
  balance?: number;
  reward: number;
  message: string;
}

const BRIDGE_URL = 'http://127.0.0.1:3001';
const DEFAULT_TARGET_FOLDER = '_OtakOs_Muzyka';

/** Wariant precyzji DiT → id pliku w katalogu modeli. */
const DIT_ID: Record<MiniMaxModelVariant, string> = {
  int8: 'dit-int8',
  fp16: 'dit-fp16',
  fp32: 'dit-fp32',
};

/**
 * Zgłasza akcję WYNIK (+100 GRV) do Ekonomii Oddechu.
 * Wołane WYŁĄCZNIE po realnym sukcesie — nagroda za nic byłaby kłamstwem w księdze.
 */
export async function reportBreathEconomyReward(
  title: string,
  rewardAmount: number = 100
): Promise<BreathEconomyRewardResult> {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/bridge/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'WYNIK',
        reward: rewardAmount,
        currency: 'GRV',
        source: 'TeO_Music_V2:AiSession',
        trackTitle: title,
        timestamp: Date.now(),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        reward: rewardAmount,
        balance: data.balance,
        message: data.message || `Przyznano +${rewardAmount} GRV do portfela Oddechu!`,
      };
    }
  } catch (err) {
    console.warn('[Ekonomia Oddechu] Most offline, rejestracja lokalna:', err);
  }

  try {
    const currentGrv = parseInt(localStorage.getItem('teo_grv_balance') || '1000', 10);
    localStorage.setItem('teo_grv_balance', (currentGrv + rewardAmount).toString());
  } catch (e) {
    console.warn('[Ekonomia Oddechu] Błąd zapisu LocalStorage:', e);
  }

  return {
    success: true,
    reward: rewardAmount,
    message: `+${rewardAmount} GRV dodane do rezonansu (Tryb Lokalny 0.00G)`,
  };
}

interface EngineStatus {
  gotowy: boolean;
  braki: string[];
}

/** Pyta most, czy silnik jest realnie gotowy — i czego brakuje, jeśli nie. */
export async function checkEngineStatus(): Promise<EngineStatus & { mostOnline: boolean }> {
  try {
    const r = await fetch(`${BRIDGE_URL}/api/music/engine/status`);
    if (!r.ok) return { mostOnline: true, gotowy: false, braki: [`Most odpowiedział HTTP ${r.status}`] };
    const d = await r.json();
    return { mostOnline: true, gotowy: !!d.gotowy, braki: d.braki ?? [] };
  } catch {
    return {
      mostOnline: false,
      gotowy: false,
      braki: ['Wiesio-Bridge nie odpowiada na 127.0.0.1:3001 — odpal Katedrę.'],
    };
  }
}

function nieudane(
  params: MusicGenerationRequest,
  error: string,
  hints: string[] = []
): MusicGenerationResult {
  return {
    success: false,
    audioUrl: '',
    title: params.title || params.style,
    duration: params.durationSeconds,
    savedPath: '',
    engine: params.engine,
    modelVariant: params.modelVariant,
    grvEarned: 0,
    error,
    hints,
  };
}

/**
 * Realna generacja. Kolejkuje graf w ComfyUI przez most, odpytuje o postęp,
 * a gotowy plik zapisuje do _OtakOs_Muzyka. Każdy zwrócony `savedPath` odpowiada
 * plikowi, który faktycznie istnieje na dysku.
 */
export async function generateMiniMaxMusic(
  params: MusicGenerationRequest,
  onProgress?: GenerationProgressCallback
): Promise<MusicGenerationResult> {
  const targetFolder = params.targetFolder || DEFAULT_TARGET_FOLDER;
  const trackTitle = params.title || `${params.style.slice(0, 20)} - MiniMax ${params.modelVariant.toUpperCase()}`;

  if (params.engine === 'suno-udio-bridge') {
    return nieudane(
      params,
      'Most Suno/Udio nie jest zaimplementowany.',
      [
        'Ten silnik był atrapą w poprzedniej wersji — nie ma po stronie mostu żadnego endpointu Suno/Udio.',
        'Użyj MiniMax-Music-3 (lokalnie, suwerennie) albo syntezatora 432Hz.',
      ]
    );
  }

  onProgress?.({
    step: 0, totalSteps: 1, stage: 'PRZEGLAD',
    percentage: 0,
    log: `🔍 Sprawdzam gotowość silnika (wagi + ComfyUI + workflow)...`,
  });

  // 1) Kolejkujemy w moście. Most sam weryfikuje wagi, ComfyUI i workflow,
  //    i zwraca 424 z konkretną listą braków — nie zgadujemy tutaj.
  let promptId: string;
  let seed: number;
  try {
    const r = await fetch(`${BRIDGE_URL}/api/music/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `${params.prompt}\n\nStyl: ${params.style} | BPM: ${params.bpm} | Tonacja: ${params.keySignature}`,
        lyrics: params.lyrics || '',
        duration: params.durationSeconds,
        seed: params.seed,
        steps: params.steps,
        cfg: params.cfgScale,
        ditId: DIT_ID[params.modelVariant],
        tiledDecode: true,
      }),
    });
    const d = await r.json().catch(() => ({}));

    if (!r.ok || !d.success) {
      const braki: string[] = [];
      if (d.hint) braki.push(d.hint);
      if (Array.isArray(d.brakujaceRole) && d.brakujaceRole.length) {
        braki.push(`Brakujące role wag: ${d.brakujaceRole.join(', ')}`);
      }
      if (d.nodeErrors) braki.push(`Błędy nodów ComfyUI: ${JSON.stringify(d.nodeErrors).slice(0, 300)}`);
      onProgress?.({
        step: 0, totalSteps: 1, stage: 'BRAK_SILNIKA', percentage: 0,
        log: `❌ ${d.message || `Most odrzucił żądanie (HTTP ${r.status})`}`,
      });
      for (const b of braki) {
        onProgress?.({ step: 0, totalSteps: 1, stage: 'BRAK_SILNIKA', percentage: 0, log: `→ ${b}` });
      }
      return nieudane(params, d.message || `Most odrzucił żądanie (HTTP ${r.status})`, braki);
    }

    promptId = d.promptId;
    seed = d.seed;
    onProgress?.({
      step: 1, totalSteps: 3, stage: 'W_KOLEJCE', percentage: 10,
      log: `✅ Graf w kolejce ComfyUI (id: ${promptId}, seed: ${seed})`,
    });
    if (Array.isArray(d.podmienione)) {
      for (const p of d.podmienione.slice(0, 12)) {
        onProgress?.({ step: 1, totalSteps: 3, stage: 'W_KOLEJCE', percentage: 10, log: `   ⚙️ ${p}` });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return nieudane(params, `Wiesio-Bridge nieosiągalny: ${msg}`, [
      'Odpal Katedrę (wiesio-bridge.js na :3001).',
    ]);
  }

  // 2) Odpytujemy o realny postęp. Bez fałszywych procentów — pokazujemy stan,
  //    który zwraca ComfyUI, i tyle.
  const startedAt = Date.now();
  const TIMEOUT_MS = 20 * 60 * 1000; // długi utwór na 6 GB VRAM potrafi trwać
  let audio: { filename: string; subfolder: string; type: string; url: string } | null = null;

  while (Date.now() - startedAt < TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, 2000));
    let d: {
      success?: boolean; stan?: string;
      audio?: { filename: string; subfolder: string; type: string; url: string }[];
      /** Czytelny komunikat złożony po stronie mostu (nie surowy JSON ComfyUI) */
      message?: string;
      /** Ile zadań stoi przed nami w kolejce ComfyUI */
      przedNami?: number;
    };
    try {
      const r = await fetch(`${BRIDGE_URL}/api/music/progress?promptId=${encodeURIComponent(promptId)}`);
      d = await r.json();
    } catch {
      onProgress?.({ step: 2, totalSteps: 3, stage: 'CZEKAM', percentage: 50, log: '⚠️ Most chwilowo nie odpowiada — próbuję dalej...' });
      continue;
    }

    const sekundy = Math.round((Date.now() - startedAt) / 1000);
    const mmss = `${Math.floor(sekundy / 60)}m ${String(sekundy % 60).padStart(2, '0')}s`;

    if (d.stan === 'przerwane') {
      onProgress?.({ step: 2, totalSteps: 3, stage: 'PRZERWANE', percentage: 0, log: `⏹️ ${d.message ?? 'Zadanie przerwane.'}` });
      return nieudane(params, d.message ?? 'Zadanie przerwane.', []);
    }

    if (d.stan === 'blad' || d.success === false) {
      const opis = d.message ?? 'ComfyUI zgłosił błąd wykonania grafu.';
      onProgress?.({ step: 2, totalSteps: 3, stage: 'BLAD', percentage: 0, log: `❌ ${opis}` });
      return nieudane(params, opis, []);
    }

    if (d.stan === 'gotowe' && d.audio && d.audio.length > 0) {
      audio = d.audio[0];
      onProgress?.({ step: 3, totalSteps: 3, stage: 'WYRENDEROWANE', percentage: 90, log: `🔊 ComfyUI zwrócił audio: ${audio.filename} (po ${mmss})` });
      break;
    }

    // ŻADNEGO wymyślonego procentu. ComfyUI nie wystawia po REST postępu w krokach,
    // więc podajemy to, co wiemy pewnie: stan i czas. `percentage: -1` znaczy
    // "nieokreślony" — panel rysuje wtedy pasek pulsujący, nie konkretną wartość.
    const stanOpis = d.stan === 'liczy'
      ? 'liczy (MiniMax-Music-3 na GPU)'
      : d.stan === 'w-kolejce'
        ? `czeka w kolejce ComfyUI${d.przedNami ? ` — przed nami: ${d.przedNami}` : ''}`
        : (d.stan ?? 'stan nieznany');

    onProgress?.({
      step: 2, totalSteps: 3,
      stage: d.stan === 'liczy' ? 'LICZY' : 'W_KOLEJCE',
      percentage: -1,
      log: `⏳ ${stanOpis} • ${mmss}`,
    });
  }

  if (!audio) {
    return nieudane(params, `Przekroczono czas oczekiwania (${Math.round(TIMEOUT_MS / 60000)} min) — zadanie może wciąż liczyć w ComfyUI.`, [
      `Sprawdź kolejkę ComfyUI, promptId: ${promptId}`,
    ]);
  }

  // 3) Zapis do biblioteki Katedry — realny plik, realny rozmiar.
  let savedPath = '';
  let audioUrl = audio.url;
  try {
    const r = await fetch(`${BRIDGE_URL}/api/music/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: audio.filename, subfolder: audio.subfolder, type: audio.type,
        title: trackTitle,
      }),
    });
    const d = await r.json();
    if (d.success) {
      savedPath = d.savedPath;
      audioUrl = d.streamUrl || audioUrl;
      onProgress?.({ step: 3, totalSteps: 3, stage: 'ZAPISANE', percentage: 98, log: `💾 Zapisano do ${targetFolder}: ${savedPath} (${(d.bytes / 1e6).toFixed(1)} MB)` });
    } else {
      onProgress?.({ step: 3, totalSteps: 3, stage: 'ZAPIS_NIEUDANY', percentage: 95, log: `⚠️ Utwór powstał, ale zapis do biblioteki nie wyszedł: ${d.message}. Grasz bezpośrednio z ComfyUI.` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onProgress?.({ step: 3, totalSteps: 3, stage: 'ZAPIS_NIEUDANY', percentage: 95, log: `⚠️ Utwór powstał, ale zapis do biblioteki padł: ${msg}` });
  }

  // Nagroda dopiero teraz — po realnym utworze.
  await reportBreathEconomyReward(trackTitle, 100);
  onProgress?.({ step: 3, totalSteps: 3, stage: 'DONE', percentage: 100, log: `✨ Gotowe: "${trackTitle}" (+100 GRV)` });

  return {
    success: true,
    audioUrl,
    title: trackTitle,
    duration: params.durationSeconds,
    savedPath: savedPath || `${targetFolder} (zapis nieudany — plik w output ComfyUI)`,
    engine: params.engine,
    modelVariant: params.modelVariant,
    grvEarned: 100,
  };
}

/**
 * Prosty generator syntetycznego tonu 432Hz (Web Audio offline).
 * To JEST realne — liczona fala PCM, nie atrapa.
 */
export function generateHarmonic432HzTone(durationSec: number = 5, baseFreq: number = 432): string {
  try {
    const sampleRate = 44100;
    const numSamples = sampleRate * durationSec;
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Harmonia 432Hz + kwinta + subbas z łagodnym envelope
      const envelope = Math.sin((Math.PI * i) / numSamples);
      const tone1 = Math.sin(2 * Math.PI * baseFreq * t);
      const tone2 = 0.4 * Math.sin(2 * Math.PI * (baseFreq * 1.25) * t);
      const sub = 0.3 * Math.sin(2 * Math.PI * (baseFreq / 4) * t);
      buffer[i] = (tone1 + tone2 + sub) * envelope * 0.4;
    }

    const wavBytes = encodeWav(buffer, sampleRate);
    const blob = new Blob([wavBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Błąd syntezy 432Hz:', e);
    return '';
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}
