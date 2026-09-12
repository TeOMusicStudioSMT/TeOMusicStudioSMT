/**
 * 🔧 WarsztatPanel — PRZEDŁUŻ · REMIKS · COVER istniejącego utworu.
 *
 * Suweren (2026-09-12): „Joanna utworzyła utwór 0:53 — a jakbym chciał, by go
 * przedłużyła? Przydałaby się osobna sekcja do przedłużania, remiksowania,
 * coverowania istniejących utworów".
 *
 * Wszystko liczy ACE-Step 1.5 w ComfyUI (most: /api/music/warsztat), z tych
 * samych wag co AI Session. Wynik ląduje w _OtakOs_Muzyka/_Przerobki i od razu
 * gra tutaj.
 *
 * ⚠️ UCZCIWE NAZWY. „Przedłuż" to KONTYNUACJA w tej samej barwie zszyta
 * crossfade'em (2 s) — nie dosłowne dokończenie frazy; latent audio nie ma
 * w rdzeniu ComfyUI maski do domalowania w miejscu (sprawdzone). „Remiks" —
 * ten sam utwór z nowymi tagami, siła mówi, ile zmienić (0,5 → obwiednia
 * zgodna z oryginałem w 78 %). „Cover" — nowa aranżacja o tej samej długości
 * z barwą oryginału.
 */

