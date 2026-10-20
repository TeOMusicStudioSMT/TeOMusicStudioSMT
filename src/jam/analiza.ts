/**
 * 🎼 Joanna aranżuje szkic — ANALIZA jamu (czysta; testy `testy/aranz.test.ts`).
 *
 * Plik .mid jamu → ścieżka Suwerena → frazy (cisza ≥ 1 beat albo 8 taktów = koniec frazy),
 * każda wyrównana do początku swojego taktu i skwantyzowana do szesnastek → tonacja
 * (Krumhansl–Kessler ze wszystkich nut) → ocena fraz z faktów: ile nut, ile różnych
 * interwałów, ile nut w skali, czy fraza się porusza. Najlepsze frazy = MOTYWY (numerowane),
 * z których model Joanny może tylko WYBIERAĆ numery.
 */

import { czytajMid } from './midiPlik.ts';
import { kontur, type Nuta } from './fraza.ts';
import { nazwaNuty, wSkali, wykryjTonacje, type Tonacja } from './teoria.ts';

export interface Motyw { nr: number; takty: number; nuty: Nuta[]; ocena: number; melodia: string; kontur: string; interwaly: number; wSkali: number }
export interface Analiza { bpm: number; tonacja: Tonacja; nut: number; motywy: Motyw[]; frazWszystkich: number }

const MAX_MOTYWOW = 8;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const q = (x: number, k = 0.25) => Math.round(x / k) * k;

/** Nuty → frazy (w beatach od początku pliku). */
export function podzielNaFrazy(nuty: Nuta[], { przerwa = 1, maxTaktow = 8 } = {}) {
    const n = [...nuty].sort((a, b) => a.start - b.start || a.wys - b.wys);
    const frazy: Nuta[][] = [];
    let biezaca: Nuta[] = [];
    let koniec = -Infinity, poczatek = 0;
    for (const x of n) {
        const nowa = !biezaca.length || x.start - koniec >= przerwa || x.start - poczatek >= maxTaktow * 4;
        if (nowa) {
            if (biezaca.length) frazy.push(biezaca);
            biezaca = [];
            poczatek = Math.floor(x.start / 4) * 4;
        }
        biezaca.push(x);
        koniec = nowa ? x.start + x.dl : Math.max(koniec, x.start + x.dl);
    }
    if (biezaca.length) frazy.push(biezaca);
    // każda fraza od początku swojego taktu, szesnastki, pełne takty
    return frazy.map((f) => {
        const od = Math.floor(f[0].start / 4) * 4;
        const nuty2 = f.map((x) => ({ wys: x.wys, sila: x.sila, start: r3(q(x.start - od)), dl: r3(Math.max(0.25, q(x.dl))) }));
        const dl = Math.max(...nuty2.map((x) => x.start + x.dl));
        const takty = Math.max(1, Math.min(maxTaktow, Math.ceil(dl / 4 - 1e-6)));
        return { od, takty, nuty: nuty2.filter((x) => x.start < takty * 4).map((x) => ({ ...x, dl: r3(Math.min(x.dl, takty * 4 - x.start)) })) };
    });
}

/** Ocena frazy z faktów (więcej = lepszy motyw). */
export function ocenFraze(nuty: Nuta[], t: Pick<Tonacja, 'tonika' | 'skala'>) {
    const m = [...nuty].sort((a, b) => a.start - b.start);
    const inter = new Set<number>();
    for (let i = 1; i < m.length; i++) inter.add(m[i].wys - m[i - 1].wys);
    const skala = m.length ? m.filter((x) => wSkali(x.wys, t)).length / m.length : 0;
    const k = kontur(m);
    const ocena = Math.min(16, m.length) + inter.size * 1.5 + skala * 6 + (k === 'stoi' ? -6 : k === 'falująca' ? 2 : 1) - (m.length < 3 ? 8 : 0);
    return { ocena: Math.round(ocena * 10) / 10, interwaly: inter.size, wSkali: Math.round(skala * 100) / 100, kontur: k };
}

/** Analiza nut Suwerena (bez pliku). */
export function analizujNuty(nuty: Nuta[], bpm: number): Analiza {
    const tonacja = wykryjTonacje(nuty);
    const frazy = podzielNaFrazy(nuty);
    const ocenione = frazy.map((f) => ({ ...f, ...ocenFraze(f.nuty, tonacja) }))
        .filter((f) => f.nuty.length >= 2)
        .sort((a, b) => b.ocena - a.ocena || a.od - b.od)
        .slice(0, MAX_MOTYWOW);
    const motywy: Motyw[] = ocenione.map((f, i) => ({
        nr: i + 1, takty: f.takty, nuty: f.nuty, ocena: f.ocena, kontur: f.kontur, interwaly: f.interwaly, wSkali: f.wSkali,
        melodia: [...f.nuty].sort((a, b) => a.start - b.start).slice(0, 16).map((x) => nazwaNuty(x.wys)).join(' '),
    }));
    return { bpm: Math.round(bpm), tonacja, nut: nuty.length, motywy, frazWszystkich: frazy.length };
}

/** Analiza pliku .mid jamu: ścieżka „Suweren” (albo pierwsza nie-perkusyjna z nutami). */
export function analizujMid(b: Uint8Array): Analiza {
    const m = czytajMid(b);
    const sc = m.sciezki.find((s) => s.nazwa === 'Suweren' && s.nuty.length) ?? m.sciezki.find((s) => s.nuty.length && s.nuty.every((n) => n.kanal !== 9));
    if (!sc) throw new Error('W pliku MIDI nie ma nut Suwerena (poza perkusją).');
    return analizujNuty(sc.nuty.map((n) => ({ wys: n.wys, sila: n.sila, start: n.start, dl: n.dl })), m.bpm);
}

/** Opis analizy dla mostu i modelu (bez nut — numery motywów i fakty). */
export const opisAnalizy = (a: Analiza) => ({
    bpm: a.bpm, tonacja: a.tonacja.nazwa, pewnoscTonacji: a.tonacja.pewnosc, nut: a.nut,
    motywy: a.motywy.map((m) => ({ nr: m.nr, takty: m.takty, nut: m.nuty.length, melodia: m.melodia, kontur: m.kontur, ocena: m.ocena })),
});
