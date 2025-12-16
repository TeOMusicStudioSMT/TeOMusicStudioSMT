import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { redeemTicket } from '../services/authBridge';
import toast from 'react-hot-toast';

export const TeleportGate: React.FC = () => {
    const navigate = useNavigate();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;

        const params = new URLSearchParams(window.location.search);
        const ticket = params.get('ticket');

        if (ticket) {
            processed.current = true;
            const t = toast.loading('Synchronizing Frequencies...');

            redeemTicket(ticket).then(user => {
                if (user) {
                    toast.success(`Welcome, ${user.username}!`, { id: t });
                    localStorage.setItem('teo_user', JSON.stringify(user));
                    navigate('/', { replace: true });
                } else {
                    toast.error('Ticket Invalid', { id: t });
                }
            });
        }
    }, [navigate]);

    return null;
};