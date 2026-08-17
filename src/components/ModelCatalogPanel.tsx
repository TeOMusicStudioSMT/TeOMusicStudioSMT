/**
 * 🧠 KATALOG MODELI — realny stan wag na dysku
 * TeO_Music_V2
 *
 * Pokazuje CO JEST, a nie co powinno być. Rozmiary i procenty lecą z mostu, który
 * czyta dysk. Plik o złym rozmiarze jest oznaczony jako uszkodzony, bo ładowanie
 * takiego wywala silnik — lepiej wiedzieć tutaj niż w środku generacji.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive, Download, Trash2, CheckCircle2, AlertTriangle,
  Loader2, RefreshCw, Package, XCircle, Cpu,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  MODEL_BUNDLES, MUSIC_MODELS, ROLE_LABELS,
  bundleBytes, humanBytes, family,
  type ModelRole, type MusicModelFile, type ModelFamily,
} from '../services/musicModelCatalog';

/** Nagłówki rodzin — wagi jednej rodziny nie łączą się z wagami drugiej. */
const FAMILY_LABELS: Record<ModelFamily, string> = {
  ace: 'ACE-Step 1.5 — lekki, 8 kroków',
  minimax: 'MiniMax-Music-3 — ciężki, faza autoregresywna',
};

const BRIDGE_URL = 'http://127.0.0.1:3001';

/** Stan pojedynczego pliku tak, jak go widzi most (czyli dysk). */
interface PlikStatus extends MusicModelFile {
  obecny: boolean;
  kompletny: boolean;
  uszkodzony: boolean;
  naDysku: number;
  czesciowo: number;
  procent: number;
  pobieranie: null | {
    id: string;
    label: string;
    pobrano: number;
    cel: number;
    procent: number;
    stan: 'w-kolejce' | 'pobieranie' | 'gotowe' | 'blad';
    blad: string | null;
    predkoscBps?: number;
    wznowione?: boolean;
  };
}

interface KatalogStatus {
  success: boolean;
  katalog: string;
  repo: string;
  pliki: PlikStatus[];
  pipelineGotowy: boolean;
  brakujaceRole: ModelRole[];
  bajtyNaDysku: number;
  aktywnePobierania: number;
}

interface SilnikStatus {
  success: boolean;
  gotowy: boolean;
  katalogModeli: string;
  comfy: { base: string; online: boolean; maMinimax?: boolean; nodeCount?: number; message?: string };
  workflow: { plik: string; obecny: boolean };
  braki: string[];
}

interface Props {
  /** Wywoływane gdy zmienia się gotowość pipeline'u — panel nadrzędny blokuje generację. */
  onReadyChange?: (gotowy: boolean) => void;
}

