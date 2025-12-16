import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Placeholder config - podmienisz go później swoimi danymi z Firebase
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "project-id.firebaseapp.com",
    projectId: "project-id",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface TeleportUser {
    uid: string;
    username: string;
    role: string;
}

export const redeemTicket = async (ticketId: string): Promise<TeleportUser | null> => {
    console.log(`[AuthBridge] 🎵 Redeeming Ticket: ${ticketId}`);
    try {
        const ticketRef = doc(db, 'teleport_tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) return null;
        const data = ticketSnap.data();

        // Optimistic burn
        updateDoc(ticketRef, { consumed: true }).catch(e => console.warn(e));

        return {
            uid: data.uid,
            username: data.displayName || 'Maestro',
            role: 'user'
        };
    } catch (error) {
        console.error("AuthBridge Error", error);
        return null;
    }
};