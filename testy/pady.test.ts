// 🥁 Pady z dźwiękiem — testy czystych części: zestaw, przycięcie, siła, normalizacja, grupy, pętla w takt, Bank B w pomiarze.
import test from 'node:test';
import assert from 'node:assert/strict';
import { oczyscZestaw, pustyZestaw, przytnij, wzmocnienieZSily, szczyt, mnoznikNormalizacji, szybkoscZeStroju, doWyciszenia, planPetli, czyPlikPadu, PADOW, NUTY_GM_BANKU_B } from '../src/jam/pady.ts';
import { odczytaj, rozpoznaj, startPomiaru, krokPomiaru, nastepnyEtap, oczyscMape } from '../src/jam/mpk.ts';
import { NUTY_GM_PADOW } from '../src/jam/silnik.ts';

test('zestaw: 16 padów, domyślnie synteza, złe pola = domyślne, plik tylko z mostu', () => {
    const z = pustyZestaw('Bity');
    assert.equal(z.pady.length, PADOW);
    assert.ok(z.pady.every((p) => p.plik === null && p.tryb === 'raz'));
    const o = oczyscZestaw({ nazwa: '  Moje\nbity  ', pady: [
        { plik: 'pad-1-a1b2c3d4.wav', od: 0.5, do: 0.2, glosnosc: 9, stroj: 40.4, tryb: 'petla', petlaUderzen: 3, grupa: 2, czulosc: -1, normalizacja: false },
        { plik: '../../sekret.wav', tryb: 'zly' },
    ] });
    assert.equal(o.nazwa, 'Moje bity');
    assert.deepEqual([o.pady[0].plik, o.pady[0].od, o.pady[0].do, o.pady[0].glosnosc, o.pady[0].stroj, o.pady[0].tryb, o.pady[0].petlaUderzen, o.pady[0].grupa, o.pady[0].czulosc, o.pady[0].normalizacja],
        ['pad-1-a1b2c3d4.wav', 0.5, null, 2, 24, 'petla', 4, 2, 0, false]);
    assert.equal(o.pady[1].plik, null, 'ścieżka spoza katalogu zestawu odrzucona');
    assert.equal(o.pady[1].tryb, 'raz');
    assert.deepEqual(oczyscZestaw('śmieci').pady.length, PADOW);
    assert.ok(czyPlikPadu('pad-16-0123ab.wav') && !czyPlikPadu('pad-1.wav') && !czyPlikPadu('x/pad-1-abcdef.wav'));
    // round-trip przez JSON bez zmian
    assert.deepEqual(oczyscZestaw(JSON.parse(JSON.stringify(o))), o);
});

test('przycięcie, siła uderzenia, normalizacja, strój', () => {
    assert.deepEqual(przytnij(2, 0.5, 1.5), { od: 0.5, dl: 1 });
    assert.deepEqual(przytnij(2, 0.5, null), { od: 0.5, dl: 1.5 });
    assert.deepEqual(przytnij(2, 5, null), { od: 1.99, dl: 0.01 });
    assert.deepEqual(przytnij(2, 1, 0.5), { od: 1, dl: 0.01 });
    assert.equal(wzmocnienieZSily(30, 0), 1);
    assert.equal(wzmocnienieZSily(127, 1), 1);
    assert.ok(wzmocnienieZSily(64, 1) < wzmocnienieZSily(100, 1));
    assert.ok(wzmocnienieZSily(20, 0.5) > wzmocnienieZSily(20, 1));
    assert.ok(Math.abs(szczyt([new Float32Array([0.1, -0.45]), new Float32Array([0.3])]) - 0.45) < 1e-6);
    assert.equal(mnoznikNormalizacji(0.45), 2);
    assert.equal(mnoznikNormalizacji(0), 1);
    assert.equal(mnoznikNormalizacji(0.01), 8, 'bez wzmacniania szumu ponad ×8');
    assert.equal(szybkoscZeStroju(12), 2);
    assert.ok(Math.abs(szybkoscZeStroju(-7) - 0.6674) < 1e-3);
});

test('grupy wyciszania: hi-hat otwarty i zamknięty gaszą się nawzajem', () => {
    const z = pustyZestaw();
    z.pady[2].grupa = 1; z.pady[3].grupa = 1; z.pady[10].grupa = 1; z.pady[5].grupa = 2;
    assert.deepEqual(doWyciszenia(2, z), [3, 10]);
    assert.deepEqual(doWyciszenia(5, z), []);
    assert.deepEqual(doWyciszenia(0, z), []);
});

test('pętla w takt: start na następnym uderzeniu metronomu, okres w uderzeniach', () => {
    // 120 BPM: beat 0,5 s, metronom od t0 = 10
    assert.deepEqual(planPetli(10.7, 10, 0.5, 4), { start: 11, okres: 2 });
    assert.deepEqual(planPetli(11.01, 10, 0.5, 2), { start: 11, okres: 1 }, '≤ 30 ms po uderzeniu = od razu');
    assert.deepEqual(planPetli(11.2, 10, 0.5, 1), { start: 11.5, okres: 0.5 });
    assert.deepEqual(planPetli(9, 10, 0.5, 8), { start: 10, okres: 4 }, 'przed startem metronomu = pierwsze uderzenie');
});

test('pomiar: Bank B opcjonalny (9–16), gałka kończy pady, rozpoznanie pada 9+', () => {
    let s = startPomiaru('MPK mini 3');
    for (let i = 0; i < 8; i++) s = krokPomiaru(s, odczytaj([0x99, 36 + i, 100]));
    assert.equal(s.etap, 'padyB');
    for (let i = 0; i < 3; i++) s = krokPomiaru(s, odczytaj([0x99, 44 + i, 100]));
    assert.equal(s.mapa.pady.length, 11);
    s = krokPomiaru(s, odczytaj([0xb0, 70, 20]));
    assert.equal(s.etap, 'galki', 'pierwsza gałka = koniec padów');
    assert.equal(s.mapa.galki.length, 1, 'ta wiadomość liczy się już jako K1');
    const m = oczyscMape(nastepnyEtap(nastepnyEtap(s)).mapa);
    assert.equal(m.pady.length, 11);
    assert.deepEqual(rozpoznaj(odczytaj([0x99, 45, 77]), m), { rola: 'pad', indeks: 9, sila: 77, puszczona: false, zmierzony: true });
    // pełne 16 → gałki same
    let t = startPomiaru('x');
    for (let i = 0; i < 16; i++) t = krokPomiaru(t, odczytaj([0x99, 36 + i, 100]));
    assert.equal(t.etap, 'galki');
});

test('nuty .mid Banku B nie zlewają się z Bankiem A', () => {
    assert.equal(new Set([...NUTY_GM_PADOW, ...NUTY_GM_BANKU_B]).size, 16);
});
