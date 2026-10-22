/**
 * 🥁 Pady z dźwiękiem (Suweren 2026-10-22: „programować pady dźwiękiem… naciskając je, by dany dźwięk leciał”) —
 * CZYSTE części: zestaw (16 padów = Bank A + Bank B MPK mini), przycięcie, czułość na siłę, normalizacja,
 * grupy wyciszania, plan pętli w takt metronomu. Testy: `testy/pady.test.ts`.
 * Zestaw na dysku: `_OtakOs_Muzyka/Jam z Joanną/Pady/<id>/zestaw.json` (most: `services/PadyJamu.js` — BLIŹNIAK
 * `oczyscZestaw`: zmieniasz pola tu, zmień tam).
 */

export const PADOW = 16; // 8 padów × 2 banki
export const TRYBY_PADU = ['raz', 'trzymaj', 'petla'] as const;
export type TrybPadu = typeof TRYBY_PADU[number];
export const UDERZENIA_PETLI = [1, 2, 4, 8, 16] as const;
export const MAX_SEKUND_PROBKI = 30;

export interface UstawieniaPadu {
    plik: string | null;          // nazwa wav w katalogu zestawu; null = perkusja syntezowana
    zrodlo: string;               // opis skąd (mikrofon, plik „x.wav”, próbka, utwór od–do) — dla człowieka
    od: number;                   // s — przycięcie nieniszczące
    do: number | null;            // s; null = do końca
    glosnosc: number;             // 0–2
    normalizacja: boolean;        // szczyt próbki → 0,9
    stroj: number;                // półtony −24…24
    tryb: TrybPadu;
    petlaUderzen: number;         // długość pętli w uderzeniach metronomu
    grupa: number;                // 0 = brak; ten sam numer = pady wyciszają się nawzajem
    czulosc: number;              // 0 = zawsze pełna siła, 1 = siła uderzenia w pełni
}
export interface ZestawPadow { nazwa: string; wersja: 1; pady: UstawieniaPadu[] }

export const padDomyslny = (): UstawieniaPadu => ({ plik: null, zrodlo: 'perkusja syntezowana', od: 0, do: null, glosnosc: 1, normalizacja: true, stroj: 0, tryb: 'raz', petlaUderzen: 4, grupa: 0, czulosc: 0.7 });
export const pustyZestaw = (nazwa = 'Mój zestaw'): ZestawPadow => ({ nazwa, wersja: 1, pady: Array.from({ length: PADOW }, padDomyslny) });

const liczba = (v: unknown, min: number, max: number, dom: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dom; };
const r3 = (x: number) => Math.round(x * 1000) / 1000;

/** Bezpieczna nazwa pliku próbki: tylko „pad-<nr>-<hex>.wav” z mostu. */
export const czyPlikPadu = (p: unknown): p is string => typeof p === 'string' && /^pad-\d{1,2}-[0-9a-f]{6,16}\.wav$/.test(p);

