import { Component, type ReactNode } from 'react';

/**
 * 🛡️ Ozdobnik bezpieczny — granica błędów dla ozdób (kursor-duszek, tła WebGL).
 *
 * Bez niej błąd w ozdobie (np. brak WebGL przy wyłączonej akceleracji sprzętowej) odmontowuje CAŁE
 * drzewo Reacta i studio zostaje czarnym ekranem. Ozdoba znika, a studio działa dalej.
 */
export default class OzdobnikBezpieczny extends Component<{ children: ReactNode; nazwa?: string }, { blad: boolean }> {
    state = { blad: false };

    static getDerivedStateFromError() {
        return { blad: true };
    }

    componentDidCatch(e: unknown) {
        console.warn(`[${this.props.nazwa ?? 'ozdoba'}] wyłączona po błędzie — studio działa dalej.`, e);
    }

    render() {
        return this.state.blad ? null : this.props.children;
    }
}
