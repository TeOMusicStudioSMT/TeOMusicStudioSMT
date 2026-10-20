/**
 * 🎹 Jam z Joanną — BRZMIENIE (WebAudio, lokalnie, bez próbek z sieci).
 *
 * Klawisze Suwerena = syntezator (piła + kwadrat), Joanna = dzwonkowy trójkąt + sinus,
 * pady = perkusja syntezowana (stopa, werbel, hi-haty, klask, tomy, obręcz).
 * Tor: głosy → filtr (jasność) → sucho + pogłos (splot z wygenerowanego ogona) → głośność →
 * kompresor → głośniki ORAZ nagrywarka. Metronom idzie tylko do głośników (nie do nagrania).
 */

export type Kto = 'suweren' | 'joanna';
export const PADY = [
    { id: 'stopa', nazwa: 'Stopa' }, { id: 'werbel', nazwa: 'Werbel' }, { id: 'hihat', nazwa: 'Hi-hat' }, { id: 'hihatOtw', nazwa: 'Hi-hat otw.' },
    { id: 'klask', nazwa: 'Klask' }, { id: 'tomNiski', nazwa: 'Tom niski' }, { id: 'tomWysoki', nazwa: 'Tom wysoki' }, { id: 'obrecz', nazwa: 'Obręcz' },
] as const;
/** Nuty GM perkusji do pliku .mid (kanał 10). */
export const NUTY_GM_PADOW = [36, 38, 42, 46, 39, 45, 50, 37];

const hz = (wys: number) => 440 * 2 ** ((wys - 69) / 12);

interface Glos { osc: OscillatorNode[]; baza: number[]; g: GainNode; kto: Kto; wys: number }

export class SilnikJamu {
    readonly ctx: AudioContext;
    private filtr: BiquadFilterNode;
    private sucho: GainNode;
    private mokro: GainNode;
    private master: GainNode;
    private szyny: Record<Kto | 'perkusja', GainNode>;
    private metronomG: GainNode;
    private szum: AudioBuffer;
    private glosy = new Map<string, Glos>();
    private odstrojenie = 0; // półtony z joysticka
    private vibrato: OscillatorNode;
    private vibratoG: GainNode;
    readonly nagrywarka: MediaStreamAudioDestinationNode;

