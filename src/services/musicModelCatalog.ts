/**
 * 🧠 KATALOG MODELI MUZYCZNYCH — jedno źródło prawdy
 * TeO_Music_V2
 *
 * Wagi NIE idą do repo (16+ GB, patrz .gitignore). Ten plik idzie do repo i opisuje,
 * co skąd ściągnąć po pierwszej instalacji — dzięki temu moduł da się zminiaturyzować
 * na otakos.wtf: kod waży kilka MB, a Suweren dociąga wagi jednym kliknięciem.
 *
 * Layout katalogu jest 1:1 z repozytorium Comfy-Org/MiniMax-Music-3, a ono z kolei
 * jest 1:1 z układem ComfyUI/models/. Dzięki temu ściąganie to zwykły fetch z
 * zachowaniem ścieżki, a ComfyUI widzi katalog przez extra_model_paths.yaml.
 *
 * Rozmiary w bajtach zweryfikowane przez HuggingFace API (nie zgadywane).
 */

export type ModelRole = 'diffusion_models' | 'text_encoders' | 'vae';
export type ModelPrecision = 'int8' | 'fp16' | 'bf16' | 'fp32';
/** Rodzina silnika. Wagi jednej rodziny NIE łączą się z wagami drugiej. */
export type ModelFamily = 'minimax' | 'ace';

export interface MusicModelFile {
  /** Stabilny identyfikator używany przez most i UI */
  id: string;
  /** Ścieżka względna w katalogu modeli — identyczna jak w repo HF */
  path: string;
  /** Do jakiego podkatalogu ComfyUI należy */
  role: ModelRole;
  precision: ModelPrecision;
  /** Rozmiar w bajtach — z HuggingFace API */
  bytes: number;
  /** Repo HuggingFace, z którego leci plik */
  repo: string;
  label: string;
  note: string;
  /** Czy realnie wchodzi w 6 GB VRAM (RTX 3060 Laptop) */
  fitsVram6gb: boolean;
  /** Domyślnie 'minimax' — wagi rodzin się nie mieszają. */
  family?: ModelFamily;
}

export const MODEL_REPO = 'Comfy-Org/MiniMax-Music-3';
export const MODEL_REPO_ACE = 'Comfy-Org/ace_step_1.5_ComfyUI_files';

/** Skąd lecą pliki. Zmiana na mirror = jedna linia. */
export function huggingFaceUrl(repo: string, path: string): string {
  return `https://huggingface.co/${repo}/resolve/main/${path}?download=true`;
}

