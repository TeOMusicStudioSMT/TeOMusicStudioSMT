/**
 * 🎼 Joanna aranżuje szkic — ARANŻ MIDI (czysty, deterministyczny z ziarnem; testy `testy/aranz.test.ts`).
 *
 * Plan utworu (sekcje w taktach, energia, progresja, motyw, instrumenty — układa go model Joanny,
 * ale WYŁĄCZNIE z list poniżej; most sprawdza plan w `services/AranzJoanny.js`) → cztery ścieżki:
 *  · MELODIA — tylko motyw Suwerena i jego przekształcenia z `fraza.ts` (echo, odwrócenie, rak,
 *    sekwencja, wariacja, kadencja), w skali; żadnej nuty spoza motywu i jego przekształceń;
 *  · AKORDY — trójdźwięki na stopniach skali z progresji (lista `PROGRESJE`);
 *  · BAS — pryma i kwinta akordu, gęstość z energii;
 *  · PERKUSJA — wzór na typ sekcji (nuty GM, kanał 10), gęstość z energii.
 * Listy SEKCJE_UTWORU / INSTRUMENTY / PROGRESJE to BLIŹNIAK mostu (`services/AranzJoanny.js`) — zmieniasz tu, zmień tam.
 */

import { odpowiedz, los, type Nuta, type Strategia } from './fraza.ts';
import { doSkali, stopien, zeStopnia, type Tonacja } from './teoria.ts';
import type { SciezkaMidi } from './midiPlik.ts';
import type { Motyw } from './analiza.ts';

export const SEKCJE_UTWORU = [
    { id: 'intro', nazwa: 'Intro', energia: 0.3, kolor: '#a855f7' },
    { id: 'zwrotka', nazwa: 'Zwrotka', energia: 0.5, kolor: '#22d3ee' },
    { id: 'refren', nazwa: 'Refren', energia: 0.8, kolor: '#ec4899' },
    { id: 'przejscie', nazwa: 'Przejście', energia: 0.6, kolor: '#f59e0b' },
    { id: 'drop', nazwa: 'Drop', energia: 1, kolor: '#ef4444' },
    { id: 'outro', nazwa: 'Outro', energia: 0.3, kolor: '#64748b' },
] as const;
export type TypSekcji = typeof SEKCJE_UTWORU[number]['id'];

export const INSTRUMENTY = [
    { id: 'fortepian', nazwa: 'Fortepian', rola: 'melodia', gm: 0 },
    { id: 'syntezator', nazwa: 'Syntezator', rola: 'melodia', gm: 81 },
    { id: 'dzwonki', nazwa: 'Dzwonki', rola: 'melodia', gm: 9 },
    { id: 'flet', nazwa: 'Flet', rola: 'melodia', gm: 73 },
    { id: 'organy', nazwa: 'Organy', rola: 'akordy', gm: 19 },
    { id: 'smyczki', nazwa: 'Smyczki', rola: 'akordy', gm: 48 },
    { id: 'pad', nazwa: 'Pad', rola: 'akordy', gm: 89 },
    { id: 'gitara', nazwa: 'Gitara', rola: 'akordy', gm: 25 },
    { id: 'chor', nazwa: 'Chór', rola: 'akordy', gm: 52 },
    { id: 'bas-syntetyczny', nazwa: 'Bas syntetyczny', rola: 'bas', gm: 38 },
    { id: 'bas-elektryczny', nazwa: 'Bas elektryczny', rola: 'bas', gm: 33 },
    { id: 'perkusja-elektroniczna', nazwa: 'Perkusja elektroniczna', rola: 'perkusja', gm: 0 },
    { id: 'perkusja-akustyczna', nazwa: 'Perkusja akustyczna', rola: 'perkusja', gm: 0 },
] as const;
export type IdInstrumentu = typeof INSTRUMENTY[number]['id'];
type Rola = 'melodia' | 'akordy' | 'bas' | 'perkusja';

/** Progresje = stopnie skali (0 = tonika) na kolejne takty, w kółko. Nazwy rzymskie jak w dur; w moll te same stopnie. */
export const PROGRESJE: Record<string, number[]> = {
    'I-V-vi-IV': [0, 4, 5, 3],
    'vi-IV-I-V': [5, 3, 0, 4],
    'I-vi-IV-V': [0, 5, 3, 4],
    'I-IV-V-IV': [0, 3, 4, 3],
    'i-VI-III-VII': [0, 5, 2, 6],
    'i-iv-v-i': [0, 3, 4, 0],
    'i-VII-VI-VII': [0, 6, 5, 6],
    'ii-V-I-I': [1, 4, 0, 0],
    'I-I-IV-IV': [0, 0, 3, 3],
};

export interface SekcjaPlanu { typ: TypSekcji; takty: number; energia: number; progresja: string; motyw: number | null; instrumenty: IdInstrumentu[] }
export interface PlanUtworu { tytul: string; styl: string; tagi: string; tekst: string; sekcje: SekcjaPlanu[] }

