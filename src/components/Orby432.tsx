/**
 * 🔮 ORBY 432 — stan ładowania Workflow Joanny (spec Jasona v3.0: „3 glowing orbs,
 * cyan / magenta / amber, pulse 432hz").
 *
 * Silnik: thinking-orbs (Jakubantalik, MIT) — canvas 2D, zero WebGL. Biblioteka
 * rysuje jasny tusz bez wyboru koloru, więc barwę nakłada warstwa
 * `mix-blend-mode: multiply` nad przezroczystym canvasem: biel × cyjan = cyjan,
 * tło zostaje ciemne. Działa TYLKO na ciemnym tle — panel Joanny jest ciemny.
 *
 * ⚠️ „PULS 432 Hz" — oko nie widzi 432 błysków na sekundę, a monitor 60 Hz nie
 * umie ich pokazać. Poświata pulsuje 8 oktaw niżej: 432 / 2⁸ = 1,6875 Hz
 * (okres 592,6 ms). To ta sama nuta, przeniesiona tam, gdzie oko nadąża —
 * tak jak DSP Panelu Bitów stroi stopę na 54 Hz (432 / 8). Nie udajemy więcej.
 */

import React from 'react';
import { ThinkingOrb, type OrbState } from 'thinking-orbs';

export const OKRES_PULSU_MS = Math.round((1000 / (432 / 2 ** 8)) * 10) / 10; // 592.6

export interface OrbDef { id: string; kolor: string; stan: OrbState; etykieta: string }

/** Trzy orby ze specyfikacji: kolor + stan animacji + co dany krok robi. */
export const ORBY_JOANNY: OrbDef[] = [
    { id: 'cyan',    kolor: '#22d3ee', stan: 'composing', etykieta: 'rytm · styl' },
    { id: 'magenta', kolor: '#e879f9', stan: 'weaving',   etykieta: 'lyrics' },
    { id: 'amber',   kolor: '#f59e0b', stan: 'searching', etykieta: 'brief dla Klatki' },
];

export const Orb: React.FC<{ def: OrbDef; aktywny: boolean; gotowy: boolean; size?: 64 | 20 }> = ({ def, aktywny, gotowy, size = 64 }) => (
    <div className="flex flex-col items-center gap-1.5">
        <div
            className="relative rounded-full"
            style={{
                width: size, height: size,
                boxShadow: aktywny ? `0 0 ${size / 2}px ${def.kolor}88, 0 0 ${size / 6}px ${def.kolor}` : gotowy ? `0 0 ${size / 6}px ${def.kolor}55` : 'none',
                animation: aktywny ? `orb-puls ${OKRES_PULSU_MS}ms ease-in-out infinite` : 'none',
                opacity: aktywny || gotowy ? 1 : 0.35,
                transition: 'opacity .3s, box-shadow .3s',
            }}
        >
            <ThinkingOrb state={gotowy && !aktywny ? 'breathing' : def.stan} size={size} theme="dark" speed={aktywny ? 1 : 0.35} paused={!aktywny && !gotowy} />
            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ backgroundColor: def.kolor, mixBlendMode: 'multiply' }} />
        </div>
        <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: aktywny ? def.kolor : '#64748b' }}>{def.etykieta}</div>
        <style>{`@keyframes orb-puls { 0%,100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.06); filter: brightness(1.35); } }`}</style>
    </div>
);

/** Rząd trzech orbów. `aktywny` = który krok właśnie liczy; `gotowe` = już skończone. */
export const Orby432: React.FC<{ aktywny: string | null; gotowe: string[]; size?: 64 | 20 }> = ({ aktywny, gotowe, size = 64 }) => (
    <div className="flex items-center justify-center gap-6">
        {ORBY_JOANNY.map((o) => <Orb key={o.id} def={o} aktywny={aktywny === o.id} gotowy={gotowe.includes(o.id)} size={size} />)}
    </div>
);
