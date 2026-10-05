/**
 * 📦 SkladnicaPanel — Music Studio przy wspólnej Składnicy Katedry (`_OtakOs_Assety`, most: services/Skladnica.js).
 *
 * Suweren (2026-10-05): „scal i podłącz Music Studio”. Składnica trzyma postacie, sceny, rekwizyty, kreacje i bryły
 * dla Story, Gier, Fashion i Podcastu. Music Studio dokłada do nich DŹWIĘK:
 *   • 🎵 utwór z biblioteki jako motyw postaci, klimat sceny, dźwięk rekwizytu (kopia do katalogu assetu —
 *     Studio Gier zabiera go „do gry” razem z obrazami i bryłami),
 *   • ▶ odsłuch dźwięków, które asset już ma,
 *   • 🗣️ Joanna mówi głosem postaci (karta postaci ma głos → Głosy Stada).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Package, Plus, Play, Pause, Paperclip, RefreshCw, Mic2 } from 'lucide-react';

const BRIDGE = 'http://127.0.0.1:3001';

type Rodzaj = 'postacie' | 'sceny' | 'rekwizyty' | 'kreacje' | 'bryly';
interface Plik { nazwa: string; rodzaj: string; url: string }
interface Asset { id: string; rodzaj: Rodzaj; nazwa: string; opis: string; glos: { profil?: string; voicestudio?: string } | null; glowny: string | null; pliki: Plik[] }
interface Utwor { id: string; title: string; filename: string; audio_url: string }

async function most<T>(sciezka: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try { r = await fetch(`${BRIDGE}${sciezka}`, { ...init, headers: init?.body ? { 'Content-Type': 'application/json' } : undefined }); }
  catch { throw new Error('Most (127.0.0.1:3001) milczy — odpal Katedrę.'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d?.success === false) throw new Error(d?.message || `Most odpowiedział HTTP ${r.status}`);
  return d as T;
}
const blad = (e: unknown) => (e instanceof Error ? e.message : String(e));

const IKONY: Record<Rodzaj, string> = { postacie: '🎭', sceny: '🏞️', rekwizyty: '🗝️', kreacje: '👗', bryly: '🗿' };
const ETYKIETY: Record<Rodzaj, string> = { postacie: 'Postacie', sceny: 'Sceny', rekwizyty: 'Rekwizyty', kreacje: 'Kreacje', bryly: 'Bryły 3D' };
const btn = 'px-3 py-2 rounded-full text-[11px] font-mono font-bold border transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5';
const pole = 'bg-black/60 border border-amber-500/25 focus:border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none';

export const SkladnicaPanel: React.FC = () => {
  const [assety, setAssety] = useState<Asset[]>([]);
  const [utwory, setUtwory] = useState<Utwor[]>([]);
  const [filtr, setFiltr] = useState<Rodzaj | ''>('');
  const [wybrany, setWybrany] = useState<string>('');
  const [utwor, setUtwor] = useState('');
  const [nowy, setNowy] = useState({ rodzaj: 'postacie' as Rodzaj, nazwa: '' });
  const [praca, setPraca] = useState('');
  const [gra, setGra] = useState<string | null>(null);
  const [problem, setProblem] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);

  const odswiez = useCallback(async () => {
    setProblem('');
    try { setAssety((await most<{ assety: Asset[] }>('/api/skladnica')).assety); }
    catch (e) { setProblem(blad(e)); }
  }, []);
  useEffect(() => {
    void odswiez();
    most<{ tracks?: Utwor[] }>('/api/bridge/execute', { method: 'POST', body: JSON.stringify({ action: 'GET_LOCAL_PLAYLIST' }) })
      .then((d) => setUtwory(d.tracks ?? [])).catch(() => setUtwory([]));
    return () => audio.current?.pause();
  }, [odswiez]);

  const klucz = (a: Asset) => `${a.rodzaj}/${a.id}`;
  const asset = assety.find((a) => klucz(a) === wybrany) ?? null;
  const widoczne = useMemo(() => assety.filter((a) => !filtr || a.rodzaj === filtr), [assety, filtr]);

  function graj(url: string) {
    const a = audio.current ?? new Audio();
    audio.current = a;
    if (gra === url) { a.pause(); setGra(null); return; }
    a.src = url; a.onended = () => setGra(null);
    a.play().then(() => setGra(url)).catch((e) => toast.error(`Nie gra: ${blad(e)}`));
  }

  async function utworz() {
    if (!nowy.nazwa.trim()) return;
    setPraca('nowy');
    try {
      const d = await most<{ asset: Asset }>('/api/skladnica', { method: 'POST', body: JSON.stringify(nowy) });
      setNowy((n) => ({ ...n, nazwa: '' }));
      await odswiez();
      setWybrany(klucz(d.asset));
      toast.success(`${IKONY[d.asset.rodzaj]} „${d.asset.nazwa}” w Składnicy.`);
    } catch (e) { toast.error(blad(e), { duration: 8000 }); } finally { setPraca(''); }
  }

  async function dolacz() {
    if (!asset || !utwor) return;
    setPraca('dolacz');
    const t = toast.loading('Kopiuję utwór do Składnicy…');
    try {
      await most(`/api/skladnica/${asset.rodzaj}/${encodeURIComponent(asset.id)}/plik`, { method: 'POST', body: JSON.stringify({ muzyka: utwor }) });
      toast.success(`🎵 Dołączone do „${asset.nazwa}” — Story, Gry i Podcast widzą go w Składnicy.`, { id: t, duration: 6000 });
      await odswiez();
    } catch (e) { toast.error(blad(e), { id: t, duration: 10000 }); } finally { setPraca(''); }
  }

  async function glosJoanny() {
    if (!asset?.glos) return;
    setPraca('joanna');
    try {
      await most('/api/glos/stado', { method: 'PUT', body: JSON.stringify({ id: 'joanna', glos: asset.glos }) });
      toast.success(`🗣️ Joanna mówi teraz głosem postaci „${asset.nazwa}”.`);
    } catch (e) { toast.error(blad(e), { duration: 8000 }); } finally { setPraca(''); }
  }

  const dzwieki = asset?.pliki.filter((p) => p.rodzaj === 'audio') ?? [];
  const obraz = asset?.pliki.find((p) => p.nazwa === asset.glowny && p.rodzaj === 'obraz') ?? asset?.pliki.find((p) => p.rodzaj === 'obraz');

  return (
    <div className="w-full max-w-5xl rounded-3xl border p-5 space-y-4" style={{ background: '#0d0e15', borderColor: '#f4c84a44', boxShadow: '0 0 40px #f4c84a1a' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: '#f4c84a' }}><Package size={20} /> Składnica Katedry</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">Wspólne postacie i sceny dla Story, Gier, Fashion i Podcastu — tu dokładasz im dźwięk: motyw postaci, klimat sceny.</p>
        </div>
        <button onClick={() => void odswiez()} className={`${btn} border-white/15 text-slate-300`} title="Odśwież"><RefreshCw size={12} /></button>
      </div>
      {problem && <p className="text-xs font-mono text-red-300">{problem}</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFiltr('')} className={`${btn} ${!filtr ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-white/10 text-slate-400'}`}>Wszystko ({assety.length})</button>
        {(Object.keys(ETYKIETY) as Rodzaj[]).map((r) => (
          <button key={r} onClick={() => setFiltr(r)} className={`${btn} ${filtr === r ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-white/10 text-slate-400'}`}>
            {IKONY[r]} {ETYKIETY[r]} ({assety.filter((a) => a.rodzaj === r).length})
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_340px] gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
          {widoczne.map((a) => {
            const img = a.pliki.find((p) => p.nazwa === a.glowny && p.rodzaj === 'obraz') ?? a.pliki.find((p) => p.rodzaj === 'obraz');
            const ile = a.pliki.filter((p) => p.rodzaj === 'audio').length;
            return (
              <button key={klucz(a)} onClick={() => setWybrany(klucz(a))}
                className={`rounded-2xl border p-2 text-left transition ${wybrany === klucz(a) ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-black/40 hover:border-amber-400/50'}`}>
                {img ? <img src={`${BRIDGE}${img.url}`} alt={a.nazwa} className="h-24 w-full rounded-xl object-cover" loading="lazy" />
                  : <div className="h-24 w-full rounded-xl bg-slate-900 flex items-center justify-center text-3xl">{IKONY[a.rodzaj]}</div>}
                <div className="mt-1 text-xs font-bold text-slate-100 truncate">{IKONY[a.rodzaj]} {a.nazwa}</div>
                <div className="text-[10px] font-mono text-slate-500">{ile ? `🎵 ${ile}` : 'bez dźwięku'}{a.glos ? ' · 🗣️ głos' : ''}</div>
              </button>
            );
          })}
          {!widoczne.length && <p className="col-span-full py-8 text-center text-xs font-mono text-slate-500">Pusto — dodaj postać albo scenę obok (pełna Składnica: Hub → ••• → Świat → 📦 Składnica).</p>}
        </div>

        <div className="space-y-3">
          {asset ? (
            <div className="p-3 rounded-2xl border border-amber-400/30 bg-black/40 space-y-2">
              {obraz && <img src={`${BRIDGE}${obraz.url}`} alt={asset.nazwa} className="h-32 w-full rounded-xl object-cover" />}
              <div className="text-sm font-black text-amber-100">{IKONY[asset.rodzaj]} {asset.nazwa}</div>
              {asset.opis && <p className="text-[11px] text-slate-400 line-clamp-3">{asset.opis}</p>}

              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block pt-1">Dźwięki assetu</span>
              {dzwieki.map((p) => (
                <div key={p.nazwa} className="flex items-center gap-2 text-[11px] font-mono bg-black/40 rounded-lg px-2 py-1">
                  <button onClick={() => graj(`${BRIDGE}${p.url}`)} className="text-amber-300">{gra === `${BRIDGE}${p.url}` ? <Pause size={12} /> : <Play size={12} />}</button>
                  <span className="truncate text-slate-200">{p.nazwa}</span>
                </div>
              ))}
              {!dzwieki.length && <p className="text-[10px] font-mono text-slate-500">Jeszcze bez dźwięku.</p>}

              <div className="flex gap-2 pt-1">
                <select className={`${pole} flex-1 min-w-0`} value={utwor} onChange={(e) => setUtwor(e.target.value)}>
                  <option value="">🎵 utwór z biblioteki…</option>
                  {utwory.map((u) => <option key={u.id} value={u.filename}>{u.title || u.filename}</option>)}
                </select>
                {utwor && <button onClick={() => { const u = utwory.find((x) => x.filename === utwor); if (u) graj(u.audio_url); }} className={`${btn} border-white/15 text-slate-300`} title="Odsłuch utworu">
                  {gra && gra === utwory.find((x) => x.filename === utwor)?.audio_url ? <Pause size={12} /> : <Play size={12} />}
                </button>}
              </div>
              <button onClick={() => void dolacz()} disabled={!!praca || !utwor} className={`${btn} w-full border-amber-400 bg-amber-500/15 text-amber-100 hover:bg-amber-500/30`}>
                {praca === 'dolacz' ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                {asset.rodzaj === 'postacie' ? 'DOŁĄCZ JAKO MOTYW POSTACI' : asset.rodzaj === 'sceny' ? 'DOŁĄCZ JAKO KLIMAT SCENY' : 'DOŁĄCZ DO ASSETU'}
              </button>
              {asset.rodzaj === 'postacie' && (
                <button onClick={() => void glosJoanny()} disabled={!!praca || !asset.glos} title={asset.glos ? 'Głosy Stada: Joanna mówi barwą tej postaci' : 'Ta postać nie ma jeszcze głosu — nadaj go Samplerem głosu albo w Hubie'}
                  className={`${btn} w-full border-pink-400/60 text-pink-100 hover:bg-pink-500/20`}>
                  {praca === 'joanna' ? <Loader2 size={12} className="animate-spin" /> : <Mic2 size={12} />} JOANNA MÓWI TYM GŁOSEM
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs font-mono text-slate-500 p-3 rounded-2xl border border-white/10">Wybierz asset, żeby dołączyć mu utwór.</p>
          )}

          <div className="p-3 rounded-2xl border border-white/10 bg-black/30 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Nowy w Składnicy</span>
            <div className="flex gap-2">
              <select className={pole} value={nowy.rodzaj} onChange={(e) => setNowy({ ...nowy, rodzaj: e.target.value as Rodzaj })}>
                {(Object.keys(ETYKIETY) as Rodzaj[]).map((r) => <option key={r} value={r}>{IKONY[r]} {ETYKIETY[r]}</option>)}
              </select>
              <input className={`${pole} flex-1 min-w-0`} value={nowy.nazwa} onChange={(e) => setNowy({ ...nowy, nazwa: e.target.value })} placeholder="Nazwa" onKeyDown={(e) => { if (e.key === 'Enter') void utworz(); }} />
            </div>
            <button onClick={() => void utworz()} disabled={!!praca || !nowy.nazwa.trim()} className={`${btn} w-full border-white/20 text-slate-200`}>
              {praca === 'nowy' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} DODAJ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkladnicaPanel;
