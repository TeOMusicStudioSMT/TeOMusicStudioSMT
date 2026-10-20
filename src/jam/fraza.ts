/**
 * 🎹 Jam z Joanną — FRAZA i ODPOWIEDŹ (czyste, deterministyczne; testy `testy/jam.test.ts`).
 *
 * Suweren gra frazę → kwantyzacja do siatki → Joanna odpowiada frazą w tej samej
 * tonacji i tempie. NUTY LICZY KOD: odpowiedź to przekształcenie frazy Suwerena
 * (echo w skali, odwrócenie, rak, sekwencja, wariacja rytmu, kadencja), a gałki
 * dają gęstość i energię. Model Joanny może co najwyżej WYBRAĆ strategię z listy
 * `STRATEGIE` — nigdy nie wymyśla nut.
 *
 * Czas we frazie liczymy w ćwierćnutach (beat) od początku frazy.
 */

import { doSkali, krokWSkali, najblizszaTonika, nazwaNuty, stopien, zeStopnia, type Tonacja } from './teoria.ts';

export interface ZdarzenieNuty { wys: number; sila: number; odMs: number; doMs: number }
export interface Nuta { wys: number; sila: number; start: number; dl: number }

export const STRATEGIE = [
    { id: 'echo', nazwa: 'Echo w skali', opis: 'ta sama fraza, o tercję wyżej w skali' },
    { id: 'odwrocenie', nazwa: 'Odwrócenie', opis: 'kontur lustrzany wokół pierwszej nuty' },
    { id: 'rak', nazwa: 'Rak', opis: 'fraza od końca, ten sam rytm' },
    { id: 'sekwencja', nazwa: 'Sekwencja', opis: 'początek motywu powtórzony stopień i dwa wyżej' },
    { id: 'wariacja', nazwa: 'Wariacja rytmu', opis: 'te same dźwięki, nowy rytm' },
    { id: 'kadencja', nazwa: 'Kadencja', opis: 'odpowiedź schodząca krokami do toniki' },
] as const;
export type Strategia = typeof STRATEGIE[number]['id'];
export const czyStrategia = (s: unknown): s is Strategia => STRATEGIE.some((x) => x.id === s);

export const msNaBeat = (bpm: number) => 60000 / Math.max(30, Math.min(300, bpm));

