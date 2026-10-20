// 🎼 Joanna aranżuje szkic — testy czystego rdzenia: analiza jamu, aranż MIDI, WAV demo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { podzielNaFrazy, ocenFraze, analizujNuty, analizujMid, opisAnalizy } from '../src/jam/analiza.ts';
import { aranzuj, akord, PROGRESJE, SEKCJE_UTWORU, INSTRUMENTY, NUTY_PERKUSJI, type PlanUtworu } from '../src/jam/aranz.ts';
import { zapiszMid, czytajMid } from '../src/jam/midiPlik.ts';
import { wSkali, klasa } from '../src/jam/teoria.ts';
import { wavZKanalow } from '../src/jam/render.ts';
import type { Nuta } from '../src/jam/fraza.ts';

const am = { tonika: 9, skala: 'moll' as const };
// jam: fraza a-moll w takcie 1, cisza, druga fraza w takcie 3, pojedyncza nuta w takcie 6
const JAM: Nuta[] = [
    ...[57, 60, 64, 62, 60, 59, 57].map((w, i) => ({ wys: w, sila: 100, start: 4 + i * 0.5, dl: 0.45 })),
    ...[64, 65, 67, 69, 71, 72, 71, 69].map((w, i) => ({ wys: w, sila: 90, start: 12.02 + i * 0.5, dl: 0.4 })),
    { wys: 57, sila: 80, start: 24, dl: 1 },
];

test('analiza: frazy po ciszy, wyrównane do taktu, w szesnastkach', () => {
    const f = podzielNaFrazy(JAM);
    assert.equal(f.length, 3);
    assert.deepEqual(f.map((x) => [x.od, x.takty, x.nuty.length]), [[4, 1, 7], [12, 1, 8], [24, 1, 1]]);
    assert.equal(f[1].nuty[0].start, 0); // 12,02 → 0
    assert.ok(f.every((x) => x.nuty.every((n) => Math.abs(n.start * 4 - Math.round(n.start * 4)) < 1e-9)));
    // długa fraza bez ciszy dzielona co 8 taktów
    const dluga = Array.from({ length: 80 }, (_, i) => ({ wys: 60 + (i % 5), sila: 90, start: i * 0.5, dl: 0.45 }));
    assert.equal(podzielNaFrazy(dluga).length, 2);
});

test('analiza: ocena fraz i motywy z numerami', () => {
    assert.ok(ocenFraze(JAM.slice(7, 15), am).ocena > ocenFraze([{ wys: 57, sila: 80, start: 0, dl: 1 }, { wys: 57, sila: 80, start: 1, dl: 1 }], am).ocena);
    const a = analizujNuty(JAM, 120);
    assert.equal(a.tonacja.nazwa, 'a-moll');
    assert.equal(a.motywy.length, 2, 'pojedyncza nuta to nie motyw');
    assert.deepEqual(a.motywy.map((m) => m.nr), [1, 2]);
    assert.ok(a.motywy[0].ocena >= a.motywy[1].ocena);
    const o = opisAnalizy(a);
    assert.equal(o.motywy[0].nut, a.motywy[0].nuty.length);
    assert.ok(!('nuty' in o.motywy[0]));
});

test('analiza pliku .mid jamu: bierze ścieżkę Suwerena, nie Joannę ani perkusję', () => {
    const b = zapiszMid({ bpm: 96, sciezki: [
        { nazwa: 'Suweren', kanal: 0, nuty: JAM },
        { nazwa: 'Joanna', kanal: 1, nuty: [{ wys: 30, sila: 100, start: 0, dl: 4 }] },
        { nazwa: 'Pady', kanal: 9, nuty: [{ wys: 36, sila: 100, start: 0, dl: 0.1 }] },
    ] });
    const a = analizujMid(b);
    assert.equal(a.bpm, 96);
    assert.equal(a.nut, JAM.length);
    assert.throws(() => analizujMid(zapiszMid({ bpm: 120, sciezki: [{ nazwa: 'Pady', kanal: 9, nuty: [{ wys: 36, sila: 1, start: 0, dl: 1 }] }] })), /nie ma nut Suwerena/);
});

const PLAN: PlanUtworu = {
    tytul: 'Szkic a-moll', styl: 'synthwave', tagi: 'synthwave, a minor, 120 bpm', tekst: '',
    sekcje: [
        { typ: 'intro', takty: 4, energia: 0.3, progresja: 'i-VI-III-VII', motyw: null, instrumenty: ['pad'] },
        { typ: 'zwrotka', takty: 8, energia: 0.5, progresja: 'i-iv-v-i', motyw: 1, instrumenty: ['syntezator', 'pad', 'bas-syntetyczny', 'perkusja-elektroniczna'] },
        { typ: 'przejscie', takty: 2, energia: 0.6, progresja: 'i-VII-VI-VII', motyw: 2, instrumenty: ['syntezator', 'perkusja-elektroniczna'] },
        { typ: 'drop', takty: 8, energia: 1, progresja: 'i-VI-III-VII', motyw: 2, instrumenty: ['dzwonki', 'smyczki', 'bas-syntetyczny', 'perkusja-elektroniczna'] },
        { typ: 'outro', takty: 4, energia: 0.3, progresja: 'i-iv-v-i', motyw: 1, instrumenty: ['fortepian', 'pad'] },
    ],
};

