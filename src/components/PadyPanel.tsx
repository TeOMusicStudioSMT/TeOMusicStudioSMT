/**
 * 🥁 PadyPanel — pady Jamu z Joanną z własnym dźwiękiem (Suweren 2026-10-22: „programować pady dźwiękiem…
 * naciskając je, by dany dźwięk leciał”).
 *
 * Siatka 8 padów (Bank A / Bank B = pady 9–16 MPK mini, gdy pomiar je rozróżnia), klik = odsłuch, ✎ = edycja:
 * źródło (🎤 mikrofon, 📁 plik z dysku — także przeciągnięty, 🎚️ próbka z Samplera, 🎵 wycinek utworu z biblioteki,
 * 🥁 perkusja syntezowana), fala z przycięciem od–do, głośność, normalizacja, strój, tryb (raz / trzymaj / pętla
 * w takt metronomu), grupa wyciszania, czułość na siłę. Dźwięk zawsze idzie przez most (`/api/jam/pady…` → ffmpeg →
 * wav w `_OtakOs_Muzyka/Jam z Joanną/Pady/<zestaw>/`), a bufory ładują się do silnika raz na zestaw.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, Pencil, Upload, Save, Plus, Copy, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SilnikJamu } from '../jam/silnik';
import { PADY } from '../jam/silnik';
import { oczyscZestaw, przytnij, TRYBY_PADU, UDERZENIA_PETLI, type UstawieniaPadu, type ZestawPadow } from '../jam/pady';

const MOST = 'http://127.0.0.1:3001';
type PadZMostu = UstawieniaPadu & { url: string | null };
type ZestawZMostu = Omit<ZestawPadow, 'pady'> & { id: string; pady: PadZMostu[] };
const NAZWY_TRYBU: Record<string, string> = { raz: 'raz (one-shot)', trzymaj: 'trzymaj (gra, póki trzymasz)', petla: 'pętla w takt (2. uderzenie = stop)' };

async function most<T>(p: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${MOST}${p}`, { headers: { 'Content-Type': 'application/json' }, ...init });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.success) throw new Error(d.message || `HTTP ${r.status}`);
    return d as T;
}
const doDataURL = (b: Blob) => new Promise<string>((ok, zle) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => zle(r.error); r.readAsDataURL(b); });
const urlMuzyki = (rel: string) => `${MOST}/music/${rel.split('/').map(encodeURIComponent).join('/')}`;

/** Fala z zaznaczeniem od–do (przeciągnij myszą). */
const Fala: React.FC<{ bufor: AudioBuffer | null; od: number; doS: number | null; onZmiana: (od: number, doS: number | null) => void }> = ({ bufor, od, doS, onZmiana }) => {
    const c = useRef<HTMLCanvasElement>(null);
    const ciagnie = useRef<number | null>(null);
    useEffect(() => {
        const cv = c.current; if (!cv) return;
        const g = cv.getContext('2d')!; const W = cv.width, H = cv.height;
        g.clearRect(0, 0, W, H);
        if (!bufor) { g.fillStyle = '#64748b'; g.font = '11px monospace'; g.fillText('perkusja syntezowana — brak fali', 8, H / 2); return; }
        const d = bufor.getChannelData(0), krok = Math.max(1, Math.floor(d.length / W));
        const { od: a, dl } = przytnij(bufor.duration, od, doS);
        g.fillStyle = 'rgba(236,72,153,0.15)'; g.fillRect((a / bufor.duration) * W, 0, (dl / bufor.duration) * W, H);
        g.strokeStyle = '#f472b6'; g.beginPath();
        for (let x = 0; x < W; x++) { let m = 0; for (let i = x * krok; i < (x + 1) * krok && i < d.length; i++) m = Math.max(m, Math.abs(d[i])); g.moveTo(x, H / 2 - m * H / 2); g.lineTo(x, H / 2 + m * H / 2); }
        g.stroke();
    }, [bufor, od, doS]);
    const sek = (e: React.PointerEvent) => { const r = c.current!.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (bufor?.duration ?? 0); };
    return (
        <canvas ref={c} width={560} height={70} className="w-full h-16 bg-black/50 rounded border border-white/10 cursor-crosshair"
            onPointerDown={(e) => { if (!bufor) return; ciagnie.current = sek(e); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (ciagnie.current == null) return; const a = ciagnie.current, b = sek(e); if (Math.abs(b - a) > 0.01) onZmiana(Math.min(a, b), Math.max(a, b)); }}
            onPointerUp={() => { ciagnie.current = null; }} />
    );
};

