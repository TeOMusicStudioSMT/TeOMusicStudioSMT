// Plik: frontend/src/services/authBridge.ts
import { doc, getDoc, updateDoc } from 'firebase/firestore';
// UWAGA: Na filmie widziałem plik firebase w 'src/firebase.ts'. Dostosuj import jeśli jest inny.
import { db } from '../firebase';

export interface TeleportUser {
    uid: string;
    username: string;
    tier: string;
    balance: number;
    role?: 'user' | 'admin' | 'vip';
}

export const redeemTicket = async (ticketId: string): Promise<TeleportUser | null> => {
    console.log(`[AuthBridge] 🎵 Redeeming Music Ticket: ${ticketId}`);

    try {
        // 1. Sprawdź bilet (Szukamy w kolekcji teleport_tickets)
        const ticketRef = doc(db, 'teleport_tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
            console.error('[AuthBridge] Ticket invalid or not found.');
            return null;
        }

        const ticketData = ticketSnap.data();

        // 2. ODBIÓR ENERGII (Klucz API)
        // To jest ten moment! Przekazujemy klucz do Agentów Muzycznych.
        if (ticketData.apiKey) {
            console.log("⚡ [AuthBridge] API Key received via UZ$. Charging Amplifiers...");
            let rawKey = ticketData.apiKey;
            if (typeof rawKey === 'string' && rawKey.startsWith('"')) {
                try { rawKey = JSON.parse(rawKey); } catch (e) { }
            }
            // Zapisujemy klucz tak, aby geminiService.ts go widział
            localStorage.setItem('gemini_api_key', rawKey);
        }

        // 3. Spal bilet (Security)
        await updateDoc(ticketRef, { consumed: true }).catch(err => console.warn("Ticket burn warning:", err));

        // 4. Zwróć dane użytkownika
        return {
            uid: ticketData.uid,
            username: ticketData.displayName || 'Maestro',
            tier: 'voyager',
            balance: 0,
            role: 'user'
        };

    } catch (error) {
        console.error('[AuthBridge] Redemption Error:', error);
        return null;
    }
};