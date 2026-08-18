/**
 * 🥁 BitGridPanel — SEKWENCER KROKOWY KATEDRY
 *
 * Matryca rytmiczna → realny WAV przez most (/api/bit/render). Perkusja jest
 * syntezowana proceduralnie po stronie mostu — bez sampli, bez zewnętrznego DAW-a.
 *
 * Kolorystyka wg specyfikacji Jasona (Prof Sound Stayl): obsydian #0d0e15,
 * neon cyan #00f3ff, fiolet #bd00ff.
 *
 * Panel jest DWUKIERUNKOWY względem czatu: wzór da się wkleić z rozmowy
 * (Joanna albo dowolny czat pisze `kick: x---x---x---x---`) i skopiować z
 * powrotem, żeby wysłać komuś gotowy bit tekstem.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Square, Download, Trash2, Sparkles, Loader2, Grid3x3,
  ClipboardPaste, ClipboardCopy, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BRIDGE_URL = 'http://127.0.0.1:3001';

const SCIEZKI = ['kick', 'snare', 'hihat', 'synth'] as const;
type Sciezka = (typeof SCIEZKI)[number];

/** Kolor i etykieta ścieżki. Kick fioletem, reszta w cyjanie — wg spec Jasona. */
const OPIS_SCIEZKI: Record<Sciezka, { etykieta: string; kolor: string }> = {
  kick:  { etykieta: 'KICK',  kolor: '#bd00ff' },
  snare: { etykieta: 'SNARE', kolor: '#00f3ff' },
  hihat: { etykieta: 'HIHAT', kolor: '#5eead4' },
  synth: { etykieta: 'SYNTH', kolor: '#fbbf24' },
};

type Matryca = Record<Sciezka, number[]>;

interface Wzorzec { id: string; nazwa: string; opis: string; bpm: number }

function pustaMatryca(kroki: number): Matryca {
  return {
    kick: new Array(kroki).fill(0),
    snare: new Array(kroki).fill(0),
    hihat: new Array(kroki).fill(0),
    synth: new Array(kroki).fill(0),
  };
}

/** Matryca → zapis tekstowy, który można wkleić czatowi. */
function doTekstu(m: Matryca): string {
  return SCIEZKI
    .map((s) => `${s}: ${m[s].map((v) => (v ? 'x' : '-')).join('')}`)
    .join('\n');
}

/**
 * Tekst z czatu → matryca. Przyjmuje linie `kick: x---x---`, ze znakami
 * x/1/#/* jako uderzeniem. Nieznane nazwy ścieżek są zwracane, żeby panel
 * mógł o nich powiedzieć zamiast po cichu zignorować.
 */
