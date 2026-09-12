/**
 * 🕊️ WORKFLOW JOANNY — „teogochi_music_v2_autonomy" wg specyfikacji Jasona v3.0.
 *
 * Suweren (2026-09-12): pop-up „przenosi w wyznaczone miejsce, lecz nic nie
 * tworzy". Ten moduł tworzy. Cztery kroki ze schematu, każdy podpięty do
 * czegoś, co w Katedrze ISTNIEJE:
 *
 *   1. Natywny Step-Grid (Rytm)    → wzór z biblioteki mostu (/api/bit/parsuj),
 *                                    BPM 70–140 wybrany przez model, DSP 432 Hz
 *   2. Styl (szablon Jasona)        → „{genre}, {bpm} bpm, {lead}, 432Hz harmonic
 *                                    alignment, spatial atmosphere, pristine production"
 *   3. Lyrics EN                    → model, struktura [Intro][Verse 1][Chorus][Outro]
 *   4. Delegacja wizualna → Klatka  → BRIEF kadru/okładki 1280×704 (tekst); render
 *                                    dopiero na kliknięcie — to minuty na karcie
 *
 * ⚠️ KAŻDY KROK MA PODPIS. Rytm to „wzór z biblioteki + wybór modelu", styl to
 * „szablon (NIE AI)", tekst i brief to „model X". Bez tego za miesiąc nikt nie
 * odróżni, co Joanna wymyśliła, a co wypełnił szablon.
 *
 * ⚠️ 432 Hz JEST PRAWDZIWE TYLKO W DSP. Panel Bitów naprawdę stroi stopę (54 Hz),
 * werbel (216 Hz) i synth (432 Hz). W opisie stylu dla modelu muzycznego
 * „432Hz harmonic alignment" to słowa, których model może posłuchać albo nie —
 * zostawiamy je, bo tak chce schemat, ale nie obiecujemy, że wynik jest w 432.
 *
 * ⚠️ MODEL ODPOWIADA JSON-EM ALBO WCALE. Mały model raz na kilka prób oddaje
 * tekst wokół JSON-a albo kilka obiektów — parser bierze pierwszy obiekt
 * z nawiasów, a brak pola = wartość domyślna z biblioteki, nie zgadywanie.
 */

const MOST = 'http://127.0.0.1:3001';

export type Matryca = Record<string, number[]>;

export interface KrokRytmu {
    wzor: string;          // id wzorca w bibliotece mostu
    nazwaWzoru: string;
    bpm: number;           // 70–140
    dspFreq: 432;
    kroki: 16;
    matryca: Matryca;      // binary_array_16_steps per ścieżka
    silnik: string;        // „wzór z biblioteki + wybór: <model>"
}

export interface WynikWorkflow {
    gatunek: string;
    instrument: string;
    nastroj: string;
    rytm: KrokRytmu;
    styl: { tekst: string; silnik: 'szablon (NIE AI)' };
    lyrics: { tekst: string; silnik: string };
    brief: { prompt: string; aspekt: '1280x704'; styl: 'cyberpunk_cathedral_aesthetic'; cel: 'album_cover_or_cinematic_frame'; silnik: string };
    model: string;
    sekundy: number;
}

export type KrokId = 'rytm' | 'styl' | 'lyrics' | 'brief';
export type Postep = (krok: KrokId, stan: 'start' | 'ok' | 'blad', info?: string) => void;

const WZORCE_DOMYSLNE = ['four-on-floor', 'boom-bap', 'trap', 'breakbeat', 'drum-and-bass', 'ambient-puls', 'oddech-zero-g', 'marsz'];

