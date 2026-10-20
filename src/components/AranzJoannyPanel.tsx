/**
 * 🎼 AranzJoannyPanel — „Joanna aranżuje szkic” (Suweren 2026-10-20) w module Jam z Joanną.
 *
 * Nagrany jam (.mid) → ANALIZA w przeglądarce (`src/jam/analiza.ts`: tonacja, tempo, motywy z numerami) →
 * PLAN od modelu Joanny przez most (`/api/aranz`, zamknięte listy sekcji, progresji, instrumentów) →
 * ✎ poprawka Suwerena (para do nauki) → ▶ DEMO: aranż MIDI liczy kod (`src/jam/aranz.ts`) z TYCH SAMYCH
 * motywów (analiza jest deterministyczna, liczona od nowa z pliku jamu) i renderuje go offline
 * (`src/jam/render.ts`) → most zapisuje mp3 + .mid → 🎛️ PEŁNE BRZMIENIE: Warsztat (ACE-Step remiks) z demo jako wzorem.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music2, Loader2, Play, Pencil, Check, X, Sparkles, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { analizujMid, opisAnalizy, type Analiza } from '../jam/analiza';
import { aranzuj, SEKCJE_UTWORU, type PlanUtworu } from '../jam/aranz';
import { zapiszMid } from '../jam/midiPlik';
import { renderujDemo } from '../jam/render';

const MOST = 'http://127.0.0.1:3001';
interface Jam { nazwa: string; kiedy: string; bpm: number; tonacja: string | null; audio: string; midi: string; url: string; urlMidi: string | null }
interface Aranz {
    id: string; utworzono: string; stan: 'propozycja' | 'przyjety' | 'odrzucony'; jam: string | null; model: string | null; poprawiony: boolean;
    analiza: { bpm: number; tonacja: string; motywy: { nr: number; takty: number; nut: number; melodia: string }[] };
    plan: PlanUtworu & { takty: number }; demo: { mp3: string; mid: string } | null;
    brzmienie: { stan: 'liczy' | 'gotowe' | 'blad'; sila: number; plik: string | null; blad: string | null; sekundy?: number } | null;
    demoUrl: string | null; utworUrl: string | null; osie?: { plik: string; os: string }[]; pominieteInstrumenty?: number;
}

const kolorSekcji = (t: string) => SEKCJE_UTWORU.find((s) => s.id === t)?.kolor ?? '#64748b';
const nazwaSekcji = (t: string) => SEKCJE_UTWORU.find((s) => s.id === t)?.nazwa ?? t;
const ziarnoZId = (id: string) => parseInt(id.slice(2, 10), 16) || 1;
const doBase64 = (b: Blob) => new Promise<string>((ok, zle) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] ?? ''); r.onerror = () => zle(r.error); r.readAsDataURL(b); });
async function most<T>(p: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${MOST}${p}`, { headers: { 'Content-Type': 'application/json' }, ...init });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.success) throw new Error(d.message || `HTTP ${r.status}`);
    return d as T;
}
const analizaJamu = async (rel: string): Promise<Analiza> => {
    const r = await fetch(`${MOST}/music/${rel.split('/').map(encodeURIComponent).join('/')}`);
    if (!r.ok) throw new Error(`Nie mogę pobrać pliku MIDI jamu (HTTP ${r.status}).`);
    return analizujMid(new Uint8Array(await r.arrayBuffer()));
};

const PasSekcji: React.FC<{ plan: PlanUtworu & { takty: number } }> = ({ plan }) => (
    <div className="flex w-full h-9 rounded-lg overflow-hidden border border-white/10">
        {plan.sekcje.map((s, i) => (
            <div key={i} title={`${nazwaSekcji(s.typ)} · ${s.takty} t. · ${s.progresja} · ${s.instrumenty.join(', ')}${s.motyw ? ` · motyw ${s.motyw}` : ''}`}
                style={{ flex: s.takty, background: `${kolorSekcji(s.typ)}${Math.round(40 + s.energia * 150).toString(16).padStart(2, '0')}` }}
                className="flex flex-col justify-center px-1.5 text-[9px] font-mono leading-tight border-r border-black/40 overflow-hidden whitespace-nowrap">
                <span className="font-bold">{nazwaSekcji(s.typ)}{s.motyw ? ` ♪${s.motyw}` : ''}</span><span className="opacity-70">{s.takty} t.</span>
            </div>
        ))}
    </div>
);

export const AranzJoannyPanel: React.FC<{ odswiezenie?: string | null }> = ({ odswiezenie }) => {
    const [jamy, setJamy] = useState<Jam[]>([]);
    const [aranze, setAranze] = useState<Aranz[]>([]);
    const [mostOffline, setMostOffline] = useState(false);
    const [praca, setPraca] = useState<string | null>(null);
    const [blad, setBlad] = useState('');
    const [uwagi, setUwagi] = useState('');
    const [wybrany, setWybrany] = useState<string | null>(null);
    const [edycja, setEdycja] = useState<string | null>(null);
    const [sila, setSila] = useState(0.45);
    const [analiza, setAnaliza] = useState<Analiza | null>(null);
    const graj = useRef<HTMLAudioElement | null>(null);

    const odswiez = useCallback(async () => {
        try {
            const [j, a] = await Promise.all([most<{ jamy: Jam[] }>('/api/jam'), most<{ aranze: Aranz[] }>('/api/aranz')]);
            setJamy(j.jamy); setAranze(a.aranze); setMostOffline(false);
        } catch { setMostOffline(true); }
    }, []);
    useEffect(() => { void odswiez(); }, [odswiez, odswiezenie]);
    useEffect(() => {
        if (!aranze.some((a) => a.brzmienie?.stan === 'liczy')) return;
        const i = setInterval(() => void odswiez(), 5000);
        return () => clearInterval(i);
    }, [aranze, odswiez]);

    const a = aranze.find((x) => x.id === wybrany) ?? null;
    useEffect(() => {
        setEdycja(null); setAnaliza(null);
        if (a?.jam) analizaJamu(a.jam).then(setAnaliza).catch(() => setAnaliza(null));
    }, [a?.id, a?.jam]);

    const aranzujJam = async (j: Jam) => {
        if (!j.midi) return;
        setPraca(`analizuję ${j.nazwa}…`); setBlad('');
        try {
            const an = await analizaJamu(j.midi);
            if (!an.motywy.length) throw new Error('W tym jamie nie ma frazy z co najmniej 2 nutami — nie ma z czego aranżować.');
            setPraca(`Joanna układa plan (${an.tonacja.nazwa}, ${an.bpm} BPM, ${an.motywy.length} motywów)…`);
            const d = await most<{ aranz: Aranz }>('/api/aranz', { method: 'POST', body: JSON.stringify({ jam: j.midi, analiza: opisAnalizy(an), uwagi }) });
            toast.success(`Plan: „${d.aranz.plan.tytul}”`);
            await odswiez();
            setWybrany(d.aranz.id);
        } catch (e) { const m = e instanceof Error ? e.message : String(e); setBlad(`Plan nie wyszedł: ${m}`); toast.error(m); }
        finally { setPraca(null); }
    };

    const zapiszPoprawke = async () => {
        if (!a || edycja == null) return;
        try {
            const plan = JSON.parse(edycja);
            await most(`/api/aranz/${a.id}`, { method: 'PUT', body: JSON.stringify({ plan }) });
            setEdycja(null); toast.success('Poprawka zapisana — Joanna uczy się z niej.'); await odswiez();
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    };
    const decyzja = async (co: 'przyjmij' | 'odrzuc') => { if (!a) return; try { await most(`/api/aranz/${a.id}/${co}`, { method: 'POST' }); await odswiez(); } catch (e) { toast.error(String(e)); } };
    const usun = async () => { if (!a || !confirm('Usunąć ten aranż z listy? (pliki w bibliotece zostają)')) return; await most(`/api/aranz/${a.id}`, { method: 'DELETE' }).catch(() => null); setWybrany(null); await odswiez(); };

    const demo = async () => {
        if (!a || !analiza) return;
        setPraca('liczę aranż i renderuję demo…');
        try {
            const ar = aranzuj({ plan: a.plan, motywy: analiza.motywy, tonacja: analiza.tonacja, bpm: a.analiza.bpm, ziarno: ziarnoZId(a.id) });
            const mid = zapiszMid({ bpm: a.analiza.bpm, sciezki: ar.sciezki });
            const t0 = performance.now();
            const { wav } = await renderujDemo(ar, a.analiza.bpm);
            const wavBlob = new Blob([wav.slice().buffer], { type: 'audio/wav' });
            if (graj.current) { graj.current.src = URL.createObjectURL(wavBlob); void graj.current.play(); }
            setPraca(`zapisuję demo (render ${((performance.now() - t0) / 1000).toFixed(1)} s)…`);
            await most(`/api/aranz/${a.id}/demo`, { method: 'POST', body: JSON.stringify({ audio: await doBase64(wavBlob), typAudio: 'audio/wav', midi: await doBase64(new Blob([mid.slice().buffer])) }) });
            toast.success(`Demo: ${ar.takty} taktów, ${ar.sekundy} s — w bibliotece.`);
            await odswiez();
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
        finally { setPraca(null); }
    };
    const brzmienie = async () => {
        if (!a) return;
        if (!confirm(`Pełne brzmienie liczy ACE-Step 1.5 w ComfyUI na karcie graficznej (6 GB): głos Katedry i Ollama oddadzą kartę, ComfyUI obudzi się sam (do 2 min), utwór ${a.plan.takty} taktów to kilka minut liczenia. Siła ${sila} — im mniej, tym więcej melodii z demo zostaje. Zlecić?`)) return;
        try { await most(`/api/aranz/${a.id}/brzmienie`, { method: 'POST', body: JSON.stringify({ sila }) }); toast.success('Zlecone w Warsztacie — patrz stan poniżej.'); await odswiez(); }
        catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    };

    if (mostOffline) return <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-amber-200">🎼 Joanna aranżuje: most Katedry (127.0.0.1:3001) nie odpowiada albo nie zna jeszcze /api/aranz (restart mostu).</div>;
    return (
        <div className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-3 space-y-3 text-xs">
            <div className="flex items-center gap-2"><Music2 className="w-4 h-4 text-violet-300" /><b className="text-sm">Joanna aranżuje szkic</b>
                <span className="text-slate-400 font-mono">plan wybiera Joanna z list · nuty liczy kod z Twoich motywów · pełne brzmienie: ACE-Step</span></div>
            <div className="grid md:grid-cols-[1fr_1.4fr] gap-3">
                <div className="space-y-2">
                    <div className="text-[11px] text-slate-400 font-mono">NAGRANE JAMY ({jamy.length})</div>
                    <input value={uwagi} onChange={(e) => setUwagi(e.target.value)} placeholder="uwagi dla Joanny (np. „nocny synthwave, bez tekstu”)" className="w-full bg-black/50 border border-white/10 rounded px-2 py-1" />
                    <div className="max-h-48 overflow-auto space-y-1">
                        {jamy.length ? jamy.map((j) => (
                            <div key={j.audio} className="flex items-center gap-2 bg-black/30 rounded px-2 py-1">
                                <span className="flex-1 font-mono truncate" title={j.audio}>{j.nazwa} · {j.bpm} BPM{j.tonacja ? ` · ${j.tonacja}` : ''}</span>
                                <button disabled={!!praca || !j.midi} onClick={() => void aranzujJam(j)} className="px-2 py-0.5 rounded border border-violet-400/50 text-violet-200 hover:bg-violet-500/10 disabled:opacity-40">🎼 Joanna aranżuje</button>
                            </div>
                        )) : <div className="text-slate-500">Nagraj jam (⏺ Nagrywaj wyżej) — tu pojawi się szkic do aranżu.</div>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono pt-1">ARANŻE ({aranze.length})</div>
                    <div className="max-h-40 overflow-auto space-y-1">
                        {aranze.map((x) => (
                            <button key={x.id} onClick={() => setWybrany(x.id)} className={`w-full text-left rounded px-2 py-1 font-mono border ${x.id === wybrany ? 'border-violet-400 bg-violet-500/10' : 'border-white/5 bg-black/30'}`}>
                                {x.plan.tytul} <span className="text-slate-500">· {x.plan.takty} t. · {x.stan}{x.demo ? ' · demo' : ''}{x.brzmienie ? ` · ACE ${x.brzmienie.stan}` : ''}</span>
                            </button>
                        ))}
                    </div>
                    {blad && !praca && <div className="text-amber-300 font-mono text-[11px]">{blad} — spróbuj jeszcze raz (model losuje) albo dopisz uwagi.</div>}
                    {praca && <div className="flex items-center gap-2 text-violet-200"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {praca}</div>}
                </div>

                <div className="space-y-2">
                    {!a ? <div className="text-slate-500 pt-6 text-center">Wybierz aranż albo poproś Joannę o nowy z nagranego jamu.</div> : <>
                        <div className="flex items-baseline justify-between gap-2">
                            <div><b className="text-sm text-white">{a.plan.tytul}</b> <span className="text-slate-400">{a.plan.styl}</span></div>
                            <span className="font-mono text-slate-500">{a.analiza.tonacja} · {a.analiza.bpm} BPM · {a.plan.takty} t. · {a.model ?? '?'}{a.poprawiony ? ' · ✎ Suweren' : ''}</span>
                        </div>
                        <PasSekcji plan={a.plan} />
                        <div className="font-mono text-[10px] text-slate-400">tagi: {a.plan.tagi}{a.plan.tekst ? ` · tekst: ${a.plan.tekst.slice(0, 80)}…` : ' · instrumentalny'}{a.pominieteInstrumenty ? ` · pominięto ${a.pominieteInstrumenty} instr. spoza listy` : ''}</div>
                        <div className="font-mono text-[10px] text-slate-500">motywy: {a.analiza.motywy.map((m) => `♪${m.nr} ${m.melodia}`).join(' · ')}{!analiza && a.jam ? ' · ⚠ nie mogę wczytać pliku jamu — demo niemożliwe' : ''}</div>
                        {edycja != null ? (
                            <div className="space-y-1">
                                <textarea value={edycja} onChange={(e) => setEdycja(e.target.value)} rows={12} className="w-full bg-black/60 border border-white/10 rounded p-2 font-mono text-[10px]" />
                                <div className="flex gap-2"><button onClick={() => void zapiszPoprawke()} className="px-2 py-1 rounded border border-emerald-400/50 text-emerald-200">💾 Zapisz poprawkę</button><button onClick={() => setEdycja(null)} className="px-2 py-1 rounded border border-white/10">Anuluj</button></div>
                                <div className="text-[10px] text-slate-500">typy: {SEKCJE_UTWORU.map((s) => s.id).join(', ')} · progresje i instrumenty z listy mostu — zła wartość = odmowa z powodem</div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setEdycja(JSON.stringify({ tytul: a.plan.tytul, styl: a.plan.styl, tagi: a.plan.tagi, tekst: a.plan.tekst, sekcje: a.plan.sekcje }, null, 1))} className="px-2 py-1 rounded border border-white/15 flex items-center gap-1"><Pencil className="w-3 h-3" /> ✎ popraw plan</button>
                                <button onClick={() => void decyzja('przyjmij')} className="px-2 py-1 rounded border border-emerald-400/40 text-emerald-200 flex items-center gap-1"><Check className="w-3 h-3" /> przyjmij</button>
                                <button onClick={() => void decyzja('odrzuc')} className="px-2 py-1 rounded border border-red-400/40 text-red-200 flex items-center gap-1"><X className="w-3 h-3" /> odrzuć</button>
                                <button onClick={() => void usun()} className="px-2 py-1 rounded border border-white/10 text-slate-400 flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button disabled={!!praca || !analiza || a.stan === 'odrzucony'} onClick={() => void demo()} className="px-3 py-1.5 rounded bg-violet-500/20 border border-violet-400/50 flex items-center gap-1.5 disabled:opacity-40"><Play className="w-3.5 h-3.5" /> ▶ demo (aranż MIDI)</button>
                            <label className="font-mono text-[10px] text-slate-300">siła ACE {sila.toFixed(2)} <input type="range" min={0.2} max={0.8} step={0.05} value={sila} onChange={(e) => setSila(Number(e.target.value))} className="align-middle accent-violet-400" /></label>
                            <button disabled={!a.demo || a.brzmienie?.stan === 'liczy'} onClick={() => void brzmienie()} className="px-3 py-1.5 rounded border border-cyan-400/50 text-cyan-200 flex items-center gap-1.5 disabled:opacity-40"><Sparkles className="w-3.5 h-3.5" /> 🎛️ pełne brzmienie (ACE-Step)</button>
                        </div>
                        <audio ref={graj} controls className="w-full h-8" src={a.demoUrl ? `${MOST}${a.demoUrl}` : undefined} />
                        {a.demo && <div className="font-mono text-[10px] text-slate-400">demo: {a.demo.mp3} · {a.demo.mid.split('/').pop()}{a.osie?.length ? ` · oś Kompozytora ✓` : ''}</div>}
                        {a.brzmienie && <div className={`font-mono text-[11px] ${a.brzmienie.stan === 'blad' ? 'text-red-300' : 'text-cyan-200'}`}>
                            ACE-Step (siła {a.brzmienie.sila}): {a.brzmienie.stan === 'liczy' ? '⏳ liczy w ComfyUI…' : a.brzmienie.stan === 'blad' ? `błąd — ${a.brzmienie.blad}` : `✓ ${a.brzmienie.plik}${a.brzmienie.sekundy ? ` (${a.brzmienie.sekundy} s)` : ''}`}
                        </div>}
                        {a.utworUrl && <audio controls className="w-full h-8" src={`${MOST}${a.utworUrl}`} />}
                    </>}
                </div>
            </div>
        </div>
    );
};

export default AranzJoannyPanel;
