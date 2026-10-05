/**
 * 🎚️ SamplerGlosuPanel — fragment dowolnego nagrania staje się GŁOSEM (most: services/GlosZeStemu.js w teo-app-hub).
 *
 * Suweren (2026-10-05): „dodaj sampler też do Music Studio”. Ten sam silnik co Sampler w TeO Story Studio → Aktorzy:
 *   • ⬆ wgraj / przeciągnij plik z dźwiękiem (nagranie ekranu mp4, wideo, mp3, wav…) → WAV w `_Stemy/_Probki`,
 *   • 🎤 nagraj mikrofonem,
 *   • 🎵 wokal z utworu biblioteki — Demucs (CPU) wyjmuje sam wokal, stem trafia do `_Stemy`,
 *   • fala: przeciągnij, by zaznaczyć od–do, ▶ odsłuchaj ten fragment,
 *   • zapisz jako głos (profil klon-lokalny) — dla aktora z obsady albo jako barwa Joanny (Głosy Stada).
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Loader2, AudioLines, Upload, Mic, Square, Play, Pause, Trash2, SlidersHorizontal, RefreshCw, Music2 } from 'lucide-react';

const BRIDGE = 'http://127.0.0.1:3001';
const MIN_S = 6, MAX_S = 30;

interface Stem { sciezka: string; nazwa: string; paczka: string; rel: string; wokal: boolean; instrumental: boolean; probka?: boolean; url?: string }
interface Utwor { id: string; title: string; filename: string }
interface Aktor { id: string; imie: string }
interface Fala { szczyty: number[]; sekundy: number; url: string }

async function most<T>(sciezka: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BRIDGE}${sciezka}`, { ...init, headers: init?.body ? { 'Content-Type': 'application/json' } : undefined });
  } catch {
    throw new Error('Most (127.0.0.1:3001) milczy — odpal Katedrę.');
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d?.success === false) throw new Error(d?.message || `Most odpowiedział HTTP ${r.status}`);
  return d as T;
}
const blad = (e: unknown) => (e instanceof Error ? e.message : String(e));
const czytajDataURL = (b: Blob) => new Promise<string>((ok, zle) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => zle(r.error ?? new Error('Nie udało się odczytać pliku.'));
  r.readAsDataURL(b);
});
const czas = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

const btn = 'px-3 py-2 rounded-full text-[11px] font-mono font-bold border transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5';
const pole = 'bg-black/60 border border-cyan-500/25 focus:border-cyan-300 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none';

export const SamplerGlosuPanel: React.FC = () => {
  const [stemy, setStemy] = useState<Stem[]>([]);
  const [utwory, setUtwory] = useState<Utwor[]>([]);
  const [utwor, setUtwor] = useState('');
  const [aktorzy, setAktorzy] = useState<Aktor[]>([]);
  const [demucs, setDemucs] = useState<{ dostepne: boolean; braki: string[] } | null>(null);
  const [stem, setStem] = useState('');
  const [fala, setFala] = useState<Fala | null>(null);
  const [od, setOd] = useState(0);
  const [doS, setDoS] = useState(0);
  const [nazwa, setNazwa] = useState('');
  const [aktorId, setAktorId] = useState('');
  const [dlaJoanny, setDlaJoanny] = useState(false);
  const [praca, setPraca] = useState('');
  const [nagrywa, setNagrywa] = useState(0);
  const [gra, setGra] = useState(false);
  const [pozycja, setPozycja] = useState<number | null>(null);
  const [nadPolem, setNadPolem] = useState(false);
  const [problem, setProblem] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const rejestrator = useRef<MediaRecorder | null>(null);
  const ciagnie = useRef<number | null>(null);
  const plotno = useRef<HTMLDivElement | null>(null);
  const plik = useRef<HTMLInputElement | null>(null);

  const odswiez = useCallback(async () => {
    setProblem('');
    try { setStemy((await most<{ stemy: Stem[] }>('/api/glos/stemy')).stemy); }
    catch (e) { setProblem(blad(e)); }
  }, []);

  useEffect(() => {
    void odswiez();
    most<{ dostepne: boolean; braki: string[] }>('/api/stemy/status').then(setDemucs).catch(() => setDemucs(null));
    most<{ aktorzy: Aktor[] }>('/api/aktorzy').then((d) => setAktorzy(d.aktorzy.filter((a) => a.id !== 'kronikarz'))).catch(() => setAktorzy([]));
    most<{ tracks?: Utwor[] }>('/api/bridge/execute', { method: 'POST', body: JSON.stringify({ action: 'GET_LOCAL_PLAYLIST' }) })
      .then((d) => setUtwory(d.tracks ?? [])).catch(() => setUtwory([]));
  }, [odswiez]);

  const doWyboru = stemy.filter((s) => !s.instrumental)
    .sort((a, b) => Number(!!b.probka) - Number(!!a.probka) || Number(b.wokal) - Number(a.wokal));

  // fala wybranego pliku; domyślnie zaznaczone pierwsze 30 s
  useEffect(() => {
    audio.current?.pause(); setGra(false); setPozycja(null);
    if (!stem) { setFala(null); return; }
    let zywy = true;
    setFala(null);
    most<Fala>(`/api/glos/fala?stem=${encodeURIComponent(stem)}&n=600`)
      .then((f) => { if (!zywy) return; setFala(f); setOd(0); setDoS(Math.min(MAX_S, f.sekundy)); })
      .catch((e) => { if (zywy) toast.error(blad(e), { duration: 8000 }); });
    return () => { zywy = false; };
  }, [stem]);

  const wybierzNowy = async (rel: string) => { await odswiez(); setStem(rel); };

  async function wgraj(n: string, b: Blob) {
    setPraca('wgrywa');
    const t = toast.loading(`Wgrywam „${n}” i wyjmuję dźwięk…`);
    try {
      const w = await most<{ rel: string; nazwa: string; sekundy: number | null }>('/api/glos/probka', { method: 'POST', body: JSON.stringify({ nazwa: n, dataURL: await czytajDataURL(b) }) });
      toast.success(`Próbka „${w.nazwa}” gotowa${w.sekundy ? ` (${w.sekundy.toFixed(1)} s)` : ''} — zaznacz fragment na fali.`, { id: t, duration: 6000 });
      await wybierzNowy(w.rel);
    } catch (e) { toast.error(blad(e), { id: t, duration: 10000 }); } finally { setPraca(''); }
  }

  async function mikrofon() {
    if (rejestrator.current) { rejestrator.current.stop(); return; }
    try {
      const strumien = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const r = new MediaRecorder(strumien);
      const kawalki: Blob[] = [];
      const start = Date.now();
      const licznik = window.setInterval(() => setNagrywa(Math.max(1, Math.round((Date.now() - start) / 1000))), 500);
      r.ondataavailable = (e) => { if (e.data.size) kawalki.push(e.data); };
      r.onstop = () => {
        window.clearInterval(licznik);
        strumien.getTracks().forEach((tr) => tr.stop());
        rejestrator.current = null; setNagrywa(0);
        const typ = r.mimeType || 'audio/webm';
        const roz = /ogg/.test(typ) ? 'ogg' : /mp4|aac/.test(typ) ? 'm4a' : 'webm';
        const n = `mikrofon ${nazwa || 'glos'} ${new Date().toISOString().slice(0, 16).replace('T', ' ').replace(':', '-')}.${roz}`;
        if (kawalki.length) void wgraj(n, new Blob(kawalki, { type: typ }));
      };
      rejestrator.current = r;
      r.start(1000);
      setNagrywa(1);
    } catch (e) { toast.error(`Mikrofon niedostępny: ${blad(e)}`, { duration: 8000 }); }
  }

  async function wokalZ(plikMuzyki: string, opis: string) {
    setPraca('demucs');
    const t = toast.loading(`Demucs wyjmuje wokal z „${opis}” (CPU — ok. 0,7× długości nagrania)…`);
    try {
      const w = await most<{ stemy: { plik: string; pusty?: boolean }[] }>('/api/stemy/rozdziel', { method: 'POST', body: JSON.stringify({ plik: plikMuzyki, tylko: ['vocals'] }) });
      const v = w.stemy[0];
      if (!v) throw new Error('Demucs nie oddał stemu wokalu.');
      if (v.pusty) toast('Demucs nie znalazł tu wokalu (prawie cisza) — może to sama muzyka.', { id: t, duration: 8000 });
      else toast.success('Sam wokal gotowy — zaznacz fragment na fali.', { id: t });
      await wybierzNowy(v.plik);
    } catch (e) { toast.error(blad(e), { id: t, duration: 12000 }); } finally { setPraca(''); }
  }

  function sluchaj() {
    if (!fala) return;
    const a = audio.current ?? new Audio();
    audio.current = a;
    if (gra) { a.pause(); setGra(false); return; }
    if (a.src !== fala.url) a.src = fala.url;
    a.currentTime = od;
    a.ontimeupdate = () => { setPozycja(a.currentTime); if (a.currentTime >= doS) { a.pause(); setGra(false); } };
    a.onended = () => setGra(false);
    a.play().then(() => setGra(true)).catch((e) => toast.error(`Nie gra: ${blad(e)}`));
  }

  const sekundaZ = (clientX: number) => {
    const el = plotno.current;
    if (!el || !fala) return 0;
    const r = el.getBoundingClientRect();
    return Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * fala.sekundy * 10) / 10;
  };

  async function zapiszGlos() {
    const aktor = aktorzy.find((a) => a.id === aktorId);
    const n = nazwa.trim() || aktor?.imie || (dlaJoanny ? 'Joanna' : '');
    if (!stem || !n) { toast.error('Nazwij głos (albo wybierz aktora).'); return; }
    setPraca('glos');
    const t = toast.loading('Wycinam głos z próbki…');
    try {
      const w = await most<{ profil: { id: string; nazwa: string }; sekundy: number; aktor: Aktor | null }>('/api/glos/ze-stemu', {
        method: 'POST', body: JSON.stringify({ stem, od, do: doS > od ? doS : null, nazwa: n, aktorId: aktorId || undefined }),
      });
      if (dlaJoanny) await most('/api/glos/stado', { method: 'PUT', body: JSON.stringify({ id: 'joanna', glos: { profil: w.profil.id } }) });
      const komu = [w.aktor ? `gra nim ${w.aktor.imie}` : '', dlaJoanny ? 'mówi nim Joanna' : ''].filter(Boolean).join(', ');
      toast.success(`Głos „${w.profil.nazwa}” gotowy (${w.sekundy.toFixed(1)} s próbki)${komu ? ` — ${komu}` : ' — wybierzesz go w Głosach (Joanna, TeOgochi, aktorzy)'}.`, { id: t, duration: 9000 });
    } catch (e) { toast.error(blad(e), { id: t, duration: 10000 }); } finally { setPraca(''); }
  }

  async function usun() {
    const s = doWyboru.find((x) => x.rel === stem);
    if (!s?.probka || !confirm(`Usunąć próbkę „${s.nazwa}”? (głosy już z niej zrobione zostają)`)) return;
    try { await most(`/api/glos/probka?stem=${encodeURIComponent(stem)}`, { method: 'DELETE' }); setStem(''); await odswiez(); }
    catch (e) { toast.error(blad(e)); }
  }

  const dlugosc = Math.max(0, doS - od);
  const wybrany = doWyboru.find((x) => x.rel === stem);
  const zaj = !!praca;

  return (
    <div
      className={`w-full max-w-5xl rounded-3xl border p-5 space-y-4 transition-all ${nadPolem ? 'ring-2 ring-fuchsia-400/60' : ''}`}
      style={{ background: '#0d0e15', borderColor: '#f472b644', boxShadow: '0 0 40px #f472b61a' }}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setNadPolem(true); } }}
      onDragLeave={() => setNadPolem(false)}
      onDrop={(e) => { e.preventDefault(); setNadPolem(false); const f = e.dataTransfer.files[0]; if (f) void wgraj(f.name, f); }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: '#f472b6' }}>
            <AudioLines size={20} /> Sampler głosu
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Fragment nagrania → próbka klonu (klon-lokalny) → głos aktora, Joanny albo TeOgochi. Lokalnie: ffmpeg, Demucs, silnik klonu Katedry.
          </p>
        </div>
        <button onClick={() => void odswiez()} className={`${btn} border-white/15 text-slate-300`} title="Odśwież listę"><RefreshCw size={12} /></button>
      </div>
      {problem && <p className="text-xs font-mono text-red-300">{problem}</p>}

      {/* Źródła */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl border border-white/10 bg-black/30 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Nagranie</span>
          <div className="flex flex-wrap gap-2">
            <button disabled={zaj || !!nagrywa} onClick={() => plik.current?.click()} className={`${btn} border-cyan-400/60 text-cyan-100 hover:bg-cyan-500/20`}
              title="Nagranie ekranu, wideo, mp3, wav… — dźwięk zostanie wyjęty do WAV">
              {praca === 'wgrywa' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} WGRAJ PLIK
            </button>
            <button disabled={zaj && !nagrywa} onClick={() => void mikrofon()}
              className={`${btn} ${nagrywa ? 'border-red-400 bg-red-500/25 text-red-100 animate-pulse' : 'border-rose-400/60 text-rose-100 hover:bg-rose-500/20'}`}>
              {nagrywa ? <><Square size={12} /> STOP {nagrywa}s</> : <><Mic size={12} /> NAGRAJ MIKROFONEM</>}
            </button>
            <input ref={plik} type="file" accept="audio/*,video/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void wgraj(f.name, f); }} />
          </div>
          <p className="text-[10px] font-mono text-slate-500">…albo przeciągnij plik na panel. Trafia do _OtakOs_Muzyka/_Stemy/_Probki jako WAV.</p>
        </div>
        <div className="p-3 rounded-2xl border border-white/10 bg-black/30 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Wokal z utworu biblioteki</span>
          <div className="flex gap-2">
            <select className={`${pole} flex-1 min-w-0`} value={utwor} onChange={(e) => setUtwor(e.target.value)}>
              <option value="">— utwór —</option>
              {utwory.map((u) => <option key={u.id ?? u.filename} value={u.filename}>{u.title || u.filename}</option>)}
            </select>
            <button disabled={zaj || !utwor || !demucs?.dostepne} onClick={() => void wokalZ(utwor, utwory.find((u) => u.filename === utwor)?.title || utwor)}
              title={demucs?.dostepne ? 'Demucs wyjmie sam wokal z utworu' : (demucs?.braki?.[0] ?? 'Demucs niedostępny')}
              className={`${btn} border-violet-400/60 text-violet-100 hover:bg-violet-500/20`}>
              {praca === 'demucs' ? <Loader2 size={12} className="animate-spin" /> : <Music2 size={12} />} WYJMIJ WOKAL
            </button>
          </div>
          {demucs && !demucs.dostepne && <p className="text-[10px] font-mono text-amber-300">{demucs.braki[0]}</p>}
        </div>
      </div>

      <select className={`${pole} w-full`} value={stem} onChange={(e) => setStem(e.target.value)}>
        <option value="">— próbka / stem z głosem ({doWyboru.length}) —</option>
        {doWyboru.map((s) => <option key={s.sciezka} value={s.rel}>{s.probka ? '🎚️ ' : s.wokal ? '🎤 ' : ''}{s.paczka && !s.probka ? `${s.paczka} / ` : ''}{s.nazwa}</option>)}
      </select>

      {stem && !fala && <p className="text-xs font-mono text-slate-500 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> rysuję falę…</p>}
      {fala && (
        <>
          <div ref={plotno} className="relative h-24 rounded-xl bg-black/50 border border-white/10 cursor-crosshair select-none overflow-hidden"
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); const s = sekundaZ(e.clientX); ciagnie.current = s; setOd(s); setDoS(s); }}
            onPointerMove={(e) => {
              if (ciagnie.current === null) return;
              const s = sekundaZ(e.clientX), a = ciagnie.current;
              setOd(Math.min(a, s)); setDoS(Math.max(a, s));
            }}
            onPointerUp={() => { ciagnie.current = null; }}>
            <div className="absolute inset-y-0 bg-fuchsia-500/20 border-x border-fuchsia-400"
              style={{ left: `${(od / (fala.sekundy || 1)) * 100}%`, width: `${(dlugosc / (fala.sekundy || 1)) * 100}%` }} />
            <div className="absolute inset-0 flex items-center gap-px px-px pointer-events-none">
              {(() => { const m = Math.max(0.05, ...fala.szczyty); return fala.szczyty.map((v, i) => (
                <div key={i} className="flex-1 bg-cyan-300/70 rounded-sm" style={{ height: `${Math.max(2, (v / m) * 100)}%` }} />
              )); })()}
            </div>
            {pozycja !== null && <div className="absolute inset-y-0 w-px bg-amber-300 pointer-events-none" style={{ left: `${(pozycja / (fala.sekundy || 1)) * 100}%` }} />}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={sluchaj} disabled={dlugosc <= 0} className={`${btn} border-amber-400/60 text-amber-100 hover:bg-amber-500/20`}>
              {gra ? <Pause size={12} /> : <Play size={12} />} {gra ? 'STOP' : 'ODSŁUCHAJ'}
            </button>
            <label className="text-[10px] font-mono text-slate-500">od</label>
            <input type="number" min={0} step={0.1} className={`${pole} w-20`} value={od} onChange={(e) => setOd(Math.max(0, Number(e.target.value)))} />
            <label className="text-[10px] font-mono text-slate-500">do</label>
            <input type="number" min={0} step={0.1} className={`${pole} w-20`} value={doS} onChange={(e) => setDoS(Number(e.target.value))} />
            <span className={`text-[10px] font-mono ${dlugosc < MIN_S ? 'text-red-300' : 'text-slate-500'}`}>{dlugosc.toFixed(1)} s z {czas(fala.sekundy)}</span>
            {!wybrany?.wokal && (
              <button onClick={() => void wokalZ(`_Stemy/${stem}`, wybrany?.nazwa ?? stem)} disabled={zaj || !demucs?.dostepne}
                title={demucs?.dostepne ? 'Gdy pod głosem gra muzyka — Demucs zostawi sam wokal' : (demucs?.braki?.[0] ?? 'Demucs niedostępny')}
                className={`${btn} border-violet-400/60 text-violet-100 hover:bg-violet-500/20`}>
                {praca === 'demucs' ? <Loader2 size={12} className="animate-spin" /> : <SlidersHorizontal size={12} />} WYJMIJ SAM WOKAL
              </button>
            )}
            {wybrany?.probka && <button onClick={() => void usun()} disabled={zaj} className={`${btn} border-white/15 text-slate-400 hover:text-red-300`} title="Usuń tę próbkę"><Trash2 size={12} /></button>}
          </div>

          <div className="p-3 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/5 flex flex-wrap gap-2 items-center">
            <input className={`${pole} flex-1 min-w-[140px]`} placeholder="Nazwa głosu (np. Aria)" value={nazwa} onChange={(e) => setNazwa(e.target.value)} />
            <select className={pole} value={aktorId} onChange={(e) => setAktorId(e.target.value)} title="Od razu głos tego aktora (TeO Story Studio, Studio Podcastu)">
              <option value="">— bez aktora —</option>
              {aktorzy.map((a) => <option key={a.id} value={a.id}>🎭 {a.imie}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer">
              <input type="checkbox" checked={dlaJoanny} onChange={(e) => setDlaJoanny(e.target.checked)} /> Joanna mówi tym głosem
            </label>
            <button disabled={zaj || dlugosc <= 0} onClick={() => void zapiszGlos()}
              className={`${btn} border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/30`}>
              {praca === 'glos' ? <Loader2 size={12} className="animate-spin" /> : <AudioLines size={12} />} ZAPISZ GŁOS
            </button>
          </div>
        </>
      )}
      <p className="text-[10px] font-mono text-slate-600">
        Cisza między frazami wypada sama; zostaje najwyżej {MAX_S} s głosu (min. {MIN_S} s). Najlepiej sama mowa bez muzyki — śpiew daje barwę wokalisty, a muzyka pod głosem psuje klon (wtedy „Wyjmij sam wokal”).
      </p>
    </div>
  );
};

export default SamplerGlosuPanel;
