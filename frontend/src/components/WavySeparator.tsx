import React from 'react';

const WavySeparator: React.FC = () => {
    return (
        <div className="flex justify-center items-center my-4">
            <svg width="120" height="12" viewBox="0 0 120 12" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="wavySeparatorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8A42DB" />
                        <stop offset="100%" stopColor="#D94A8C" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <path
                    d="M 5 6 C 25 0, 35 12, 60 6 S 95 0, 115 6"
                    stroke="url(#wavySeparatorGradient)"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    filter="url(#glow)"
                />
            </svg>
        </div>
    );
};

export default WavySeparator;