export const MUSIC_MODELS: MusicModelFile[] = [
  // ── DiT (rdzeń dyfuzji) ────────────────────────────────────────────────────
  {
    id: 'dit-int8',
    path: 'diffusion_models/minimax_music3_dit_int8_convrot.safetensors',
    role: 'diffusion_models',
    precision: 'int8',
    bytes: 2_502_161_682,
    repo: MODEL_REPO,
    label: 'DiT int8 (convrot)',
    note: 'Rdzeń dyfuzji skwantyzowany. Jedyny wariant DiT sensowny na 6 GB VRAM przy dłuższych utworach.',
    fitsVram6gb: true,
  },
  {
    id: 'dit-fp16',
    path: 'diffusion_models/minimax_music3_dit_fp16.safetensors',
    role: 'diffusion_models',
    precision: 'fp16',
    bytes: 4_914_197_682,
    repo: MODEL_REPO,
    label: 'DiT fp16',
    note: 'Wyższa wierność. Na 6 GB wchodzi tylko przy krótkich utworach i tiled_decode.',
    fitsVram6gb: false,
  },
  {
    id: 'dit-fp32',
    path: 'diffusion_models/minimax_music3_dit_fp32.safetensors',
    role: 'diffusion_models',
    precision: 'fp32',
    bytes: 9_828_345_396,
    repo: MODEL_REPO,
    label: 'DiT fp32 (Studio Master)',
    note: 'Pełna precyzja. NIE wchodzi w 6 GB VRAM — tylko pod mocniejszy węzeł Katedry.',
    fitsVram6gb: false,
  },

  // ── Text encoder (rozumie opis i tekst piosenki) ───────────────────────────
  {
    id: 'text-encoder-pruned-int8',
    path: 'text_encoders/minimax_music3_text_encoder_pruned_int8_convrot.safetensors',
    role: 'text_encoders',
    precision: 'int8',
    bytes: 9_196_611_886,
    repo: MODEL_REPO,
    label: 'Text Encoder pruned int8',
    note: 'Najlżejszy encoder. Duży nawet po przycięciu — ładowany na CPU/offload, nie musi siedzieć cały w VRAM.',
    fitsVram6gb: true,
  },
  {
    id: 'text-encoder-pruned-bf16',
    path: 'text_encoders/minimax_music3_text_encoder_pruned_bf16.safetensors',
    role: 'text_encoders',
    precision: 'bf16',
    bytes: 16_706_629_398,
    repo: MODEL_REPO,
    label: 'Text Encoder pruned bf16',
    note: 'Lepsze rozumienie promptu i tekstu. 16 GB pliku — liczy się miejsce na dysku, nie tylko VRAM.',
    fitsVram6gb: false,
  },
  {
    id: 'text-encoder-bf16',
    path: 'text_encoders/minimax_music3_text_encoder_bf16.safetensors',
    role: 'text_encoders',
    precision: 'bf16',
    bytes: 18_472_478_038,
    repo: MODEL_REPO,
    label: 'Text Encoder bf16 (pełny)',
    note: 'Pełny encoder bez przycięcia. 18 GB — tylko dla węzła z dużym dyskiem i RAM-em.',
    fitsVram6gb: false,
  },

  // ── DAV (dekoder audio — bez niego nie ma dźwięku) ─────────────────────────
  {
    id: 'dav',
    path: 'vae/minimax_music3_dav.safetensors',
    role: 'vae',
    precision: 'fp32',
    bytes: 216_696_128,
    repo: MODEL_REPO,
    label: 'DAV (dekoder audio)',
    note: 'Zamienia latent w falę dźwiękową. Mały i BEZWZGLĘDNIE wymagany — bez niego nie ma pliku audio.',
    fitsVram6gb: true,
  },

  // ══ ACE-Step 1.5 ═══════════════════════════════════════════════════════════
  // DLACZEGO ISTNIEJE TA RODZINA: MiniMax ma fazę autoregresywną (~25 kroków na
  // sekundę audio). Zmierzone na RTX 3060 Laptop 6GB / 15,7GB RAM: 16,6 s/krok,
  // 1501 kroków na minutę = ~6h50m, przy GPU na 0% (model streamowany z dysku).
  // ACE-Step turbo to czysta dyfuzja w 8 krokach — ~190× mniej obliczeń — więc
  // chodzi na tym sprzęcie realnie. Do tego bierze BPM i tonację jako wejścia
  // modelu (a nie tekst w prompcie) i obsługuje polskie teksty.
  {
    id: 'ace-dit-turbo',
    path: 'diffusion_models/acestep_v1.5_turbo.safetensors',
    role: 'diffusion_models',
    precision: 'bf16',
    bytes: 4_787_825_604,
    repo: MODEL_REPO_ACE,
    label: 'ACE-Step 1.5 turbo (DiT)',
    note: 'Rdzeń dyfuzji, wariant turbo — 8 kroków zamiast 30. Główny powód, dla którego ACE działa na 6 GB VRAM.',
    fitsVram6gb: true,
    family: 'ace',
  },
  {
    id: 'ace-dit-base',
    path: 'diffusion_models/acestep_v1.5_base.safetensors',
    role: 'diffusion_models',
    precision: 'bf16',
    bytes: 4_787_825_604,
    repo: MODEL_REPO_ACE,
    label: 'ACE-Step 1.5 base (DiT)',
    note: 'Wariant bez turbo — więcej kroków, potencjalnie lepsza jakość. Wolniejszy.',
    fitsVram6gb: true,
    family: 'ace',
  },
  {
    id: 'ace-clip-06b',
    path: 'text_encoders/qwen_0.6b_ace15.safetensors',
    role: 'text_encoders',
    precision: 'bf16',
    bytes: 1_191_588_248,
    repo: MODEL_REPO_ACE,
    label: 'ACE Qwen 0.6B (encoder A)',
    note: 'Pierwszy z DWÓCH wymaganych encoderów (DualCLIPLoader). Ledwie 1,1 GB — tu jest cała różnica wobec 8,6 GB MiniMaxa.',
    fitsVram6gb: true,
    family: 'ace',
  },
  {
    id: 'ace-clip-17b',
    path: 'text_encoders/qwen_1.7b_ace15.safetensors',
    role: 'text_encoders',
    precision: 'bf16',
    bytes: 3_708_523_360,
    repo: MODEL_REPO_ACE,
    label: 'ACE Qwen 1.7B (encoder B)',
    note: 'Drugi z DWÓCH wymaganych encoderów. ACE nie ruszy z jednym — graf używa DualCLIPLoader.',
    fitsVram6gb: true,
    family: 'ace',
  },
  {
    id: 'ace-vae',
    path: 'vae/ace_1.5_vae.safetensors',
    role: 'vae',
    precision: 'fp32',
    bytes: 337_431_732,
    repo: MODEL_REPO_ACE,
    label: 'ACE 1.5 VAE',
    note: 'Dekoder audio ACE. Mały i bezwzględnie wymagany.',
    fitsVram6gb: true,
    family: 'ace',
  },
];

