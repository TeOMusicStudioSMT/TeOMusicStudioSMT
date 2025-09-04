import React from 'react';

const WavySeparator: React.FC = () => {
    return (
        <div className="flex justify-center my-4">
            <svg width="250" height="20" viewBox="0 0 250 20" xmlns="http://www.w3.org/2000/svg" className="w-1/3 max-w-xs">
                <defs>
                    <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#8A42DB' }} />
                        <stop offset="100%" style={{ stopColor: '#D94A8C' }} />
                    </linearGradient>
                    <style>{`
                        @keyframes wave-draw {
                            to {
                                stroke-dashoffset: 0;
                            }
                        }
                    `}</style>
                </defs>
                <path
                    d="M 5 10 C 30 0, 50 20, 75 10 S 100 0, 125 10 S 150 20, 175 10 S 200 0, 225 10"
                    stroke="url(#wave-gradient)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: 400,
                        strokeDashoffset: 400,
                        animation: 'wave-draw 2s ease-out forwards 0.5s'
                    }}
                />
            </svg>
        </div>
    );
};

export default WavySeparator;
