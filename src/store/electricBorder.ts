import { atom } from 'jotai';

export type ElectricBorderMode = 'just' | 'resonance' | 'active';

interface ElectricBorderState {
    globalMode: ElectricBorderMode;
    energyLevel: number; // 0-100% energii systemu
    isStable: boolean;
}

// Domyślny stan (Startujemy w trybie LOKALNYM - JusT)
const defaultState: ElectricBorderState = {
    globalMode: 'just',
    energyLevel: 100,
    isStable: true,
};

// Główny Atom (Magazyn stanu)
export const electricBorderAtom = atom<ElectricBorderState>(defaultState);

// Atom Akcji (Funkcja do zmiany trybu)
export const setGlobalModeAtom = atom(
    null,
    (get, set, mode: ElectricBorderMode) => {
        const current = get(electricBorderAtom);
        set(electricBorderAtom, { ...current, globalMode: mode });
        console.log(`🔌 TeO Field Shift: ${mode.toUpperCase()}`);
    }
);