function zTekstu(tekst: string, kroki: number): { matryca: Matryca; nieznane: string[] } {
  const matryca = pustaMatryca(kroki);
  const nieznane: string[] = [];
  const synonim: Record<string, Sciezka> = {
    kick: 'kick', stopa: 'kick', bd: 'kick', bass: 'kick',
    snare: 'snare', werbel: 'snare', sd: 'snare', clap: 'snare',
    hihat: 'hihat', hh: 'hihat', hat: 'hihat', talerz: 'hihat',
    synth: 'synth', perc: 'synth', lead: 'synth', bell: 'synth',
  };
  for (const linia of tekst.split(/\r?\n/)) {
    const m = linia.match(/^\s*([\p{L}]+)\s*[:=]\s*(.+)$/u);
    if (!m) continue;
    const cel = synonim[m[1].toLowerCase()];
    if (!cel) { nieznane.push(m[1]); continue; }
    const znaki = [...m[2].replace(/[,\s]/g, '')];
    if (!znaki.length) continue;
    for (let i = 0; i < kroki; i++) {
      matryca[cel][i] = /[xX1#*]/.test(znaki[i % znaki.length]) ? 1 : 0;
    }
  }
  return { matryca, nieznane };
}

export const BitGridPanel: React.FC<{ onClose?: () => void }> = () => {
  const [kroki, setKroki] = useState<number>(16);
  const [matryca, setMatryca] = useState<Matryca>(() => pustaMatryca(16));
  const [bpm, setBpm] = useState<number>(120);
  const [dspFreq, setDspFreq] = useState<number>(432);
  const [powtorzen, setPowtorzen] = useState<number>(2);

  const [wzorce, setWzorce] = useState<Wzorzec[]>([]);
  const [renderuje, setRenderuje] = useState(false);
  const [wynik, setWynik] = useState<{ url: string; plik: string; sekundy: number; uderzen: number } | null>(null);
  const [gra, setGra] = useState(false);
  const [pokazTekst, setPokazTekst] = useState(false);
  const [tekstWzoru, setTekstWzoru] = useState('');
  const [mostOffline, setMostOffline] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Biblioteka wzorców z mostu — to samo źródło, z którego korzysta Joanna.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BRIDGE_URL}/api/bit/wzorce`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        setWzorce(d.wzorce ?? []);
        setMostOffline(false);
      } catch {
        setMostOffline(true);
      }
    })();
  }, []);

  // Zmiana liczby kroków zachowuje to, co już ułożone (zapętla krótsze).
  const zmienKroki = (nowe: number) => {
    setMatryca((stara) => {
      const nowa = pustaMatryca(nowe);
      for (const s of SCIEZKI) {
        for (let i = 0; i < nowe; i++) nowa[s][i] = stara[s][i % stara[s].length] ?? 0;
      }
      return nowa;
    });
    setKroki(nowe);
  };

  const przelacz = (s: Sciezka, i: number) => {
    setMatryca((m) => {
      const nowa = { ...m, [s]: [...m[s]] };
      nowa[s][i] = nowa[s][i] ? 0 : 1;
      return nowa;
    });
  };

  const wyczysc = () => setMatryca(pustaMatryca(kroki));

  const wczytajWzorzec = async (id: string) => {
    if (!id) return;
    try {
      // Most zna matryce wzorców — bierzemy je stamtąd, żeby panel i Joanna
      // nie rozjechały się z definicjami.
      const r = await fetch(`${BRIDGE_URL}/api/bit/parsuj`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: kroki, wzor: id }),
      });
      const d = await r.json();
      if (d.matryca) {
        setMatryca(d.matryca);
        const w = wzorce.find((x) => x.id === id);
        if (w) setBpm(w.bpm);
        toast.success(`Wczytano: ${w?.nazwa ?? id}`);
      }
    } catch {
      toast.error('Most nie odpowiada — nie mogę wczytać wzorca.');
    }
  };

  const zloz = useCallback(async () => {
    const pusty = SCIEZKI.every((s) => matryca[s].every((v) => !v));
    if (pusty) {
      toast.error('Matryca jest pusta — kliknij choć jedno pole.');
      return;
    }
    setRenderuje(true);
    setWynik(null);
    try {
      const grid: Record<string, number[]> = {};
      for (const s of SCIEZKI) grid[s] = matryca[s];
      const r = await fetch(`${BRIDGE_URL}/api/bit/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bpm, steps: kroki, dsp_freq: dspFreq, powtorzen, grid }),
      });
      const d = await r.json();
      if (!d.success) {
        toast.error(d.message || 'Most odmówił złożenia bitu.');
        return;
      }
      setWynik({ url: d.url, plik: d.plik, sekundy: d.sekundy, uderzen: d.uderzen });
      toast.success(`🥁 Bit gotowy — ${d.uderzen} uderzeń, ${d.sekundy}s`);
    } catch {
      toast.error('Wiesio-Bridge nie odpowiada na :3001 — odpal Katedrę.');
    } finally {
      setRenderuje(false);
    }
  }, [matryca, bpm, kroki, dspFreq, powtorzen]);

  const odtworz = () => {
    if (!wynik) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    if (gra) { a.pause(); setGra(false); return; }
    a.src = wynik.url;
    a.loop = true;
    a.onended = () => setGra(false);
    void a.play().then(() => setGra(true)).catch(() => toast.error('Nie mogę odtworzyć pliku.'));
  };

  const wklejTekst = () => {
    const { matryca: m, nieznane } = zTekstu(tekstWzoru, kroki);
    const pusty = SCIEZKI.every((s) => m[s].every((v) => !v));
    if (pusty) {
      toast.error('Nie znalazłem żadnego wzoru. Format: kick: x---x---x---x---');
      return;
    }
    setMatryca(m);
    setPokazTekst(false);
    if (nieznane.length) toast(`Pominąłem nieznane ścieżki: ${nieznane.join(', ')}`, { icon: '⚠️' });
    else toast.success('Wzór wczytany z tekstu.');
  };

  const kopiujTekst = async () => {
    try {
      await navigator.clipboard.writeText(doTekstu(matryca));
      toast.success('Wzór skopiowany — możesz wkleić czatowi.');
    } catch {
      toast.error('Przeglądarka nie dała dostępu do schowka.');
    }
  };

  return (
    <div
      className="w-full max-w-5xl rounded-3xl border p-5 space-y-5"
      style={{ background: '#0d0e15', borderColor: '#bd00ff44', boxShadow: '0 0 40px #bd00ff22' }}
    >
      {/* NAGŁÓWEK */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: '#00f3ff' }}>
            <Grid3x3 className="w-5 h-5" />
            PANEL BITÓW
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: '#bd00ff33', color: '#bd00ff' }}>
              STEP-GRID 0.00G
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 font-mono mt-1">
            Perkusja syntezowana proceduralnie na moście — bez sampli, bez DAW-a.
          </p>
        </div>
        {mostOffline && (
          <span className="text-[10px] font-mono text-amber-400 border border-amber-500/40 bg-amber-950/30 px-2 py-1 rounded-lg">
            Most offline — wzorce i składanie niedostępne
          </span>
        )}
      </div>

      {/* WZORCE */}
      {wzorce.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Gotowe rytmy:</span>
          {wzorce.map((w) => (
            <button
              key={w.id}
              onClick={() => wczytajWzorzec(w.id)}
              title={`${w.opis} (${w.bpm} BPM)`}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all hover:scale-105"
              style={{ background: '#00f3ff12', borderColor: '#00f3ff44', color: '#00f3ff' }}
            >
              {w.nazwa}
            </button>
          ))}
        </div>
      )}

      {/* SIATKA */}
      <div className="space-y-1.5 overflow-x-auto pb-1">
        {SCIEZKI.map((s) => (
          <div key={s} className="flex items-center gap-2 min-w-max">
            <span
              className="w-14 shrink-0 text-[10px] font-mono font-bold tracking-wider"
              style={{ color: OPIS_SCIEZKI[s].kolor }}
            >
              {OPIS_SCIEZKI[s].etykieta}
            </span>
            <div className="flex gap-1">
              {matryca[s].map((v, i) => {
                // Co czwarty krok = mocna część taktu, dlatego jaśniejsze tło.
                const mocny = i % 4 === 0;
                return (
                  <button
                    key={i}
                    onClick={() => przelacz(s, i)}
                    aria-label={`${s} krok ${i + 1}`}
                    className="w-7 h-7 rounded-md border transition-all hover:scale-110"
                    style={{
                      background: v ? OPIS_SCIEZKI[s].kolor : mocny ? '#1c1f2e' : '#14161f',
                      borderColor: v ? OPIS_SCIEZKI[s].kolor : mocny ? '#2c3145' : '#1f2333',
                      boxShadow: v ? `0 0 10px ${OPIS_SCIEZKI[s].kolor}88` : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {/* Numeracja kroków — bez niej trudno trafić w „raz i trzy". */}
        <div className="flex items-center gap-2 min-w-max pt-0.5">
          <span className="w-14 shrink-0" />
          <div className="flex gap-1">
            {Array.from({ length: kroki }).map((_, i) => (
              <span
                key={i}
                className="w-7 text-center text-[9px] font-mono"
                style={{ color: i % 4 === 0 ? '#00f3ff99' : '#334155' }}
              >
                {i % 4 === 0 ? i / 4 + 1 : '·'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PARAMETRY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 border-t" style={{ borderColor: '#bd00ff22' }}>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Tempo</span><span className="text-white font-bold">{bpm} BPM</span>
          </div>
          <input
            type="range" min={40} max={220} step={1} value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-800"
            style={{ accentColor: '#00f3ff' }}
          />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Kroki</span>
          <div className="flex gap-1.5">
            {[8, 16, 32].map((k) => (
              <button
                key={k}
                onClick={() => zmienKroki(k)}
                className="flex-1 text-[11px] font-mono py-1 rounded-lg border transition-all"
                style={kroki === k
                  ? { background: '#00f3ff', borderColor: '#00f3ff', color: '#0d0e15', fontWeight: 700 }
                  : { background: '#14161f', borderColor: '#2c3145', color: '#94a3b8' }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Strojenie</span>
          <div className="flex gap-1.5">
            {[432, 440].map((f) => (
              <button
                key={f}
                onClick={() => setDspFreq(f)}
                title={f === 432
                  ? 'Stroi stopę (54 Hz), korpus werbla (216 Hz) i synth (432 Hz)'
                  : 'Strój klasyczny — stopa 55 Hz, werbel 220 Hz, synth 440 Hz'}
                className="flex-1 text-[11px] font-mono py-1 rounded-lg border transition-all"
                style={dspFreq === f
                  ? { background: '#bd00ff', borderColor: '#bd00ff', color: '#fff', fontWeight: 700 }
                  : { background: '#14161f', borderColor: '#2c3145', color: '#94a3b8' }}
              >
                {f} Hz
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Powtórzeń</span><span className="text-white font-bold">{powtorzen}</span>
          </div>
          <input
            type="range" min={1} max={8} step={1} value={powtorzen}
            onChange={(e) => setPowtorzen(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-800"
            style={{ accentColor: '#bd00ff' }}
          />
        </div>
      </div>

      {/* Hi-hat nie jest strojony — mówimy to, zamiast pozwolić się domyślać. */}
      <p className="text-[10px] text-slate-600 leading-snug">
        Strojenie działa na stopę, korpus werbla i synth. Hi-hat to szum nieharmoniczny —
        nie jest strojony i panel tego nie udaje.
      </p>

      {/* AKCJE */}
      <div className="flex items-center gap-2 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={zloz}
          disabled={renderuje}
          className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg,#bd00ff,#00f3ff)', color: '#0d0e15' }}
        >
          {renderuje ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {renderuje ? 'Składam...' : 'Złóż bit'}
        </motion.button>

        {wynik && (
          <>
            <button
              onClick={odtworz}
              className="px-4 py-2.5 rounded-xl text-sm font-mono flex items-center gap-2 border transition-all"
              style={{ background: '#00f3ff12', borderColor: '#00f3ff55', color: '#00f3ff' }}
            >
              {gra ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {gra ? 'Stop' : 'Odtwórz'}
            </button>
            <a
              href={wynik.url}
              download={wynik.plik}
              className="px-4 py-2.5 rounded-xl text-sm font-mono flex items-center gap-2 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" /> Pobierz
            </a>
            <span className="text-[11px] font-mono text-slate-500">
              {wynik.uderzen} uderzeń · {wynik.sekundy}s
            </span>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={() => { setTekstWzoru(doTekstu(matryca)); setPokazTekst((v) => !v); }}
          title="Wklej wzór z czatu albo skopiuj do wysłania"
          className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>
        <button
          onClick={kopiujTekst}
          title="Skopiuj wzór jako tekst"
          className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <ClipboardCopy className="w-4 h-4" />
        </button>
        <button
          onClick={wyczysc}
          title="Wyczyść siatkę"
          className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* WYMIANA TEKSTOWA Z CZATEM */}
      {pokazTekst && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 overflow-hidden"
        >
          <p className="text-[10px] text-slate-500 font-mono">
            Format: <span className="text-cyan-400">kick: x---x---x---x---</span> — x to uderzenie, myślnik cisza.
            Krótszy wzór zapętla się.
          </p>
          <textarea
            value={tekstWzoru}
            onChange={(e) => setTekstWzoru(e.target.value)}
            spellCheck={false}
            className="w-full h-28 rounded-xl p-3 text-xs font-mono resize-none focus:outline-none"
            style={{ background: '#14161f', border: '1px solid #2c3145', color: '#e2e8f0' }}
          />
          <button
            onClick={wklejTekst}
            className="px-4 py-1.5 rounded-lg text-[11px] font-mono border transition-all"
            style={{ background: '#bd00ff22', borderColor: '#bd00ff66', color: '#bd00ff' }}
          >
            <RefreshCw className="w-3 h-3 inline mr-1.5" />
            Wczytaj wzór do siatki
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default BitGridPanel;
