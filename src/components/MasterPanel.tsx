/**
 * 🎛️ MasterPanel — mastering DOWOLNEGO utworu biblioteki w SoundCraft (most: /api/master, services/MasterSoundcraft.js).
 *
 * Łańcuch z zamkniętej listy mostu (przejrzysty / ciepły / głośny klubowy / delikatny) — EQ 7-band, kompresor,
 * nasycenie, gain, maximizer z sufitem −1,5 dB; most liczy wzmocnienie z pomiaru LUFS (dwa przebiegi, czasem
 * poprawka). Wynik: `<tytuł> (master).mp3` obok oryginału — oryginał nietknięty. Lokalnie, bez karty graficznej.
 */

import React, { useEffect, useState } from 'react';
import { Gauge, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const MOST = 'http://127.0.0.1:3001';

interface Utwor { nazwa: string; sciezka: string; bajtow: number; kiedy: number }
interface Karta {
    zrodlo: string; plik: string; tytul: string; lancuch: string; nazwaLancucha: string; cel: number;
    lufsPrzed: number; truePeakPrzed: number; lufs: number; truePeak: number; lufsMp3: number | null; truePeakMp3: number | null;
    uwaga: string | null; wzmocnienie: number; przebiegi: { wzmocnienie: number; lufs: number }[]; sekundy: number; sekundyLiczenia: number; kiedy: string;
}
interface Stan { dostepny: boolean; powod?: string; wersja?: string; lancuchy: Record<string, { nazwa: string; opis: string; cel: number }>; trwa: string | null; mastery: Karta[] }

const url = (rel: string) => `${MOST}/music/${rel.split('/').map(encodeURIComponent).join('/')}`;
const czyMaster = (n: string) => /\(master\)\.[^.]+$/i.test(n);

export const MasterPanel: React.FC<{ utwory: Utwor[]; startPlik?: string }> = ({ utwory, startPlik = '' }) => {
    const [stan, setStan] = useState<Stan | null>(null);
    const [offline, setOffline] = useState(false);
    const [plik, setPlik] = useState('');
    const [lancuch, setLancuch] = useState('przejrzysty');
    const [liczy, setLiczy] = useState(false);
    const [wynik, setWynik] = useState<Karta | null>(null);

    const lista = utwory.filter((u) => !czyMaster(u.nazwa));
    const odswiez = () => fetch(`${MOST}/api/master/stan`).then((r) => r.json()).then((d) => {
        if (!d.success) throw new Error(d.message);
        setStan(d.master); setOffline(false);
    }).catch(() => { setStan(null); setOffline(true); });
    useEffect(() => { void odswiez(); }, []);
    useEffect(() => { setPlik((p) => p || (startPlik && !czyMaster(startPlik) ? startPlik : lista[0]?.sciezka) || ''); }, [utwory, startPlik]);

    const masteruj = async () => {
        if (!plik) return toast.error('Wybierz utwór.');
        setLiczy(true);
        try {
            const r = await fetch(`${MOST}/api/master`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plik, lancuch }) });
            const d = await r.json();
            if (!d.success) throw new Error(d.message || 'most odmówił');
            setWynik(d.master);
            toast.success(`🎛️ Master: ${d.master.lufsPrzed} → ${d.master.lufs} LUFS · true peak ${d.master.truePeak} dBTP`);
            await odswiez();
        } catch (e) { toast.error(e instanceof Error ? e.message : String(e), { duration: 9000 }); }
        finally { setLiczy(false); }
    };

    const pokaz = wynik ?? stan?.mastery?.[0] ?? null;

    return (
        <div className="mt-6 rounded-2xl border border-violet-500/20 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/10"><Gauge size={18} className="text-violet-300" /></div>
                <div>
                    <h3 className="text-base font-bold text-white">🎛️ Mastering (SoundCraft)</h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">dowolny utwór biblioteki · EQ · kompresor · maximizer · cel LUFS · lokalnie</p>
                </div>
                <button onClick={() => void odswiez()} className="ml-auto text-slate-500 hover:text-white"><RefreshCw size={14} /></button>
            </div>

            {offline && <div className="text-xs text-amber-300">Most (:3001) nie zna /api/master — uruchom ponownie most Katedry.</div>}
            {stan && !stan.dostepny && <div className="text-xs text-amber-300">{stan.powod}</div>}

            {stan?.dostepny && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                        <label className="block text-[10px] uppercase tracking-widest text-slate-400">Utwór ({lista.length})
                            <select value={plik} onChange={(e) => setPlik(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 p-2 text-xs text-slate-200">
                                {lista.map((u) => <option key={u.sciezka} value={u.sciezka}>{u.nazwa} · {(u.bajtow / 1e6).toFixed(1)} MB</option>)}
                            </select>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(stan.lancuchy).map(([id, l]) => (
                                <button key={id} onClick={() => setLancuch(id)} className={`rounded-xl border p-2 text-left ${lancuch === id ? 'border-violet-400/60 bg-violet-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                                    <div className="text-sm font-bold text-white">{l.nazwa} <span className="font-mono text-[10px] text-violet-300">{l.cel} LUFS</span></div>
                                    <div className="text-[10px] leading-snug text-slate-500">{l.opis}</div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => void masteruj()} disabled={liczy || !plik || !!stan.trwa} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-700 py-3 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-40">
                            {liczy ? <Loader2 size={16} className="animate-spin" /> : <Gauge size={16} />} {stan.trwa ? `trwa: ${stan.trwa}` : 'Masteruj'}
                        </button>
                        <div className="font-mono text-[10px] text-slate-600">{stan.wersja} · wynik: „&lt;tytuł&gt; (master).mp3” obok oryginału, oryginał zostaje · ~10 s na utwór</div>
                    </div>

                    <div className="space-y-2 text-xs">
                        {!pokaz && <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-slate-500">Pierwszy master pojawi się tutaj — z odsłuchem przed i po.</div>}
                        {pokaz && (
                            <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                                <div className="text-slate-200">{pokaz.tytul} · <span className="text-violet-300">{pokaz.nazwaLancucha}</span></div>
                                <div className="font-mono text-[10px] text-slate-400">
                                    {pokaz.lufsPrzed} → {pokaz.lufs} LUFS (cel {pokaz.cel}) · true peak {pokaz.truePeakPrzed} → {pokaz.truePeak} dBTP
                                    {pokaz.lufsMp3 != null ? ` · mp3: ${pokaz.lufsMp3} LUFS / ${pokaz.truePeakMp3} dBTP` : ''}
                                    {` · wzmocnienie ${pokaz.wzmocnienie} dB w ${pokaz.przebiegi.length} przebiegach · ${pokaz.sekundy} s · liczone ${pokaz.sekundyLiczenia} s`}
                                </div>
                                {pokaz.uwaga && <div className="text-[10px] text-amber-300">{pokaz.uwaga}</div>}
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">przed</div>
                                <audio controls className="h-8 w-full" src={url(pokaz.zrodlo)} />
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">po (master)</div>
                                <audio controls className="h-8 w-full" src={url(pokaz.plik)} />
                            </div>
                        )}
                        {(stan.mastery?.length ?? 0) > 1 && (
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Ostatnie mastery</div>
                                {stan.mastery.slice(0, 8).map((m) => (
                                    <button key={m.plik} onClick={() => setWynik(m)} className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1 text-left hover:border-violet-400/40">
                                        <span className="truncate text-slate-300">{m.tytul}</span>
                                        <span className="ml-auto font-mono text-[10px] text-slate-500">{m.nazwaLancucha} · {m.lufs} LUFS</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterPanel;