export const PadyPanel: React.FC<{
    silnik: () => SilnikJamu; uderzenia: number[]; bank: 0 | 1; setBank: (b: 0 | 1) => void; bankB: boolean;
    onUderz: (i: number) => void; onZestaw: (id: string | null) => void;
}> = ({ silnik, uderzenia, bank, setBank, bankB, onUderz, onZestaw }) => {
    const [zestawy, setZestawy] = useState<{ id: string; nazwa: string; probek: number }[]>([]);
    const [id, setId] = useState<string>(() => { try { return localStorage.getItem('jam_zestaw_padow') ?? ''; } catch { return ''; } });
    const [z, setZ] = useState<ZestawZMostu | null>(null);
    const [bufory, setBufory] = useState<(AudioBuffer | null)[]>([]);
    const [edytuj, setEdytuj] = useState<number | null>(null);
    const [praca, setPraca] = useState<string | null>(null);
    const [mostOffline, setMostOffline] = useState(false);
    const [stemy, setStemy] = useState<{ rel: string; nazwa: string; probka: boolean }[]>([]);
    const [utwory, setUtwory] = useState<{ plik: string; tytul: string }[]>([]);
    const [utwor, setUtwor] = useState(''); const [falaUtworu, setFalaUtworu] = useState<AudioBuffer | null>(null); const [wycinek, setWycinek] = useState<{ od: number; do: number }>({ od: 0, do: 1 });
    const [nagr, setNagr] = useState<MediaRecorder | null>(null);
    const [zmienione, setZmienione] = useState(false);

    const odswiezListe = useCallback(async () => {
        try { const d = await most<{ zestawy: typeof zestawy }>('/api/jam/pady'); setZestawy(d.zestawy); setMostOffline(false); return d.zestawy; }
        catch { setMostOffline(true); return []; }
    }, []);
    useEffect(() => { void odswiezListe().then((l) => { if (!l.some((x) => x.id === id) && l[0]) setId(l[0].id); }); }, [odswiezListe]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Zestaw → silnik: bufory ładowane raz (dekodowanie w kontekście jamu). */
    const wczytaj = useCallback(async (zs: ZestawZMostu) => {
        const s = silnik();
        const b = await Promise.all(zs.pady.map(async (p) => {
            if (!p.url) return null;
            try { return await s.ctx.decodeAudioData(await (await fetch(`${MOST}${p.url}`)).arrayBuffer()); } catch { return null; }
        }));
        s.ustawZestaw(oczyscZestaw(zs), b);
        setZ(zs); setBufory(b); setZmienione(false);
    }, [silnik]);
    useEffect(() => {
        try { localStorage.setItem('jam_zestaw_padow', id); } catch { /* bez pamięci */ }
        onZestaw(id || null);
        if (!id) { silnik().ustawZestaw(null); setZ(null); setBufory([]); return; }
        most<{ zestaw: ZestawZMostu }>(`/api/jam/pady/${id}`).then((d) => wczytaj(d.zestaw)).catch((e) => toast.error(String(e instanceof Error ? e.message : e)));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const nowyZestaw = async (zKopii: boolean) => {
        const nazwa = prompt(zKopii ? 'Zapisz zestaw jako (nazwa):' : 'Nazwa nowego zestawu padów:', zKopii && z ? `${z.nazwa} (kopia)` : 'Mój zestaw');
        if (!nazwa) return;
        try { const d = await most<{ zestaw: ZestawZMostu }>('/api/jam/pady', { method: 'POST', body: JSON.stringify({ nazwa, z: zKopii ? id : null }) }); await odswiezListe(); setId(d.zestaw.id); }
        catch (e) { toast.error(String(e instanceof Error ? e.message : e)); }
    };

    const zmienPad = (i: number, zm: Partial<UstawieniaPadu>) => {
        if (!z) return;
        const n = { ...z, pady: z.pady.map((p, j) => (j === i ? { ...p, ...zm } : p)) };
        setZ(n); setZmienione(true);
        silnik().ustawUstawienia(oczyscZestaw(n));
    };
    const zapiszUstawienia = async () => {
        if (!z) return;
        try { const d = await most<{ zestaw: ZestawZMostu }>(`/api/jam/pady/${id}`, { method: 'PUT', body: JSON.stringify({ nazwa: z.nazwa, pady: z.pady }) }); setZ(d.zestaw); setZmienione(false); toast.success('Zestaw zapisany.'); }
        catch (e) { toast.error(String(e instanceof Error ? e.message : e)); }
    };
    /** Nowy dźwięk na pad przez most (ffmpeg → wav), potem przeładowanie zestawu. */
    const dzwiek = async (i: number, cialo: object, opis: string) => {
        if (zmienione) await zapiszUstawienia();
        setPraca(`pad ${i + 1}: ${opis}…`);
        try { const d = await most<{ zestaw: ZestawZMostu }>(`/api/jam/pady/${id}/pad/${i + 1}`, { method: cialo ? 'POST' : 'DELETE', body: cialo ? JSON.stringify(cialo) : undefined }); await wczytaj(d.zestaw); await odswiezListe(); toast.success(`Pad ${i + 1}: ${d.zestaw.pady[i].zrodlo}`); }
        catch (e) { toast.error(String(e instanceof Error ? e.message : e)); }
        finally { setPraca(null); }
    };
    const zPliku = async (i: number, f: File) => dzwiek(i, { rodzaj: 'dane', nazwa: f.name, dataURL: await doDataURL(f) }, `plik ${f.name}`);
    const mikrofon = async (i: number) => {
        if (nagr) { nagr.stop(); return; }
        try {
            const strumien = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(strumien); const k: Blob[] = [];
            mr.ondataavailable = (e) => { if (e.data.size) k.push(e.data); };
            mr.onstop = () => { strumien.getTracks().forEach((t) => t.stop()); setNagr(null); void doDataURL(new Blob(k, { type: mr.mimeType })).then((d) => dzwiek(i, { rodzaj: 'dane', dataURL: d }, 'nagranie z mikrofonu')); };
            mr.start(); setNagr(mr);
        } catch (e) { toast.error(`Mikrofon: ${e instanceof Error ? e.message : e}`); }
    };
    useEffect(() => {
        if (edytuj == null || stemy.length || utwory.length) return;
        most<{ stemy: { rel: string; nazwa: string; probka: boolean }[] }>('/api/glos/stemy').then((d) => setStemy(d.stemy.sort((a, b) => Number(b.probka) - Number(a.probka)))).catch(() => {});
        most<{ utwory: { plik: string; tytul: string }[] }>('/api/rytm/utwory').then((d) => setUtwory(d.utwory)).catch(() => {});
    }, [edytuj]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        setFalaUtworu(null);
        if (!utwor) return;
        fetch(urlMuzyki(utwor)).then((r) => r.arrayBuffer()).then((a) => silnik().ctx.decodeAudioData(a)).then((b) => { setFalaUtworu(b); setWycinek({ od: 0, do: Math.min(2, b.duration) }); }).catch(() => toast.error('Nie mogę wczytać utworu.'));
    }, [utwor, silnik]);

    if (mostOffline) return <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-amber-200">🥁 Pady z dźwiękiem: most (127.0.0.1:3001) nie odpowiada albo nie zna jeszcze /api/jam/pady (restart mostu). Pady grają perkusję syntezowaną.</div>;
    const p = edytuj != null && z ? z.pady[edytuj] : null;
    return (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 font-mono">
                <span className="text-[11px] text-slate-400">PADY (1–8 na klawiaturze)</span>
                <select value={id} onChange={(e) => setId(e.target.value)} className="bg-black/60 border border-white/10 rounded px-1 py-0.5">
                    <option value="">🥁 perkusja syntezowana</option>
                    {zestawy.map((x) => <option key={x.id} value={x.id}>{x.nazwa} ({x.probek})</option>)}
                </select>
                <button onClick={() => void nowyZestaw(false)} className="px-1.5 py-0.5 rounded border border-white/10" title="nowy zestaw"><Plus className="w-3 h-3" /></button>
                {z && <button onClick={() => void nowyZestaw(true)} className="px-1.5 py-0.5 rounded border border-white/10" title="zapisz jako…"><Copy className="w-3 h-3" /></button>}
                {zmienione && <button onClick={() => void zapiszUstawienia()} className="px-2 py-0.5 rounded border border-emerald-400/50 text-emerald-200 flex items-center gap-1"><Save className="w-3 h-3" /> zapisz zestaw</button>}
                <span className="ml-auto flex gap-1">
                    {[0, 1].map((b) => <button key={b} onClick={() => setBank(b as 0 | 1)} title={b && !bankB ? 'Bank B: pady 9–16 rozróżnia dopiero pomiar MPK (z Bankiem B); z klawiatury działa zawsze' : ''} className={`px-2 py-0.5 rounded border ${bank === b ? 'border-pink-400 text-pink-200' : 'border-white/10 text-slate-400'}`}>Bank {b ? 'B' : 'A'}</button>)}
                </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }, (_, k) => {
                    const i = bank * 8 + k, pp = z?.pady[i], ma = !!bufory[i];
                    const swieci = Date.now() - (uderzenia[i] ?? 0) < 150;
                    return (
                        <div key={i} className={`relative h-14 rounded-lg border font-mono text-[10px] transition-colors ${swieci ? 'bg-pink-500/40 border-pink-300' : ma ? 'bg-violet-500/10 border-violet-400/40' : 'bg-white/5 border-white/10'}`}>
                            <button onPointerDown={() => onUderz(i)} onPointerUp={() => silnik().padPuszczony(i)} className="absolute inset-0 text-left px-2 py-1">
                                <div className="font-bold">{i + 1} {ma ? '🔊' : PADY[i % 8].nazwa}</div>
                                <div className="opacity-60 truncate">{ma ? pp?.zrodlo : 'synteza'}{pp && ma && pp.tryb !== 'raz' ? ` · ${pp.tryb}` : ''}{pp?.grupa ? ` · gr.${pp.grupa}` : ''}</div>
                            </button>
                            {z && <button onClick={() => setEdytuj(edytuj === i ? null : i)} className="absolute top-1 right-1 p-0.5 rounded hover:bg-white/10" title="✎ edytuj pad"><Pencil className="w-3 h-3" /></button>}
                        </div>
                    );
                })}
            </div>
            {!z && <div className="text-slate-500">Załóż zestaw (＋), żeby przypisać padom własne dźwięki. Bez zestawu grają syntezowane.</div>}

            {p && edytuj != null && (
                <div className="border border-violet-400/30 rounded-lg p-2 space-y-2 bg-violet-500/5"
                    onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void zPliku(edytuj, f); }}>
                    <div className="flex items-center gap-2"><b>✎ Pad {edytuj + 1}</b><span className="text-slate-400 truncate">{bufory[edytuj] ? `${p.zrodlo} · ${bufory[edytuj]!.duration.toFixed(2)} s` : 'perkusja syntezowana'}</span>
                        {praca && <span className="flex items-center gap-1 text-violet-200"><Loader2 className="w-3 h-3 animate-spin" />{praca}</span>}</div>
                    <div className="flex flex-wrap gap-2">
                        <button disabled={!!praca} onClick={() => void mikrofon(edytuj)} className={`px-2 py-1 rounded border flex items-center gap-1 ${nagr ? 'border-red-400 text-red-200 animate-pulse' : 'border-white/15'}`}>{nagr ? <><Square className="w-3 h-3" /> stop i zapisz</> : <><Mic className="w-3 h-3" /> mikrofon</>}</button>
                        <label className="px-2 py-1 rounded border border-white/15 flex items-center gap-1 cursor-pointer"><Upload className="w-3 h-3" /> plik (albo upuść tu)
                            <input type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void zPliku(edytuj, f); e.target.value = ''; }} /></label>
                        <select disabled={!!praca} value="" onChange={(e) => e.target.value && void dzwiek(edytuj, { rodzaj: 'probka', stem: e.target.value }, 'próbka')} className="bg-black/60 border border-white/10 rounded px-1 max-w-[220px]">
                            <option value="">🎚️ próbka z Samplera…</option>
                            {stemy.map((s) => <option key={s.rel} value={s.rel}>{s.probka ? '🎚️ ' : ''}{s.nazwa}</option>)}
                        </select>
                        <button disabled={!!praca || !bufory[edytuj]} onClick={() => void dzwiek(edytuj, null as unknown as object, 'powrót do syntezy')} className="px-2 py-1 rounded border border-white/15 flex items-center gap-1 disabled:opacity-40"><Trash2 className="w-3 h-3" /> 🥁 synteza</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select value={utwor} onChange={(e) => setUtwor(e.target.value)} className="bg-black/60 border border-white/10 rounded px-1 max-w-[260px]">
                            <option value="">🎵 wycinek utworu z biblioteki…</option>
                            {utwory.map((u) => <option key={u.plik} value={u.plik}>{u.tytul}</option>)}
                        </select>
                        {utwor && <>
                            <span className="font-mono">{wycinek.od.toFixed(2)}–{wycinek.do.toFixed(2)} s</span>
                            <button disabled={!!praca || !falaUtworu || wycinek.do - wycinek.od > 30} onClick={() => void dzwiek(edytuj, { rodzaj: 'utwor', plik: utwor, od: wycinek.od, do: wycinek.do }, 'wycinek utworu')} className="px-2 py-1 rounded border border-violet-400/50 text-violet-200 disabled:opacity-40">→ na pad {edytuj + 1}</button>
                            {wycinek.do - wycinek.od > 30 && <span className="text-amber-300">najwyżej 30 s</span>}
                        </>}
                    </div>
                    {utwor && <Fala bufor={falaUtworu} od={wycinek.od} doS={wycinek.do} onZmiana={(a, b) => setWycinek({ od: a, do: b ?? a + 1 })} />}
                    <div className="text-[10px] text-slate-400">przycięcie próbki padu — przeciągnij po fali:</div>
                    <Fala bufor={bufory[edytuj]} od={p.od} doS={p.do} onZmiana={(a, b) => zmienPad(edytuj, { od: Math.round(a * 1000) / 1000, do: b === null ? null : Math.round(b * 1000) / 1000 })} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[10px]">
                        <label>głośność {p.glosnosc.toFixed(2)}<input type="range" min={0} max={2} step={0.05} value={p.glosnosc} onChange={(e) => zmienPad(edytuj, { glosnosc: Number(e.target.value) })} className="w-full accent-pink-400" /></label>
                        <label>strój {p.stroj > 0 ? '+' : ''}{p.stroj} półt.<input type="range" min={-24} max={24} step={1} value={p.stroj} onChange={(e) => zmienPad(edytuj, { stroj: Number(e.target.value) })} className="w-full accent-pink-400" /></label>
                        <label>czułość na siłę {Math.round(p.czulosc * 100)}%<input type="range" min={0} max={1} step={0.05} value={p.czulosc} onChange={(e) => zmienPad(edytuj, { czulosc: Number(e.target.value) })} className="w-full accent-pink-400" /></label>
                        <label className="flex items-center gap-1"><input type="checkbox" checked={p.normalizacja} onChange={(e) => zmienPad(edytuj, { normalizacja: e.target.checked })} /> normalizacja</label>
                        <label>tryb<select value={p.tryb} onChange={(e) => zmienPad(edytuj, { tryb: e.target.value as UstawieniaPadu['tryb'] })} className="w-full bg-black/60 border border-white/10 rounded">{TRYBY_PADU.map((t) => <option key={t} value={t}>{NAZWY_TRYBU[t]}</option>)}</select></label>
                        {p.tryb === 'petla' && <label>pętla<select value={p.petlaUderzen} onChange={(e) => zmienPad(edytuj, { petlaUderzen: Number(e.target.value) })} className="w-full bg-black/60 border border-white/10 rounded">{UDERZENIA_PETLI.map((u) => <option key={u} value={u}>{u} {u === 1 ? 'uderzenie' : 'uderzeń'}</option>)}</select></label>}
                        <label>grupa wyciszania<select value={p.grupa} onChange={(e) => zmienPad(edytuj, { grupa: Number(e.target.value) })} className="w-full bg-black/60 border border-white/10 rounded">{Array.from({ length: 9 }, (_, g) => <option key={g} value={g}>{g ? `grupa ${g}` : 'brak'}</option>)}</select></label>
                        <button onClick={() => onUderz(edytuj)} className="px-2 py-1 rounded border border-white/15">▶ odsłuch</button>
                    </div>
                    <div className="text-[10px] text-slate-500">Ustawienia działają od razu; „💾 zapisz zestaw” trwale zapisuje je w moście. Pętla startuje na uderzeniu metronomu (gdy jam gra), drugie uderzenie ją zatrzymuje.</div>
                </div>
            )}
        </div>
    );
};

export default PadyPanel;
