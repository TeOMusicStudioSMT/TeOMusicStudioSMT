// Plik: frontend/src/components/TeleportGate.tsx
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; // Dostosowane do Twojego AuthContext
import { redeemTicket } from '../services/authBridge';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const TeleportGate: React.FC = () => {
    // Sprawdź w AuthContext czy funkcja nazywa się 'login', 'signIn' czy 'setUser'
    // Na podstawie pliku App.tsx zakładam, że AuthProvider udostępnia kontekst.
    // Tutaj musisz dopasować to do swojego hooka useAuth!
    const { login } = useAuth() as any;
    const navigate = useNavigate();
    const processedRef = useRef(false); // Zapobiega podwójnemu wywołaniu (React 18)

    useEffect(() => {
        const checkTicket = async () => {
            if (processedRef.current) return;

            // Obsługa HashRoutera - bilet może być po #
            // np. https://teomusic.studio/#/?ticket=123
            const currentUrl = window.location.href;
            let ticketId = new URL(currentUrl).searchParams.get('ticket');

            if (!ticketId && currentUrl.includes('ticket=')) {
                ticketId = currentUrl.split('ticket=')[1].split('&')[0];
            }

            if (ticketId) {
                processedRef.current = true;
                const toastId = toast.loading('Synchronizing Studio Frequencies...');

                try {
                    const user = await redeemTicket(ticketId);

                    if (user) {
                        console.log("[TeleportGate] User Authorized:", user.username);

                        // LOGOWANIE - To musi pasować do Twojej funkcji w AuthContext!
                        // Przekazujemy fake-email, jeśli system go wymaga
                        if (login) {
                            await login(user.username, 'external-auth-bypass');
                            // LUB jeśli login przyjmuje obiekt:
                            // await login({ uid: user.uid, displayName: user.username, ... });
                        }

                        toast.success(`Studio Ready. Welcome, ${user.username}!`, { id: toastId });

                        // Czyścimy URL z biletu
                        navigate('/', { replace: true });
                    } else {
                        toast.error('Teleportation Ticket Invalid.', { id: toastId });
                    }
                } catch (e) {
                    console.error("Teleport Error", e);
                    toast.error('Connection Interference.', { id: toastId });
                }
            }
        };

        checkTicket();
    }, [login, navigate]);

    return null;
};