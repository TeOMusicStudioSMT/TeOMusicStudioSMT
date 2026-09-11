/**
 * 🕊️ JOANNA — TeOgochi od muzyki, która co jakiś czas wygląda zza krawędzi ekranu.
 *
 * Suweren (2026-09-11): „brakuje takiego pop-upu co jakiś czas z jakiejś strony
 * ekranu — TeOgochi od Muzyki i jego aktualnej ikonki (u mnie to Joanna); po
 * kliknięciu masz panel z wyborem song / bit / cinema / … wszystko, co z samymi
 * głosami. To już będzie V3."
 *
 * ⚠️ IKONA I STAN SĄ PRAWDZIWE, NIE NARYSOWANE. Forma (🥚 → 🕊️), etap, XP i to,
 * co Joanna właśnie robi, przychodzą z /api/teogochi/stado — z tego samego
 * źródła, które karmi TeOgochi w Hubie. Gdy most milczy, Joanna nie udaje, że
 * żyje: pop-up mówi, że nie ma połączenia, i nie pokazuje wymyślonej formy.
 *
 * ⚠️ KAŻDA POZYCJA PANELU PROWADZI DO CZEGOŚ, CO ISTNIEJE:
 *   · Song    → moduł AI Session (MiniMax-Music-3 / ACE przez ComfyUI)
 *   · Bit     → Panel Bitów
 *   · Cinema  → Joanna komponuje pod długość filmu: POST /api/montazownia/skomponuj
 *               (ta sama trasa, którą używa Montażownia w Story)
 *   · Głosy   → Piper (lista z /api/voice/piper/glosy) + stan VoiceStudio (/api/glos-studio/stan)
 *   · Rzeźba  → Rzeźba Audio
 *   · Rozmowa → /api/joanna/rozmowa (Joanna ma ręce — rozmowa wykonuje akcje)
 *
 * ⚠️ RYTM: pierwszy raz po 25 s, potem co 6 min. „Drzemka" wycisza na 30 min i jest
 * pamiętana w localStorage — pop-up, który wraca mimo odesłania, to nie kompan,
 * tylko reklama.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Music, Grid3X3, Clapperboard, Mic2, Scissors, MessageCircle, X, Moon, Loader2, WifiOff } from 'lucide-react';

const MOST = 'http://127.0.0.1:3001';
const PIERWSZY_PO_MS = 25_000;
const CO_ILE_MS = 6 * 60_000;
const POKAZ_NA_MS = 14_000;
const DRZEMKA_MS = 30 * 60_000;
const KLUCZ_DRZEMKI = 'joanna_popup_drzemka_do';

type Krawedz = 'lewo' | 'prawo' | 'dol';

interface StanJoanny {
    forma: string;
    etap: string;
    xp: number;
    robi: string | null;
    robiOd: number | null;
    kolor: string;
}

interface Utwor { id: string; opis: string; plik: string | null; dlugosc: number | null; data: string }

export type ModulMuzyki = 'ai' | 'bity' | 'rzezba' | 'radio' | 'engine';

interface Props {
    /** Przełącza moduł w App — pop-up nie ma własnej nawigacji. */
    onModul: (m: ModulMuzyki) => void;
}

/** 1 utwór · 2–4 utwory · 5+ utworów — Joanna mówi po polsku, więc odmienia. */
function utworow(n: number): string {
    const r10 = n % 10, r100 = n % 100;
    if (n === 1) return '1 utwór';
    if (r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14)) return `${n} utwory`;
    return `${n} utworów`;
}

