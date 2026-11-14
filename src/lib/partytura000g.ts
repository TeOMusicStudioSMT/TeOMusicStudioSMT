/**
 * 🎼 0.00G Orchestra / Opodysk Score Visualizer — wspólny silnik świetlistej partytury (Suweren 2026-11-14).
 *
 * BLIŹNIAK: ten sam plik leży w TeO Story Studio (`src/lib/`), TeO Music Studio (`src/lib/`) i w portalu
 * teostory.studio (`src/`). Zmieniasz jeden — skopiuj do pozostałych.
 *
 * Bez zależności: Canvas 2D + WebAudio. Wszystko, co widać, jest POLICZONE Z DŹWIĘKU utworu:
 *  • nuty = cztery pasma częstotliwości miksu (bas 40–180 Hz, harmonia 180–420, 420–900, 900–2400 Hz); w każdej
 *    szesnastce (z BPM stacji) najsilniejszy prążek pasma daje wysokość nuty, a jego energia — czy nuta gra i jak mocno.
 *    To pasma MIKSU, nie rozdzielone ścieżki: warstwy „Kael” i „Elara” to rejestry, w których leżą ich głosy,
 *    a nie wyizolowany wokal.
 *  • GRAVITY / LOSS = 1 − (energia, która już wybrzmiała ÷ energia całego utworu): schodzi z 1.0000 do 0.0000G,
 *    szybciej w głośnych miejscach, stoi w ciszy.
 *  • KEY = zgodność chromagramu z najlepiej pasującą tonacją (profile Krumhansl–Kessler), PULSE = powtarzalność
 *    uderzeń co ćwierćnutę, HARMONY i MELODY = poziom swoich pasm, EXPRESSION = najwyższa dotąd dynamika
 *    (dochodzi do 100% w najgłośniejszym miejscu utworu).
 * Akty (epoki), wersy i kadry przychodzą ze storyboardu; bez analizy dźwięku silnik niczego nie udaje — pisze, że czeka.
 */

export interface AktPartytury { nr: number; nazwa: string; od: number; do: number; wersy: string[]; obraz?: string | null }
export interface DanePartytury {
  /** mały napis u góry, np. „0.00G DESCENT · FOR ELARA & KAEL” */
  naglowek: string;
  bpm: number;
  sekundy: number;
  akty: AktPartytury[];
  /** słowo przed numerem aktu (domyślnie EPOCH) */
  slowoAktu?: string;
  /** dźwięk jest jednym aktem z `n` (portal gra akt po akcie): krzywa GRAVITY liczy się w skali całej księgi */
  segment?: { i: number; n: number };
}
export interface Nuta { w: number; od: number; do: number; midi: number; sila: number }
export interface Analiza {
  krok: number; sekundy: number; nuty: Nuta[]; zakres: [number, number][];
  strata: Float32Array; key: Float32Array; pulse: Float32Array; harmony: Float32Array; melody: Float32Array; expression: Float32Array;
}