export const ModelCatalogPanel: React.FC<Props> = ({ onReadyChange }) => {
  const [katalog, setKatalog] = useState<KatalogStatus | null>(null);
  const [silnik, setSilnik] = useState<SilnikStatus | null>(null);
  const [mostOffline, setMostOffline] = useState(false);
  const [odswieza, setOdswieza] = useState(false);

  const pobierzStatus = useCallback(async () => {
    try {
      const [rk, rs] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/music/models`),
        fetch(`${BRIDGE_URL}/api/music/engine/status`),
      ]);
      if (!rk.ok) throw new Error(`HTTP ${rk.status}`);
      const dk: KatalogStatus = await rk.json();
      setKatalog(dk);
      setMostOffline(false);
      onReadyChange?.(dk.pipelineGotowy);
      if (rs.ok) setSilnik(await rs.json());
    } catch {
      // Most nie żyje — mówimy to wprost, nie udajemy pustego katalogu.
      setMostOffline(true);
      setKatalog(null);
      onReadyChange?.(false);
    }
  }, [onReadyChange]);

  useEffect(() => { void pobierzStatus(); }, [pobierzStatus]);

  // Gdy coś się ściąga — odpytujemy częściej, żeby pasek żył.
  useEffect(() => {
    const cos = (katalog?.aktywnePobierania ?? 0) > 0;
    const ms = cos ? 1000 : 8000;
    const t = setInterval(() => { void pobierzStatus(); }, ms);
    return () => clearInterval(t);
  }, [katalog?.aktywnePobierania, pobierzStatus]);

  const sciagnij = async (ids: string[], opis: string) => {
    try {
      const r = await fetch(`${BRIDGE_URL}/api/music/models/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const d = await r.json();
      if (!d.success) { toast.error(d.message || 'Most odmówił pobierania.'); return; }
      toast.success(`⬇️ ${opis}: ${d.message}`, { duration: 6000 });
      void pobierzStatus();
    } catch {
      toast.error('Most (:3001) nie odpowiada — nie mogę zacząć pobierania.');
    }
  };

  const usunPlik = async (p: PlikStatus) => {
    try {
      const r = await fetch(`${BRIDGE_URL}/api/music/models/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success(`🗑️ Usunięto ${p.label} — zwolniono ${humanBytes(d.zwolnione || 0)}`);
        void pobierzStatus();
      } else toast.error(d.message || 'Nie udało się usunąć.');
    } catch {
      toast.error('Most (:3001) nie odpowiada.');
    }
  };

  const odswiez = async () => {
    setOdswieza(true);
    await pobierzStatus();
    setTimeout(() => setOdswieza(false), 400);
  };

  // ── MOST OFFLINE ──────────────────────────────────────────────────────────
  if (mostOffline) {
    return (
      <div className="bg-black/40 border border-amber-500/30 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase">
          <AlertTriangle className="w-4 h-4" />
          <span>Wiesio-Bridge nie odpowiada</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Katalog modeli czyta dysk przez most na <span className="font-mono text-amber-300">127.0.0.1:3001</span>.
          Bez mostu nie wiem, co realnie leży na dysku — i nie będę zgadywał.
          Odpal Katedrę i kliknij odświeżenie.
        </p>
        <button
          onClick={odswiez}
          className="mt-1 px-3 py-1.5 rounded-lg text-[11px] font-mono bg-amber-950/60 border border-amber-500/40 text-amber-200 hover:border-amber-400 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${odswieza ? 'animate-spin' : ''}`} />
          Sprawdź ponownie
        </button>
      </div>
    );
  }

  if (!katalog) {
    return (
      <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-5 flex items-center gap-2 text-slate-400 text-xs font-mono">
        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
        Czytam katalog wag z dysku...
      </div>
    );
  }

  const poRodzinieIRoli = (rodzina: ModelFamily, rola: ModelRole) =>
    katalog.pliki.filter((p) => family(p) === rodzina && p.role === rola);

  /** Rodziny w kolejności: najpierw ta, która realnie chodzi na tym sprzęcie. */
  const RODZINY: ModelFamily[] = ['ace', 'minimax'];

  return (
    <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 space-y-4">

      {/* NAGŁÓWEK */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5 uppercase">
            <HardDrive className="w-4 h-4 text-pink-400" />
            <span>Katalog Modeli Muzycznych</span>
          </span>
          <p className="text-[10px] text-slate-500 font-mono mt-1 break-all">
            {katalog.katalog}
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            Na dysku: <span className="text-slate-400">{humanBytes(katalog.bajtyNaDysku)}</span>
            {' • '}rodziny: <span className="text-slate-400">ACE-Step 1.5 + MiniMax-Music-3</span>
          </p>
        </div>
        <button
          onClick={odswiez}
          className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${odswieza ? 'animate-spin' : ''}`} />
          Odśwież
        </button>
      </div>

      {/* GOTOWOŚĆ PIPELINE'U */}
      <div
        className={`rounded-xl border p-3 ${
          katalog.pipelineGotowy
            ? 'bg-emerald-950/30 border-emerald-500/30'
            : 'bg-amber-950/30 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          {katalog.pipelineGotowy ? (
            <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-emerald-300">Wagi kompletne — po jednym pliku z każdej roli</span></>
          ) : (
            <><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="text-amber-300">Brakuje wag: {katalog.brakujaceRole.map((r) => ROLE_LABELS[r]).join(', ')}</span></>
          )}
        </div>
        {!katalog.pipelineGotowy && (
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            Pipeline potrzebuje <strong>po jednym</strong> pliku z każdej z trzech rol: rdzeń DiT,
            encoder tekstu i dekoder audio. Bez dekodera nie powstanie plik dźwiękowy.
          </p>
        )}
      </div>

      {/* ZESTAWY DO KLIKNIĘCIA */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-3 h-3" /> Zestawy gotowe
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {MODEL_BUNDLES.map((b) => {
            const brakujace = b.fileIds.filter(
              (id) => !katalog.pliki.find((p) => p.id === id)?.kompletny
            );
            const komplet = brakujace.length === 0;
            const doPobrania = brakujace.reduce(
              (s, id) => s + (MUSIC_MODELS.find((m) => m.id === id)?.bytes ?? 0), 0
            );
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex flex-col gap-2 ${
                  b.recommendedFor6gb
                    ? 'bg-purple-950/30 border-purple-500/40'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white">{b.label}</span>
                  {b.recommendedFor6gb && (
                    <span className="text-[8px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded font-mono shrink-0">
                      TWÓJ SPRZĘT
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug flex-1">{b.description}</p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Razem {humanBytes(bundleBytes(b))}
                </p>
                {komplet ? (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Kompletny
                  </span>
                ) : (
                  <button
                    onClick={() => sciagnij(brakujace, b.label)}
                    className="w-full px-2 py-1.5 rounded-lg text-[10px] font-mono bg-purple-600/80 hover:bg-purple-600 text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    Dociągnij {humanBytes(doPobrania)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LISTA PLIKÓW — najpierw rodzina, w niej role */}
      <div className="space-y-5">
        {RODZINY.map((rodzina) => (
          <div key={rodzina} className="space-y-3">
            <div className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${
              rodzina === 'ace'
                ? 'text-emerald-300 bg-emerald-950/30 border-emerald-500/30'
                : 'text-amber-300/90 bg-amber-950/20 border-amber-500/25'
            }`}>
              {FAMILY_LABELS[rodzina]}
            </div>
        {(['diffusion_models', 'text_encoders', 'vae'] as ModelRole[]).map((rola) => (
          <div key={rola} className="space-y-1.5 pl-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              {ROLE_LABELS[rola]}
              {rodzina === 'ace' && rola === 'text_encoders' && (
                <span className="ml-1.5 text-[9px] text-emerald-400/80 normal-case">
                  (ACE wymaga OBU)
                </span>
              )}
            </span>
            {poRodzinieIRoli(rodzina, rola).map((p) => {
              const pob = p.pobieranie;
              const leci = pob?.stan === 'pobieranie' || pob?.stan === 'w-kolejce';
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border px-3 py-2 ${
                    p.kompletny
                      ? 'bg-emerald-950/20 border-emerald-500/25'
                      : p.uszkodzony
                        ? 'bg-red-950/20 border-red-500/30'
                        : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.kompletny ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : p.uszkodzony ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        : leci ? <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
                        : <Download className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                      <span className="text-xs text-white font-mono truncate">{p.label}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                        {humanBytes(p.bytes)}
                      </span>
                      {!p.fitsVram6gb && (
                        <span
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 shrink-0"
                          title="Nie zmieści się komfortowo w Twoich 6 GB VRAM"
                        >
                          &gt; 6GB VRAM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.kompletny && (
                        <button
                          onClick={() => usunPlik(p)}
                          title="Usuń wagę z dysku"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {!p.kompletny && !leci && (
                        <button
                          onClick={() => sciagnij([p.id], p.label)}
                          className="px-2 py-1 rounded-lg text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-purple-500/50 transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          {p.czesciowo > 0 || p.uszkodzony ? 'Wznów' : 'Pobierz'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">{p.note}</p>

                  {/* PASEK POSTĘPU — tylko gdy realnie coś leci */}
                  <AnimatePresence>
                    {leci && pob && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            animate={{ width: `${pob.procent}%` }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                          <span>
                            {pob.stan === 'w-kolejce' ? 'w kolejce...' : `${humanBytes(pob.pobrano)} / ${humanBytes(pob.cel)}`}
                            {pob.wznowione && ' • wznowione'}
                          </span>
                          <span>
                            {pob.predkoscBps ? `${(pob.predkoscBps / 1e6).toFixed(1)} MB/s • ` : ''}
                            {pob.procent}%
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {p.uszkodzony && (
                    <p className="text-[10px] text-red-300 mt-1.5 font-mono">
                      Zły rozmiar: {humanBytes(p.naDysku)} zamiast {humanBytes(p.bytes)} — pobieranie się nie dokończyło.
                    </p>
                  )}
                  {pob?.stan === 'blad' && (
                    <p className="text-[10px] text-red-300 mt-1.5 font-mono break-all">
                      Błąd pobierania: {pob.blad}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
          </div>
        ))}
      </div>

      {/* STAN SILNIKA — co jeszcze blokuje realną generację */}
      {silnik && !silnik.gotowy && silnik.braki.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 space-y-1.5">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3 h-3" /> Do realnej generacji brakuje jeszcze
          </span>
          <ul className="space-y-1">
            {silnik.braki.map((b, i) => (
              <li key={i} className="text-[10px] text-amber-200/90 font-mono flex gap-1.5 leading-snug">
                <span className="text-amber-500 shrink-0">→</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {silnik?.gotowy && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-3">
          <span className="text-[11px] text-emerald-300 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Silnik gotowy — ComfyUI zna nody MiniMax, workflow wczytany, wagi na miejscu.
          </span>
        </div>
      )}
    </div>
  );
};

export default ModelCatalogPanel;
