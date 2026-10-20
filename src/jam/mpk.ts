/**
 * 🎹 Jam z Joanną — wiadomości z kontrolera MIDI i MAPA z POMIARU (czyste; testy `testy/jam.test.ts`).
 *
 * Mapy MPK mini nie zgadujemy: preset „FLStudio20” może wysyłać pady i gałki
 * inaczej niż fabryczny. Suweren robi raz „🎓 Pomiar” (uderz pady 1→8, pokręć
 * gałkami K1→K8, rusz joystickiem) — `krokPomiaru` zapisuje to, co urządzenie
 * NAPRAWDĘ wysłało, łącznie z trybem gałek (bezwzględny 0–127 albo względny —
 * MPK mini 3 ma enkodery bez końca). Do czasu pomiaru: pady = nuty na kanale 10
 * (konwencja GM, w panelu oznaczone „niezmierzone”), gałki tylko jako surowe CC.
 */

export type Wiadomosc =
    | { typ: 'nuta'; kanal: number; wys: number; sila: number }
    | { typ: 'puszczona'; kanal: number; wys: number }
    | { typ: 'cc'; kanal: number; cc: number; wartosc: number }
    | { typ: 'pitch'; kanal: number; wartosc: number } // −1…1
    | { typ: 'inne'; bajty: number[] };

/** Kanały liczymy od 0 (kanał 10 MIDI = 9). */
export function odczytaj(d: ArrayLike<number>): Wiadomosc {
    const st = d[0] ?? 0, a = d[1] ?? 0, b = d[2] ?? 0;
    const kanal = st & 15;
    switch (st & 0xf0) {
        case 0x90: return b > 0 ? { typ: 'nuta', kanal, wys: a, sila: b } : { typ: 'puszczona', kanal, wys: a };
        case 0x80: return { typ: 'puszczona', kanal, wys: a };
        case 0xb0: return { typ: 'cc', kanal, cc: a, wartosc: b };
        case 0xe0: return { typ: 'pitch', kanal, wartosc: Math.max(-1, Math.min(1, (((b << 7) | a) - 8192) / 8191)) };
        default: return { typ: 'inne', bajty: Array.from(d as ArrayLike<number>) };
    }
}

export interface PadMapy { kanal: number; wys: number }
export interface GalkaMapy { kanal: number; cc: number; tryb: 'abs' | 'wzgl' | 'wzgl64' }
export interface MapaKontrolera {
    urzadzenie: string;
    pady: PadMapy[];
    galki: GalkaMapy[];
    joystick: { pitch: boolean; cc: { kanal: number; cc: number }[] };
    zmierzona: string | null; // ISO czasu pomiaru albo null
}

export const pustaMapa = (urzadzenie = ''): MapaKontrolera => ({ urzadzenie, pady: [], galki: [], joystick: { pitch: false, cc: [] }, zmierzona: null });

export type Rola =
    | { rola: 'klawisz'; wys: number; sila: number; puszczona: boolean }
    | { rola: 'pad'; indeks: number; sila: number; puszczona: boolean; zmierzony: boolean }
    | { rola: 'galka'; indeks: number; wartosc: number; zmiana: number; tryb: GalkaMapy['tryb'] }
    | { rola: 'joystick'; os: 'x' | 'y'; wartosc: number }
    | { rola: 'cc'; kanal: number; cc: number; wartosc: number }
    | { rola: 'inne' };

/** Zmiana enkodera względnego: „wzgl” = 1…63 w górę, 65…127 w dół (uzupełnienie do dwóch), „wzgl64” = 64 ± n. */
export function zmianaWzgledna(wartosc: number, tryb: GalkaMapy['tryb']) {
    if (tryb === 'wzgl64') return wartosc - 64;
    if (tryb === 'wzgl') return wartosc < 64 ? wartosc : wartosc - 128;
    return 0;
}

/** Co zrobił Suweren — wg zmierzonej mapy. */
export function rozpoznaj(w: Wiadomosc, m: MapaKontrolera): Rola {
    if (w.typ === 'nuta' || w.typ === 'puszczona') {
        const i = m.pady.findIndex((p) => p.kanal === w.kanal && p.wys === w.wys);
        const sila = w.typ === 'nuta' ? w.sila : 0;
        if (i >= 0) return { rola: 'pad', indeks: i, sila, puszczona: w.typ === 'puszczona', zmierzony: true };
        if (!m.pady.length && w.kanal === 9) return { rola: 'pad', indeks: (((w.wys - 36) % 8) + 8) % 8, sila, puszczona: w.typ === 'puszczona', zmierzony: false };
        return { rola: 'klawisz', wys: w.wys, sila, puszczona: w.typ === 'puszczona' };
    }
    if (w.typ === 'cc') {
        const g = m.galki.findIndex((x) => x.kanal === w.kanal && x.cc === w.cc);
        if (g >= 0) {
            const tryb = m.galki[g].tryb;
            return { rola: 'galka', indeks: g, wartosc: w.wartosc, zmiana: tryb === 'abs' ? 0 : zmianaWzgledna(w.wartosc, tryb), tryb };
        }
        const j = m.joystick.cc.findIndex((x) => x.kanal === w.kanal && x.cc === w.cc);
        if (j >= 0) return { rola: 'joystick', os: j === 0 && !m.joystick.pitch ? 'x' : 'y', wartosc: w.wartosc / 127 };
        return { rola: 'cc', kanal: w.kanal, cc: w.cc, wartosc: w.wartosc };
    }
    if (w.typ === 'pitch') return { rola: 'joystick', os: 'x', wartosc: w.wartosc };
    return { rola: 'inne' };
}

