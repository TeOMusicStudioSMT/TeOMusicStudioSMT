/**
 * 🎹 JamZJoannaPanel — Suweren gra na AKAI MPK mini (Web MIDI), Joanna odpowiada na żywo.
 *
 * Suweren (2026-10-20): „grać na żywo razem z Joanną”. Pętla PYTANIE–ODPOWIEDŹ: takt
 * odliczania, potem na zmianę N taktów Suwerena i N taktów Joanny. Fraza Suwerena →
 * kwantyzacja → tonacja → odpowiedź liczona przez KOD (`src/jam/fraza.ts`, testy
 * `testy/jam.test.ts`). Model Joanny (most: `/api/jam/strategia`, przydział TeOgochi
 * `joanna`) wybiera tylko STRATEGIĘ następnej odpowiedzi z listy i mówi jedno zdanie —
 * model myśli kilka sekund, więc jego wybór gra przy KOLEJNEJ frazie (uczciwie pokazane).
 *
 * Mapa kontrolera z POMIARU (`src/jam/mpk.ts`): pady, gałki (z trybem enkodera), joystick —
 * zapis w localStorage per urządzenie. Bez urządzenia: klawiatura komputera (A W S E D F T G Y H U J K,
 * Z/X oktawa, 1–8 pady). Nagranie: .mid + dźwięk (MediaRecorder) → most → `_OtakOs_Muzyka/Jam z Joanną/`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Piano, Square, CircleDot, Download, Wrench, Brain, Volume2, GraduationCap, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { SilnikJamu, NUTY_GM_PADOW } from '../jam/silnik';
import { NUTY_GM_BANKU_B } from '../jam/pady';
import PadyPanel from './PadyPanel';
import AranzJoannyPanel from './AranzJoannyPanel';
import { kwantyzuj, odpowiedz, opisFrazy, wybierzStrategie, STRATEGIE, czyStrategia, type Nuta, type ZdarzenieNuty, type Strategia } from '../jam/fraza';
import { wykryjTonacje, nazwaNuty, type Tonacja } from '../jam/teoria';
import { zapiszMid } from '../jam/midiPlik';
import { odczytaj, rozpoznaj, oczyscMape, pustaMapa, startPomiaru, krokPomiaru, nastepnyEtap, type MapaKontrolera, type StanPomiaru, type Wiadomosc } from '../jam/mpk';

const MOST = 'http://127.0.0.1:3001';
const FUNKCJE = [
    { id: 'energia', nazwa: 'Energia', start: 0.5 },
    { id: 'gestosc', nazwa: 'Gęstość', start: 0.5 },
    { id: 'jasnosc', nazwa: 'Jasność', start: 0.7 },
    { id: 'poglos', nazwa: 'Pogłos', start: 0.25 },
    { id: 'glosnosc', nazwa: 'Głośność', start: 0.8 },
    { id: 'joanna', nazwa: 'Joanna', start: 0.8 },
    { id: 'perkusja', nazwa: 'Perkusja', start: 0.9 },
    { id: 'metronom', nazwa: 'Metronom', start: 0.35 },
] as const;
const KLAWISZE_PC = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k'];
const kluczMapy = (n: string) => `jam_mapa_v1:${n}`;
const nazwaStrategii = (s: string) => STRATEGIE.find((x) => x.id === s)?.nazwa ?? s;

interface ZapisNuty { kanal: 'suweren' | 'joanna' | 'pady'; wys: number; sila: number; od: number; do: number }
interface WpisLogu { hex: string; opis: string }
interface Wymiana { nr: number; fraza: Nuta[]; odp: Nuta[]; tonacja: Tonacja; strategia: Strategia; zrodlo: 'kod' | 'model'; czeka?: boolean }
interface Nagrany { audio: string; midi: string; url?: string; bpm: number; tonacja: string | null }

function opisRoli(w: Wiadomosc, m: MapaKontrolera) {
    const r = rozpoznaj(w, m);
    switch (r.rola) {
        case 'klawisz': return `klawisz ${nazwaNuty(r.wys)} (${r.wys})${r.puszczona ? ' puszczony' : ` siła ${r.sila}`}`;
        case 'pad': return `pad ${r.indeks + 1}${r.zmierzony ? '' : ' (niezmierzony)'}${r.puszczona ? ' puszczony' : ` siła ${r.sila}`}`;
        case 'galka': return `K${r.indeks + 1} = ${r.wartosc}${r.tryb === 'abs' ? '' : ` (${r.tryb}, ${r.zmiana > 0 ? '+' : ''}${r.zmiana})`}`;
        case 'joystick': return `joystick ${r.os} ${r.wartosc.toFixed(2)}`;
        case 'cc': return `CC${r.cc} = ${r.wartosc} (kanał ${r.kanal + 1}, niezmierzone)`;
        default: return 'inne';
    }
}

/** Wiadomość, która gra dźwięk (klawisz / pad) — dla niej budzimy silnik przed liczeniem czasu. */
const r0 = (w: Wiadomosc) => w.typ === 'nuta' || w.typ === 'puszczona';

const doBase64 = (b: Blob) => new Promise<string>((ok, zle) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] ?? ''); r.onerror = () => zle(r.error); r.readAsDataURL(b); });