/** Mały, powtarzalny los (mulberry32). */
export function los(ziarno: number) {
    let a = (ziarno >>> 0) || 1;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const zaokr = (x: number, krok: number) => Math.round(x / krok) * krok;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Kwantyzacja zagranych nut do siatki. `siatka` w beatach (0,25 = szesnastka).
 * Nuty po końcu frazy odpadają, ostatnia jest przycinana do końca. Dwie nuty
 * o tej samej wysokości w tym samym miejscu siatki = jedna (mocniejsza).
 */
export function kwantyzuj(zdarzenia: ZdarzenieNuty[], o: { bpm: number; poczatekMs: number; siatka?: number; beatow: number }): Nuta[] {
    const siatka = o.siatka && o.siatka > 0 ? o.siatka : 0.25;
    const mb = msNaBeat(o.bpm);
    const out = new Map<string, Nuta>();
    for (const z of zdarzenia) {
        const start = zaokr((z.odMs - o.poczatekMs) / mb, siatka);
        if (start < 0 || start >= o.beatow) continue;
        let dl = Math.max(siatka, zaokr((Math.max(z.doMs, z.odMs) - z.odMs) / mb, siatka));
        dl = Math.min(dl, o.beatow - start);
        const n = { wys: Math.round(z.wys), sila: Math.max(1, Math.min(127, Math.round(z.sila))), start: r3(start), dl: r3(dl) };
        const k = `${n.wys}@${n.start}`;
        const byla = out.get(k);
        if (!byla || byla.sila < n.sila) out.set(k, n);
    }
    return [...out.values()].sort((a, b) => a.start - b.start || a.wys - b.wys);
}

/** Melodia = najwyższa nuta w każdym miejscu (akord liczy się jako jeden krok konturu). */
function melodia(f: Nuta[]) {
    const m = new Map<number, Nuta>();
    for (const n of f) { const b = m.get(n.start); if (!b || n.wys > b.wys) m.set(n.start, n); }
    return [...m.values()].sort((a, b) => a.start - b.start);
}

export function kontur(f: Nuta[]): 'wznosząca' | 'opadająca' | 'falująca' | 'stoi' {
    const m = melodia(f);
    if (m.length < 2) return 'stoi';
    let gora = 0, dol = 0;
    for (let i = 1; i < m.length; i++) { if (m[i].wys > m[i - 1].wys) gora++; else if (m[i].wys < m[i - 1].wys) dol++; }
    if (!gora && !dol) return 'stoi';
    if (gora > dol * 2) return 'wznosząca';
    if (dol > gora * 2) return 'opadająca';
    return 'falująca';
}

/** Krótki opis frazy dla modelu Joanny (fakty, bez interpretacji). */
export function opisFrazy(f: Nuta[], t: Tonacja, bpm: number) {
    const m = melodia(f);
    const wys = f.map((n) => n.wys);
    return {
        nut: f.length,
        tonacja: t.nazwa,
        pewnoscTonacji: t.pewnosc,
        bpm: Math.round(bpm),
        kontur: kontur(f),
        zakres: wys.length ? `${nazwaNuty(Math.min(...wys))}–${nazwaNuty(Math.max(...wys))}` : '',
        melodia: m.slice(0, 16).map((n) => nazwaNuty(n.wys)).join(' '),
        sredniaSila: f.length ? Math.round(f.reduce((s, n) => s + n.sila, 0) / f.length) : 0,
    };
}

/** Strategia bez modelu: obrót listy po numerze odpowiedzi + energia przesuwa ku mocniejszym. */
export function wybierzStrategie(f: Nuta[], energia: number, nr: number): Strategia {
    const k = kontur(f);
    if (k === 'stoi') return nr % 2 ? 'kadencja' : 'wariacja';
    const i = (Math.max(0, nr) + Math.round(Math.max(0, Math.min(1, energia)) * 2)) % STRATEGIE.length;
    return STRATEGIE[i].id;
}

export interface OpcjeOdpowiedzi {
    tonacja: Pick<Tonacja, 'tonika' | 'skala'>;
    strategia: Strategia;
    beatow: number;
    energia?: number; // 0–1: siła uderzeń i rejestr
    gestosc?: number; // 0–1: rzadziej ↔ gęściej
    siatka?: number;
    ziarno?: number;
    kadencja?: boolean; // ostatnia nuta → tonika (domyślnie tak)
}

const MIN_WYS = 36, MAX_WYS = 96;

/** Odpowiedź Joanny. Pusta fraza = pusta odpowiedź (Joanna nie gra z niczego). */
export function odpowiedz(fraza: Nuta[], o: OpcjeOdpowiedzi): Nuta[] {
    if (!fraza.length) return [];
    const t = o.tonacja;
    const siatka = o.siatka && o.siatka > 0 ? o.siatka : 0.25;
    const energia = Math.max(0, Math.min(1, o.energia ?? 0.5));
    const gestosc = Math.max(0, Math.min(1, o.gestosc ?? 0.5));
    const rnd = los(o.ziarno ?? 1);
    const f = [...fraza].sort((a, b) => a.start - b.start || a.wys - b.wys).map((n) => ({ ...n, wys: doSkali(n.wys, t) }));
    const koniec = Math.max(...f.map((n) => n.start + n.dl));
    const pierwsza = f[0].wys;
    let w: Nuta[];

    switch (o.strategia) {
        case 'echo':
            w = f.map((n) => ({ ...n, wys: krokWSkali(n.wys, 2, t) }));
            break;
        case 'odwrocenie': {
            const os = stopien(pierwsza, t);
            w = f.map((n) => ({ ...n, wys: krokWSkali(pierwsza, os - stopien(n.wys, t), t) }));
            break;
        }
        case 'rak':
            w = f.map((n) => ({ ...n, start: r3(Math.max(0, koniec - n.start - n.dl)) }));
            break;
        case 'sekwencja': {
            const pol = Math.max(siatka, zaokr(koniec / 3, siatka));
            const motyw = f.filter((n) => n.start < pol);
            w = [];
            for (let p = 0; p < 3; p++) for (const n of motyw) w.push({ ...n, start: r3(n.start + p * pol), dl: Math.min(n.dl, pol), wys: krokWSkali(n.wys, p, t) });
            break;
        }
        case 'wariacja': {
            // te same dźwięki po kolei, długości przetasowane i rozłożone od nowa w tej samej długości frazy
            const m = melodia(f);
            const dl = m.map((n) => n.dl);
            for (let i = dl.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [dl[i], dl[j]] = [dl[j], dl[i]]; }
            const suma = dl.reduce((s, x) => s + x, 0) || 1;
            let pos = m[0].start;
            w = m.map((n, i) => { const d = Math.max(siatka, zaokr((dl[i] / suma) * (koniec - m[0].start), siatka)); const x = { ...n, start: r3(pos), dl: r3(d) }; pos += d; return x; });
            break;
        }
        case 'kadencja': {
            // rytm frazy, melodia schodzi krokami ze szczytu do toniki
            const m = melodia(f);
            const szczyt = Math.max(...m.map((n) => n.wys));
            const cel = najblizszaTonika(m[m.length - 1].wys, t);
            const a = stopien(szczyt, t), b = stopien(cel, t);
            w = m.map((n, i) => ({ ...n, wys: zeStopnia(a + Math.round(((b - a) * i) / Math.max(1, m.length - 1)), t) }));
            break;
        }
        default:
            w = f;
    }

    // Gęstość: rzadko = wypadają nuty z nieparzystych szesnastek (zostaje co ważne), gęsto = długie nuty dzielone na dwie.
    if (gestosc < 0.35) {
        const rzadkie = w.filter((n, i) => i === 0 || Math.round(n.start / siatka) % 2 === 0 || rnd() < gestosc);
        if (rzadkie.length) w = rzadkie;
    } else if (gestosc > 0.65) {
        const gesto: Nuta[] = [];
        for (const n of w) {
            if (n.dl >= 2 * siatka && rnd() < gestosc) {
                const pol = zaokr(n.dl / 2, siatka);
                gesto.push({ ...n, dl: pol }, { ...n, start: r3(n.start + pol), dl: r3(n.dl - pol), wys: krokWSkali(n.wys, rnd() < 0.5 ? 1 : -1, t) });
            } else gesto.push(n);
        }
        w = gesto;
    }

    // Energia: siła uderzeń i oktawa wyżej przy pełnej energii.
    const okt = energia > 0.85 ? 12 : 0;
    w = w.map((n) => ({ ...n, wys: n.wys + okt, sila: Math.max(1, Math.min(127, Math.round(n.sila * (0.55 + 0.75 * energia)))) }));

    // Rejestr, skala, granice frazy.
    w = w
        .map((n) => {
            let wys = n.wys;
            while (wys > MAX_WYS) wys -= 12;
            while (wys < MIN_WYS) wys += 12;
            return { ...n, wys: doSkali(wys, t) };
        })
        .filter((n) => n.start < o.beatow)
        .map((n) => ({ ...n, dl: r3(Math.max(siatka, Math.min(n.dl, o.beatow - n.start))) }))
        .sort((a, b) => a.start - b.start || a.wys - b.wys);

    if (o.kadencja !== false && w.length) {
        const ost = w[w.length - 1];
        w[w.length - 1] = { ...ost, wys: najblizszaTonika(ost.wys, t) };
    }
    return w;
}