/** Tryb gałki z wartości zebranych przy kręceniu. */
export function trybGalki(wartosci: number[]): GalkaMapy['tryb'] {
    if (wartosci.length < 3) return 'abs';
    const rozne = new Set(wartosci);
    if (wartosci.every((v) => v >= 57 && v <= 71) && wartosci.some((v) => v !== 64) && rozne.size <= 6) return 'wzgl64';
    if (wartosci.every((v) => v <= 8 || v >= 120) && rozne.size <= 6) return 'wzgl';
    return 'abs';
}

export type EtapPomiaru = 'pady' | 'galki' | 'joystick' | 'gotowe';
export interface StanPomiaru {
    etap: EtapPomiaru;
    mapa: MapaKontrolera;
    zebrane: Record<string, number[]>; // wartości CC gałek: `${kanal}:${cc}` → wartości
}

export const startPomiaru = (urzadzenie: string): StanPomiaru => ({ etap: 'pady', mapa: pustaMapa(urzadzenie), zebrane: {} });

/**
 * Jeden krok pomiaru. Pady: każde nowe (kanał, nuta) = następny pad, po 8 → gałki.
 * Gałki: każde nowe (kanał, CC) = następna gałka (tryb liczony z jej wartości);
 * po 8 → joystick. Joystick: pitch bend i do 2 CC (ruch góra/dół). `nastepnyEtap` kończy etap wcześniej.
 */
export function krokPomiaru(s: StanPomiaru, w: Wiadomosc): StanPomiaru {
    const m = s.mapa;
    if (s.etap === 'pady' && w.typ === 'nuta') {
        if (m.pady.some((p) => p.kanal === w.kanal && p.wys === w.wys)) return s;
        const pady = [...m.pady, { kanal: w.kanal, wys: w.wys }];
        return { ...s, mapa: { ...m, pady }, etap: pady.length >= 8 ? 'galki' : 'pady' };
    }
    if (s.etap === 'galki' && w.typ === 'cc') {
        const k = `${w.kanal}:${w.cc}`;
        const zebrane = { ...s.zebrane, [k]: [...(s.zebrane[k] ?? []), w.wartosc] };
        const galki = m.galki.some((g) => g.kanal === w.kanal && g.cc === w.cc)
            ? m.galki.map((g) => (g.kanal === w.kanal && g.cc === w.cc ? { ...g, tryb: trybGalki(zebrane[k]) } : g))
            : m.galki.length < 8 ? [...m.galki, { kanal: w.kanal, cc: w.cc, tryb: trybGalki(zebrane[k]) }] : m.galki;
        // ósma gałka zmierzona i pokręcona kilka razy → joystick
        const etap: EtapPomiaru = galki.length >= 8 && (zebrane[`${galki[7].kanal}:${galki[7].cc}`]?.length ?? 0) >= 4 ? 'joystick' : 'galki';
        return { ...s, zebrane, mapa: { ...m, galki }, etap };
    }
    if (s.etap === 'joystick') {
        if (w.typ === 'pitch' && !m.joystick.pitch) return { ...s, mapa: { ...m, joystick: { ...m.joystick, pitch: true } } };
        if (w.typ === 'cc' && !m.galki.some((g) => g.kanal === w.kanal && g.cc === w.cc) && !m.joystick.cc.some((c) => c.kanal === w.kanal && c.cc === w.cc) && m.joystick.cc.length < 2) {
            return { ...s, mapa: { ...m, joystick: { ...m.joystick, cc: [...m.joystick.cc, { kanal: w.kanal, cc: w.cc }] } } };
        }
    }
    return s;
}

export function nastepnyEtap(s: StanPomiaru, kiedy = new Date().toISOString()): StanPomiaru {
    const kol: EtapPomiaru[] = ['pady', 'galki', 'joystick', 'gotowe'];
    const etap = kol[Math.min(kol.length - 1, kol.indexOf(s.etap) + 1)];
    return { ...s, etap, mapa: etap === 'gotowe' ? { ...s.mapa, zmierzona: kiedy } : s.mapa };
}

/** Wczytanie zapisanej mapy (localStorage) — złe dane = pusta mapa, nie wyjątek. */
export function oczyscMape(x: unknown): MapaKontrolera {
    const o = (x && typeof x === 'object' ? x : {}) as Partial<MapaKontrolera>;
    const n = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null);
    const pady = (Array.isArray(o.pady) ? o.pady : []).map((p) => ({ kanal: n(p?.kanal, 15), wys: n(p?.wys, 127) })).filter((p): p is PadMapy => p.kanal != null && p.wys != null).slice(0, 16);
    const galki = (Array.isArray(o.galki) ? o.galki : []).map((g) => ({ kanal: n(g?.kanal, 15), cc: n(g?.cc, 127), tryb: ['abs', 'wzgl', 'wzgl64'].includes(g?.tryb as string) ? g.tryb : 'abs' })).filter((g): g is GalkaMapy => g.kanal != null && g.cc != null).slice(0, 8);
    const jc = (Array.isArray(o.joystick?.cc) ? o.joystick!.cc : []).map((c) => ({ kanal: n(c?.kanal, 15), cc: n(c?.cc, 127) })).filter((c): c is { kanal: number; cc: number } => c.kanal != null && c.cc != null).slice(0, 2);
    return { urzadzenie: String(o.urzadzenie ?? '').slice(0, 80), pady, galki, joystick: { pitch: !!o.joystick?.pitch, cc: jc }, zmierzona: typeof o.zmierzona === 'string' ? o.zmierzona : null };
}