/** Mały piano-roll frazy i odpowiedzi. */
const Rolka: React.FC<{ fraza: Nuta[]; odp: Nuta[]; beatow: number }> = ({ fraza, odp, beatow }) => {
    const wszystkie = [...fraza, ...odp];
    if (!wszystkie.length) return <div className="h-28 flex items-center justify-center text-xs text-slate-500 font-mono">zagraj frazę — tu zobaczysz ją i odpowiedź Joanny</div>;
    const min = Math.min(...wszystkie.map((n) => n.wys)) - 2, max = Math.max(...wszystkie.map((n) => n.wys)) + 2;
    const W = 600, H = 112, sz = W / (beatow * 2), wy = H / Math.max(1, max - min);
    const prost = (n: Nuta, x0: number, kolor: string, k: number) => <rect key={k} x={x0 + n.start * sz} y={H - (n.wys - min) * wy} width={Math.max(2, n.dl * sz - 1)} height={Math.max(2, wy - 1)} rx={1.5} fill={kolor} opacity={0.35 + (n.sila / 127) * 0.65} />;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 bg-black/40 rounded-lg border border-white/5">
            <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5} />
            {fraza.map((n, i) => prost(n, 0, '#22d3ee', i))}
            {odp.map((n, i) => prost(n, W / 2, '#f472b6', 1000 + i))}
            <text x={6} y={12} fontSize={10} fill="#67e8f9" fontFamily="monospace">TY</text>
            <text x={W / 2 + 6} y={12} fontSize={10} fill="#f9a8d4" fontFamily="monospace">JOANNA</text>
        </svg>
    );
};