import React, { useEffect, useState } from 'react';
import { Wrench, Loader2, Play, Square, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const BRIDGE = 'http://127.0.0.1:3001';

type Tryb = 'przedluz' | 'remiks' | 'cover';
interface Utwor { nazwa: string; sciezka: string; bajtow: number; kiedy: number }
interface Zadanie { id: string; tryb: Tryb; nazwaTrybu: string; zrodlo: string; sekundyOryg: number; tags: string; sila: number | null; dodajSekund: number | null; stan: 'liczy' | 'gotowe' | 'blad'; wynik: string | null; streamUrl: string | null; sekundyWyniku: number | null; blad: string | null; silnik: string; od: string }

const TRYBY: { id: Tryb; nazwa: string; opis: string }[] = [
    { id: 'przedluz', nazwa: 'Przedłuż', opis: 'kontynuacja w tej samej barwie, zszyta crossfade 2 s' },
    { id: 'remiks', nazwa: 'Remiks', opis: 'ten sam utwór z nowymi tagami; siła = ile zmienić' },
    { id: 'cover', nazwa: 'Cover', opis: 'nowa aranżacja tej samej długości, barwa z oryginału' },
];

const nazwaPliku = (p: string) => p.split(/[\\/]/).pop() ?? p;

export const WarsztatPanel: React.FC<{ startPlik?: string | null; startTags?: string; startLyrics?: string }> = ({ startPlik, startTags = '', startLyrics = '' }) => {
    const [utwory, setUtwory] = useState<Utwor[]>([]);
    const [plik, setPlik] = useState(startPlik ?? '');
    const [tryb, setTryb] = useState<Tryb>('przedluz');
    const [tags, setTags] = useState(startTags);
    const [lyrics, setLyrics] = useState(startLyrics);
    const [sila, setSila] = useState(0.5);
    const [dodaj, setDodaj] = useState(30);
    const [zadania, setZadania] = useState<Zadanie[]>([]);
    const [zleca, setZleca] = useState(false);
    const [mostOffline, setMostOffline] = useState(false);
    const [gra, setGra] = useState<string | null>(null);
    const [audio] = useState(() => new Audio());

    const odswiez = async () => {
        try {
            const [k, w] = await Promise.all([
                fetch(`${BRIDGE}/api/muzyka/katalog`).then((r) => r.json()),
                fetch(`${BRIDGE}/api/music/warsztat`).then((r) => r.json()),
            ]);
            const lista: Utwor[] = (k.biblioteka ?? []).filter((u: Utwor) => /\.(mp3|wav|flac|ogg)$/i.test(u.nazwa)).sort((a: Utwor, b: Utwor) => b.kiedy - a.kiedy);
            setUtwory(lista);
            setPlik((p) => p || startPlik || lista[0]?.sciezka || '');
            setZadania(w.zadania ?? []);
            setMostOffline(false);
        } catch { setMostOffline(true); }
    };
    useEffect(() => { void odswiez(); }, []);
    useEffect(() => {
        if (!zadania.some((z) => z.stan === 'liczy')) return;
        const i = setInterval(() => void odswiez(), 5000);
        return () => clearInterval(i);
    }, [zadania]);
    useEffect(() => { audio.onended = () => setGra(null); return () => { audio.pause(); }; }, [audio]);

    const zlec = async () => {
        if (!plik) return toast.error('Wybierz utwór.');
        if (!tags.trim()) return toast.error('Podaj tagi — model nie zgadnie, w którą stronę iść.');
        setZleca(true);
        try {
            const r = await fetch(`${BRIDGE}/api/music/warsztat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tryb, plik, tags, lyrics, sila, dodajSekund: dodaj }) });
            const d = await r.json();
            if (!d.success) throw new Error(d.message || 'most odmówił');
            toast.success(`${d.nazwaTrybu}: ComfyUI liczy (${d.sekundyOryg} s${d.dodajSekund ? ` + ${d.dodajSekund} s` : ''}).`);
            await odswiez();
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e), { duration: 8000 }); }
        finally { setZleca(false); }
    };

    const graj = (z: Zadanie) => {
        if (!z.streamUrl) return;
        if (gra === z.id) { audio.pause(); setGra(null); return; }
        audio.src = z.streamUrl; void audio.play(); setGra(z.id);
    };

    const wybrany = utwory.find((u) => u.sciezka === plik);

    return (
        <div className="w-full max-w-5xl rounded-3xl border border-cyan-500/20 bg-[#070a12]/95 p-6 text-slate-200 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10"><Wrench className="text-cyan-300" /></div>
                <div>
                    <h2 className="text-xl font-bold text-white">Warsztat utworów</h2>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">przedłuż · remiks · cover — ACE-Step 1.5, lokalnie</p>
                </div>
                <button onClick={() => void odswiez()} className="ml-auto text-slate-500 hover:text-white"><RefreshCw size={15} /></button>
            </div>

            {mostOffline && <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200"><AlertTriangle size={14} /> Most (:3001) milczy — Warsztat liczy przez most i ComfyUI.</div>}

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400">Utwór z biblioteki ({utwory.length})
                        <select value={plik} onChange={(e) => setPlik(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 p-2 text-xs text-slate-200">
                            {startPlik && !utwory.some((u) => u.sciezka === startPlik) && <option value={startPlik}>{nazwaPliku(startPlik)} (ostatnio wygenerowany)</option>}
                            {utwory.map((u) => <option key={u.sciezka} value={u.sciezka}>{u.nazwa} · {(u.bajtow / 1e6).toFixed(1)} MB</option>)}
                        </select>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {TRYBY.map((t) => (
                            <button key={t.id} onClick={() => setTryb(t.id)} className={`rounded-xl border p-2 text-left ${tryb === t.id ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                                <div className="text-sm font-bold text-white">{t.nazwa}</div>
                                <div className="text-[10px] leading-snug text-slate-500">{t.opis}</div>
                            </button>
                        ))}
                    </div>
                    {tryb === 'przedluz' && (
                        <label className="block text-[10px] uppercase tracking-widest text-slate-400">dodaj sekund: <span className="text-cyan-300">{dodaj}</span>{wybrany ? '' : ''}
                            <input type="range" min={5} max={180} step={5} value={dodaj} onChange={(e) => setDodaj(Number(e.target.value))} className="mt-1 w-full" />
                        </label>
                    )}
                    {tryb === 'remiks' && (
                        <label className="block text-[10px] uppercase tracking-widest text-slate-400">siła zmiany: <span className="text-cyan-300">{sila.toFixed(2)}</span> <span className="normal-case text-slate-600">(0,3 = delikatnie · 0,5 = struktura zostaje · 0,8 = prawie nowy utwór)</span>
                            <input type="range" min={0.1} max={0.95} step={0.05} value={sila} onChange={(e) => setSila(Number(e.target.value))} className="mt-1 w-full" />
                        </label>
                    )}
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400">tagi (brzmienie){tryb === 'przedluz' ? ' — najlepiej te same, co przy tworzeniu' : ' — nowe brzmienie'}
                        <textarea value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ambient electronic, warm analog synthesizers, 72 bpm, instrumental" className="mt-1 h-16 w-full rounded-lg border border-white/10 bg-black/50 p-2 font-mono text-xs text-slate-200 outline-none focus:border-cyan-400/50" />
                    </label>
                    {tryb !== 'przedluz' && (
                        <label className="block text-[10px] uppercase tracking-widest text-slate-400">tekst (opcjonalnie)
                            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="[Verse 1]…" className="mt-1 h-20 w-full rounded-lg border border-white/10 bg-black/50 p-2 font-mono text-xs text-slate-200 outline-none" />
                        </label>
                    )}
                    <button onClick={() => void zlec()} disabled={zleca || !plik} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 py-3 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-40">
                        {zleca ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />} {TRYBY.find((t) => t.id === tryb)?.nazwa}
                    </button>
                    <div className="font-mono text-[10px] text-slate-600">ACE-Step 1.5 turbo, 8 kroków · wynik: _OtakOs_Muzyka/_Przerobki · przedłużenie 20 s ≈ 1 min na RTX 3060</div>
                </div>

                <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400">Przeróbki ({zadania.length})</div>
                    {!zadania.length && <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs text-slate-500">Pusto. Pierwsza przeróbka pojawi się tutaj i zagra od razu.</div>}
                    {zadania.map((z) => (
                        <div key={z.id} className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`font-mono text-[10px] ${z.stan === 'gotowe' ? 'text-lime-300' : z.stan === 'blad' ? 'text-red-300' : 'text-sky-300'}`}>{z.stan === 'liczy' ? <Loader2 size={11} className="inline animate-spin" /> : null} {z.nazwaTrybu}</span>
                                <span className="text-slate-300">{nazwaPliku(z.zrodlo)}</span>
                                <span className="ml-auto font-mono text-[10px] text-slate-500">{z.sekundyOryg} s{z.sekundyWyniku ? ` → ${z.sekundyWyniku} s` : z.dodajSekund ? ` + ${z.dodajSekund} s` : ''}{z.sila !== null ? ` · siła ${z.sila}` : ''}</span>
                            </div>
                            <div className="mt-1 truncate text-[10px] text-slate-500" title={z.tags}>{z.tags}</div>
                            {z.blad && <div className="mt-1 text-[10px] text-red-300">{z.blad}</div>}
                            {z.stan === 'gotowe' && z.streamUrl && (
                                <div className="mt-2 flex items-center gap-2">
                                    <button onClick={() => graj(z)} className="flex items-center gap-1 rounded-lg border border-cyan-400/40 px-3 py-1 text-cyan-200">{gra === z.id ? <Square size={12} /> : <Play size={12} />} {gra === z.id ? 'stop' : 'graj'}</button>
                                    <a href={z.streamUrl} download className="text-[10px] text-slate-400 hover:text-white">pobierz</a>
                                    <span className="ml-auto font-mono text-[10px] text-slate-600">{nazwaPliku(z.wynik ?? '')}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WarsztatPanel;
