// 🎹 Jam z Joanną — testy czystego rdzenia: `node --test testy/` (Node ≥ 23 zdejmuje typy sam).
import test from 'node:test';
import assert from 'node:assert/strict';
import { wykryjTonacje, doSkali, krokWSkali, wSkali, najblizszaTonika, nazwaNuty } from '../src/jam/teoria.ts';
import { kwantyzuj, odpowiedz, STRATEGIE, wybierzStrategie, kontur, opisFrazy, type Nuta } from '../src/jam/fraza.ts';
import { zapiszMid, czytajMid, vlq } from '../src/jam/midiPlik.ts';
import { odczytaj, rozpoznaj, pustaMapa, startPomiaru, krokPomiaru, nastepnyEtap, trybGalki, zmianaWzgledna, oczyscMape } from '../src/jam/mpk.ts';

const C = 60;
const fraza = (wys: number[], dl = 0.5): Nuta[] => wys.map((w, i) => ({ wys: w, sila: 100, start: i * dl, dl }));

test('tonacja: gama C-dur, a-moll, G-dur', () => {
    assert.equal(wykryjTonacje(fraza([60, 62, 64, 65, 67, 69, 71, 72])).nazwa, 'C-dur');
    // a-moll: akcent na a, c, e i g#
    const am = wykryjTonacje([57, 60, 64, 57, 59, 60, 62, 64, 68, 69, 57].map((w) => ({ wys: w, dl: w % 12 === 9 ? 2 : 1 })));
    assert.equal(am.nazwa, 'a-moll');
    assert.equal(wykryjTonacje(fraza([67, 69, 71, 72, 74, 76, 78, 79])).nazwa, 'G-dur');
    assert.equal(wykryjTonacje([]).pewnosc, 0);
});

test('skala: doSkali, kroki diatoniczne, tonika', () => {
    const cdur = { tonika: 0, skala: 'dur' as const };
    assert.equal(doSkali(61, cdur), 60); // C# → C (remis w dół)
    assert.equal(doSkali(66, cdur), 65);
    assert.equal(krokWSkali(60, 2, cdur), 64); // C + tercja = E
    assert.equal(krokWSkali(71, 1, cdur), 72); // H → C wyżej
    assert.equal(krokWSkali(60, -1, cdur), 59);
    assert.equal(najblizszaTonika(67, cdur), 72);
    assert.equal(najblizszaTonika(65, cdur), 60);
    assert.equal(nazwaNuty(60), 'C4');
    const am = { tonika: 9, skala: 'moll' as const };
    assert.ok(wSkali(60, am) && !wSkali(61, am));
});

test('kwantyzacja: siatka szesnastek przy 120 BPM, nuty po końcu odpadają, dubel = mocniejszy', () => {
    // 120 BPM → beat 500 ms, szesnastka 125 ms
    const n = kwantyzuj([
        { wys: 60, sila: 90, odMs: 1010, doMs: 1240 }, // 0,02 beatu → 0; dł. 0,46 → 0,5
        { wys: 64, sila: 80, odMs: 1530, doMs: 1560 }, // 1,06 → 1; dł. min = 0,25
        { wys: 64, sila: 110, odMs: 1490, doMs: 1700 }, // ten sam krok → zostaje silniejszy
        { wys: 67, sila: 100, odMs: 4800, doMs: 6000 }, // 7,6 → 7,5; przycięta do końca (8)
        { wys: 72, sila: 100, odMs: 5100, doMs: 5200 }, // 8,2 → po końcu
    ], { bpm: 120, poczatekMs: 1000, beatow: 8 });
    assert.deepEqual(n.map((x) => [x.wys, x.start, x.dl, x.sila]), [[60, 0, 0.5, 90], [64, 1, 0.5, 110], [67, 7.5, 0.5, 100]]);
});

test('odpowiedź: każda strategia zostaje w skali, w długości frazy i kończy na tonice', () => {
    const t = { tonika: 0, skala: 'dur' as const };
    const f = fraza([60, 62, 64, 67, 65, 64, 62, 60]);
    for (const s of STRATEGIE) {
        const o = odpowiedz(f, { tonacja: t, strategia: s.id, beatow: 4, ziarno: 7 });
        assert.ok(o.length > 0, s.id);
        for (const n of o) {
            assert.ok(wSkali(n.wys, t), `${s.id}: ${n.wys} poza skalą`);
            assert.ok(n.start >= 0 && n.start + n.dl <= 4 + 1e-9, `${s.id}: poza frazą`);
            assert.ok(n.sila >= 1 && n.sila <= 127);
        }
        assert.equal(o[o.length - 1].wys % 12, 0, `${s.id}: nie kończy na C`);
        // deterministycznie
        assert.deepEqual(o, odpowiedz(f, { tonacja: t, strategia: s.id, beatow: 4, ziarno: 7 }));
    }
});