export const JamZJoannaPanel: React.FC<{ onDoWarsztatu?: (w: { plik: string; tags: string; lyrics: string }) => void }> = ({ onDoWarsztatu }) => {
    // ── stan widoczny ──
    const [midiStan, setMidiStan] = useState<'brak-api' | 'czeka' | 'odmowa' | 'brak-urzadzen' | 'ok'>('czeka');
    const [wejscia, setWejscia] = useState<{ id: string; nazwa: string }[]>([]);
    const [wejscieId, setWejscieId] = useState('');
    const [log, setLog] = useState<WpisLogu[]>([]);
    const [mapa, setMapa] = useState<MapaKontrolera>(pustaMapa());
    const [pomiar, setPomiar] = useState<StanPomiaru | null>(null);
    const [galki, setGalki] = useState<number[]>(FUNKCJE.map((f) => f.start));
    const [bpm, setBpm] = useState(120);
    const [taktow, setTaktow] = useState(2);
    const [gra, setGra] = useState(false);
    const [faza, setFaza] = useState<{ kto: 'liczenie' | 'ty' | 'joanna'; takt: number; z: number }>({ kto: 'liczenie', takt: 0, z: 0 });
    const [wymiana, setWymiana] = useState<Wymiana | null>(null);
    const [komentarz, setKomentarz] = useState<{ tekst: string; strategia: string; ms: number; model: string | null } | null>(null);
    const [modelBlad, setModelBlad] = useState('');
    const [zModelem, setZModelem] = useState(true);
    const [mowNaGlos, setMowNaGlos] = useState(false);
    const [nagrywa, setNagrywa] = useState(false);
    const [nagrany, setNagrany] = useState<Nagrany | null>(null);
    const [zapisuje, setZapisuje] = useState(false);
    const [lokalnie, setLokalnie] = useState<{ audio: string; midi: string; typ: string } | null>(null);
    const [pady, setPady] = useState<number[]>(new Array(16).fill(0));
    const [bank, setBank] = useState<0 | 1>(0);
    const bankR = useRef(bank); bankR.current = bank;
    const zestawPadowR = useRef<string | null>(null);
    const [oktawaPc, setOktawaPc] = useState(4);
    const [dzwiek, setDzwiek] = useState(false);

    // ── refy pętli (bez renderów) ──
    const silnik = useRef<SilnikJamu | null>(null);
    const mapaR = useRef(mapa); mapaR.current = mapa;
    const pomiarR = useRef(pomiar); pomiarR.current = pomiar;
    const galkiR = useRef(galki); galkiR.current = galki;
    const zModelemR = useRef(zModelem); zModelemR.current = zModelem;
    const mowR = useRef(mowNaGlos); mowR.current = mowNaGlos;
    const urzadzenieR = useRef('');
    const oktawaPcR = useRef(oktawaPc); oktawaPcR.current = oktawaPc;
    const otwarte = useRef(new Map<number, { od: number; sila: number }>());
    const zdarzenia = useRef<{ wys: number; sila: number; od: number; do: number }[]>([]);
    const historia = useRef<Nuta[]>([]);
    const nastepna = useRef<{ strategia: Strategia; komentarz: string } | null>(null);
    const uzyte = useRef<Strategia[]>([]);
    const petla = useRef<{ t0: number; beatSek: number; taktow: number; zaplanowany: number; obsluzonyCykl: number; timer: number } | null>(null);
    const rec = useRef<{ start: number; mr: MediaRecorder; kawalki: Blob[]; nuty: ZapisNuty[] } | null>(null);
    const tapy = useRef<number[]>([]);

    const daj = useCallback(() => {
        if (!silnik.current) {
            silnik.current = new SilnikJamu();
            const s = silnik.current, g = galkiR.current;
            s.ustawJasnosc(g[2]); s.ustawPoglos(g[3]); s.ustawGlosnosc(g[4]); s.ustawSzyne('joanna', g[5]); s.ustawSzyne('perkusja', g[6]); s.ustawMetronom(g[7]);
        }
        void silnik.current.wznow().then(() => setDzwiek(silnik.current?.ctx.state === 'running'));
        return silnik.current;
    }, []);
    // pomiar dla testów (jak window.__gra w grach): stan padów silnika
    useEffect(() => { (window as unknown as { __jam?: object }).__jam = { pady: () => silnik.current?.stanPadow() ?? null, czas: () => silnik.current?.ctx.currentTime ?? 0 }; }, []);
    useEffect(() => () => {
        if (petla.current) clearInterval(petla.current.timer);
        if (rec.current?.mr.state === 'recording') rec.current.mr.stop();
        silnik.current?.zamknij();
    }, []);

    const ustawGalke = useCallback((i: number, v: number) => {
        const x = Math.max(0, Math.min(1, v));
        // ref od razu: enkoder względny przysyła serię zmian szybciej niż React renderuje
        const n = [...galkiR.current]; n[i] = x; galkiR.current = n;
        setGalki(n);
        const s = silnik.current;
        if (!s) return;
        if (i === 2) s.ustawJasnosc(x); else if (i === 3) s.ustawPoglos(x); else if (i === 4) s.ustawGlosnosc(x);
        else if (i === 5) s.ustawSzyne('joanna', x); else if (i === 6) s.ustawSzyne('perkusja', x); else if (i === 7) s.ustawMetronom(x);
    }, []);

    // ── zdarzenia gry (z MIDI i z klawiatury komputera) ──
    const klawisz = useCallback((wys: number, sila: number, puszczona: boolean, t: number) => {
        const s = daj();
        if (!puszczona) {
            s.nutaWl(wys, sila, 'suweren');
            otwarte.current.set(wys, { od: t, sila });
        } else {
            s.nutaWyl(`suweren:${wys}`);
            const o = otwarte.current.get(wys);
            if (!o) return;
            otwarte.current.delete(wys);
            zdarzenia.current.push({ wys, sila: o.sila, od: o.od, do: Math.max(t, o.od + 0.02) });
            if (zdarzenia.current.length > 2000) zdarzenia.current.splice(0, 1000);
            if (rec.current) rec.current.nuty.push({ kanal: 'suweren', wys, sila: o.sila, od: o.od, do: Math.max(t, o.od + 0.02) });
        }
    }, [daj]);
    const pad = useCallback((i: number, sila: number, t: number) => {
        daj().pad(i, sila);
        setPady((p) => { const n = [...p]; n[i] = Date.now(); return n; });
        window.setTimeout(() => setPady((p) => [...p]), 160);
        if (rec.current) rec.current.nuty.push({ kanal: 'pady', wys: i < 8 ? NUTY_GM_PADOW[i] : NUTY_GM_BANKU_B[i - 8], sila, od: t, do: t + 0.1 });
    }, [daj]);

    const naWiadomosc = useCallback((dane: Uint8Array, znacznik: number) => {
        const w = odczytaj(dane);
        if (w.typ === 'inne' && (dane[0] === 0xf8 || dane[0] === 0xfe)) return; // zegar i „aktywne wyczuwanie” — szum
        const m = mapaR.current;
        setLog((l) => [{ hex: Array.from(dane).map((b) => b.toString(16).padStart(2, '0')).join(' '), opis: opisRoli(w, m) }, ...l].slice(0, 14));
        if (pomiarR.current && pomiarR.current.etap !== 'gotowe') { const n = krokPomiaru(pomiarR.current, w); pomiarR.current = n; setPomiar(n); return; }
        const s = r0(w) ? daj() : silnik.current;
        const t = s ? Math.min(s.ctx.currentTime, s.ctx.currentTime - (performance.now() - znacznik) / 1000) : 0;
        const r = rozpoznaj(w, m);
        if (r.rola === 'klawisz') klawisz(r.wys, r.sila, r.puszczona, t);
        else if (r.rola === 'pad' && !r.puszczona) pad(r.indeks, r.sila, t);
        else if (r.rola === 'pad' && r.puszczona) silnik.current?.padPuszczony(r.indeks);
        else if (r.rola === 'galka') ustawGalke(r.indeks, r.tryb === 'abs' ? r.wartosc / 127 : galkiR.current[r.indeks] + r.zmiana / 100);
        else if (r.rola === 'joystick') { if (r.os === 'x') daj().ustawOdstrojenie(r.wartosc); else daj().ustawVibrato(r.wartosc); }
    }, [klawisz, pad, ustawGalke, daj]);

    // ── Web MIDI ──
    const dostep = useRef<MIDIAccess | null>(null);
    const odswiezWejscia = useCallback(() => {
        const a = dostep.current;
        if (!a) return;
        const lista = [...a.inputs.values()].map((i) => ({ id: i.id, nazwa: i.name || i.id }));
        setWejscia(lista);
        setMidiStan(lista.length ? 'ok' : 'brak-urzadzen');
        setWejscieId((obecne) => (lista.some((l) => l.id === obecne) ? obecne : (lista.find((l) => /mpk/i.test(l.nazwa)) ?? lista[0])?.id ?? ''));
    }, []);
    useEffect(() => {
        if (!navigator.requestMIDIAccess) { setMidiStan('brak-api'); return; }
        navigator.requestMIDIAccess({ sysex: false }).then((a) => { dostep.current = a; a.onstatechange = odswiezWejscia; odswiezWejscia(); }).catch(() => setMidiStan('odmowa'));
    }, [odswiezWejscia]);
    useEffect(() => {
        const we = dostep.current ? [...dostep.current.inputs.values()].find((i) => i.id === wejscieId) : undefined;
        if (!we) return;
        urzadzenieR.current = we.name || we.id;
        try { setMapa(oczyscMape(JSON.parse(localStorage.getItem(kluczMapy(urzadzenieR.current)) || 'null'))); } catch { setMapa(pustaMapa(urzadzenieR.current)); }
        const h = (e: MIDIMessageEvent) => { if (e.data) naWiadomosc(e.data, e.timeStamp); };
        we.addEventListener('midimessage', h as EventListener);
        return () => we.removeEventListener('midimessage', h as EventListener);
    }, [wejscieId, naWiadomosc]);

    // ── klawiatura komputera (bez urządzenia) ──
    useEffect(() => {
        const wcisniete = new Set<string>();
        const wPolu = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
        const dol = (e: KeyboardEvent) => {
            if (wPolu(e) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase();
            const t = silnik.current?.ctx.currentTime ?? 0;
            if (k === 'z') { setOktawaPc((o) => Math.max(1, o - 1)); return; }
            if (k === 'x') { setOktawaPc((o) => Math.min(7, o + 1)); return; }
            if (/^[1-8]$/.test(k)) { if (!wcisniete.has(k)) { wcisniete.add(k); pad(bankR.current * 8 + Number(k) - 1, 100, t); } return; }
            const i = KLAWISZE_PC.indexOf(k);
            if (i < 0 || wcisniete.has(k)) return;
            wcisniete.add(k);
            klawisz((oktawaPcR.current + 1) * 12 + i, 96, false, silnik.current?.ctx.currentTime ?? t);
        };
        const gora = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (/^[1-8]$/.test(k)) { wcisniete.delete(k); silnik.current?.padPuszczony(bankR.current * 8 + Number(k) - 1); return; }
            const i = KLAWISZE_PC.indexOf(k);
            if (i < 0 || !wcisniete.has(k)) return;
            wcisniete.delete(k);
            klawisz((oktawaPcR.current + 1) * 12 + i, 0, true, silnik.current?.ctx.currentTime ?? 0);
        };
        window.addEventListener('keydown', dol); window.addEventListener('keyup', gora);
        return () => { window.removeEventListener('keydown', dol); window.removeEventListener('keyup', gora); };
    }, [klawisz, pad]);

    // ── Joanna: model wybiera strategię NASTĘPNEJ odpowiedzi ──
    const zapytajJoanne = useCallback(async (f: Nuta[], t: Tonacja, bpmTeraz: number) => {
        try {
            const r = await fetch(`${MOST}/api/jam/strategia`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fraza: opisFrazy(f, t, bpmTeraz), energia: galkiR.current[0], gestosc: galkiR.current[1], poprzednie: uzyte.current.slice(-4) }) });
            const d = await r.json().catch(() => ({}));
            if (!r.ok || !d.success || !czyStrategia(d.strategia)) throw new Error(d.message || `HTTP ${r.status}`);
            nastepna.current = { strategia: d.strategia, komentarz: d.komentarz };
            setKomentarz({ tekst: d.komentarz, strategia: d.strategia, ms: d.ms, model: d.model });
            setModelBlad('');
            if (mowR.current && d.komentarz) {
                const g = await fetch(`${MOST}/api/voice/speak`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: d.komentarz, teogochi: 'joanna', voiceId: 'joanna', przewod: 'piper-pl' }) });
                if (g.ok) void new Audio(URL.createObjectURL(await g.blob())).play();
            }
        } catch (e) { setModelBlad(e instanceof Error ? e.message : String(e)); }
    }, []);

    const odpowiedzNaFraze = useCallback((nr: number, tStart: number, tKon: number) => {
        const p = petla.current, s = silnik.current;
        if (!p || !s) return;
        const beatow = p.taktow * 4;
        const zebrane: ZdarzenieNuty[] = zdarzenia.current.filter((z) => z.od >= tStart - p.beatSek * 0.125 && z.od < tKon).map((z) => ({ wys: z.wys, sila: z.sila, odMs: z.od * 1000, doMs: Math.min(z.do, tKon) * 1000 }));
        for (const [wys, o] of otwarte.current) if (o.od >= tStart - p.beatSek * 0.125 && o.od < tKon) zebrane.push({ wys, sila: o.sila, odMs: o.od * 1000, doMs: tKon * 1000 });
        const f = kwantyzuj(zebrane, { bpm: 60 / p.beatSek, poczatekMs: tStart * 1000, beatow });
        if (!f.length) { setWymiana((w) => (w ? { ...w, czeka: true } : null)); return; }
        historia.current = [...historia.current, ...f].slice(-48);
        const tonacja = wykryjTonacje(historia.current);
        const zModelu = zModelemR.current && nastepna.current ? nastepna.current.strategia : null;
        const strategia = zModelu ?? wybierzStrategie(f, galkiR.current[0], nr);
        nastepna.current = null;
        uzyte.current = [...uzyte.current, strategia].slice(-200);
        const odp = odpowiedz(f, { tonacja, strategia, beatow, energia: galkiR.current[0], gestosc: galkiR.current[1], ziarno: nr + 1 });
        for (const n of odp) {
            const od = tKon + n.start * p.beatSek, doT = tKon + (n.start + n.dl) * p.beatSek;
            s.zagraj(n.wys, n.sila, od, doT, 'joanna');
            if (rec.current) rec.current.nuty.push({ kanal: 'joanna', wys: n.wys, sila: n.sila, od, do: doT });
        }
        setWymiana({ nr, fraza: f, odp, tonacja, strategia, zrodlo: zModelu ? 'model' : 'kod' });
        if (zModelemR.current) void zapytajJoanne(f, tonacja, 60 / p.beatSek);
    }, [zapytajJoanne]);

    // ── transport: odliczanie 1 takt, potem cykl TY (N taktów) → JOANNA (N taktów) ──
    const start = useCallback(() => {
        const s = daj();
        const beatSek = 60 / bpm;
        const t0 = s.ctx.currentTime + 0.15;
        const p = { t0, beatSek, taktow, zaplanowany: 0, obsluzonyCykl: -1, timer: 0 };
        const cykl = taktow * 8;
        p.timer = window.setInterval(() => {
            const teraz = s.ctx.currentTime;
            while (t0 + p.zaplanowany * beatSek < teraz + 0.12) {
                const b = p.zaplanowany;
                const wCyklu = b < 4 ? -1 : (b - 4) % cykl;
                s.klik(t0 + b * beatSek, b % 4 === 0 && (b < 4 || wCyklu === 0 || wCyklu === taktow * 4));
                p.zaplanowany++;
            }
            const b = (teraz - t0) / beatSek;
            if (b < 4) { setFaza((f) => (f.kto === 'liczenie' && f.takt === Math.floor(b) ? f : { kto: 'liczenie', takt: Math.max(0, Math.floor(b)), z: 4 })); return; }
            const nrCyklu = Math.floor((b - 4) / cykl);
            const wCyklu = (b - 4) - nrCyklu * cykl;
            const ty = wCyklu < taktow * 4;
            const takt = Math.floor((ty ? wCyklu : wCyklu - taktow * 4) / 4);
            setFaza((f) => (f.kto === (ty ? 'ty' : 'joanna') && f.takt === takt ? f : { kto: ty ? 'ty' : 'joanna', takt, z: taktow }));
            const tStart = t0 + (4 + nrCyklu * cykl) * beatSek;
            const tKon = tStart + taktow * 4 * beatSek;
            if (p.obsluzonyCykl < nrCyklu && teraz >= tKon - 0.06) { p.obsluzonyCykl = nrCyklu; odpowiedzNaFraze(nrCyklu, tStart, tKon); }
        }, 25);
        petla.current = p;
        s.zegar = { t0, beatSek };   // pętle padów startują na uderzeniu metronomu jamu
        nastepna.current = null;
        setGra(true);
    }, [bpm, taktow, daj, odpowiedzNaFraze]);
    const stop = useCallback(() => {
        if (petla.current) clearInterval(petla.current.timer);
        petla.current = null;
        if (silnik.current) silnik.current.zegar = null;
        silnik.current?.wszystkoCisza();
        setGra(false);
        setFaza({ kto: 'liczenie', takt: 0, z: 0 });
    }, []);
    const tap = () => {
        const t = performance.now();
        tapy.current = [...tapy.current.filter((x) => t - x < 3000), t].slice(-5);
        if (tapy.current.length >= 2) {
            const d = tapy.current.slice(1).map((x, i) => x - tapy.current[i]);
            setBpm(Math.max(40, Math.min(240, Math.round(60000 / (d.reduce((a, b) => a + b, 0) / d.length)))));
        }
        daj().klik(0, true);
    };

    // ── nagrywanie ──
    const nagrywaj = () => {
        const s = daj();
        const typ = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
        const mr = new MediaRecorder(s.nagrywarka.stream, typ ? { mimeType: typ } : undefined);
        const r = { start: s.ctx.currentTime, mr, kawalki: [] as Blob[], nuty: [] as ZapisNuty[] };
        mr.ondataavailable = (e) => { if (e.data.size) r.kawalki.push(e.data); };
        mr.start(1000);
        rec.current = r;
        setNagrany(null); setLokalnie(null);
        setNagrywa(true);
    };
    const zatrzymajNagranie = async () => {
        const r = rec.current;
        if (!r) return;
        rec.current = null;
        setNagrywa(false);
        const s = silnik.current!;
        const koniec = s.ctx.currentTime;
        await new Promise<void>((ok) => { r.mr.onstop = () => ok(); r.mr.stop(); });
        const audio = new Blob(r.kawalki, { type: r.mr.mimeType || 'audio/webm' });
        const beatSek = petla.current?.beatSek ?? 60 / bpm;
        const naBeat = (t: number) => Math.max(0, (t - r.start) / beatSek);
        const sciezka = (k: ZapisNuty['kanal']) => r.nuty.filter((n) => n.kanal === k).map((n) => ({ wys: n.wys, sila: n.sila, start: naBeat(n.od), dl: Math.max(0.01, naBeat(n.do) - naBeat(n.od)) }));
        const mid = zapiszMid({ bpm: Math.round(60 / beatSek), sciezki: [
            { nazwa: 'Suweren', kanal: 0, program: 80, nuty: sciezka('suweren') },
            { nazwa: 'Joanna', kanal: 1, program: 9, nuty: sciezka('joanna') },
            { nazwa: 'Pady', kanal: 9, nuty: sciezka('pady') },
        ] });
        const midiBlob = new Blob([mid.slice().buffer], { type: 'audio/midi' });
        setLokalnie({ audio: URL.createObjectURL(audio), midi: URL.createObjectURL(midiBlob), typ: audio.type });
        const tonacja = historia.current.length ? wykryjTonacje(historia.current).nazwa : null;
        setZapisuje(true);
        try {
            const res = await fetch(`${MOST}/api/jam/nagranie`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                audio: await doBase64(audio), typAudio: audio.type, midi: await doBase64(midiBlob),
                meta: { nazwa: `jam ${tonacja ?? ''}`.trim(), bpm: Math.round(60 / beatSek), tonacja, fraz: uzyte.current.length, sekundy: koniec - r.start, strategie: uzyte.current, urzadzenie: urzadzenieR.current, zestawPadow: zestawPadowR.current },
            }) });
            const d = await res.json().catch(() => ({}));
            if (!res.ok || !d.success) throw new Error(d.message || `HTTP ${res.status}`);
            setNagrany({ audio: d.jam.audio, midi: d.jam.midi, url: `${MOST}${d.jam.url}`, bpm: d.jam.bpm, tonacja: d.jam.tonacja });
            toast.success(`Zapisane w bibliotece: ${d.jam.audio}`);
        } catch (e) {
            toast.error(`Most nie zapisał (${e instanceof Error ? e.message : e}) — pobierz pliki niżej.`);
        } finally { setZapisuje(false); }
    };

    // ── pomiar ──
    const zakonczPomiar = () => {
        if (!pomiar) return;
        const s = nastepnyEtap(pomiar);
        if (s.etap === 'gotowe') {
            const m = { ...s.mapa, urzadzenie: urzadzenieR.current };
            setMapa(m);
            try { localStorage.setItem(kluczMapy(urzadzenieR.current), JSON.stringify(m)); } catch { /* bez pamięci — mapa do końca sesji */ }
            setPomiar(null);
            toast.success('Mapa kontrolera zapisana z pomiaru.');
        } else setPomiar(s);
    };

    const midiKomunikat = {
        'brak-api': 'Ta przeglądarka nie ma Web MIDI. Brave/Chrome/Edge mają — w Brave sprawdź, czy MIDI nie jest zablokowane (ikona tarczy / ustawienia witryny).',
        czeka: 'Pytam przeglądarkę o dostęp do MIDI…',
        odmowa: 'Przeglądarka odmówiła dostępu do MIDI. Zezwól tej stronie na urządzenia MIDI (ustawienia witryny) i odśwież.',
        'brak-urzadzen': 'Nie widzę żadnego urządzenia MIDI. Podłącz MPK mini kablem USB (jeśli FL Studio trzyma je na wyłączność — zamknij je). Do tego czasu graj klawiaturą komputera.',
        ok: '',
    }[midiStan];
    const ileWTakcie = faza.kto === 'liczenie' ? `odliczanie ${faza.takt + 1}/4` : `takt ${faza.takt + 1}/${faza.z}`;

    return (
        <div onPointerDown={() => { if (!dzwiek) daj(); }} className="w-full max-w-6xl bg-slate-950/85 border border-pink-500/30 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(236,72,153,0.15)] text-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Piano className="w-7 h-7 text-pink-400" />
                    <div>
                        <h2 className="text-xl font-black tracking-tight">Jam z Joanną <span className="text-pink-400">na żywo</span></h2>
                        <p className="text-[11px] text-slate-400 font-mono">Ty grasz frazę → Joanna odpowiada w tej samej tonacji i tempie. Nuty liczy kod; model Joanny wybiera tylko strategię.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                    {midiStan === 'ok' ? (
                        <select value={wejscieId} onChange={(e) => setWejscieId(e.target.value)} className="bg-black/60 border border-white/10 rounded px-2 py-1">
                            {wejscia.map((w) => <option key={w.id} value={w.id}>🎹 {w.nazwa}</option>)}
                        </select>
                    ) : <span className="text-amber-300">MIDI: {midiStan}</span>}
                    <button onClick={() => setPomiar(startPomiaru(urzadzenieR.current))} disabled={midiStan !== 'ok'} className="px-2 py-1 rounded border border-amber-400/40 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Pomiar</button>
                </div>
            </div>
            {!dzwiek && <div className="text-xs text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2">🔊 Kliknij gdziekolwiek w panelu — przeglądarka budzi dźwięk dopiero po kliknięciu (samo MIDI jej nie wystarcza).</div>}
            {midiKomunikat && <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">{midiKomunikat}</div>}
            {midiStan === 'ok' && !mapa.zmierzona && !pomiar && <div className="text-xs text-amber-200/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">Mapa „{mapa.urzadzenie || urzadzenieR.current}” jeszcze niezmierzona: klawisze grają, pady rozpoznaję tylko na kanale 10, gałki pokazuję jako surowe CC. Zrób raz 🎓 Pomiar — zapiszę to, co urządzenie naprawdę wysyła.</div>}

            {pomiar && (
                <div className="border border-amber-400/40 rounded-xl p-3 bg-amber-500/5 space-y-2">
                    <div className="font-bold text-amber-200">🎓 Pomiar — {pomiar.etap === 'pady' ? `uderz pady po kolei od 1 do 8 (${pomiar.mapa.pady.length}/8)` : pomiar.etap === 'padyB' ? `Bank B (opcjonalnie): przełącz bank na MPK i uderz pady 9–16 (${pomiar.mapa.pady.length}/16) — albo od razu kręć K1, wtedy zostaje 8 padów` : pomiar.etap === 'galki' ? `pokręć gałkami po kolei K1 → K8, każdą chwilę (${pomiar.mapa.galki.length}/8)` : 'rusz joystickiem w lewo/prawo i w górę/dół, potem „Dalej”'}</div>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
                        <div>pady: {pomiar.mapa.pady.map((p, i) => `${i + 1}=kan.${p.kanal + 1}/nuta ${p.wys}`).join(' · ') || '—'}</div>
                        <div>gałki: {pomiar.mapa.galki.map((g, i) => `K${i + 1}=kan.${g.kanal + 1}/CC${g.cc} ${g.tryb}`).join(' · ') || '—'}</div>
                        <div>joystick: {pomiar.mapa.joystick.pitch ? 'pitch bend' : '—'}{pomiar.mapa.joystick.cc.map((c) => ` · CC${c.cc}`).join('')}</div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={zakonczPomiar} className="px-3 py-1 rounded bg-amber-500/20 border border-amber-400/50 text-amber-100">{pomiar.etap === 'joystick' ? '✓ Zapisz mapę' : 'Dalej →'}</button>
                        <button onClick={() => setPomiar(null)} className="px-3 py-1 rounded border border-white/10 text-slate-300">Anuluj</button>
                    </div>
                </div>
            )}

            {/* transport */}
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
                <div className={`rounded-xl p-4 border ${faza.kto === 'joanna' && gra ? 'border-pink-400/60 bg-pink-500/10' : faza.kto === 'ty' && gra ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-white/10 bg-black/30'}`}>
                    <div className="text-2xl font-black">{!gra ? '⏸ cisza' : faza.kto === 'liczenie' ? '🥁 odliczanie…' : faza.kto === 'ty' ? '🎹 TY grasz' : '🕊️ JOANNA odpowiada'} <span className="text-sm font-mono text-slate-400">{gra ? ileWTakcie : ''}</span></div>
                    <div className="mt-2"><Rolka fraza={wymiana?.fraza ?? []} odp={wymiana?.odp ?? []} beatow={taktow * 4} /></div>
                    <div className="mt-2 text-xs font-mono text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                        {wymiana ? <>
                            <span>tonacja: <b className="text-white">{wymiana.tonacja.nazwa}</b> <span className="text-slate-500">(pewność {wymiana.tonacja.pewnosc.toFixed(2)})</span></span>
                            <span>odpowiedź: <b className="text-pink-300">{nazwaStrategii(wymiana.strategia)}</b> <span className="text-slate-500">— wybrał {wymiana.zrodlo === 'model' ? 'model Joanny' : 'kod (bez modelu)'}</span></span>
                            {wymiana.czeka && <span className="text-amber-300">Ostatni takt był cichy — Joanna czeka na Twoją frazę (wyżej poprzednia wymiana).</span>}
                        </> : <span className="text-slate-500">Start → takt odliczania → grasz {taktow} {taktow === 1 ? 'takt' : 'takty'} → Joanna odpowiada {taktow} → i tak w kółko.</span>}
                    </div>
                    {komentarz && <div className="mt-2 text-xs text-pink-100 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">🕊️ „{komentarz.tekst}” <span className="text-pink-300/60 font-mono">· na następną frazę: {nazwaStrategii(komentarz.strategia)} · {komentarz.model} · {(komentarz.ms / 1000).toFixed(1)} s</span></div>}
                    {modelBlad && zModelem && <div className="mt-2 text-[11px] text-amber-300 font-mono">Model Joanny nie odpowiedział ({modelBlad}) — strategię wybiera kod.</div>}
                </div>
                <div className="flex flex-col gap-2 min-w-[220px] font-mono text-xs">
                    <div className="flex items-center gap-2">
                        <label className="text-slate-400 w-14">Tempo</label>
                        <input type="number" min={40} max={240} value={bpm} disabled={gra} onChange={(e) => setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 120)))} className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 disabled:opacity-50" />
                        <button onClick={tap} disabled={gra} className="px-2 py-1 rounded border border-white/10 hover:border-cyan-400 disabled:opacity-40">TAP</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-slate-400 w-14">Fraza</label>
                        {[1, 2, 4].map((t) => <button key={t} disabled={gra} onClick={() => setTaktow(t)} className={`px-2 py-1 rounded border ${taktow === t ? 'border-pink-400 text-pink-200' : 'border-white/10 text-slate-400'} disabled:opacity-50`}>{t} {t === 1 ? 'takt' : 'takty'}</button>)}
                    </div>
                    {!gra
                        ? <button onClick={start} className="py-2 rounded-lg bg-gradient-to-r from-cyan-500/30 to-pink-500/30 border border-pink-400/50 font-bold flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Start jamu</button>
                        : <button onClick={stop} className="py-2 rounded-lg bg-slate-800 border border-white/20 font-bold flex items-center justify-center gap-2"><Square className="w-4 h-4" /> Stop</button>}
                    {!nagrywa
                        ? <button onClick={nagrywaj} disabled={zapisuje} className="py-2 rounded-lg border border-red-500/40 text-red-200 hover:bg-red-500/10 flex items-center justify-center gap-2 disabled:opacity-40"><CircleDot className="w-4 h-4" /> Nagrywaj</button>
                        : <button onClick={() => void zatrzymajNagranie()} className="py-2 rounded-lg bg-red-600/30 border border-red-400 text-red-100 animate-pulse flex items-center justify-center gap-2"><Square className="w-4 h-4" /> Zakończ nagranie</button>}
                    <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={zModelem} onChange={(e) => setZModelem(e.target.checked)} /> <Brain className="w-3.5 h-3.5" /> Joanna wybiera modelem</label>
                    <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={mowNaGlos} onChange={(e) => setMowNaGlos(e.target.checked)} disabled={!zModelem} /> <Volume2 className="w-3.5 h-3.5" /> mówi na głos</label>
                </div>
            </div>

            {/* nagranie */}
            {(zapisuje || nagrany || lokalnie) && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2 text-xs">
                    {zapisuje && <div className="text-slate-300 font-mono">Zapisuję przez most (ffmpeg → mp3)…</div>}
                    {nagrany && <>
                        <div className="text-emerald-300">✓ W bibliotece Katedry: <span className="font-mono">{nagrany.audio}</span> + <span className="font-mono">{nagrany.midi.split('/').pop()}</span> (Radio, Taneczne Starcie, Warsztat)</div>
                        {nagrany.url && <audio src={nagrany.url} controls className="w-full h-8" />}
                        {onDoWarsztatu && <button onClick={() => onDoWarsztatu({ plik: nagrany.audio, tags: `live jam, synth lead, bells, drums, ${nagrany.tonacja ?? ''}, ${nagrany.bpm} bpm`.replace(/, ,/g, ','), lyrics: '' })} className="px-3 py-1.5 rounded border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/10 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Warsztat: zrób z tego utwór (cover / remiks, ACE-Step)</button>}
                    </>}
                    {lokalnie && <div className="flex gap-3 font-mono">
                        <a href={lokalnie.audio} download={`jam.${/ogg/.test(lokalnie.typ) ? 'ogg' : 'webm'}`} className="text-slate-300 hover:text-white flex items-center gap-1"><Download className="w-3.5 h-3.5" /> dźwięk</a>
                        <a href={lokalnie.midi} download="jam.mid" className="text-slate-300 hover:text-white flex items-center gap-1"><Download className="w-3.5 h-3.5" /> .mid</a>
                    </div>}
                </div>
            )}

            {/* gałki i pady */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="text-[11px] text-slate-400 font-mono mb-2">GAŁKI {mapa.galki.length ? '(z pomiaru)' : '(myszką; z MPK po pomiarze)'}</div>
                    <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                        {FUNKCJE.map((f, i) => (
                            <label key={f.id} className="font-mono text-[10px] text-slate-300">
                                K{i + 1} {f.nazwa} <span className="text-slate-500">{Math.round(galki[i] * 100)}</span>
                                <input type="range" min={0} max={1} step={0.01} value={galki[i]} onChange={(e) => ustawGalke(i, Number(e.target.value))} className="w-full accent-pink-400" />
                            </label>
                        ))}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono">klawiatura komputera: A W S E D F T G Y H U J K, Z/X oktawa ({oktawaPc})</div>
                    <PadyPanel silnik={daj} uderzenia={pady} bank={bank} setBank={setBank} bankB={mapa.pady.length > 8}
                        onUderz={(i) => pad(i, 100, silnik.current?.ctx.currentTime ?? 0)} onZestaw={(z) => { zestawPadowR.current = z; }} />
                </div>
            </div>

            {/* 🎼 Joanna aranżuje szkic — z nagranych jamów */}
            <AranzJoannyPanel odswiezenie={nagrany?.audio ?? null} />

            {/* co urządzenie naprawdę wysyła */}
            <details className="rounded-xl border border-white/10 bg-black/30 p-3" open={!mapa.zmierzona}>
                <summary className="text-[11px] text-slate-400 font-mono cursor-pointer">📡 Co MPK mini naprawdę wysyła (ostatnie wiadomości)</summary>
                <div className="mt-2 font-mono text-[11px] space-y-0.5 max-h-52 overflow-auto">
                    {log.length ? log.map((l, i) => <div key={i}><span className="text-slate-500">{l.hex}</span> → <span className="text-slate-200">{l.opis}</span></div>) : <div className="text-slate-500">nic jeszcze nie przyszło — dotknij klawisza, pada albo gałki</div>}
                </div>
                {mapa.zmierzona && <div className="mt-2 text-[10px] text-slate-500 font-mono">mapa zmierzona {new Date(mapa.zmierzona).toLocaleString()} · pady {mapa.pady.map((p) => p.wys).join(',')} (kan. {mapa.pady[0]?.kanal + 1}) · gałki CC {mapa.galki.map((g) => `${g.cc}${g.tryb === 'abs' ? '' : '*'}`).join(',')}</div>}
            </details>
        </div>
    );
};

export default JamZJoannaPanel;