async function zMostu<T>(sciezka: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${MOST}${sciezka}`, { headers: { 'Content-Type': 'application/json' }, ...init });
    const d = await r.json().catch(() => null);
    if (!r.ok || d?.success === false) throw new Error(d?.message || `HTTP ${r.status}`);
    return d as T;
}

/** Jedno wywołanie modelu bez strumienia — /api/ollama/pisz (z think:false na moście). */
async function pisz(system: string, prompt: string, model?: string): Promise<{ tekst: string; model: string }> {
    const d = await zMostu<{ tekst: string; model: string }>('/api/ollama/pisz', {
        method: 'POST', body: JSON.stringify({ system, prompt, model }),
    });
    return d;
}

/** Pierwszy obiekt JSON z tekstu, z poszanowaniem nawiasów w łańcuchach. */
function pierwszyObiekt(s: string): Record<string, unknown> | null {
    let g = 0, start = -1, wL = false, esc = false;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (wL) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') wL = false; continue; }
        if (c === '"') { wL = true; continue; }
        if (c === '{') { if (g === 0) start = i; g++; }
        else if (c === '}') { g--; if (g === 0 && start >= 0) { try { return JSON.parse(s.slice(start, i + 1)); } catch { start = -1; } } }
    }
    return null;
}

const ogranicz = (n: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(n)));

/**
 * Uruchamia cztery kroki. `intencja` to zdanie od Suwerena (z Rozmowy albo puste) —
 * bez niej Joanna sama wybiera nastrój.
 */
export async function uruchomWorkflow({ intencja = '', model, postep }: { intencja?: string; model?: string; postep?: Postep }): Promise<WynikWorkflow> {
    const t0 = Date.now();
    const p: Postep = postep ?? (() => {});

    // ── 1. RYTM ─────────────────────────────────────────────────────────────
    p('rytm', 'start');
    let wzorce: { id: string; nazwa: string; bpm: number; opis: string }[] = [];
    try { wzorce = (await zMostu<{ wzorce: typeof wzorce }>('/api/bit/wzorce')).wzorce ?? []; } catch { /* most poda błąd niżej */ }
    const idWzorcow = wzorce.length ? wzorce.map((w) => w.id) : WZORCE_DOMYSLNE;

    const wybor = await pisz(
        'Jesteś Joanną, kompozytorką Katedry OtakOS. Odpowiadasz WYŁĄCZNIE jednym obiektem JSON, bez komentarza.',
        [
            intencja ? `Suweren chce: „${intencja}".` : 'Suweren nie podał intencji — wybierz sama nastrój, który dziś czujesz.',
            'Wybierz parametry utworu. Pola:',
            `{"genre": "<gatunek po angielsku, 2-4 słowa>", "bpm": <liczba 70-140>, "lead_instrument": "<instrument wiodący po angielsku>", "pattern": "<jedno z: ${idWzorcow.join(', ')}>", "mood": "<nastrój po polsku, 3-6 słów>"}`,
        ].join('\n'),
        model,
    );
    const j = pierwszyObiekt(wybor.tekst) ?? {};
    const gatunek = String(j.genre || 'ambient electronic').trim();
    const instrument = String(j.lead_instrument || 'analog synthesizer').trim();
    const nastroj = String(j.mood || 'spokojny, przestrzenny').trim();
    const wzorId = idWzorcow.includes(String(j.pattern)) ? String(j.pattern) : (idWzorcow[0] ?? 'four-on-floor');
    const wzorMeta = wzorce.find((w) => w.id === wzorId);

    const siatka = await zMostu<{ kroki: number; bpm: number | null; matryca: Matryca }>('/api/bit/parsuj', {
        method: 'POST', body: JSON.stringify({ wzor: wzorId, steps: 16 }),
    });
    const bpm = ogranicz(Number(j.bpm) || siatka.bpm || wzorMeta?.bpm || 100, 70, 140);
    const rytm: KrokRytmu = {
        wzor: wzorId, nazwaWzoru: wzorMeta?.nazwa ?? wzorId, bpm, dspFreq: 432, kroki: 16,
        matryca: siatka.matryca,
        silnik: `wzór z biblioteki mostu + wybór: ${wybor.model}`,
    };
    p('rytm', 'ok', `${rytm.nazwaWzoru} · ${bpm} bpm · 432 Hz`);

    // ── 2. STYL (szablon Jasona — nie AI) ───────────────────────────────────
    p('styl', 'start');
    const styl = {
        tekst: `${gatunek}, ${bpm} bpm, ${instrument}, 432Hz harmonic alignment, spatial atmosphere, pristine production`,
        silnik: 'szablon (NIE AI)' as const,
    };
    p('styl', 'ok', styl.tekst);

    // ── 3. LYRICS EN ────────────────────────────────────────────────────────
    p('lyrics', 'start');
    const tekst = await pisz(
        'You are Joanna, songwriter of the OtakOS Cathedral. Write ONLY the lyrics, in English, nothing else.',
        [
            `Genre: ${gatunek}. Tempo: ${bpm} bpm. Lead: ${instrument}. Mood (Polish): ${nastroj}.`,
            intencja ? `The Sovereign asked for: "${intencja}".` : '',
            'Structure, exactly these section tags on their own lines: [Intro] [Verse 1] [Chorus] [Outro].',
            'Intro 2 lines, Verse 4 lines, Chorus 4 lines, Outro 2 lines. Concrete images, no clichés about "journey" or "light within".',
        ].filter(Boolean).join('\n'),
        model,
    );
    const lyrics = { tekst: tekst.tekst.replace(/^```[a-z]*\n?|```$/g, '').trim(), silnik: tekst.model };
    p('lyrics', 'ok', `${lyrics.tekst.split('\n').length} linii`);

    // ── 4. BRIEF DLA KLATKI (tekst; render osobno, na kliknięcie) ───────────
    p('brief', 'start');
    const b = await pisz(
        'You write image prompts for a local image model. Output ONE line, English, no preamble.',
        [
            `Album cover / cinematic frame for a track: genre ${gatunek}, ${bpm} bpm, lead ${instrument}, mood ${nastroj}.`,
            'Aesthetic: cyberpunk cathedral — gothic stone vaults with neon, volumetric light, 0.00G weightlessness.',
            'Aspect 1280x704 (wide). Describe composition, light, palette, one focal element. Max 60 words.',
        ].join('\n'),
        model,
    );
    const brief = {
        prompt: b.tekst.split('\n').filter(Boolean)[0]?.trim() || `Cyberpunk cathedral album cover, ${gatunek}, neon over gothic vaults, 1280x704`,
        aspekt: '1280x704' as const, styl: 'cyberpunk_cathedral_aesthetic' as const, cel: 'album_cover_or_cinematic_frame' as const,
        silnik: b.model,
    };
    p('brief', 'ok', brief.prompt.slice(0, 80));

    return { gatunek, instrument, nastroj, rytm, styl, lyrics, brief, model: wybor.model, sekundy: Math.round((Date.now() - t0) / 1000) };
}

/**
 * Delegacja do Klatki: zlecenie renderu okładki 1280×704 przez most (/api/obraz/policz).
 * Wywoływane TYLKO na kliknięcie — to minuty na karcie graficznej.
 */
export async function zlecKlatce(brief: WynikWorkflow['brief']): Promise<{ zlecenie: string; silnik: string }> {
    const [w, h] = brief.aspekt.split('x').map(Number);
    const d = await zMostu<{ zlecenie: string; silnik?: string }>('/api/obraz/policz', {
        method: 'POST', body: JSON.stringify({ prompt: brief.prompt, szerokosc: w, wysokosc: h }),
    });
    return { zlecenie: d.zlecenie, silnik: d.silnik ?? '?' };
}