/** Rodzina modelu — brak pola znaczy 'minimax' (tak było przed dodaniem ACE). */
export function family(m: MusicModelFile): ModelFamily {
  return m.family ?? 'minimax';
}

/**
 * Zestawy gotowe do kliknięcia. Każdy MUSI zawierać po jednym: DiT, encoder, DAV —
 * inaczej pipeline nie ruszy.
 */
export interface ModelBundle {
  id: string;
  label: string;
  description: string;
  fileIds: string[];
  recommendedFor6gb: boolean;
}

export const MODEL_BUNDLES: ModelBundle[] = [
  {
    id: 'ace-turbo',
    label: 'ACE-Step Turbo',
    description:
      'Czysta dyfuzja w 8 krokach, bez fazy autoregresywnej. Jedyny zestaw, który ZMIERZONO jako używalny na 16 GB RAM. Bierze BPM i tonację wprost, obsługuje polskie teksty.',
    fileIds: ['ace-dit-turbo', 'ace-clip-06b', 'ace-clip-17b', 'ace-vae'],
    recommendedFor6gb: true,
  },
  {
    id: 'lekki',
    label: 'MiniMax Lekki',
    description:
      'MiniMax w int8. Zmierzone na tej maszynie: ~6h50m na minutę muzyki (faza autoregresywna, 1501 kroków). Sensowne dopiero od ~32 GB RAM.',
    fileIds: ['dit-int8', 'text-encoder-pruned-int8', 'dav'],
    recommendedFor6gb: false,
  },
  {
    id: 'jakosc',
    label: 'MiniMax fp16',
    description: 'DiT w fp16 + przycięty encoder int8. Wyższa wierność, ale ta sama faza autoregresywna.',
    fileIds: ['dit-fp16', 'text-encoder-pruned-int8', 'dav'],
    recommendedFor6gb: false,
  },
  {
    id: 'studio',
    label: 'MiniMax Studio Master',
    description: 'fp32 + pełny encoder bf16. Ponad 28 GB pobierania, wymaga mocnego węzła.',
    fileIds: ['dit-fp32', 'text-encoder-bf16', 'dav'],
    recommendedFor6gb: false,
  },
];

export function modelById(id: string): MusicModelFile | undefined {
  return MUSIC_MODELS.find((m) => m.id === id);
}

export function bundleBytes(bundle: ModelBundle): number {
  return bundle.fileIds.reduce((sum, id) => sum + (modelById(id)?.bytes ?? 0), 0);
}

/** 4914197682 → "4.58 GB" */
export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 2 : 1)} ${units[unit]}`;
}

/**
 * Czy z obecnych plików da się w ogóle grać? Potrzebny po jednym z każdej roli.
 */
export function isPipelineComplete(presentIds: string[]): boolean {
  const roles = new Set(
    presentIds.map((id) => modelById(id)?.role).filter((r): r is ModelRole => !!r)
  );
  return roles.has('diffusion_models') && roles.has('text_encoders') && roles.has('vae');
}

/** Czego brakuje, żeby pipeline ruszył — po roli, nie po pliku. */
export function missingRoles(presentIds: string[]): ModelRole[] {
  const roles = new Set(
    presentIds.map((id) => modelById(id)?.role).filter((r): r is ModelRole => !!r)
  );
  return (['diffusion_models', 'text_encoders', 'vae'] as ModelRole[]).filter(
    (r) => !roles.has(r)
  );
}

export const ROLE_LABELS: Record<ModelRole, string> = {
  diffusion_models: 'Rdzeń DiT',
  text_encoders: 'Encoder Tekstu',
  vae: 'Dekoder Audio',
};
