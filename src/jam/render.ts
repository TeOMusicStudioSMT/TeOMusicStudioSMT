/**
 * 🎼 Joanna aranżuje szkic — RENDER DEMO (OfflineAudioContext, lokalnie, bez próbek z sieci).
 *
 * Aranż MIDI → dźwięk tym samym rodzajem syntezy co jam (perkusja = `uderzPerkusje`), szybciej niż
 * w czasie rzeczywistym → WAV (`wavZKanalow`, czysty, testowany). Demo to WZÓR dla Warsztatu
 * (ACE-Step), nie gotowy utwór — brzmi jak szkic syntezatorowy i tak go nazywamy.
 */

import { buforSzumu, hz, uderzPerkusje } from './silnik.ts';
import type { Aranz } from './aranz.ts';

/** Kanały float −1…1 → WAV PCM 16-bit (little-endian). */
export function wavZKanalow(kanaly: Float32Array[], sr: number): Uint8Array {
    const k = Math.max(1, kanaly.length), n = kanaly[0]?.length ?? 0;
    const b = new DataView(new ArrayBuffer(44 + n * k * 2));
    const pisz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
    pisz(0, 'RIFF'); b.setUint32(4, 36 + n * k * 2, true); pisz(8, 'WAVE'); pisz(12, 'fmt ');
    b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, k, true); b.setUint32(24, sr, true);
    b.setUint32(28, sr * k * 2, true); b.setUint16(32, k * 2, true); b.setUint16(34, 16, true); pisz(36, 'data'); b.setUint32(40, n * k * 2, true);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < k; c++) { const v = Math.max(-1, Math.min(1, kanaly[c][i])); b.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Uint8Array(b.buffer);
}

/** GM perkusji → pad syntezowany jamu (talerz 49 = otwarty hi-hat — przybliżenie, mówimy to). */
const PAD_Z_GM: Record<number, number> = { 36: 0, 38: 1, 42: 2, 46: 3, 39: 4, 45: 5, 50: 6, 37: 7, 49: 3 };

export async function renderujDemo(a: Aranz, bpm: number, sr = 44100): Promise<{ wav: Uint8Array; sekundy: number }> {
    const sb = 60 / bpm;
    const sekundy = a.beatow * sb + 2.5;
    const ctx = new OfflineAudioContext(2, Math.ceil(sekundy * sr), sr);
    const komp = new DynamicsCompressorNode(ctx, { threshold: -16, ratio: 4, attack: 0.005, release: 0.25 });
    komp.connect(ctx.destination);
    const master = new GainNode(ctx, { gain: 0.7 });
    master.connect(komp);
    const ogon = ctx.createBuffer(2, Math.floor(sr * 2.2), sr);
    for (let c = 0; c < 2; c++) { const d = ogon.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3; }
    const poglos = new ConvolverNode(ctx, { buffer: ogon });
    const mokro = new GainNode(ctx, { gain: 0.22 });
    poglos.connect(mokro).connect(master);
    const szyna = (pan: number, gain: number, wPoglos = 0.5) => {
        const g = new GainNode(ctx, { gain });
        g.connect(new StereoPannerNode(ctx, { pan })).connect(master);
        const s = new GainNode(ctx, { gain: wPoglos }); g.connect(s).connect(poglos);
        return g;
    };
    const [smel, sakk, sbas, sperk] = [szyna(0.15, 0.55, 0.6), szyna(-0.2, 0.22, 0.8), szyna(0, 0.6, 0.1), szyna(0, 0.8, 0.2)];
    const szum = buforSzumu(ctx, 1);

    const glos = (wy: AudioNode, typy: OscillatorType[], wys: number, sila: number, od: number, dl: number, o: { atak: number; zanik: number; podtrzymanie: number; puszczenie: number; filtr?: number }) => {
        const t = od * sb, koniec = (od + dl) * sb, v = sila / 127;
        const g = new GainNode(ctx, { gain: 0 });
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + o.atak);
        g.gain.setTargetAtTime(v * o.podtrzymanie, t + o.atak, o.zanik);
        g.gain.setTargetAtTime(0, koniec, o.puszczenie / 3);
        let wej: AudioNode = g;
        if (o.filtr) { const f = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: o.filtr, Q: 0.7 }); g.connect(f); wej = f; }
        wej.connect(wy);
        typy.forEach((typ, i) => {
            const os = new OscillatorNode(ctx, { type: typ, frequency: hz(wys) * (typ === 'sine' && i > 0 ? 2 : 1), detune: i === 1 && typ !== 'sine' ? 7 : 0 });
            const m = new GainNode(ctx, { gain: i ? 0.4 : 1 });
            os.connect(m).connect(g);
            os.start(t); os.stop(koniec + o.puszczenie * 2);
        });
    };

    const [mel, akk, bas, perk] = a.sciezki;
    const pm = mel.program ?? 0;
    for (const n of mel.nuty) {
        if (pm === 9) glos(smel, ['triangle', 'sine'], n.wys, n.sila, n.start, n.dl, { atak: 0.005, zanik: 0.3, podtrzymanie: 0.15, puszczenie: 0.6 });
        else if (pm === 0) glos(smel, ['triangle', 'sine'], n.wys, n.sila, n.start, n.dl, { atak: 0.004, zanik: 0.45, podtrzymanie: 0.25, puszczenie: 0.3, filtr: 3500 });
        else if (pm === 73) glos(smel, ['sine'], n.wys, n.sila, n.start, n.dl, { atak: 0.05, zanik: 0.5, podtrzymanie: 0.8, puszczenie: 0.2 });
        else glos(smel, ['sawtooth', 'square'], n.wys, n.sila, n.start, n.dl, { atak: 0.006, zanik: 0.15, podtrzymanie: 0.6, puszczenie: 0.15, filtr: 4200 });
    }
    const pa = akk.program ?? 89;
    for (const n of akk.nuty) glos(sakk, pa === 19 ? ['square', 'sine'] : ['sawtooth', 'sawtooth'], n.wys, n.sila, n.start, n.dl, { atak: pa === 25 ? 0.004 : 0.08, zanik: 0.6, podtrzymanie: pa === 25 ? 0.2 : 0.75, puszczenie: 0.35, filtr: 1600 });
    for (const n of bas.nuty) glos(sbas, ['sine', 'sawtooth'], n.wys, n.sila, n.start, n.dl, { atak: 0.005, zanik: 0.25, podtrzymanie: 0.7, puszczenie: 0.08, filtr: 450 });
    for (const n of perk.nuty) uderzPerkusje(ctx, sperk, szum, PAD_Z_GM[n.wys] ?? 2, n.sila, n.start * sb);

    const buf = await ctx.startRendering();
    return { wav: wavZKanalow([buf.getChannelData(0), buf.getChannelData(1)], sr), sekundy: Math.round(sekundy * 10) / 10 };
}
