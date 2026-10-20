/**
 * 🎹 Jam z Joanną — zapis Standard MIDI File (format 1), czysty (testy `testy/jam.test.ts`).
 * Ścieżka 0 = tempo i nazwa, kolejne = Suweren / Joanna / pady (każda na swoim kanale).
 * Czas nut w beatach (ćwierćnutach), PPQ 480.
 */

export interface NutaMidi { wys: number; sila: number; start: number; dl: number }
export interface SciezkaMidi { nazwa: string; kanal: number; nuty: NutaMidi[]; program?: number }

export const PPQ = 480;

/** Liczba o zmiennej długości (VLQ). */
export function vlq(n: number): number[] {
    let v = Math.max(0, Math.floor(n));
    const b = [v & 0x7f];
    while ((v >>= 7)) b.unshift((v & 0x7f) | 0x80);
    return b;
}

const tekst = (s: string) => Array.from(new TextEncoder().encode(s));
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const chunk = (typ: string, dane: number[]) => [...tekst(typ), ...u32(dane.length), ...dane];

function sciezka(zdarzenia: { tick: number; bajty: number[]; kolej: number }[]) {
    zdarzenia.sort((a, b) => a.tick - b.tick || a.kolej - b.kolej);
    const out: number[] = [];
    let t = 0;
    for (const z of zdarzenia) { out.push(...vlq(z.tick - t), ...z.bajty); t = z.tick; }
    out.push(0, 0xff, 0x2f, 0);
    return chunk('MTrk', out);
}

export function zapiszMid({ bpm, sciezki, metrum = 4 }: { bpm: number; sciezki: SciezkaMidi[]; metrum?: number }): Uint8Array {
    const usNaBeat = Math.round(60_000_000 / Math.max(20, Math.min(300, bpm)));
    const nazwa = tekst('Jam z Joanną');
    const t0 = sciezka([
        { tick: 0, kolej: 0, bajty: [0xff, 0x03, ...vlq(nazwa.length), ...nazwa] },
        { tick: 0, kolej: 1, bajty: [0xff, 0x51, 3, (usNaBeat >> 16) & 255, (usNaBeat >> 8) & 255, usNaBeat & 255] },
        { tick: 0, kolej: 2, bajty: [0xff, 0x58, 4, metrum, 2, 24, 8] },
    ]);
    const reszta = sciezki.map((s) => {
        const k = Math.max(0, Math.min(15, s.kanal | 0));
        const n = tekst(s.nazwa);
        const z: { tick: number; bajty: number[]; kolej: number }[] = [{ tick: 0, kolej: 0, bajty: [0xff, 0x03, ...vlq(n.length), ...n] }];
        if (s.program != null) z.push({ tick: 0, kolej: 1, bajty: [0xc0 | k, s.program & 127] });
        for (const nu of s.nuty) {
            const od = Math.round(nu.start * PPQ);
            const doT = Math.max(od + 1, Math.round((nu.start + nu.dl) * PPQ));
            const w = Math.max(0, Math.min(127, Math.round(nu.wys)));
            z.push({ tick: od, kolej: 3, bajty: [0x90 | k, w, Math.max(1, Math.min(127, Math.round(nu.sila)))] });
            z.push({ tick: doT, kolej: 2, bajty: [0x80 | k, w, 0] }); // puszczenie przed nowym uderzeniem w tym samym ticku
        }
        return sciezka(z);
    });
    const naglowek = chunk('MThd', [0, 1, 0, 1 + reszta.length, (PPQ >> 8) & 255, PPQ & 255]);
    return Uint8Array.from([...naglowek, ...t0, ...reszta.flat()]);
}

/** Odczyt własnego zapisu (do testów i podglądu): nuty na ścieżkę. */
export function czytajMid(b: Uint8Array) {
    const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
    const r32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    if (s(0, 4) !== 'MThd') throw new Error('To nie jest plik MIDI.');
    const ppq = (b[12] << 8) | b[13];
    let i = 8 + r32(4);
    let tempo = 500000;
    const sciezki: { nazwa: string; nuty: { wys: number; sila: number; start: number; dl: number; kanal: number }[] }[] = [];
    while (i < b.length) {
        if (s(i, 4) !== 'MTrk') throw new Error('Zła ścieżka MIDI.');
        const kon = i + 8 + r32(i + 4);
        let p = i + 8, t = 0, nazwa = '';
        const otwarte = new Map<string, { t: number; sila: number }>();
        const nuty: { wys: number; sila: number; start: number; dl: number; kanal: number }[] = [];
        const czytajVlq = () => { let v = 0, x; do { x = b[p++]; v = (v << 7) | (x & 0x7f); } while (x & 0x80); return v; };
        while (p < kon) {
            t += czytajVlq();
            const st = b[p++];
            if (st === 0xff) {
                const typ = b[p++]; const dl = czytajVlq();
                if (typ === 0x03) nazwa = new TextDecoder().decode(b.slice(p, p + dl));
                if (typ === 0x51) tempo = (b[p] << 16) | (b[p + 1] << 8) | b[p + 2];
                p += dl;
            } else if ((st & 0xf0) === 0x90 || (st & 0xf0) === 0x80) {
                const w = b[p++], v = b[p++], k = st & 15, kl = `${k}:${w}`;
                if ((st & 0xf0) === 0x90 && v > 0) otwarte.set(kl, { t, sila: v });
                else { const o = otwarte.get(kl); if (o) { nuty.push({ wys: w, sila: o.sila, start: o.t / ppq, dl: (t - o.t) / ppq, kanal: k }); otwarte.delete(kl); } }
            } else if ((st & 0xf0) === 0xc0) p += 1;
            else p += 2;
        }
        sciezki.push({ nazwa, nuty: nuty.sort((a, c) => a.start - c.start) });
        i = kon;
    }
    return { ppq, bpm: Math.round(60_000_000 / tempo), sciezki };
}