export const WARSTWY = [
  { nazwa: 'Bas / Kontrabas', kolor: '#5fd8ee', pasmo: [40, 180] },
  { nazwa: 'Harmonia / Rhodes', kolor: '#8d7cf2', pasmo: [180, 420] },
  { nazwa: 'Kael', kolor: '#e3a84c', pasmo: [420, 900] },
  { nazwa: 'Elara', kolor: '#ea7a92', pasmo: [900, 2400] },
] as const;
const DUR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MOLL = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const ogr = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const a = re[i]; re[i] = re[j]; re[j] = a; const b = im[i]; im[i] = im[j]; im[j] = b; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const kat = (-2 * Math.PI) / len, wr = Math.cos(kat), wi = Math.sin(kat);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const percentyl = (t: ArrayLike<number>, p: number) => { const s = Array.from(t).filter((x) => x > 0).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
function wygladz(t: Float32Array, okno: number) {
  const w = new Float32Array(t.length); let s = 0;
  for (let i = 0; i < t.length; i++) { s += t[i]; if (i >= okno) s -= t[i - okno]; w[i] = s / Math.min(i + 1, okno); }
  return w;
}
function korelacja(a: number[], b: number[]) {
  let sa = 0, sb = 0; for (let i = 0; i < 12; i++) { sa += a[i]; sb += b[i]; }
  sa /= 12; sb /= 12; let l = 0, ma = 0, mb = 0;
  for (let i = 0; i < 12; i++) { const x = a[i] - sa, y = b[i] - sb; l += x * y; ma += x * x; mb += y * y; }
  return ma && mb ? l / Math.sqrt(ma * mb) : 0;
}

/** Analiza próbek mono — czysta funkcja (testowalna bez przeglądarki). */
export function analizujProbki(mono: Float32Array, sr: number, bpm: number): Analiza {
  const d = Math.max(1, Math.floor(sr / 11025)), fs = sr / d;
  const x = new Float32Array(Math.floor(mono.length / d));
  for (let i = 0; i < x.length; i++) { let s = 0; for (let j = 0; j < d; j++) s += mono[i * d + j]; x[i] = s / d; }
  const N = 2048, krok = 60 / (bpm > 0 ? bpm : 120) / 4, sekundy = x.length / fs, kroki = Math.max(1, Math.floor(sekundy / krok));
  const hann = new Float32Array(N); for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
  const re = new Float32Array(N), im = new Float32Array(N), mag = new Float32Array(N / 2), poprz = new Float32Array(N / 2);
  const amp = WARSTWY.map(() => new Float32Array(kroki)), wys = WARSTWY.map(() => new Float32Array(kroki));
  const chroma = new Float32Array(kroki * 12), flux = new Float32Array(kroki), rms = new Float32Array(kroki);
  const bin = (hz: number) => Math.round((hz * N) / fs), gora = Math.min(N / 2 - 2, bin(2400));
  for (let k = 0; k < kroki; k++) {
    const start = Math.round((k + 0.5) * krok * fs - N / 2);
    for (let i = 0; i < N; i++) { const p = start + i; re[i] = p >= 0 && p < x.length ? x[p] * hann[i] : 0; im[i] = 0; }
    fft(re, im);
    let f = 0;
    for (let i = 1; i <= gora + 1; i++) { mag[i] = Math.hypot(re[i], im[i]); if (mag[i] > poprz[i]) f += mag[i] - poprz[i]; }
    poprz.set(mag); flux[k] = f;
    let razem = 0;
    WARSTWY.forEach((w, b) => {
      const lo = Math.max(2, bin(w.pasmo[0])), hi = Math.min(gora, bin(w.pasmo[1]));
      let e = 0, p = lo;
      for (let i = lo; i <= hi; i++) { e += mag[i] * mag[i]; if (mag[i] > mag[p]) p = i; }
      const A = mag[p - 1], B = mag[p], C = mag[p + 1], m = A - 2 * B + C, hz = ((p + (m ? (0.5 * (A - C)) / m : 0)) * fs) / N;
      amp[b][k] = Math.sqrt(e); wys[b][k] = hz > 0 ? 69 + 12 * Math.log2(hz / 440) : 0; razem += e;
    });
    rms[k] = Math.sqrt(razem);
    for (let i = bin(60); i <= Math.min(gora, bin(2000)); i++) { const pc = ((Math.round(69 + 12 * Math.log2((i * fs) / N / 440)) % 12) + 12) % 12; chroma[k * 12 + pc] += mag[i] * mag[i]; }
  }
  // nuty: pasmo gra, gdy jego poziom przekracza część mediany; nowa nuta przy zmianie półtonu albo wyraźnym ponownym uderzeniu
  const nuty: Nuta[] = [], zakres: [number, number][] = [];
  WARSTWY.forEach((_, b) => {
    const prog = 0.5 * percentyl(amp[b], 0.5), szczyt = percentyl(amp[b], 0.95) || 1, moje: Nuta[] = [];
    let cur: { k0: number; k1: number; midi: number; max: number } | null = null;
    const zamknij = () => { if (cur) moje.push({ w: b, od: cur.k0 * krok, do: cur.k1 * krok, midi: cur.midi, sila: ogr(cur.max / szczyt) }); cur = null; };
    for (let k = 0; k < kroki; k++) {
      const a = amp[b][k], m = Math.round(wys[b][k]);
      if (!(a > prog && prog > 0)) { zamknij(); continue; }
      const c = cur as { k0: number; k1: number; midi: number; max: number } | null;
      if (c && c.midi === m && k - c.k0 < 32 && !(k - c.k0 >= 2 && a > 1.7 * amp[b][k - 1])) { c.k1 = k + 1; if (a > c.max) c.max = a; }
      else { zamknij(); cur = { k0: k, k1: k + 1, midi: m, max: a }; }
    }
    zamknij();
    const m = moje.map((n) => n.midi).sort((p, q) => p - q);
    zakres.push(m.length ? [m[Math.floor(m.length * 0.04)], m[Math.min(m.length - 1, Math.floor(m.length * 0.96))]] : [0, 1]);
    nuty.push(...moje);
  });
  nuty.sort((p, q) => p.od - q.od);
  // GRAVITY / LOSS: ile energii utworu jeszcze nie wybrzmiało
  const strata = new Float32Array(kroki); let suma = 0, cum = 0;
  for (let k = 0; k < kroki; k++) suma += rms[k];
  for (let k = 0; k < kroki; k++) { cum += rms[k]; strata[k] = suma ? 1 - cum / suma : 1 - (k + 1) / kroki; }
  // wskaźniki
  const key = new Float32Array(kroki), pulse = new Float32Array(kroki), okno = 64, ch = new Array<number>(12).fill(0);
  let licz = 0, mian = 0;
  for (let k = 0; k < kroki; k++) {
    for (let p = 0; p < 12; p++) { ch[p] += chroma[k * 12 + p]; if (k >= okno) ch[p] -= chroma[(k - okno) * 12 + p]; }
    let r = 0;
    for (let rot = 0; rot < 12; rot++) { const obr = ch.map((_, i) => ch[(i + rot) % 12]); r = Math.max(r, korelacja(obr, DUR), korelacja(obr, MOLL)); }
    key[k] = ogr((r - 0.3) / 0.5);
    mian += flux[k] * flux[k]; if (k >= 4) licz += flux[k] * flux[k - 4];
    if (k >= okno) { mian -= flux[k - okno] * flux[k - okno]; if (k - okno >= 4) licz -= flux[k - okno] * flux[k - okno - 4]; }
    pulse[k] = mian > 0 ? ogr((licz / mian - 0.15) / 0.6) : 0;
  }
  const poziom = (t: Float32Array) => { const s = wygladz(t, 16), sz = percentyl(s, 0.95) || 1; return s.map((v) => ogr(v / sz)); };
  const mel = new Float32Array(kroki); for (let k = 0; k < kroki; k++) mel[k] = amp[2][k] + amp[3][k];
  const dyn = wygladz(rms, 32); let lo = Infinity, hi = 0; for (const v of dyn) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const expression = new Float32Array(kroki); let naj = 0;
  for (let k = 0; k < kroki; k++) { const v = hi > lo ? (dyn[k] - lo) / (hi - lo) : 0; if (v > naj) naj = v; expression[k] = naj; }
  return { krok, sekundy, nuty, zakres, strata, key: wygladz(key, 8), pulse: wygladz(pulse, 8), harmony: poziom(amp[1]), melody: poziom(mel), expression };
}

const schowek = new Map<string, Promise<Analiza>>();
/** Pobiera plik dźwiękowy, dekoduje go WebAudio i analizuje (wynik pamiętany na adres + BPM). */
export function analizujAudio(url: string, bpm: number): Promise<Analiza> {
  const klucz = `${url}|${bpm}`;
  let p = schowek.get(klucz);
  if (!p) {
    p = (async () => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Nie pobrałem dźwięku (HTTP ${r.status}).`);
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      try {
        const buf = await ctx.decodeAudioData(await r.arrayBuffer());
        const mono = new Float32Array(buf.length);
        for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) mono[i] += d[i] / buf.numberOfChannels; }
        return analizujProbki(mono, buf.sampleRate, bpm);
      } finally { void ctx.close(); }
    })();
    p.catch(() => schowek.delete(klucz));
    schowek.set(klucz, p);
  }
  return p;
}

const wartosc = (t: Float32Array, a: Analiza, czas: number) => { const i = Math.max(0, Math.min(t.length - 1, czas / a.krok - 0.5)), j = Math.floor(i), f = i - j; return t[j] * (1 - f) + t[Math.min(t.length - 1, j + 1)] * f; };
/** GRAVITY w chwili `czas` (w trybie segmentu: w skali całej księgi). */
export function grawitacja(d: DanePartytury, a: Analiza, czas: number) {
  const g = czas <= 0 ? 1 : czas >= a.sekundy ? 0 : wartosc(a.strata, a, czas);
  return d.segment ? 1 - (d.segment.i + (1 - g)) / Math.max(1, d.segment.n) : g;
}
export const aktW = (d: DanePartytury, czas: number) => d.akty.find((x) => czas >= x.od && czas < x.do) ?? (czas < (d.akty[0]?.od ?? 0) ? d.akty[0] : d.akty[d.akty.length - 1]) ?? null;
export function wersW(akt: AktPartytury | null, czas: number) {
  if (!akt || !akt.wersy.length) return '';
  return akt.wersy[Math.max(0, Math.min(akt.wersy.length - 1, Math.floor(((czas - akt.od) / Math.max(0.1, akt.do - akt.od)) * akt.wersy.length)))];
}

export interface OpcjeRysunku { tlo?: CanvasImageSource | null; tloPoprz?: CanvasImageSource | null; mieszanie?: number; ruch?: number; stan?: string }
const SZERYF = '"Cormorant Garamond", "EB Garamond", Georgia, "Times New Roman", serif', PROSTY = '"Inter", "Helvetica Neue", Arial, sans-serif';
const TORY: [number, number][] = [[0.74, 0.93], [0.5, 0.7], [0.08, 0.42], [0.15, 0.49]];   // pas partytury każdej warstwy (ułamki wysokości)

function okladka(c: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number, skala: number, alfa: number) {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width, ih = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height;
  if (!iw || !ih) return;
  const s = Math.max(w / iw, h / ih) * skala;
  c.globalAlpha = alfa; c.drawImage(img, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s); c.globalAlpha = 1;
}
function kapsula(c: CanvasRenderingContext2D, x: number, y: number, dl: number, wys: number) {
  const r = wys / 2; c.beginPath(); c.moveTo(x + r, y - r); c.lineTo(x + dl - r, y - r); c.arc(x + dl - r, y, r, -Math.PI / 2, Math.PI / 2); c.lineTo(x + r, y + r); c.arc(x + r, y, r, Math.PI / 2, -Math.PI / 2); c.closePath();
}
function napis(c: CanvasRenderingContext2D, t: string, x: number, y: number, font: string, kolor: string, wyrownanie: CanvasTextAlign = 'left', odstep = 0) {
  c.font = font; c.fillStyle = kolor; c.textAlign = wyrownanie; c.textBaseline = 'middle';
  (c as unknown as { letterSpacing: string }).letterSpacing = `${odstep}px`;
  c.fillText(t, x, y);
  (c as unknown as { letterSpacing: string }).letterSpacing = '0px';
}

/** Rysuje jedną klatkę partytury dla czasu `t` (sekundy dźwięku). Deterministyczne: ten sam czas = ta sama klatka. */
export function rysujPartyture(c: CanvasRenderingContext2D, w: number, h: number, d: DanePartytury, a: Analiza | null, t: number, o: OpcjeRysunku = {}) {
  const s = w / 1280, bpm = d.bpm > 0 ? d.bpm : 120, akt = aktW(d, t);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.shadowBlur = 0; c.globalAlpha = 1;
  // tło: głęboka noc, a w Fuzji kadr opowieści pod ciemną zasłoną
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#080a14'); g.addColorStop(0.55, '#05060d'); g.addColorStop(1, '#030408');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  if (o.tlo || o.tloPoprz) {
    const m = o.mieszanie ?? 1, ruch = 1.03 + 0.09 * ogr(o.ruch ?? 0);
    if (o.tloPoprz && m < 1) okladka(c, o.tloPoprz, w, h, 1.12, 1);
    if (o.tlo) okladka(c, o.tlo, w, h, ruch, m);
    c.fillStyle = 'rgba(4,5,12,0.26)'; c.fillRect(0, 0, w, h);
    const pas = c.createLinearGradient(0, 0, 0, h); pas.addColorStop(0, 'rgba(3,4,10,0.72)'); pas.addColorStop(0.2, 'rgba(3,4,10,0)'); pas.addColorStop(0.76, 'rgba(3,4,10,0)'); pas.addColorStop(1, 'rgba(3,4,10,0.86)');
    c.fillStyle = pas; c.fillRect(0, 0, w, h);
    const v = c.createRadialGradient(w / 2, h * 0.48, h * 0.1, w / 2, h * 0.48, h * 0.85); v.addColorStop(0, 'rgba(4,5,12,0)'); v.addColorStop(1, 'rgba(2,3,8,0.42)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  }
  const x0 = w * 0.055, x1 = w * 0.945, W = x1 - x0, y0 = h * 0.17, y1 = h * 0.8, H = y1 - y0, cx = x0 + W / 2;
  const blask = c.createRadialGradient(cx, y0 + H * 0.5, 0, cx, y0 + H * 0.5, W * 0.3); blask.addColorStop(0, 'rgba(70,90,190,0.13)'); blask.addColorStop(1, 'rgba(70,90,190,0)');
  c.fillStyle = blask; c.fillRect(x0, y0, W, H);

  // ── górny pasek telemetrii ──
  napis(c, d.naglowek.toUpperCase(), w / 2, h * 0.028, `500 ${10 * s}px ${PROSTY}`, 'rgba(206,210,226,0.78)', 'center', 3.2 * s);
  if (akt) {
    const e = `${d.slowoAktu ?? 'EPOCH'} ${akt.nr}`;
    napis(c, e, x0, h * 0.062, `600 ${27 * s}px ${PROSTY}`, '#d8d4c8', 'left', 3.5 * s);
    c.font = `600 ${27 * s}px ${PROSTY}`; (c as unknown as { letterSpacing: string }).letterSpacing = `${3.5 * s}px`;
    const dx = c.measureText(e).width; (c as unknown as { letterSpacing: string }).letterSpacing = '0px';
    napis(c, akt.nazwa.toUpperCase().slice(0, 34), x0 + dx + 14 * s, h * 0.066, `500 ${12.5 * s}px ${PROSTY}`, 'rgba(216,212,200,0.72)', 'left', 2.6 * s);
  }
  const grav = a ? grawitacja(d, a, t) : null, koniec = grav !== null && (grav < 0.00005 || t >= d.sekundy - 0.05);
  const liczba = grav === null ? '—' : koniec ? '0.0000G' : grav.toFixed(4);
  napis(c, liczba, x1, h * 0.062, `300 ${20 * s}px ${PROSTY}`, koniec ? '#f0c56a' : '#e6dfc8', 'right', 1.2 * s);
  c.font = `300 ${20 * s}px ${PROSTY}`; const lw = c.measureText(liczba).width + 14 * s;
  napis(c, 'GRAVITY', x1 - lw, h * 0.064, `500 ${9 * s}px ${PROSTY}`, 'rgba(190,196,214,0.55)', 'right', 2.6 * s);
  const krokNr = String(Math.max(0, Math.floor((t * bpm) / 60)));
  c.font = `500 ${9 * s}px ${PROSTY}`; const gw = c.measureText('GRAVITY').width + 7 * 2.6 * s + 34 * s;
  napis(c, krokNr, x1 - lw - gw, h * 0.062, `300 ${20 * s}px ${PROSTY}`, '#e6dfc8', 'right', 1.2 * s);
  c.font = `300 ${20 * s}px ${PROSTY}`; const kw = c.measureText(krokNr).width + 14 * s;
  napis(c, 'STEP', x1 - lw - gw - kw, h * 0.064, `500 ${9 * s}px ${PROSTY}`, 'rgba(190,196,214,0.55)', 'right', 2.6 * s);
  // poetycka kursywa: wers śpiewany w tej chwili
  const wers = wersW(akt, t);
  if (wers) {
    let px = 27 * s; c.font = `italic 500 ${px}px ${SZERYF}`;
    while (c.measureText(wers).width > W * 0.86 && px > 13 * s) { px -= s; c.font = `italic 500 ${px}px ${SZERYF}`; }
    c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 10 * s;
    napis(c, wers, w / 2, h * 0.118, `italic 500 ${px}px ${SZERYF}`, '#f1ece0', 'center');
    c.shadowBlur = 0;
  }

  // ── partytura ──
  const sekOkna = (16 * 60) / bpm, pps = W / sekOkna, takt = (4 * 60) / bpm;
  c.save(); c.beginPath(); c.rect(x0, y0 - 4 * s, W, H + 8 * s); c.clip();
  for (let n = Math.ceil((t - sekOkna / 2) / takt); n * takt <= t + sekOkna / 2; n++) {
    if (n < 0) continue;
    const x = cx + (n * takt - t) * pps;
    c.fillStyle = n % 4 === 0 ? 'rgba(160,170,210,0.16)' : 'rgba(160,170,210,0.07)'; c.fillRect(x, y0, Math.max(1, s), H);
  }
  if (a) {
    const ch = 10 * s;
    for (const n of a.nuty) {
      if (n.do < t - sekOkna / 2 - 1) continue;
      if (n.od > t + sekOkna / 2) break;
      const [lo, hi] = a.zakres[n.w], tor = TORY[n.w], u = hi > lo ? ogr((n.midi - lo) / (hi - lo)) : 0.5;
      const y = y0 + H * (tor[1] - u * (tor[1] - tor[0])), xa = cx + (n.od - t) * pps, dl = Math.max(ch, (n.do - n.od) * pps - 2 * s), kolor = WARSTWY[n.w].kolor;
      const gra = t >= n.od && t < n.do, bylo = n.do <= t, moc = 0.45 + 0.55 * n.sila;
      c.globalAlpha = (bylo ? 0.68 : 0.9) * moc;
      if (gra) { c.shadowColor = kolor; c.shadowBlur = 20 * s; c.globalAlpha = 1; }
      kapsula(c, xa, y, dl, ch); c.fillStyle = gra ? `${kolor}33` : 'rgba(10,13,26,0.55)'; c.fill();
      c.lineWidth = Math.max(1, 1.1 * s); c.strokeStyle = kolor; c.stroke();
      c.beginPath(); c.arc(xa + ch / 2, y, ch / 2, 0, Math.PI * 2); c.fillStyle = kolor; c.fill();
      if (gra) {
        const puls = 1 - (t - n.od) / Math.max(0.05, n.do - n.od);
        c.beginPath(); c.arc(cx, y, ch * 0.62, 0, Math.PI * 2); c.fillStyle = '#ffffff'; c.globalAlpha = 0.9; c.fill();
        c.beginPath(); c.arc(cx, y, ch * (1.15 + 0.9 * (1 - puls)), 0, Math.PI * 2); c.strokeStyle = kolor; c.globalAlpha = 0.55 * puls; c.lineWidth = 1.4 * s; c.stroke();
      }
      c.shadowBlur = 0; c.globalAlpha = 1;
    }
  }
  c.restore();
  if (!a || o.stan) napis(c, o.stan || 'Wczytuję i analizuję dźwięk utworu…', cx, y0 + H * 0.5 + (a ? H * 0.42 : 0), `400 ${13 * s}px ${PROSTY}`, 'rgba(240,197,106,0.85)', 'center', s);
  // złoty promień
  const zl = c.createLinearGradient(0, y0, 0, y1); zl.addColorStop(0, 'rgba(255,214,150,0.95)'); zl.addColorStop(0.5, 'rgba(240,180,110,0.9)'); zl.addColorStop(1, 'rgba(240,170,100,0.35)');
  c.shadowColor = 'rgba(255,190,110,0.9)'; c.shadowBlur = 14 * s; c.fillStyle = zl; c.fillRect(cx - Math.max(1, s), y0 - 6 * s, Math.max(2, 2 * s), H + 6 * s); c.shadowBlur = 0;
  c.beginPath(); c.moveTo(cx - 5 * s, y0 - 14 * s); c.lineTo(cx + 5 * s, y0 - 14 * s); c.lineTo(cx, y0 - 6 * s); c.closePath(); c.fillStyle = '#f3e3c2'; c.fill();

  // ── dół: krzywa GRAVITY → 0.00G ──
  const bx = x0, bw = w * 0.37, by = h * 0.875, bh = h * 0.085, etyk = `500 ${8.5 * s}px ${PROSTY}`, cichy = 'rgba(190,196,214,0.5)';
  napis(c, 'LOSS → 0.00G', bx, by - 16 * s, etyk, cichy, 'left', 2.4 * s);
  napis(c, '1.0', bx - 8 * s, by, etyk, cichy, 'right'); napis(c, '0', bx - 8 * s, by + bh, etyk, cichy, 'right');
  c.fillStyle = 'rgba(160,170,210,0.12)'; c.fillRect(bx, by + bh, bw, Math.max(1, s));
  const seg = d.segment, calosc = seg ? seg.n : 1, tx = (ulamek: number) => bx + bw * ulamek;
  d.akty.forEach((x) => { const u = seg ? (x.nr - 1) / calosc : x.od / Math.max(1, d.sekundy); napis(c, String(x.nr), tx(u), by + bh + 13 * s, etyk, akt && x.nr === akt.nr ? '#f0c56a' : cichy, 'left'); });
  if (a && grav !== null) {
    const pocz = seg ? seg.i / calosc : 0, teraz = seg ? (seg.i + ogr(t / a.sekundy)) / calosc : ogr(t / Math.max(1, d.sekundy));
    c.beginPath(); c.moveTo(bx, by);
    if (seg) c.lineTo(tx(pocz), by + bh * (seg.i / calosc));
    const ile = 160;
    for (let i = 0; i <= ile; i++) { const tt = (t * i) / ile; c.lineTo(tx(pocz + (teraz - pocz) * (i / ile)), by + bh * (1 - grawitacja(d, a, tt))); }
    c.strokeStyle = '#f0d9a0'; c.lineWidth = 2 * s; c.lineJoin = 'round'; c.shadowColor = 'rgba(255,200,120,0.9)'; c.shadowBlur = 10 * s; c.stroke();
    c.beginPath(); c.arc(tx(teraz), by + bh * (1 - grav), 3.6 * s, 0, Math.PI * 2); c.fillStyle = '#fff3d6'; c.fill(); c.shadowBlur = 0;
  }
  // ── dół: pięć wskaźników ──
  const paski: [string, Float32Array | null][] = [['KEY', a?.key ?? null], ['PULSE', a?.pulse ?? null], ['HARMONY', a?.harmony ?? null], ['MELODY', a?.melody ?? null], ['EXPRESSION', a?.expression ?? null]];
  const px0 = w * 0.752, pw = w * 0.158, py = h * 0.855, pd = h * 0.0285;
  paski.forEach(([nazwa, tab], i) => {
    const y = py + i * pd, v = a && tab ? ogr(wartosc(tab, a, Math.min(t, a.sekundy))) : 0;
    napis(c, nazwa, px0 - 12 * s, y, `600 ${9 * s}px ${PROSTY}`, v > 0.02 ? '#dcd8cc' : cichy, 'right', 2.4 * s);
    c.fillStyle = 'rgba(160,170,210,0.16)'; kapsula(c, px0, y, pw, 3.4 * s); c.fill();
    if (v > 0.004) { c.fillStyle = '#f4f1e8'; c.shadowColor = 'rgba(255,255,255,0.7)'; c.shadowBlur = 6 * s; kapsula(c, px0, y, Math.max(3.4 * s, pw * v), 3.4 * s); c.fill(); c.shadowBlur = 0; }
    napis(c, a ? `${Math.round(v * 100)}%` : '—', px0 + pw + 16 * s, y, `400 ${9.5 * s}px ${PROSTY}`, cichy, 'left', s);
  });
  c.restore();
}

export interface Partytura { ustawAnalize(a: Analiza | null, stan?: string): void; ustawDane(d: DanePartytury): void; ustawFuzje(f: boolean): void; stop(): void }
/**
 * Żywa partytura na płótnie: co klatkę pyta `czas()` (sekundy dźwięku) i rysuje. `dopasuj` = rozdzielczość płótna idzie
 * za jego rozmiarem na ekranie; bez niego rysuje w rozmiarze ustawionym przez gospodarza (np. 1920×1080 do nagrania).
 * `dlaNagrania` ładuje kadry z CORS-em, żeby płótno dało się nagrać (captureStream).
 */
export function utworzPartyture(canvas: HTMLCanvasElement, o: { dane: DanePartytury; czas: () => number; fuzja?: boolean; dopasuj?: boolean; dlaNagrania?: boolean }): Partytura {
  let dane = o.dane, analiza: Analiza | null = null, stan = '', fuzja = !!o.fuzja, raf = 0, zywa = true;
  const obrazy = new Map<string, HTMLImageElement>();
  const laduj = () => dane.akty.forEach((x) => { if (x.obraz && !obrazy.has(x.obraz)) { const i = new Image(); if (o.dlaNagrania) i.crossOrigin = 'anonymous'; i.src = x.obraz; obrazy.set(x.obraz, i); } });
  const gotowy = (adres?: string | null) => { const i = adres ? obrazy.get(adres) : null; return i && i.complete && i.naturalWidth ? i : null; };
  let aktNr = -1, zmiana = 0, poprz: HTMLImageElement | null = null, biezacy: HTMLImageElement | null = null;
  const klatka = () => {
    if (!zywa) return;
    if (o.dopasuj) { const r = Math.min(2, window.devicePixelRatio || 1), cw = Math.round(canvas.clientWidth * r), chh = Math.round(canvas.clientHeight * r); if (cw && chh && (canvas.width !== cw || canvas.height !== chh)) { canvas.width = cw; canvas.height = chh; } }
    const c = canvas.getContext('2d');
    if (c && canvas.width && canvas.height) {
      const t = o.czas(), akt = aktW(dane, t), teraz = performance.now();
      let op: OpcjeRysunku = { stan };
      if (fuzja && akt) {
        if (akt.nr !== aktNr) { poprz = biezacy; aktNr = akt.nr; zmiana = teraz; }
        biezacy = gotowy(akt.obraz) ?? biezacy;
        op = { stan, tlo: biezacy, tloPoprz: poprz, mieszanie: ogr((teraz - zmiana) / 1400), ruch: (t - akt.od) / Math.max(0.1, akt.do - akt.od) };
      }
      rysujPartyture(c, canvas.width, canvas.height, dane, analiza, t, op);
    }
    raf = requestAnimationFrame(klatka);
  };
  laduj(); raf = requestAnimationFrame(klatka);
  return {
    ustawAnalize(a, s = '') { analiza = a; stan = s; },
    ustawDane(d) { dane = d; aktNr = -1; laduj(); },
    ustawFuzje(f) { fuzja = f; },
    stop() { zywa = false; cancelAnimationFrame(raf); },
  };
}