test('aranż: długość, granice sekcji, wszystko w skali, deterministycznie', () => {
    const a = analizujNuty(JAM, 120);
    const r = aranzuj({ plan: PLAN, motywy: a.motywy, tonacja: am, bpm: 120, ziarno: 5 });
    assert.equal(r.takty, 26);
    assert.equal(r.sekundy, 52);
    assert.deepEqual(r.granice.map((g) => [g.typ, g.od, g.do]), [['intro', 0, 4], ['zwrotka', 4, 12], ['przejscie', 12, 14], ['drop', 14, 22], ['outro', 22, 26]]);
    const [mel, akk, bas, perk] = r.sciezki;
    for (const s of [mel, akk, bas]) for (const n of s.nuty) {
        assert.ok(wSkali(n.wys, am), `${s.nazwa}: ${n.wys} poza skalą`);
        assert.ok(n.start >= 0 && n.start + n.dl <= r.beatow + 1e-9, `${s.nazwa}: poza utworem`);
        assert.ok(n.sila >= 1 && n.sila <= 127);
    }
    assert.ok(perk.nuty.every((n) => (Object.values(NUTY_PERKUSJI) as number[]).includes(n.wys)));
    assert.equal(perk.kanal, 9);
    // intro bez melodii i perkusji (tylko pad), outro bez perkusji
    assert.ok(!mel.nuty.some((n) => n.start < 16) || mel.nuty.every((n) => n.start >= 16));
    assert.ok(!perk.nuty.some((n) => n.start < 16 || n.start >= 88));
    // pierwsze powtórzenie motywu w zwrotce = dokładnie motyw 1 (oktawa i skala bez zmian)
    const m1 = a.motywy.find((m) => m.nr === 1)!;
    const pocz = mel.nuty.filter((n) => n.start >= 16 && n.start < 16 + m1.takty * 4).map((n) => [n.wys, n.start - 16]);
    assert.deepEqual(pocz, m1.nuty.map((n) => [n.wys + (m1.nuty.reduce((s, x) => s + x.wys, 0) / m1.nuty.length < 60 ? 12 : 0), n.start]));
    assert.deepEqual(aranzuj({ plan: PLAN, motywy: a.motywy, tonacja: am, bpm: 120, ziarno: 5 }), r);
    assert.notDeepEqual(aranzuj({ plan: PLAN, motywy: a.motywy, tonacja: am, bpm: 120, ziarno: 6 }).sciezki[0], mel);
    // programy GM z planu
    assert.equal(mel.program, INSTRUMENTY.find((i) => i.id === 'syntezator')!.gm);
    // SMF wielościeżkowy
    const plik = czytajMid(zapiszMid({ bpm: 120, sciezki: r.sciezki }));
    assert.equal(plik.sciezki.length, 5);
    assert.equal(plik.sciezki[4].nuty.length, perk.nuty.length);
});

test('aranż: melodia tylko z klas wysokości motywów i ich przekształceń w skali, perkusja z energią', () => {
    const a = analizujNuty(JAM, 120);
    const r = aranzuj({ plan: PLAN, motywy: a.motywy, tonacja: am, bpm: 120 });
    assert.ok(r.sciezki[0].nuty.every((n) => wSkali(n.wys, am)));
    const dropSila = r.sciezki[3].nuty.filter((n) => n.start >= 56 && n.start < 88 && n.wys === 36).map((n) => n.sila);
    const zwrotkaSila = r.sciezki[3].nuty.filter((n) => n.start >= 16 && n.start < 48 && n.wys === 36).map((n) => n.sila);
    assert.ok(Math.max(...dropSila) > Math.max(...zwrotkaSila));
    // akord: trójdźwięk ze skali wokół środka
    assert.deepEqual(akord(0, am, 62).map(klasa).sort(), [0, 4, 9].sort((x, y) => x - y)); // a-c-e
    assert.ok(Object.keys(PROGRESJE).length >= 6 && SEKCJE_UTWORU.length === 6);
});

test('WAV demo: nagłówek i próbki 16-bit stereo', () => {
    const l = new Float32Array([0, 1, -1, 0.5]), p = new Float32Array([0, -0.5, 2, 0]);
    const w = wavZKanalow([l, p], 44100);
    const v = new DataView(w.buffer);
    assert.equal(String.fromCharCode(...w.slice(0, 4)), 'RIFF');
    assert.equal(String.fromCharCode(...w.slice(8, 12)), 'WAVE');
    assert.equal(v.getUint16(22, true), 2);
    assert.equal(v.getUint32(24, true), 44100);
    assert.equal(v.getUint32(40, true), 16);
    assert.equal(w.length, 44 + 16);
    assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => v.getInt16(44 + i * 2, true)), [0, 0, 32767, -16384, -32768, 32767]);
});