test('odpowiedź: echo = tercja w skali, odwrócenie = lustro, rak = od końca', () => {
    const t = { tonika: 0, skala: 'dur' as const };
    const f = fraza([C, 62, 64, 65]);
    const bez = { tonacja: t, beatow: 4, kadencja: false } as const;
    assert.deepEqual(odpowiedz(f, { ...bez, strategia: 'echo' }).map((n) => n.wys), [64, 65, 67, 69]);
    assert.deepEqual(odpowiedz(f, { ...bez, strategia: 'odwrocenie' }).map((n) => n.wys), [60, 59, 57, 55]);
    assert.deepEqual(odpowiedz(f, { ...bez, strategia: 'rak' }).map((n) => n.wys), [65, 64, 62, 60]);
    const kad = odpowiedz(fraza([C, 64, 67, 72]), { tonacja: t, beatow: 4, strategia: 'kadencja' });
    assert.ok(kad.every((n, i) => i === 0 || n.wys <= kad[i - 1].wys), 'kadencja schodzi');
});

test('odpowiedź: gęstość i energia z gałek', () => {
    const t = { tonika: 0, skala: 'dur' as const };
    const f: Nuta[] = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((s, i) => ({ wys: 60 + [0, 2, 4, 5, 7, 5, 4, 2][i], sila: 80, start: s, dl: 0.25 }));
    const rzadko = odpowiedz(f, { tonacja: t, beatow: 4, strategia: 'echo', gestosc: 0, ziarno: 3 });
    assert.ok(rzadko.length < f.length);
    const dlugie = fraza([60, 64, 67, 72], 1);
    assert.ok(odpowiedz(dlugie, { tonacja: t, beatow: 4, strategia: 'echo', gestosc: 1, ziarno: 3 }).length > dlugie.length);
    const cicho = odpowiedz(f, { tonacja: t, beatow: 4, strategia: 'echo', energia: 0 });
    const mocno = odpowiedz(f, { tonacja: t, beatow: 4, strategia: 'echo', energia: 1 });
    assert.ok(mocno[0].sila > cicho[0].sila);
    assert.ok(mocno[0].wys > cicho[0].wys, 'pełna energia = oktawa wyżej');
    assert.deepEqual(odpowiedz([], { tonacja: t, beatow: 4, strategia: 'echo' }), []);
});

test('strategia bez modelu i opis frazy', () => {
    const f = fraza([60, 62, 64, 67]);
    assert.equal(kontur(f), 'wznosząca');
    assert.equal(kontur(fraza([60, 60])), 'stoi');
    assert.ok(STRATEGIE.some((s) => s.id === wybierzStrategie(f, 0.5, 3)));
    assert.notEqual(wybierzStrategie(f, 0, 0), wybierzStrategie(f, 0, 1));
    const o = opisFrazy(f, wykryjTonacje(f), 120);
    assert.equal(o.melodia, 'C4 D4 E4 G4');
    assert.equal(o.zakres, 'C4–G4');
});

test('plik .mid: zapis → odczyt, tempo, kanały, VLQ', () => {
    assert.deepEqual(vlq(0), [0]);
    assert.deepEqual(vlq(127), [0x7f]);
    assert.deepEqual(vlq(128), [0x81, 0]);
    assert.deepEqual(vlq(0x0fffffff), [0xff, 0xff, 0xff, 0x7f]);
    const b = zapiszMid({ bpm: 120, sciezki: [
        { nazwa: 'Suweren', kanal: 0, nuty: [{ wys: 60, sila: 100, start: 0, dl: 1 }, { wys: 60, sila: 90, start: 1, dl: 0.5 }] },
        { nazwa: 'Joanna', kanal: 1, nuty: [{ wys: 64, sila: 70, start: 2, dl: 0.25 }] },
        { nazwa: 'Pady', kanal: 9, nuty: [{ wys: 36, sila: 127, start: 0, dl: 0.25 }] },
    ] });
    assert.equal(String.fromCharCode(...b.slice(0, 4)), 'MThd');
    const m = czytajMid(b);
    assert.equal(m.bpm, 120);
    assert.equal(m.ppq, 480);
    assert.equal(m.sciezki.length, 4);
    assert.equal(m.sciezki[1].nazwa, 'Suweren');
    assert.deepEqual(m.sciezki[1].nuty.map((n) => [n.wys, n.start, n.dl, n.sila]), [[60, 0, 1, 100], [60, 1, 0.5, 90]]);
    assert.equal(m.sciezki[2].nuty[0].kanal, 1);
    assert.equal(m.sciezki[3].nuty[0].kanal, 9);
});