/** Jakimi przekształceniami melodia odpowiada w kolejnych powtórzeniach motywu w sekcji. */
const PRZEKSZTALCENIA: Record<TypSekcji, Strategia[]> = {
    intro: ['rak'],
    zwrotka: ['wariacja', 'echo'],
    refren: ['echo', 'odwrocenie'],
    przejscie: ['sekwencja'],
    drop: ['echo', 'sekwencja'],
    outro: ['kadencja'],
};
export const NUTY_PERKUSJI = { stopa: 36, werbel: 38, klask: 39, hihat: 42, hihatOtw: 46, talerz: 49 } as const;

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const rolaInstrumentu = (id: string): Rola | null => (INSTRUMENTY.find((i) => i.id === id)?.rola as Rola | undefined) ?? null;
const maRole = (s: SekcjaPlanu, r: Rola) => s.instrumenty.some((i) => rolaInstrumentu(i) === r);

/** Trójdźwięk na stopniu `d` w okolicy `srodek`. */
export function akord(d: number, t: Pick<Tonacja, 'tonika' | 'skala'>, srodek = 60) {
    const baza = stopien(t.tonika + 48, t) + d;
    return [0, 2, 4].map((k) => {
        let w = zeStopnia(baza + k, t);
        while (w < srodek - 8) w += 12;
        while (w > srodek + 8) w -= 12;
        return w;
    }).sort((a, b) => a - b);
}