async function zMostu<T>(sciezka: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${MOST}${sciezka}`, { headers: { 'Content-Type': 'application/json' }, ...init });
    const d = await r.json().catch(() => null);
    if (!r.ok || d?.success === false) throw new Error(d?.message || d?.error || `HTTP ${r.status}`);
    return d as T;
}

export const JoannaPopup: React.FC<Props> = ({ onModul }) => {
    const [joanna, setJoanna] = useState<StanJoanny | null>(null);
    const [mostZyje, setMostZyje] = useState<boolean | null>(null);
    const [utwory, setUtwory] = useState<Utwor[]>([]);
    const [widoczna, setWidoczna] = useState(false);
    const [krawedz, setKrawedz] = useState<Krawedz>('prawo');
    const [panel, setPanel] = useState(false);
    const hover = useRef(false);
    const timerUkrycia = useRef<number | null>(null);

    // ── Stan Joanny z mostu (to samo źródło co TeOgochi w Hubie) ──
    const odswiez = useCallback(async () => {
        try {
            // Most oddaje { success, migawka, gatunki: [...], aktywnosc } — Joanna jest w `gatunki`.
            // Pierwsza wersja szukała pod `stado` i dymek pokazywał jajko „szukam się w stadzie",
            // choć Joanna była legendą — zmierzone na żywo, nie w głowie.
            const d = await zMostu<{ gatunki?: (StanJoanny & { id?: string })[] }>('/api/teogochi/stado');
            const j = (d.gatunki ?? []).find((x) => x.id === 'joanna');
            setJoanna(j ?? null);
            setMostZyje(true);
        } catch {
            setMostZyje(false);
        }
        try {
            const p = await zMostu<{ utwory: Utwor[] }>('/api/joanna/pamiec');
            setUtwory(p.utwory ?? []);
        } catch { /* pamięć opcjonalna */ }
    }, []);

    useEffect(() => {
        void odswiez();
        const t = window.setInterval(() => void odswiez(), 60_000);
        return () => window.clearInterval(t);
    }, [odswiez]);

    // ── Rytm pokazywania ──
    const drzemie = () => {
        try { return Number(localStorage.getItem(KLUCZ_DRZEMKI) || 0) > Date.now(); } catch { return false; }
    };

    const pokaz = useCallback(() => {
        if (drzemie() || panel) return;
        const k: Krawedz[] = ['lewo', 'prawo', 'dol'];
        setKrawedz(k[Math.floor(Math.random() * k.length)]);
        setWidoczna(true);
        if (timerUkrycia.current) window.clearTimeout(timerUkrycia.current);
        timerUkrycia.current = window.setTimeout(() => { if (!hover.current) setWidoczna(false); }, POKAZ_NA_MS);
    }, [panel]);

    useEffect(() => {
        const pierwszy = window.setTimeout(pokaz, PIERWSZY_PO_MS);
        const rytm = window.setInterval(pokaz, CO_ILE_MS);
        return () => { window.clearTimeout(pierwszy); window.clearInterval(rytm); };
    }, [pokaz]);

    const drzemka = () => {
        try { localStorage.setItem(KLUCZ_DRZEMKI, String(Date.now() + DRZEMKA_MS)); } catch { /* prywatne okno */ }
        setWidoczna(false);
        setPanel(false);
        toast('Joanna wraca za pół godziny.', { icon: '🌙' });
    };

    // ── Co Joanna mówi w dymku: fakt, nie frazes ──
    const zdanie = (): string => {
        if (mostZyje === false) return 'Nie słyszę mostu — Katedra śpi?';
        if (!joanna) return 'Szukam się w stadzie…';
        const swiezeRobi = joanna.robi && joanna.robiOd && Date.now() - joanna.robiOd < 2 * 60 * 60_000;
        if (swiezeRobi) return joanna.robi as string;
        if (utwory.length) {
            const ostatni = utwory[utwory.length - 1];
            return `Mam ${utworow(utwory.length)} w pamięci. Ostatni: „${ostatni.opis}".`;
        }
        return 'Nic jeszcze nie skomponowałam. Zaczniemy?';
    };

    const pozycja: Record<Krawedz, { style: React.CSSProperties; z: { x?: number; y?: number } }> = {
        lewo:  { style: { left: 16, bottom: 96 },  z: { x: -220 } },
        prawo: { style: { right: 16, bottom: 96 }, z: { x: 220 } },
        // ⚠️ Bez transform: framer-motion animuje x/y przez transform i nadpisałby translateX(-50%).
        dol:   { style: { left: 'calc(50% - 160px)', bottom: 16 }, z: { y: 200 } },
    };

    const kolor = joanna?.kolor ?? '#a855f7';

    return (
        <>
            <AnimatePresence>
                {widoczna && !panel && (
                    <motion.button
                        key="joanna-dymek"
                        initial={{ opacity: 0, ...pozycja[krawedz].z }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, ...pozycja[krawedz].z }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        style={{ ...pozycja[krawedz].style, borderColor: `${kolor}66`, boxShadow: `0 0 32px ${kolor}33` }}
                        className="fixed z-[90] flex items-center gap-3 rounded-2xl border bg-black/80 px-3 py-2.5 text-left backdrop-blur-xl max-w-[320px]"
                        onMouseEnter={() => { hover.current = true; }}
                        onMouseLeave={() => { hover.current = false; }}
                        onClick={() => { setPanel(true); setWidoczna(false); }}
                        title="Joanna — TeOgochi od muzyki. Kliknij, żeby otworzyć panel."
                    >
                        <motion.span
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                            className="text-3xl leading-none"
                        >
                            {mostZyje === false ? '🔌' : (joanna?.forma ?? '🥚')}
                        </motion.span>
                        <span className="min-w-0">
                            <span className="block text-[10px] font-mono uppercase tracking-wider" style={{ color: kolor }}>
                                Joanna{joanna ? ` · ${joanna.etap} · ${joanna.xp} XP` : ''}
                            </span>
                            <span className="block text-xs text-slate-200 leading-snug line-clamp-2">{zdanie()}</span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {panel && (
                    <PanelJoanny
                        joanna={joanna}
                        mostZyje={mostZyje}
                        utwory={utwory}
                        kolor={kolor}
                        onModul={(m) => { setPanel(false); onModul(m); }}
                        onZamknij={() => setPanel(false)}
                        onDrzemka={drzemka}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PANEL: song / bit / cinema / głosy / rzeźba / rozmowa
// ─────────────────────────────────────────────────────────────────────────────

type Karta = 'menu' | 'cinema' | 'glosy' | 'rozmowa';

const PanelJoanny: React.FC<{
    joanna: StanJoanny | null; mostZyje: boolean | null; utwory: Utwor[]; kolor: string;
    onModul: (m: ModulMuzyki) => void; onZamknij: () => void; onDrzemka: () => void;
}> = ({ joanna, mostZyje, utwory, kolor, onModul, onZamknij, onDrzemka }) => {
    const [karta, setKarta] = useState<Karta>('menu');

    useEffect(() => {
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onZamknij(); };
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [onZamknij]);

    const pozycje: { id: Karta | ModulMuzyki; nazwa: string; opis: string; Ikona: React.ElementType; modul?: ModulMuzyki }[] = [
        { id: 'ai',      nazwa: 'Song',    opis: 'AI Session — utwór z opisu',          Ikona: Music,        modul: 'ai' },
        { id: 'bity',    nazwa: 'Bit',     opis: 'Panel Bitów — rytm z siatki',         Ikona: Grid3X3,      modul: 'bity' },
        { id: 'cinema',  nazwa: 'Cinema',  opis: 'Muzyka pod długość filmu z Katedry',  Ikona: Clapperboard },
        { id: 'glosy',   nazwa: 'Głosy',   opis: 'Piper, VoiceStudio — co dziś mówi',   Ikona: Mic2 },
        { id: 'rzezba',  nazwa: 'Rzeźba',  opis: 'Cięcie, pętle, pasma, stemy',        Ikona: Scissors,     modul: 'rzezba' },
        { id: 'rozmowa', nazwa: 'Rozmowa', opis: 'Powiedz Joannie, czego chcesz',       Ikona: MessageCircle },
    ];

    return (
        <motion.div
            key="joanna-panel"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onClick={onZamknij}
        >
            <motion.div
                initial={{ y: 40, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl rounded-3xl border bg-[#0b0712]/95 p-5 shadow-2xl"
                style={{ borderColor: `${kolor}55`, boxShadow: `0 0 60px ${kolor}22` }}
            >
                {/* ── Nagłówek: prawdziwa forma i stan ── */}
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl leading-none">{mostZyje === false ? '🔌' : (joanna?.forma ?? '🥚')}</span>
                        <div>
                            <div className="text-sm font-bold text-white">Joanna <span className="font-mono text-[10px] font-normal text-slate-500">TeOgochi · Muzyka</span></div>
                            <div className="text-[11px] font-mono" style={{ color: kolor }}>
                                {mostZyje === false
                                    ? 'most nie odpowiada — bez Katedry nic tu nie zagra'
                                    : joanna ? `${joanna.etap} · ${joanna.xp} XP · ${utworow(utwory.length)} w pamięci` : 'szukam się w stadzie…'}
                            </div>
                            {joanna?.robi && <div className="text-[11px] text-slate-400 mt-0.5">teraz: {joanna.robi}</div>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={onDrzemka} title="Drzemka — 30 min ciszy" className="rounded-lg p-2 text-slate-500 hover:text-slate-200"><Moon size={15} /></button>
                        <button onClick={onZamknij} title="Zamknij (Esc)" className="rounded-lg p-2 text-slate-500 hover:text-white"><X size={16} /></button>
                    </div>
                </div>

                {mostZyje === false && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                        <WifiOff size={14} /> Most (:3001) milczy. Odpal Katedrę — Song i Bit działają lokalnie w tej apce, ale Cinema, Głosy i Rozmowa idą przez most.
                    </div>
                )}

                {karta === 'menu' && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {pozycje.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => (p.modul ? onModul(p.modul) : setKarta(p.id as Karta))}
                                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:bg-white/[0.07]"
                                style={{ ['--k' as string]: kolor }}
                            >
                                <p.Ikona size={18} style={{ color: kolor }} />
                                <div className="mt-2 text-sm font-bold text-white">{p.nazwa}</div>
                                <div className="text-[10px] leading-snug text-slate-500">{p.opis}</div>
                            </button>
                        ))}
                    </div>
                )}

                {karta === 'cinema' && <Cinema kolor={kolor} wroc={() => setKarta('menu')} />}
                {karta === 'glosy' && <Glosy kolor={kolor} wroc={() => setKarta('menu')} />}
                {karta === 'rozmowa' && <Rozmowa kolor={kolor} wroc={() => setKarta('menu')} />}
            </motion.div>
        </motion.div>
    );
};

const Wroc: React.FC<{ wroc: () => void; tytul: string }> = ({ wroc, tytul }) => (
    <div className="mb-3 flex items-center gap-2">
        <button onClick={wroc} className="text-[11px] font-mono text-slate-500 hover:text-slate-200">← menu</button>
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{tytul}</span>
    </div>
);

// ── CINEMA: Joanna komponuje pod film — ta sama trasa co Montażownia w Story ──
const Cinema: React.FC<{ kolor: string; wroc: () => void }> = ({ kolor, wroc }) => {
    const [projekty, setProjekty] = useState<string[]>([]);
    const [projekt, setProjekt] = useState('');
    const [filmy, setFilmy] = useState<{ sciezka: string; nazwa: string; sekundy: number | null }[]>([]);
    const [film, setFilm] = useState('');
    const [laduje, setLaduje] = useState(false);
    const [zadanie, setZadanie] = useState<{ id: string; stan: string; segmenty: { stan: string }[]; plik: string | null; model: string; blad: string | null; sekundy: number } | null>(null);
    const [blad, setBlad] = useState('');

    useEffect(() => {
        zMostu<{ projekty: { nazwa: string }[] }>('/api/rezyser/projekty')
            .then((d) => { const n = (d.projekty ?? []).map((p) => p.nazwa); setProjekty(n); if (n[0]) setProjekt(n[0]); })
            .catch((e) => setBlad(e.message));
    }, []);

    useEffect(() => {
        if (!projekt) return;
        setLaduje(true); setFilmy([]); setFilm('');
        // ⚠️ Materiały liczą się przez ffprobe — przy 140 plikach to kilkanaście sekund. Mówimy to.
        zMostu<{ filmy: { sciezka: string; nazwa: string; sekundy: number | null }[] }>(`/api/montazownia/materialy?projekt=${encodeURIComponent(projekt)}`)
            .then((d) => { const m = d.filmy ?? []; setFilmy(m); if (m[0]) setFilm(m[0].sciezka); })
            .catch((e) => setBlad(e.message))
            .finally(() => setLaduje(false));
    }, [projekt]);

    const skomponuj = async () => {
        if (!projekt || !film) return;
        setBlad('');
        try {
            const d = await zMostu<{ id: string; sekundy: number; model: string; segmentow: number }>('/api/montazownia/skomponuj', {
                method: 'POST', body: JSON.stringify({ projekt, film }),
            });
            toast.success(`Joanna komponuje ${d.segmentow} segmentów pod ${Math.round(d.sekundy)} s (${d.model}).`);
            const id = d.id;
            const tik = window.setInterval(async () => {
                try {
                    const z = await zMostu<typeof zadanie>(`/api/montazownia/skomponuj/${encodeURIComponent(id)}`);
                    setZadanie(z);
                    if (z && (z.stan === 'gotowe' || z.stan === 'blad' || z.stan === 'przerwane')) window.clearInterval(tik);
                } catch { window.clearInterval(tik); }
            }, 5000);
        } catch (e) { setBlad(e instanceof Error ? e.message : String(e)); }
    };

    const wybrany = filmy.find((f) => f.sciezka === film);
    const pole = 'w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-slate-200 outline-none';

    return (
        <div>
            <Wroc wroc={wroc} tytul="Cinema — muzyka pod film" />
            <p className="mb-3 text-[11px] text-slate-400">Joanna pisze podkład pod <b>dokładną długość</b> filmu z Katedry — segmentami, jak w Montażowni. To trwa minuty; liczy lokalny model.</p>
            <div className="grid gap-2 sm:grid-cols-2">
                <select value={projekt} onChange={(e) => setProjekt(e.target.value)} className={pole}>
                    {projekty.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={film} onChange={(e) => setFilm(e.target.value)} className={pole} disabled={laduje}>
                    {laduje && <option>mierzę materiały…</option>}
                    {filmy.map((f) => <option key={f.sciezka} value={f.sciezka}>{f.nazwa}{f.sekundy ? ` · ${Math.round(f.sekundy)} s` : ''}</option>)}
                </select>
            </div>
            <button
                onClick={skomponuj}
                disabled={!film || laduje || (zadanie !== null && zadanie.stan === 'liczy')}
                className="mt-3 w-full rounded-xl py-2 text-sm font-bold text-black disabled:opacity-40"
                style={{ backgroundColor: kolor }}
            >
                {zadanie?.stan === 'liczy' ? <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> komponuje…</span> : `SKOMPONUJ${wybrany?.sekundy ? ` pod ${Math.round(wybrany.sekundy)} s` : ''}`}
            </button>
            {zadanie && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] font-mono text-slate-300">
                    stan: <b>{zadanie.stan}</b> · segmenty gotowe: {zadanie.segmenty.filter((s) => s.stan === 'gotowe').length}/{zadanie.segmenty.length} · silnik: {zadanie.model}
                    {zadanie.plik && <div className="mt-1 break-all text-emerald-300">✓ {zadanie.plik}</div>}
                    {zadanie.blad && <div className="mt-1 text-red-300">{zadanie.blad}</div>}
                </div>
            )}
            {blad && <div className="mt-3 text-[11px] text-red-300">{blad}</div>}
        </div>
    );
};

// ── GŁOSY: to, co Katedra dziś NAPRAWDĘ potrafi powiedzieć ──
const Glosy: React.FC<{ kolor: string; wroc: () => void }> = ({ kolor, wroc }) => {
    const [piper, setPiper] = useState<{ glosy: string[]; domyslny: string; przewod: string } | null>(null);
    const [studio, setStudio] = useState<{ zywe: boolean; braki?: string[]; glosy?: unknown[] } | null>(null);
    const [tekst, setTekst] = useState('Jestem Joanna. Muzyka to matematyka, która postanowiła poczuć.');
    const [glos, setGlos] = useState('');
    const [mowi, setMowi] = useState(false);

    useEffect(() => {
        zMostu<{ glosy: string[]; domyslny: string; przewod: string }>('/api/voice/piper/glosy').then((d) => { setPiper(d); setGlos(d.domyslny); }).catch(() => setPiper(null));
        zMostu<{ zywe: boolean; braki?: string[]; glosy?: unknown[] }>('/api/glos-studio/stan').then(setStudio).catch(() => setStudio(null));
    }, []);

    const powiedz = async () => {
        setMowi(true);
        try {
            const r = await fetch(`${MOST}/api/voice/speak`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: tekst, voiceId: glos, przewod: 'piper-pl' }),
            });
            const typ = r.headers.get('content-type') || '';
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            if (typ.startsWith('audio/')) {
                const blob = await r.blob();
                await new Audio(URL.createObjectURL(blob)).play();
            } else {
                const d = await r.json();
                const url = d.url || d.audioUrl || (d.plik ? `${MOST}/${String(d.plik).replace(/^\/+/, '')}` : null);
                if (!url) throw new Error(d.message || 'Most nie oddał dźwięku.');
                await new Audio(url).play();
            }
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setMowi(false); }
    };

    return (
        <div>
            <Wroc wroc={wroc} tytul="Głosy" />
            <div className="space-y-2 text-[11px]">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="font-mono uppercase tracking-wider text-slate-500">Piper (lokalnie, PL)</div>
                    {piper
                        ? <div className="mt-1 text-slate-300">{piper.glosy.length} głosy · przewód <b>{piper.przewod}</b>: {piper.glosy.join(', ')}</div>
                        : <div className="mt-1 text-slate-500">most nie oddał listy</div>}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="font-mono uppercase tracking-wider text-slate-500">VoiceStudio (klon, OmniVoice)</div>
                    {studio?.zywe
                        ? <div className="mt-1 text-emerald-300">żyje · głosów: {studio.glosy?.length ?? 0}</div>
                        : <div className="mt-1 text-amber-300">{studio?.braki?.[0] ?? 'śpi — osobny program'}</div>}
                    <div className="mt-1 text-slate-600">⚠️ VoiceStudio i render Wan dzielą tę samą kartę 6 GB — nie odpalaj go w trakcie renderu.</div>
                </div>
                {piper && (
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <div className="font-mono uppercase tracking-wider text-slate-500">powiedz to teraz</div>
                        <div className="mt-2 flex gap-2">
                            <select value={glos} onChange={(e) => setGlos(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-200">
                                {piper.glosy.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <input value={tekst} onChange={(e) => setTekst(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-200" />
                            <button onClick={powiedz} disabled={mowi} className="rounded-lg px-3 text-xs font-bold text-black disabled:opacity-40" style={{ backgroundColor: kolor }}>
                                {mowi ? '…' : 'MÓW'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── ROZMOWA: Joanna ma ręce — rozmowa wykonuje akcje ──
const Rozmowa: React.FC<{ kolor: string; wroc: () => void }> = ({ kolor, wroc }) => {
    const [historia, setHistoria] = useState<{ kto: 'ty' | 'joanna'; tresc: string }[]>([]);
    const [tekst, setTekst] = useState('');
    const [czeka, setCzeka] = useState(false);

    const wyslij = async () => {
        const w = tekst.trim();
        if (!w) return;
        setTekst('');
        setHistoria((h) => [...h, { kto: 'ty', tresc: w }]);
        setCzeka(true);
        try {
            // Most oddaje { mowa, akcja, wynikAkcji, uwaga } — „Joanna ma ręce": rozmowa wykonuje akcje.
            const d = await zMostu<{ mowa?: string; akcja?: { typ?: string } | null; wynikAkcji?: unknown; uwaga?: string }>('/api/joanna/rozmowa', {
                method: 'POST',
                body: JSON.stringify({ wypowiedz: w, historia: historia.map((h) => ({ rola: h.kto === 'ty' ? 'user' : 'assistant', tresc: h.tresc })) }),
            });
            const odp = d.mowa ?? '(cisza)';
            setHistoria((h) => [...h, { kto: 'joanna', tresc: odp + (d.uwaga ? `  ·  ${d.uwaga}` : '') }]);
            if (d.akcja) toast(`Joanna wykonała akcję: ${d.akcja.typ ?? 'tak'}.`, { icon: '🖐️' });
        } catch (e) {
            setHistoria((h) => [...h, { kto: 'joanna', tresc: `Nie mogę odpowiedzieć: ${e instanceof Error ? e.message : String(e)}` }]);
        } finally { setCzeka(false); }
    };

    return (
        <div>
            <Wroc wroc={wroc} tytul="Rozmowa z Joanną" />
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                {!historia.length && <div className="text-slate-500">Powiedz, czego potrzebujesz — Joanna potrafi zlecić utwór, opisać nastrój, dobrać tempo.</div>}
                {historia.map((h, i) => (
                    <div key={i} className={h.kto === 'ty' ? 'text-right text-slate-300' : 'text-left'} style={h.kto === 'joanna' ? { color: kolor } : {}}>
                        {h.tresc}
                    </div>
                ))}
                {czeka && <div className="text-slate-500"><Loader2 size={12} className="inline animate-spin" /> Joanna myśli…</div>}
            </div>
            <div className="mt-2 flex gap-2">
                <input value={tekst} onChange={(e) => setTekst(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void wyslij(); }} placeholder="np. zrób mi 30 s ambientu pod pustynię" className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-slate-200 outline-none" />
                <button onClick={() => void wyslij()} disabled={czeka} className="rounded-lg px-3 text-xs font-bold text-black disabled:opacity-40" style={{ backgroundColor: kolor }}>WYŚLIJ</button>
            </div>
        </div>
    );
};
