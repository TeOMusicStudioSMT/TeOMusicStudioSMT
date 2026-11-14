/**
 * 🎼 Wizualizer 0.00G (Gradient Score) — świetlista partytura grającego utworu (Suweren 2026-11-14).
 *
 * Źródła: stacje Jasona (`/api/jason/opodyski`: utwór z paczki wydawniczej + akty storyboardu z wersami i kadrami)
 * albo dowolny utwór biblioteki Katedry (`/api/rytm/utwory`, tempo z `/api/rytm`). Rysuje wspólny silnik
 * `src/lib/partytura000g.ts` — nuty, GRAVITY i wskaźniki są liczone z dźwięku utworu, nie z zegara.
 * Utwór biblioteki nie ma storyboardu: epoki to bloki po 8 taktów, bez wersów.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { NAGLOWEK_PARTYTURY, analizujAudio, utworzPartyture, type AktPartytury, type DanePartytury, type Partytura } from '../lib/partytura000g';

const MOST = 'http://127.0.0.1:3001';
type Zrodlo = { klucz: string; etykieta: string; audio: string; bpm: number | null; sekundy: number | null; naglowek: string; storyboard?: string | null; kampania?: string; plik?: string };
type Scena = { nr: number; sekcja: string; od: number; do: number; wersy: string[]; kadry?: Record<string, { plik?: string; wersja?: number }> };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function WizualizerPanel() {
  const [zrodla, setZrodla] = useState<Zrodlo[]>([]);
  const [klucz, setKlucz] = useState('');
  const [dane, setDane] = useState<DanePartytury | null>(null);
  const [fuzja, setFuzja] = useState(true);
  const [info, setInfo] = useState('Pytam Katedrę o utwory…');
  const [gra, setGra] = useState(false);
  const [czas, setCzas] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const plotno = useRef<HTMLCanvasElement | null>(null);
  const scena = useRef<HTMLDivElement | null>(null);
  const silnik = useRef<Partytura | null>(null);
  const z = useMemo(() => zrodla.find((x) => x.klucz === klucz) ?? null, [zrodla, klucz]);

  useEffect(() => {
    Promise.all([
      fetch(`${MOST}/api/jason/opodyski`).then((r) => r.json()).catch(() => null),
      fetch(`${MOST}/api/rytm/utwory`).then((r) => r.json()).catch(() => null),
    ]).then(([j, b]) => {
      const stacje: Zrodlo[] = (j?.utwory ?? []).map((u: { id: string; nr: number; tytul: string; artysci: string[]; bpm: number | null; sekundy: number | null; audio: string; storyboard?: { url: string } | null }) => ({
        klucz: `j:${u.id}`, etykieta: `🎛️ Stacja ${u.nr} · ${u.tytul}${u.storyboard ? ' · 🎭' : ''}`, audio: `${MOST}${u.audio}`, bpm: u.bpm, sekundy: u.sekundy,
        naglowek: NAGLOWEK_PARTYTURY, storyboard: u.storyboard ? `${MOST}${u.storyboard.url}` : null, kampania: u.id }));
      const bib: Zrodlo[] = (b?.utwory ?? []).map((u: { plik: string; tytul: string; url: string }) => ({ klucz: `b:${u.plik}`, etykieta: `🎵 ${u.tytul}`, audio: `${MOST}${u.url}`, bpm: null, sekundy: null, naglowek: NAGLOWEK_PARTYTURY, plik: u.plik }));
      setZrodla([...stacje, ...bib]);
      setInfo(stacje.length + bib.length ? '' : 'Most Katedry nie oddał utworów — uruchom Katedrę.');
      if (stacje[0] ?? bib[0]) setKlucz((stacje[0] ?? bib[0]).klucz);
    });
  }, []);

  // wybrany utwór → akty (storyboard albo bloki taktów) → analiza dźwięku
  useEffect(() => {
    if (!z) return;
    let zywy = true;
    (async () => {
      let bpm = z.bpm ?? 0, sekundy = z.sekundy ?? 0, akty: AktPartytury[] = [];
      if (z.storyboard) {
        const s = await fetch(z.storyboard).then((r) => r.json()).catch(() => null);
        if (s?.success) {
          bpm = bpm || s.storyboard.bpm; sekundy = sekundy || s.storyboard.sekundy;
          akty = (s.storyboard.sceny as Scena[]).map((a) => { const k = a.kadry?.['16:9']; return { nr: a.nr, nazwa: a.sekcja, od: a.od, do: a.do, wersy: a.wersy ?? [], obraz: k?.plik ? `${MOST}/api/jason/kampanie/${z.kampania}/storyboard/kadr/${k.plik.split('/').pop()}?v=${k.wersja ?? 1}` : null }; });
        }
      }
      if (z.plik) {
        const r = await fetch(`${MOST}/api/rytm?plik=${encodeURIComponent(z.plik)}`).then((x) => x.json()).catch(() => null);
        if (r?.success) { bpm = r.rytm.bpm; sekundy = r.rytm.sekundy; }
      }
      if (!zywy) return;
      if (!bpm) { setInfo('Nie znam tempa tego utworu (most nie policzył rytmu) — partytura potrzebuje BPM.'); return; }
      if (!akty.length && sekundy) { const blok = (8 * 4 * 60) / bpm; for (let i = 0; i * blok < sekundy; i++) akty.push({ nr: i + 1, nazwa: `takty ${i * 8 + 1}–${i * 8 + 8}`, od: i * blok, do: Math.min(sekundy, (i + 1) * blok), wersy: [] }); }
      const d: DanePartytury = { naglowek: z.naglowek, bpm, sekundy, akty };
      setDane(d); setInfo('Analizuję dźwięk utworu…');
      try { const a = await analizujAudio(z.audio, bpm); if (zywy) { silnik.current?.ustawAnalize(a); setInfo(''); } }
      catch (e) { if (zywy) { silnik.current?.ustawAnalize(null, `Nie przeanalizowałem dźwięku: ${(e as Error).message}`); setInfo(`⚠ ${(e as Error).message}`); } }
    })();
    return () => { zywy = false; };
  }, [z]);

  useEffect(() => {
    if (!dane || !plotno.current) return;
    const p = utworzPartyture(plotno.current, { dane, czas: () => audio.current?.currentTime ?? 0, fuzja, dopasuj: true });
    silnik.current = p;
    if (z) analizujAudio(z.audio, dane.bpm).then((a) => p.ustawAnalize(a)).catch(() => {});
    return () => { p.stop(); silnik.current = null; };
  }, [dane]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { silnik.current?.ustawFuzje(fuzja); }, [fuzja]);
  useEffect(() => { if (!gra) return; const t = setInterval(() => setCzas(audio.current?.currentTime ?? 0), 250); return () => clearInterval(t); }, [gra]);

  const wybierz = (k: string) => { setKlucz(k); setDane(null); setGra(false); setCzas(0); setInfo('Wczytuję utwór…'); };
  const grajPauza = () => { const a = audio.current; if (!a) return; if (a.paused) void a.play(); else a.pause(); };
  const dlugosc = dane?.sekundy ?? 0, maKadry = !!dane?.akty.some((a) => a.obraz);
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 p-4 text-slate-100">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold tracking-wide text-amber-200">🎼 Wizualizer 0.00G <span className="text-sm font-normal text-slate-400">Gradient Score</span></h2>
        <select value={klucz} onChange={(e) => wybierz(e.target.value)} className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm">
          {zrodla.map((x) => <option key={x.klucz} value={x.klucz}>{x.etykieta}</option>)}
        </select>
        {maKadry && <label className="flex items-center gap-1.5 text-sm text-slate-300"><input type="checkbox" checked={fuzja} onChange={(e) => setFuzja(e.target.checked)} /> Fuzja z kadrami opowieści</label>}
      </div>
      <div ref={scena} className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-black">
        <canvas ref={plotno} className="h-full w-full" />
        {!dane && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-amber-200">{info}</div>}
      </div>
      {z && <audio ref={audio} key={z.klucz} src={z.audio} preload="auto" onPlay={() => setGra(true)} onPause={() => setGra(false)} onEnded={() => setGra(false)} />}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button onClick={grajPauza} disabled={!dane} className="rounded bg-amber-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40">{gra ? '⏸ pauza' : '▶ graj'}</button>
        <input type="range" min={0} max={dlugosc || 1} step={0.1} value={Math.min(czas, dlugosc || 1)} onChange={(e) => { const s = Number(e.target.value); if (audio.current) audio.current.currentTime = s; setCzas(s); }} className="min-w-0 flex-1 accent-amber-400" />
        <span className="font-mono text-slate-300">{mmss(czas)} / {mmss(dlugosc)}</span>
        <button onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void scena.current?.requestFullscreen?.())} className="rounded border border-slate-700 px-2.5 py-1 hover:bg-slate-800">⛶ pełny ekran</button>
        {z?.kampania && <a href={`${MOST}/apps/story/?teatr=${z.kampania}`} target="_blank" rel="noopener" className="rounded border border-fuchsia-500/60 px-2.5 py-1 hover:bg-fuchsia-900/40">🎭 Teatr Opodysku</a>}
      </div>
      {info && dane && <div className="text-xs text-amber-200">{info}</div>}
      <p className="text-xs text-slate-500">Nuty to cztery pasma częstotliwości miksu (bas · harmonia · rejestr Kaela · rejestr Elary), liczone z dźwięku co szesnastkę — nie rozdzielone ścieżki. GRAVITY spada tak, jak wybrzmiewa energia utworu.</p>
    </div>
  );
}
