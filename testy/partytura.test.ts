// 🎼 Silnik partytury 0.00G — analiza liczona z próbek (bez przeglądarki)
import test from 'node:test';
import assert from 'node:assert/strict';
import { analizujProbki, grawitacja, aktW, wersW, type DanePartytury } from '../src/lib/partytura000g.ts';

const SR = 44100, BPM = 120;
/** 8 s: cisza 1 s, potem bas A2 (110 Hz) 3 s, potem bas E2 (82,41 Hz) + głośny ton 1000 Hz 4 s, z uderzeniem co ćwierćnutę */
function sygnal() {
  const x = new Float32Array(SR * 8);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR; if (t < 1) continue;
    const obw = 0.35 + 0.65 * Math.exp(-((t * 2) % 1) * 6);
    x[i] = t < 4 ? 0.3 * obw * Math.sin(2 * Math.PI * 110 * t) : 0.3 * obw * Math.sin(2 * Math.PI * 82.41 * t) + 0.6 * obw * Math.sin(2 * Math.PI * 1000 * t);
  }
  return x;
}

test('nuty basu mają wysokość z dźwięku, a warstwa wysoka gra dopiero, gdy brzmi', () => {
  const a = analizujProbki(sygnal(), SR, BPM);
  assert.ok(Math.abs(a.krok - 0.125) < 1e-9);
  const bas = a.nuty.filter((n) => n.w === 0), wys = a.nuty.filter((n) => n.w === 3);
  assert.ok(bas.length > 0 && wys.length > 0);
  assert.ok(bas.every((n) => n.od >= 0.75), 'w ciszy nie ma nut');
  const wczesne = bas.filter((n) => n.do <= 3.9 && n.od >= 1.2), pozne = bas.filter((n) => n.od >= 4.2);
  assert.ok(wczesne.length && wczesne.every((n) => n.midi === 45), `A2 = 45, jest ${wczesne.map((n) => n.midi)}`);
  assert.ok(pozne.length && pozne.every((n) => n.midi === 40), `E2 = 40, jest ${pozne.map((n) => n.midi)}`);
  assert.ok(wys.every((n) => n.od >= 3.8 && n.midi === 83), `1000 Hz = B5 (83) od 4. sekundy, jest ${wys.map((n) => `${n.od.toFixed(2)}:${n.midi}`)}`);
});

test('GRAVITY schodzi z 1 do 0 bez wzrostów, w ciszy stoi; EXPRESSION dochodzi do 100% i nie spada', () => {
  const a = analizujProbki(sygnal(), SR, BPM), d: DanePartytury = { naglowek: 'x', bpm: BPM, sekundy: 8, akty: [] };
  assert.equal(grawitacja(d, a, 0), 1);
  assert.equal(grawitacja(d, a, 8), 0);
  assert.ok(grawitacja(d, a, 0.8) > 0.995, 'cisza nie zdejmuje grawitacji');
  for (let i = 1; i < a.strata.length; i++) assert.ok(a.strata[i] <= a.strata[i - 1] + 1e-6);
  assert.ok(grawitacja(d, a, 4) > 0.7, 'cichsza połowa niesie mniej energii');
  for (let i = 1; i < a.expression.length; i++) assert.ok(a.expression[i] >= a.expression[i - 1]);
  assert.ok(a.expression[a.expression.length - 1] > 0.99 && a.expression[4] < 0.05);
  assert.ok(Math.max(...a.pulse) > 0.5, 'uderzenie co ćwierćnutę daje PULSE');
  // tryb segmentu (portal gra akt po akcie): trzeci akt z czterech zaczyna od 0,5 i kończy na 0,25
  const s = { ...d, segment: { i: 2, n: 4 } };
  assert.equal(grawitacja(s, a, 0), 0.5); assert.equal(grawitacja(s, a, 8), 0.25);
});

test('akt i wers idą za czasem', () => {
  const d: DanePartytury = { naglowek: 'x', bpm: 82, sekundy: 20, akty: [{ nr: 1, nazwa: 'Intro', od: 0, do: 10, wersy: [] }, { nr: 2, nazwa: 'Chorus', od: 10, do: 20, wersy: ['a', 'b'] }] };
  assert.equal(aktW(d, 3)?.nr, 1); assert.equal(aktW(d, 12)?.nr, 2); assert.equal(aktW(d, 99)?.nr, 2);
  assert.equal(wersW(aktW(d, 12), 12), 'a'); assert.equal(wersW(aktW(d, 17), 17), 'b'); assert.equal(wersW(aktW(d, 3), 3), '');
});