/** Zestaw z dysku albo z sieci → poprawny (złe pola = wartości domyślne, nigdy wyjątek). */
export function oczyscZestaw(x: unknown): ZestawPadow {
    const o = (x && typeof x === 'object' ? x : {}) as Partial<ZestawPadow>;
    const lista = Array.isArray(o.pady) ? o.pady : [];
    const pady = Array.from({ length: PADOW }, (_, i) => {
        const p = (lista[i] && typeof lista[i] === 'object' ? lista[i] : {}) as Partial<UstawieniaPadu>;
        const d = padDomyslny();
        const od = r3(liczba(p.od, 0, MAX_SEKUND_PROBKI * 20, 0));
        const doS = p.do === null || p.do === undefined ? null : r3(liczba(p.do, 0, MAX_SEKUND_PROBKI * 20, 0));
        return {
            plik: czyPlikPadu(p.plik) ? p.plik : null,
            zrodlo: String(p.zrodlo ?? (czyPlikPadu(p.plik) ? 'próbka' : d.zrodlo)).replace(/\p{Cc}/gu, ' ').slice(0, 120),
            od, do: doS !== null && doS > od ? doS : null,
            glosnosc: r3(liczba(p.glosnosc, 0, 2, d.glosnosc)),
            normalizacja: typeof p.normalizacja === 'boolean' ? p.normalizacja : d.normalizacja,
            stroj: Math.round(liczba(p.stroj, -24, 24, 0)),
            tryb: (TRYBY_PADU as readonly string[]).includes(String(p.tryb)) ? p.tryb as TrybPadu : d.tryb,
            petlaUderzen: (UDERZENIA_PETLI as readonly number[]).includes(Number(p.petlaUderzen)) ? Number(p.petlaUderzen) : d.petlaUderzen,
            grupa: Math.round(liczba(p.grupa, 0, 8, 0)),
            czulosc: r3(liczba(p.czulosc, 0, 1, d.czulosc)),
        };
    });
    return { nazwa: String(o.nazwa ?? '').replace(/\p{Cc}/gu, ' ').trim().slice(0, 60) || 'Mój zestaw', wersja: 1, pady };
}

/** Przycięcie w granicach próbki: {od, dl} w sekundach (min 10 ms). */
export function przytnij(dlugosc: number, od: number, doS: number | null) {
    const L = Math.max(0, dlugosc);
    const a = Math.min(Math.max(0, od), Math.max(0, L - 0.01));
    const b = doS === null ? L : Math.min(L, Math.max(a + 0.01, doS));
    return { od: r3(a), dl: r3(Math.max(0.01, b - a)) };
}

/** Wzmocnienie z siły uderzenia: czułość 0 = stałe, 1 = (siła/127)². */
export const wzmocnienieZSily = (sila: number, czulosc: number) => {
    const s = Math.max(0, Math.min(127, sila)) / 127;
    return r3((1 - czulosc) + czulosc * s * s);
};

/** Szczyt bezwzględny kanałów. */
export function szczyt(kanaly: ArrayLike<number>[]) {
    let m = 0;
    for (const k of kanaly) for (let i = 0; i < k.length; i++) { const v = Math.abs(k[i]); if (v > m) m = v; }
    return m;
}
/** Mnożnik normalizacji do celu (cisza = 1, bez wzmacniania szumu ponad ×8). */
export const mnoznikNormalizacji = (sz: number, cel = 0.9) => (sz < 1e-4 ? 1 : r3(Math.min(8, cel / sz)));

/** Strój w półtonach → playbackRate. */
export const szybkoscZeStroju = (polTony: number) => 2 ** (polTony / 12);

/** Pady do wyciszenia przy uderzeniu w pad `i` (ta sama grupa > 0, bez niego samego). */
export function doWyciszenia(i: number, z: ZestawPadow) {
    const g = z.pady[i]?.grupa ?? 0;
    if (!g) return [];
    return z.pady.map((p, j) => (j !== i && p.grupa === g ? j : -1)).filter((j) => j >= 0);
}

/**
 * Pętla w takt: start na najbliższym uderzeniu metronomu (siatka od `t0`), okres = `uderzen` × beat.
 * Uderzenie pada „na” uderzenie (≤ 30 ms po nim) = start od razu na tym uderzeniu.
 */
export function planPetli(teraz: number, t0: number, beatSek: number, uderzen: number) {
    const b = Math.max(0.05, beatSek);
    const n = (teraz - t0) / b;
    const k = n - Math.floor(n) <= 0.03 / b ? Math.floor(n) : Math.ceil(n);
    return { start: r3(t0 + Math.max(0, k) * b), okres: r3(Math.max(1, uderzen) * b) };
}

/** Nuty GM w .mid: Bank A jak dotąd (stopa, werbel…), Bank B — osobne nuty, żeby nie zlewały się z A. */
export const NUTY_GM_BANKU_B = [40, 41, 43, 47, 48, 51, 53, 56];