    constructor() {
        const ctx = new AudioContext({ latencyHint: 'interactive' });
        this.ctx = ctx;
        this.filtr = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 6000, Q: 0.8 });
        this.sucho = new GainNode(ctx, { gain: 1 });
        this.mokro = new GainNode(ctx, { gain: 0.25 });
        this.master = new GainNode(ctx, { gain: 0.8 });
        const komp = new DynamicsCompressorNode(ctx, { threshold: -14, ratio: 4, attack: 0.005, release: 0.2 });
        const poglos = new ConvolverNode(ctx, { buffer: this.ogon(2.6) });
        this.szyny = { suweren: new GainNode(ctx, { gain: 0.9 }), joanna: new GainNode(ctx, { gain: 0.8 }), perkusja: new GainNode(ctx, { gain: 0.9 }) };
        this.szyny.suweren.connect(new StereoPannerNode(ctx, { pan: -0.2 })).connect(this.filtr);
        this.szyny.joanna.connect(new StereoPannerNode(ctx, { pan: 0.25 })).connect(this.filtr);
        this.szyny.perkusja.connect(this.filtr);
        this.filtr.connect(this.sucho).connect(this.master);
        this.filtr.connect(poglos).connect(this.mokro).connect(this.master);
        this.master.connect(komp);
        komp.connect(ctx.destination);
        this.nagrywarka = ctx.createMediaStreamDestination();
        komp.connect(this.nagrywarka);
        this.metronomG = new GainNode(ctx, { gain: 0.35 });
        this.metronomG.connect(ctx.destination);
        this.szum = this.bufSzumu(1);
        this.vibrato = new OscillatorNode(ctx, { frequency: 5.5 });
        this.vibratoG = new GainNode(ctx, { gain: 0 });
        this.vibrato.connect(this.vibratoG);
        this.vibrato.start();
    }

    private bufSzumu(s: number) {
        const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * s), this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return b;
    }
    private ogon(s: number) {
        const n = Math.floor(this.ctx.sampleRate * s);
        const b = this.ctx.createBuffer(2, n, this.ctx.sampleRate);
        for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3; }
        return b;
    }

    wznow() { return this.ctx.state === 'suspended' ? this.ctx.resume() : Promise.resolve(); }

    // ── gałki ───────────────────────────────────────────────
    ustawJasnosc(x: number) { this.filtr.frequency.setTargetAtTime(250 * 2 ** (Math.max(0, Math.min(1, x)) * 6.3), this.ctx.currentTime, 0.03); }
    ustawPoglos(x: number) { this.mokro.gain.setTargetAtTime(Math.max(0, Math.min(1, x)) * 0.9, this.ctx.currentTime, 0.05); }
    ustawGlosnosc(x: number) { this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, x)), this.ctx.currentTime, 0.03); }
    ustawSzyne(kto: Kto | 'perkusja', x: number) { this.szyny[kto].gain.setTargetAtTime(Math.max(0, Math.min(1.2, x)), this.ctx.currentTime, 0.03); }
    ustawMetronom(x: number) { this.metronomG.gain.setTargetAtTime(Math.max(0, Math.min(1, x)), this.ctx.currentTime, 0.03); }
    /** Joystick X: −1…1 → ±2 półtony dla grających klawiszy Suwerena. */
    ustawOdstrojenie(x: number) {
        this.odstrojenie = Math.max(-1, Math.min(1, x)) * 2;
        for (const g of this.glosy.values()) if (g.kto === 'suweren') g.osc.forEach((o, i) => o.detune.setTargetAtTime(this.odstrojenie * 100 + g.baza[i], this.ctx.currentTime, 0.01));
    }
    /** Joystick Y: 0…1 → głębokość vibrato (centy). */
    ustawVibrato(x: number) { this.vibratoG.gain.setTargetAtTime(Math.max(0, Math.min(1, x)) * 40, this.ctx.currentTime, 0.05); }

    // ── klawisze ────────────────────────────────────────────
    nutaWl(wys: number, sila: number, kto: Kto = 'suweren', kiedy = 0, klucz = `${kto}:${wys}`) {
        const t = Math.max(this.ctx.currentTime, kiedy || 0);
        this.nutaWyl(klucz, t);
        const v = Math.max(0.02, sila / 127);
        const g = new GainNode(this.ctx, { gain: 0 });
        const osc: OscillatorNode[] = [];
        const baza = kto === 'suweren' ? [0, 7] : [0, 0];
        if (kto === 'suweren') {
            osc.push(new OscillatorNode(this.ctx, { type: 'sawtooth', frequency: hz(wys), detune: this.odstrojenie * 100 }));
            osc.push(new OscillatorNode(this.ctx, { type: 'square', frequency: hz(wys), detune: this.odstrojenie * 100 + 7 }));
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.22 * v, t + 0.006);
            g.gain.setTargetAtTime(0.13 * v, t + 0.006, 0.12);
        } else {
            osc.push(new OscillatorNode(this.ctx, { type: 'triangle', frequency: hz(wys) }));
            osc.push(new OscillatorNode(this.ctx, { type: 'sine', frequency: hz(wys) * 2 }));
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.32 * v, t + 0.01);
            g.gain.setTargetAtTime(0.1 * v, t + 0.01, 0.35);
        }
        const mix = new GainNode(this.ctx, { gain: 1 });
        osc.forEach((o, i) => {
            this.vibratoG.connect(o.detune);
            if (i === 1) { const p = new GainNode(this.ctx, { gain: kto === 'suweren' ? 0.5 : 0.25 }); o.connect(p).connect(mix); } else o.connect(mix);
            o.start(t);
        });
        mix.connect(g).connect(this.szyny[kto]);
        this.glosy.set(klucz, { osc, baza, g, kto, wys });
    }
    nutaWyl(klucz: string, kiedy = 0) {
        const gl = this.glosy.get(klucz);
        if (!gl) return;
        this.glosy.delete(klucz);
        const t = Math.max(this.ctx.currentTime, kiedy || 0);
        const rel = gl.kto === 'suweren' ? 0.18 : 0.45;
        gl.g.gain.cancelScheduledValues(t);
        gl.g.gain.setTargetAtTime(0, t, rel / 3);
        for (const o of gl.osc) o.stop(t + rel * 2);
    }
    /** Nuta z góry zaplanowana (odpowiedź Joanny): start i koniec w czasie AudioContext. */
    zagraj(wys: number, sila: number, od: number, doT: number, kto: Kto = 'joanna') {
        const klucz = `${kto}:${wys}:${od.toFixed(3)}`;
        this.nutaWl(wys, sila, kto, od, klucz);
        const g = this.glosy.get(klucz)!;
        const rel = 0.45;
        g.g.gain.setTargetAtTime(0, doT, rel / 3);
        for (const o of g.osc) o.stop(doT + rel * 2);
        this.glosy.delete(klucz);
    }
    wszystkoCisza() { for (const k of [...this.glosy.keys()]) this.nutaWyl(k); }

    // ── pady ────────────────────────────────────────────────
    pad(i: number, sila: number, kiedy = 0) {
        const t = Math.max(this.ctx.currentTime, kiedy || 0);
        const v = Math.max(0.05, sila / 127);
        const wy = this.szyny.perkusja;
        const env = (g: GainNode, szczyt: number, dl: number) => { g.gain.setValueAtTime(szczyt * v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dl); };
        const szum = (dl: number, filtr: BiquadFilterOptions, szczyt: number, opozn = 0) => {
            const s = new AudioBufferSourceNode(this.ctx, { buffer: this.szum });
            const f = new BiquadFilterNode(this.ctx, filtr);
            const g = new GainNode(this.ctx, { gain: 0 });
            g.gain.setValueAtTime(0, t + opozn);
            g.gain.setValueAtTime(szczyt * v, t + opozn);
            g.gain.exponentialRampToValueAtTime(0.0008, t + opozn + dl);
            s.connect(f).connect(g).connect(wy);
            s.start(t + opozn, Math.random() * 0.5, dl + 0.05);
        };
        const ton = (typ: OscillatorType, z: number, na: number, dl: number, szczyt: number) => {
            const o = new OscillatorNode(this.ctx, { type: typ, frequency: z });
            o.frequency.exponentialRampToValueAtTime(na, t + dl * 0.6);
            const g = new GainNode(this.ctx, { gain: 0 });
            env(g, szczyt, dl);
            o.connect(g).connect(wy);
            o.start(t); o.stop(t + dl + 0.05);
        };
        switch (PADY[((i % 8) + 8) % 8].id) {
            case 'stopa': ton('sine', 150, 42, 0.42, 1); break;
            case 'werbel': ton('triangle', 190, 140, 0.14, 0.45); szum(0.2, { type: 'bandpass', frequency: 1900, Q: 0.7 }, 0.7); break;
            case 'hihat': szum(0.05, { type: 'highpass', frequency: 7500 }, 0.5); break;
            case 'hihatOtw': szum(0.32, { type: 'highpass', frequency: 7000 }, 0.4); break;
            case 'klask': for (const d of [0, 0.011, 0.023]) szum(d === 0.023 ? 0.18 : 0.02, { type: 'bandpass', frequency: 1200, Q: 1.2 }, 0.7, d); break;
            case 'tomNiski': ton('sine', 130, 80, 0.38, 0.8); break;
            case 'tomWysoki': ton('sine', 210, 140, 0.3, 0.7); break;
            case 'obrecz': ton('square', 820, 760, 0.04, 0.3); szum(0.03, { type: 'highpass', frequency: 3000 }, 0.3); break;
        }
    }

    // ── metronom ────────────────────────────────────────────
    klik(kiedy: number, akcent: boolean) {
        const o = new OscillatorNode(this.ctx, { type: 'square', frequency: akcent ? 1800 : 1100 });
        const g = new GainNode(this.ctx, { gain: 0 });
        g.gain.setValueAtTime(akcent ? 0.5 : 0.28, kiedy);
        g.gain.exponentialRampToValueAtTime(0.0008, kiedy + 0.04);
        o.connect(g).connect(this.metronomG);
        o.start(kiedy); o.stop(kiedy + 0.06);
    }

    zamknij() { void this.ctx.close(); }
}
