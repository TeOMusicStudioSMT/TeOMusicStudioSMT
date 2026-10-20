/**
 * 🎹 Jam z Joanną — TEORIA (czysta, bez przeglądarki, z testami w `testy/jam.test.ts`).
 *
 * Tonacja z zagranych nut: profil Krumhansla–Kesslera (dur / moll) korelowany z
 * histogramem klas wysokości ważonym długością i siłą. Wynik niesie `pewnosc`
 * (różnica korelacji najlepszej i drugiej) — przy 2–3 nutach tonacja jest
 * zgadywana, i tak to mówimy.
 */

export type Skala = 'dur' | 'moll';
export interface Tonacja { tonika: number; skala: Skala; nazwa: string; pewnosc: number }
export interface NutaWazona { wys: number; dl?: number; sila?: number }

export const NAZWY_NUT = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'] as const;
export const SKALE: Record<Skala, number[]> = {
    dur: [0, 2, 4, 5, 7, 9, 11],
    moll: [0, 2, 3, 5, 7, 8, 10],
};
// Krumhansl & Kessler (1982), profile dla C-dur i c-moll.
const PROFIL: Record<Skala, number[]> = {
    dur: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
    moll: [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
};

export const klasa = (wys: number) => ((Math.round(wys) % 12) + 12) % 12;
export const nazwaNuty = (wys: number) => `${NAZWY_NUT[klasa(wys)]}${Math.floor(Math.round(wys) / 12) - 1}`;
export const nazwaTonacji = (tonika: number, skala: Skala) => (skala === 'dur' ? `${NAZWY_NUT[klasa(tonika)]}-dur` : `${NAZWY_NUT[klasa(tonika)].toLowerCase()}-moll`);

function korelacja(a: number[], b: number[]) {
    const sa = a.reduce((s, x) => s + x, 0) / a.length;
    const sb = b.reduce((s, x) => s + x, 0) / b.length;
    let l = 0, da = 0, db = 0;
    for (let i = 0; i < a.length; i++) { l += (a[i] - sa) * (b[i] - sb); da += (a[i] - sa) ** 2; db += (b[i] - sb) ** 2; }
    return da && db ? l / Math.sqrt(da * db) : 0;
}

/** Histogram klas wysokości (długość × siła). */
export function histogram(nuty: NutaWazona[]) {
    const h = new Array(12).fill(0);
    for (const n of nuty) h[klasa(n.wys)] += Math.max(0.05, n.dl ?? 1) * (0.5 + (n.sila ?? 100) / 254);
    return h;
}

/** Tonacja z nut. Bez nut = C-dur z pewnością 0. */
export function wykryjTonacje(nuty: NutaWazona[]): Tonacja {
    if (!nuty.length) return { tonika: 0, skala: 'dur', nazwa: 'C-dur', pewnosc: 0 };
    const h = histogram(nuty);
    const wyniki: { tonika: number; skala: Skala; r: number }[] = [];
    for (const skala of ['dur', 'moll'] as Skala[]) {
        for (let t = 0; t < 12; t++) {
            const prof = PROFIL[skala].map((_, i) => PROFIL[skala][(i - t + 12) % 12]);
            wyniki.push({ tonika: t, skala, r: korelacja(h, prof) });
        }
    }
    // Remis rozstrzyga najniższa (pierwsza zagrana) nuta jako tonika — tak słyszy ucho.
    const pierwsza = klasa(nuty[0].wys);
    wyniki.sort((a, b) => b.r - a.r || (b.tonika === pierwsza ? 1 : 0) - (a.tonika === pierwsza ? 1 : 0));
    const [best, drugi] = wyniki;
    return { tonika: best.tonika, skala: best.skala, nazwa: nazwaTonacji(best.tonika, best.skala), pewnosc: Math.max(0, Math.min(1, Math.round((best.r - drugi.r) * 100) / 100 * 4)) };
}

/** Czy wysokość należy do skali tonacji. */
export const wSkali = (wys: number, t: Pick<Tonacja, 'tonika' | 'skala'>) => SKALE[t.skala].includes(klasa(wys - t.tonika));

/** Najbliższy dźwięk skali (remis = w dół). */
export function doSkali(wys: number, t: Pick<Tonacja, 'tonika' | 'skala'>) {
    const w = Math.round(wys);
    for (let d = 0; d <= 6; d++) {
        if (wSkali(w - d, t)) return w - d;
        if (wSkali(w + d, t)) return w + d;
    }
    return w;
}

/** Indeks stopnia skali (ciągły po oktawach): C4 w C-dur = 35 (5 oktaw × 7). */
export function stopien(wys: number, t: Pick<Tonacja, 'tonika' | 'skala'>) {
    const w = doSkali(wys, t);
    const wzg = w - t.tonika;
    const okt = Math.floor(wzg / 12);
    return okt * 7 + SKALE[t.skala].indexOf(klasa(wzg));
}

/** Wysokość z indeksu stopnia. */
export function zeStopnia(st: number, t: Pick<Tonacja, 'tonika' | 'skala'>) {
    const okt = Math.floor(st / 7);
    const i = ((st % 7) + 7) % 7;
    return t.tonika + okt * 12 + SKALE[t.skala][i];
}

/** Przesunięcie o `kroki` stopni W SKALI (diatonicznie). */
export const krokWSkali = (wys: number, kroki: number, t: Pick<Tonacja, 'tonika' | 'skala'>) => zeStopnia(stopien(wys, t) + kroki, t);

/** Najbliższa tonika do danej wysokości (do kadencji). */
export function najblizszaTonika(wys: number, t: Pick<Tonacja, 'tonika'>) {
    const baza = Math.round(wys) - klasa(Math.round(wys) - t.tonika);
    return wys - baza > 6 ? baza + 12 : baza;
}