/** Program GM na rolę: najczęściej wskazany instrument tej roli w planie. */
function programRoli(plan: PlanUtworu, r: Rola) {
    const licz = new Map<string, number>();
    for (const s of plan.sekcje) for (const i of s.instrumenty) if (rolaInstrumentu(i) === r) licz.set(i, (licz.get(i) ?? 0) + s.takty);
    const naj = [...licz.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return INSTRUMENTY.find((i) => i.id === naj)?.gm;
}

export interface Aranz { sciezki: SciezkaMidi[]; takty: number; beatow: number; sekundy: number; granice: { typ: TypSekcji; od: number; do: number }[] }

export function aranzuj({ plan, motywy, tonacja, bpm, ziarno = 1 }: { plan: PlanUtworu; motywy: Motyw[]; tonacja: Pick<Tonacja, 'tonika' | 'skala'>; bpm: number; ziarno?: number }): Aranz {
    const t = tonacja;
    const mel: Nuta[] = [], akk: Nuta[] = [], bas: Nuta[] = [], perk: Nuta[] = [];
    const granice: Aranz['granice'] = [];
    let takt = 0;
    plan.sekcje.forEach((s, si) => {
        const od = takt * 4, T = s.takty, e = Math.max(0, Math.min(1, s.energia));
        const rnd = los(ziarno * 7919 + si * 104729);
        const prog = PROGRESJE[s.progresja] ?? PROGRESJE['I-V-vi-IV'];
        granice.push({ typ: s.typ, od: takt, do: takt + T });

        // MELODIA: motyw i jego przekształcenia, powtarzane do końca sekcji
        const m = s.motyw != null ? motywy.find((x) => x.nr === s.motyw) : undefined;
        if (m && m.nuty.length && maRole(s, 'melodia')) {
            const L = m.takty;
            const srednia = m.nuty.reduce((a, n) => a + n.wys, 0) / m.nuty.length;
            const okt = srednia < 60 ? 12 : srednia > 84 ? -12 : 0;
            const baza = m.nuty.map((n) => ({ ...n, wys: doSkali(n.wys + okt, t) }));
            const powt = Math.ceil(T / L);
            for (let r = 0; r < powt; r++) {
                const ostatnie = r === powt - 1;
                const strategia = PRZEKSZTALCENIA[s.typ][(r - 1 + PRZEKSZTALCENIA[s.typ].length) % PRZEKSZTALCENIA[s.typ].length];
                const frazy = r === 0
                    ? baza.map((n) => ({ ...n, sila: Math.max(1, Math.min(127, Math.round(n.sila * (0.6 + 0.5 * e)))) }))
                    : odpowiedz(baza, { tonacja: t, strategia, beatow: L * 4, energia: e, gestosc: 0.3 + 0.5 * e, ziarno: ziarno + si * 31 + r, kadencja: ostatnie });
                for (const n of frazy) {
                    const st = od + r * L * 4 + n.start;
                    if (st >= od + T * 4) continue;
                    mel.push({ ...n, start: r3(st), dl: r3(Math.min(n.dl, od + T * 4 - st)) });
                }
            }
        }

        for (let b = 0; b < T; b++) {
            const p = od + b * 4;
            const d = prog[b % prog.length];
            // AKORDY
            if (maRole(s, 'akordy')) {
                const ak = akord(d, t, 62);
                const sila = Math.round(45 + 40 * e);
                const rytm = e < 0.5 ? [[0, 4]] : e < 0.8 ? [[0, 2], [2, 2]] : [[0, 1], [1, 1], [2, 1], [3, 1]];
                for (const [o, dl] of rytm) for (const w of ak) akk.push({ wys: w, sila, start: p + o, dl: dl - 0.05 });
            }
            // BAS: pryma i kwinta akordu w okolicy E2–G3
            if (maRole(s, 'bas')) {
                let prymaB = zeStopnia(stopien(t.tonika + 36, t) + d, t);
                while (prymaB > 47) prymaB -= 12;
                while (prymaB < 33) prymaB += 12;
                const kwinta = zeStopnia(stopien(prymaB, t) + 4, t);
                const sila = Math.round(70 + 40 * e);
                const wzor: [number, number, number][] = e < 0.4 ? [[0, 4, prymaB]] : e < 0.75 ? [[0, 2, prymaB], [2, 2, kwinta]] : [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((o, i) => [o, 0.45, i % 4 === 3 ? kwinta : prymaB] as [number, number, number]);
                for (const [o, dl, w] of wzor) bas.push({ wys: w, sila, start: p + o, dl });
            }
            // PERKUSJA
            if (maRole(s, 'perkusja')) {
                const v = (x: number) => Math.max(1, Math.min(127, Math.round(x * (0.55 + 0.45 * e))));
                const uderz = (wys: number, o: number, sila: number) => perk.push({ wys, sila: v(sila), start: r3(p + o), dl: 0.1 });
                const ostatniTakt = b === T - 1;
                switch (s.typ) {
                    case 'intro':
                        if (e > 0.25) uderz(NUTY_PERKUSJI.stopa, 0, 100);
                        for (const o of [0, 1, 2, 3]) uderz(NUTY_PERKUSJI.hihat, o, 60);
                        break;
                    case 'zwrotka':
                        for (const o of [0, 2]) uderz(NUTY_PERKUSJI.stopa, o, 110);
                        if (rnd() < e * 0.6) uderz(NUTY_PERKUSJI.stopa, 2.5, 80);
                        for (const o of [1, 3]) uderz(NUTY_PERKUSJI.werbel, o, 105);
                        for (let o = 0; o < 4; o += 0.5) uderz(NUTY_PERKUSJI.hihat, o, o % 1 ? 60 : 85);
                        break;
                    case 'refren':
                        for (const o of [0, 1, 2, 3]) uderz(NUTY_PERKUSJI.stopa, o, 115);
                        for (const o of [1, 3]) uderz(NUTY_PERKUSJI.werbel, o, 110);
                        for (const o of [0.5, 1.5, 2.5, 3.5]) uderz(NUTY_PERKUSJI.hihatOtw, o, 75);
                        if (b === 0) uderz(NUTY_PERKUSJI.talerz, 0, 100);
                        break;
                    case 'przejscie':
                        for (const o of [0, 2]) uderz(NUTY_PERKUSJI.stopa, o, 100);
                        if (ostatniTakt) for (let o = 0; o < 4; o += 0.25) uderz(NUTY_PERKUSJI.werbel, o, 50 + o * 18);
                        else for (const o of [1, 3]) uderz(NUTY_PERKUSJI.werbel, o, 95);
                        for (let o = 0; o < 4; o += 0.5) uderz(NUTY_PERKUSJI.hihat, o, 65);
                        break;
                    case 'drop':
                        for (const o of [0, 1, 2, 3]) uderz(NUTY_PERKUSJI.stopa, o, 127);
                        for (const o of [1, 3]) uderz(NUTY_PERKUSJI.klask, o, 115);
                        for (let o = 0; o < 4; o += 0.25) uderz(NUTY_PERKUSJI.hihat, o, o % 1 === 0.5 ? 90 : 55);
                        if (b % 4 === 0) uderz(NUTY_PERKUSJI.talerz, 0, 110);
                        break;
                    case 'outro':
                        uderz(NUTY_PERKUSJI.stopa, 0, 90 * (1 - b / Math.max(1, T)));
                        for (const o of [0, 1, 2, 3]) uderz(NUTY_PERKUSJI.hihat, o, 50 * (1 - b / Math.max(1, T)) + 5);
                        break;
                }
            }
        }
        takt += T;
    });
    const sciezki: SciezkaMidi[] = [
        { nazwa: 'Melodia (motyw Suwerena)', kanal: 0, program: programRoli(plan, 'melodia') ?? 0, nuty: mel },
        { nazwa: 'Akordy', kanal: 1, program: programRoli(plan, 'akordy') ?? 89, nuty: akk },
        { nazwa: 'Bas', kanal: 2, program: programRoli(plan, 'bas') ?? 38, nuty: bas },
        { nazwa: 'Perkusja', kanal: 9, nuty: perk },
    ];
    return { sciezki, takty: takt, beatow: takt * 4, sekundy: Math.round(takt * 4 * (60 / bpm) * 10) / 10, granice };
}