test('MIDI: odczyt bajtów i rozpoznanie wg mapy', () => {
    assert.deepEqual(odczytaj([0x99, 36, 100]), { typ: 'nuta', kanal: 9, wys: 36, sila: 100 });
    assert.deepEqual(odczytaj([0x90, 60, 0]), { typ: 'puszczona', kanal: 0, wys: 60 });
    assert.deepEqual(odczytaj([0xb0, 70, 64]), { typ: 'cc', kanal: 0, cc: 70, wartosc: 64 });
    assert.equal((odczytaj([0xe0, 0, 64]) as { wartosc: number }).wartosc, 0);
    assert.equal((odczytaj([0xe0, 127, 127]) as { wartosc: number }).wartosc, 1);
    const pusta = pustaMapa('MPK mini 3');
    // bez pomiaru: kanał 10 = pad „niezmierzony”, CC = surowe
    assert.deepEqual(rozpoznaj(odczytaj([0x99, 37, 90]), pusta), { rola: 'pad', indeks: 1, sila: 90, puszczona: false, zmierzony: false });
    assert.equal(rozpoznaj(odczytaj([0x90, 60, 90]), pusta).rola, 'klawisz');
    assert.equal(rozpoznaj(odczytaj([0xb0, 70, 3]), pusta).rola, 'cc');
});

test('pomiar: pady, gałki z trybem, joystick → mapa', () => {
    let s = startPomiaru('MPK mini 3');
    // pady na kanale 1 (np. preset bez kanału 10)
    for (let i = 0; i < 8; i++) s = krokPomiaru(s, odczytaj([0x90, 44 + i, 100]));
    s = krokPomiaru(s, odczytaj([0x90, 44, 100])); // powtórka nic nie zmienia
    assert.equal(s.etap, 'padyB', 'po 8 padach Bank B jest opcjonalny');
    assert.equal(s.mapa.pady.length, 8);
    // gałki: K1 bezwzględna, K2 względna (1/127), reszta bezwzględna
    for (const v of [10, 20, 30, 40]) s = krokPomiaru(s, odczytaj([0xb0, 70, v]));
    for (const v of [1, 1, 127, 1]) s = krokPomiaru(s, odczytaj([0xb0, 71, v]));
    for (let k = 2; k < 8; k++) for (const v of [5, 15, 25, 35]) s = krokPomiaru(s, odczytaj([0xb0, 70 + k, v]));
    assert.equal(s.etap, 'joystick');
    assert.equal(s.mapa.galki[0].tryb, 'abs');
    assert.equal(s.mapa.galki[1].tryb, 'wzgl');
    s = krokPomiaru(s, odczytaj([0xe0, 0, 80]));
    s = krokPomiaru(s, odczytaj([0xb0, 1, 90]));
    s = nastepnyEtap(s, '2026-10-20T12:00:00Z');
    assert.equal(s.etap, 'gotowe');
    assert.equal(s.mapa.zmierzona, '2026-10-20T12:00:00Z');
    const m = oczyscMape(JSON.parse(JSON.stringify(s.mapa)));
    assert.deepEqual(rozpoznaj(odczytaj([0x90, 45, 99]), m), { rola: 'pad', indeks: 1, sila: 99, puszczona: false, zmierzony: true });
    assert.equal(rozpoznaj(odczytaj([0x90, 60, 99]), m).rola, 'klawisz');
    assert.deepEqual(rozpoznaj(odczytaj([0xb0, 71, 127]), m), { rola: 'galka', indeks: 1, wartosc: 127, zmiana: -1, tryb: 'wzgl' });
    assert.equal(rozpoznaj(odczytaj([0xb0, 1, 64]), m).rola, 'joystick');
    assert.deepEqual(oczyscMape('śmieci'), pustaMapa());
});

test('tryb gałki i zmiana względna', () => {
    assert.equal(trybGalki([0, 5, 10, 20]), 'abs');
    assert.equal(trybGalki([65, 65, 63, 66]), 'wzgl64');
    assert.equal(trybGalki([1, 2, 127, 126]), 'wzgl');
    assert.equal(zmianaWzgledna(65, 'wzgl64'), 1);
    assert.equal(zmianaWzgledna(126, 'wzgl'), -2);
});
