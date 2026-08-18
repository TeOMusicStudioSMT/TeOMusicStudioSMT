/**
 * ✂️ RzezbaPanel — OBRÓBKA NAGRAŃ
 *
 * Cięcie, pętle, sklejanie, normalizacja, pasma i PRAWDZIWE stemy — wszystko
 * przez most, na lokalnym ffmpeg i lokalnym Demucsie. Zero chmury.
 *
 * ⚠️ ROZRÓŻNIENIE, KTÓREGO PANEL NIE ZAMAZUJE:
 *   „Pasma"  = podział po CZĘSTOTLIWOŚCI (ffmpeg). Dół zawiera bas, stopę
 *              i dół wokalu RAZEM. Szybkie, przybliżone.
 *   „Stemy"  = separacja modelem uczonym (Demucs): wokal / perkusja / bas / reszta.
 *              Wolne (liczy na CPU), ale realne.
 * Te dwie rzeczy mają osobne przyciski i osobne opisy, bo to nie to samo.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, Repeat, Link2, Gauge, SlidersHorizontal, Layers3,
  Play, Square, Download, Loader2, RefreshCw, Music2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BRIDGE = 'http://127.0.0.1:3001';

interface Utwor { id: string; title: string; filename: string; audio_url: string }
interface Wynik { etykieta: string; plik: string; url: string; opis?: string; pusty?: boolean }

export const RzezbaPanel: React.FC = () => {
  const [utwory, setUtwory] = useState<Utwor[]>([]);
  const [wybrany, setWybrany] = useState<string>('');
  const [dlugosc, setDlugosc] = useState<number | null>(null);
  const [mostOffline, setMostOffline] = useState(false);

  const [od, setOd] = useState(0);
  const [ile, setIle] = useState(4);
  const [powtorzen, setPowtorzen] = useState(4);

  const [pracuje, setPracuje] = useState<string | null>(null);
  const [wyniki, setWyniki] = useState<Wynik[]>([]);
  const [gra, setGra] = useState<string | null>(null);
  const [stemyDostepne, setStemyDostepne] = useState<boolean | null>(null);

  const [audio] = useState(() => (typeof Audio !== 'undefined' ? new Audio() : null));

  // Biblioteka + dostępność Demucsa
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BRIDGE}/api/bridge/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'GET_LOCAL_PLAYLIST' }),
        });
        const d = await r.json();
        if (d.success && Array.isArray(d.tracks)) {
          setUtwory(d.tracks);
          if (d.tracks.length) setWybrany(d.tracks[0].filename ?? d.tracks[0].title);
        }
        setMostOffline(false);
      } catch { setMostOffline(true); }

      try {
        const r = await fetch(`${BRIDGE}/api/stemy/status`);
        const d = await r.json();
        setStemyDostepne(!!d.dostepne);
      } catch { setStemyDostepne(false); }
    })();
  }, []);

  // Długość wybranego — żeby suwaki nie wychodziły poza nagranie
  useEffect(() => {
    if (!wybrany) return;
    (async () => {
      try {
        const r = await fetch(`${BRIDGE}/api/rzezba/info?plik=${encodeURIComponent(wybrany)}`);
        const d = await r.json();
        setDlugosc(d.sekundy ?? null);
        if (d.sekundy && od + ile > d.sekundy) { setOd(0); setIle(Math.min(4, d.sekundy)); }
      } catch { setDlugosc(null); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wybrany]);

  const wolaj = useCallback(async (
    sciezka: string, ciało: Record<string, unknown>, klucz: string,
  ) => {
    setPracuje(klucz);
    try {
      const r = await fetch(`${BRIDGE}${sciezka}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ciało),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.message || 'Most odmówił.'); return null; }
      return d;
    } catch {
      toast.error('Wiesio-Bridge nie odpowiada na :3001.');
      return null;
    } finally {
      setPracuje(null);
    }
  }, []);

  const dodaj = (nowe: Wynik[]) => setWyniki((w) => [...nowe, ...w].slice(0, 24));

  const tnij = async () => {
    const d = await wolaj('/api/rzezba/tnij', { plik: wybrany, od, ile }, 'tnij');
    if (d) { dodaj([{ etykieta: `Cięcie ${od}s +${ile}s`, plik: d.plik, url: d.url }]); toast.success('✂️ Wycięte'); }
  };
  const petla = async () => {
    const d = await wolaj('/api/rzezba/petla', { plik: wybrany, od, ile, powtorzen }, 'petla');
    if (d) { dodaj([{ etykieta: `Pętla ×${powtorzen}`, plik: d.plik, url: d.url }]); toast.success('🔁 Zapętlone'); }
  };
  const normalizuj = async () => {
    const d = await wolaj('/api/rzezba/normalizuj', { plik: wybrany }, 'norm');
    if (d) { dodaj([{ etykieta: `Normalizacja ${d.lufs} LUFS`, plik: d.plik, url: d.url }]); toast.success('📏 Znormalizowane'); }
  };
  const pasma = async () => {
    const d = await wolaj('/api/rzezba/pasma', { plik: wybrany }, 'pasma');
    if (d) {
      dodaj(d.pasma.map((x: { pasmo: string; etykieta: string; plik: string; url: string }) => ({
        etykieta: `Pasmo: ${x.etykieta}`, plik: x.plik, url: x.url,
      })));
      toast('Pasma gotowe — to podział po częstotliwości, nie stemy.', { icon: '🎚️', duration: 5000 });
    }
  };
  const stemy = async () => {
    toast('Separacja liczy na CPU — przy dłuższym utworze to minuty.', { icon: '⏳', duration: 4000 });
    const d = await wolaj('/api/stemy/rozdziel', { plik: wybrany }, 'stemy');
    if (d) {
      dodaj(d.stemy.map((x: { stem: string; plik: string; url: string; rmsDb: number; pusty: boolean }) => ({
        etykieta: `Stem: ${x.stem}`, plik: x.plik, url: x.url,
        opis: `${x.rmsDb} dB`, pusty: x.pusty,
      })));
      toast.success(`🎚️ ${d.stemy.length} stemów w ${d.sekundySeparacji}s`);
    }
  };
  const sklejWyniki = async () => {
    if (wyniki.length < 2) { toast.error('Potrzeba co najmniej dwóch wyników.'); return; }
    const pliki = wyniki.slice(0, 2).map((w) => `_Rzezba/${w.plik}`);
    const d = await wolaj('/api/rzezba/sklej', { pliki }, 'sklej');
    if (d) { dodaj([{ etykieta: `Sklejka ${d.zlaczono}×`, plik: d.plik, url: d.url }]); toast.success('🔗 Sklejone'); }
  };

  const odtworz = (w: Wynik) => {
    if (!audio) return;
    if (gra === w.plik) { audio.pause(); setGra(null); return; }
    audio.src = w.url;
    audio.onended = () => setGra(null);
    void audio.play().then(() => setGra(w.plik)).catch(() => toast.error('Nie mogę odtworzyć.'));
  };

  const maxOd = Math.max(0, (dlugosc ?? 60) - 0.5);
  const maxIle = Math.max(0.5, (dlugosc ?? 60) - od);

  const PRZYCISKI = [
    { klucz: 'tnij',  etykieta: 'Wytnij',      ikona: Scissors,          akcja: tnij,       kolor: '#00f3ff' },
    { klucz: 'petla', etykieta: 'Zapętl',      ikona: Repeat,            akcja: petla,      kolor: '#00f3ff' },
    { klucz: 'norm',  etykieta: 'Normalizuj',  ikona: Gauge,             akcja: normalizuj, kolor: '#5eead4' },
    { klucz: 'sklej', etykieta: 'Sklej 2 wyniki', ikona: Link2,          akcja: sklejWyniki, kolor: '#5eead4' },
    { klucz: 'pasma', etykieta: 'Pasma (szybkie)', ikona: SlidersHorizontal, akcja: pasma,  kolor: '#fbbf24' },
  ];

  return (
    <div
      className="w-full max-w-5xl rounded-3xl border p-5 space-y-5"
      style={{ background: '#0d0e15', borderColor: '#00f3ff44', boxShadow: '0 0 40px #00f3ff1a' }}
    >
      <div>
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: '#00f3ff' }}>
          <Scissors className="w-5 h-5" />
          RZEŹBA AUDIO
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: '#00f3ff22', color: '#00f3ff' }}>
            ffmpeg + Demucs · lokalnie
          </span>
        </h2>
        <p className="text-[11px] text-slate-500 font-mono mt-1">
          Obróbka nagrań z biblioteki Katedry. Wyniki lądują w _OtakOs_Muzyka.
        </p>
      </div>

      {mostOffline && (
        <div className="text-[11px] font-mono text-amber-400 border border-amber-500/40 bg-amber-950/30 px-3 py-2 rounded-xl">
          Most nie odpowiada na :3001 — odpal Katedrę.
        </div>
      )}

      {/* WYBÓR UTWORU */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Music2 className="w-3 h-3" /> Nagranie ({utwory.length} w bibliotece)
        </span>
        <select
          value={wybrany}
          onChange={(e) => setWybrany(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
          style={{ background: '#14161f', border: '1px solid #2c3145', color: '#e2e8f0' }}
        >
          {utwory.map((u) => (
            <option key={u.id ?? u.filename} value={u.filename ?? u.title}>{u.title}</option>
          ))}
        </select>
        <p className="text-[10px] text-slate-600 font-mono">
          {dlugosc !== null ? `Długość: ${dlugosc.toFixed(2)} s` : 'Długość: —'}
        </p>
      </div>

      {/* ZAKRES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Od</span><span className="text-white font-bold">{od.toFixed(1)} s</span>
          </div>
          <input type="range" min={0} max={maxOd} step={0.1} value={od}
            onChange={(e) => setOd(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-800" style={{ accentColor: '#00f3ff' }} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Długość</span><span className="text-white font-bold">{ile.toFixed(1)} s</span>
          </div>
          <input type="range" min={0.5} max={maxIle} step={0.1} value={Math.min(ile, maxIle)}
            onChange={(e) => setIle(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-800" style={{ accentColor: '#00f3ff' }} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Powtórzeń pętli</span><span className="text-white font-bold">{powtorzen}</span>
          </div>
          <input type="range" min={2} max={16} step={1} value={powtorzen}
            onChange={(e) => setPowtorzen(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-800" style={{ accentColor: '#5eead4' }} />
        </div>
      </div>

      {/* OPERACJE */}
      <div className="flex flex-wrap gap-2">
        {PRZYCISKI.map((b) => (
          <button
            key={b.klucz}
            onClick={b.akcja}
            disabled={!!pracuje || !wybrany}
            className="px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all disabled:opacity-40"
            style={{ background: `${b.kolor}12`, borderColor: `${b.kolor}55`, color: b.kolor }}
          >
            {pracuje === b.klucz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <b.ikona className="w-3.5 h-3.5" />}
            {b.etykieta}
          </button>
        ))}

        {/* STEMY osobno — inna technologia, inny czas, inna obietnica */}
        <button
          onClick={stemy}
          disabled={!!pracuje || !wybrany || stemyDostepne === false}
          title={stemyDostepne === false
            ? 'Demucs nie jest zainstalowany — sprawdź /api/stemy/status'
            : 'Prawdziwa separacja modelem: wokal / perkusja / bas / reszta. Liczy na CPU.'}
          className="px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all disabled:opacity-40"
          style={{ background: '#bd00ff18', borderColor: '#bd00ff66', color: '#bd00ff' }}
        >
          {pracuje === 'stemy' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers3 className="w-3.5 h-3.5" />}
          Stemy (Demucs)
          {stemyDostepne === false && <AlertTriangle className="w-3 h-3 text-amber-400" />}
        </button>
      </div>

      {/* Różnica pasma/stemy powiedziana wprost, a nie ukryta w tooltipie */}
      <p className="text-[10px] text-slate-500 leading-snug">
        <span className="text-amber-400">Pasma</span> dzielą po częstotliwości — szybkie, ale w dolnym paśmie
        siedzi bas, stopa i dół wokalu razem.{' '}
        <span style={{ color: '#bd00ff' }}>Stemy</span> to separacja modelem uczonym: wokal, perkusja, bas, reszta.
        Liczy na CPU, więc dłuższy utwór to minuty.
      </p>

      {/* WYNIKI */}
      <AnimatePresence>
        {wyniki.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Wyniki</span>
              <button onClick={() => setWyniki([])} className="text-[10px] font-mono text-slate-600 hover:text-slate-300">
                <RefreshCw className="w-3 h-3 inline mr-1" />wyczyść listę
              </button>
            </div>
            {wyniki.map((w) => (
              <div
                key={w.plik}
                className="flex items-center gap-2 rounded-xl px-3 py-2 border"
                style={{ background: '#14161f', borderColor: w.pusty ? '#f59e0b44' : '#2c3145' }}
              >
                <button onClick={() => odtworz(w)} className="p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors">
                  {gra === w.plik ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono text-slate-200 truncate">{w.etykieta}</div>
                  <div className="text-[9px] font-mono text-slate-600 truncate">{w.plik}</div>
                </div>
                {w.opis && <span className="text-[9px] font-mono text-slate-500 shrink-0">{w.opis}</span>}
                {w.pusty && (
                  <span className="text-[9px] font-mono text-amber-400 shrink-0" title="Model nie znalazł tu materiału — to poprawny wynik, nie błąd">
                    praktycznie cisza
                  </span>
                )}
                <a href={w.url} download={w.plik} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RzezbaPanel;
