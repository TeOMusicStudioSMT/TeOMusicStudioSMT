import React from 'react';
import './HolographicCard.css';
import type { LucideIcon } from 'lucide-react';

interface HolographicCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string; // Hex color for the glow (e.g. #00ffff)
    onClick: () => void;
}

const HolographicCard: React.FC<HolographicCardProps> = ({ title, description, icon: Icon, color, onClick }) => {
    return (
        <div className="holo-card" onClick={onClick} style={{ '--neon-color': color } as React.CSSProperties}>
            <div className="holo-content">
                {/* PRZÓD (Ikona + Tytuł) */}
                <div className="holo-front">
                    {/* Animowane tło (Blobs) */}
                    <div className="holo-circle" style={{ backgroundColor: color, top: '20%', left: '20%' }}></div>
                    <div className="holo-circle" style={{ backgroundColor: color, bottom: '20%', right: '20%', width: '60px', height: '60px', animationDelay: '-1s' }}></div>

                    <div className="holo-front-content">
                        <div className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-xl">
                            <Icon size={40} color="white" />
                        </div>
                        <h3 className="text-xl font-bold tracking-widest uppercase text-white drop-shadow-md">{title}</h3>
                    </div>
                </div>

                {/* TYŁ (Opis + Akcja) */}
                <div className="holo-back">
                    <div className="holo-back-inner">
                        <Icon size={24} style={{ color: color }} />
                        <h3 className="holo-title">{title}</h3>
                        <p className="holo-desc">{description}</p>
                        <button className="holo-btn">Initialize</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolographicCard;