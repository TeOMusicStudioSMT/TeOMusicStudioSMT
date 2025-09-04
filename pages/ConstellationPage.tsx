import React from 'react';
import { useContent } from '../hooks/useContent';
import { ConstellationItem } from '../types';
import WavySeparator from '../components/WavySeparator';

const ConstellationCard: React.FC<{ item: ConstellationItem }> = ({ item }) => (
    <a 
        href={item.linkUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="group bg-brand-surface rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 flex flex-col"
    >
        <div className="aspect-w-16 aspect-h-9 overflow-hidden">
            <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
        </div>
        <div className="p-6 flex-grow flex flex-col">
            <h3 className="text-xl font-bold text-white">{item.title}</h3>
            <p className="text-brand-text-secondary mt-2 text-sm flex-grow">
                {item.description}
            </p>
            <span className="mt-4 text-sm font-semibold text-brand-primary group-hover:underline">
                Visit →
            </span>
        </div>
    </a>
);


const ConstellationPage: React.FC = () => {
    const { constellationItems } = useContent();

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow">S.M.T. Constellation</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        An ecosystem of our trusted partners, side-projects, and collaborators. Explore the universe expanding from TeO Music Studio.
                    </p>
                </div>
                
                {constellationItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {constellationItems.map(item => (
                            <ConstellationCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-2xl text-white">The Constellation is forming.</p>
                        <p className="text-brand-text-secondary mt-2">Check back later to see our growing network of partners.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConstellationPage;