import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { Artist } from '../types';
import WavySeparator from '../components/WavySeparator';

const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => (
    <Link to={`/artists/${artist.id}`} className="group relative overflow-hidden rounded-lg block shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-brand-primary/40 hover:-translate-y-2">
        <img src={artist.imageUrl} alt={artist.name} className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 w-full">
            <h3 className="text-2xl font-bold text-white transition-colors duration-300 group-hover:text-brand-accent">{artist.name}</h3>
            <p className="text-brand-text-secondary">{artist.genre}</p>
        </div>
    </Link>
);

const ArtistsPage: React.FC = () => {
    const { artists } = useContent();

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-white animate-fade-in-up">Meet the Artists</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-2 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Discover the unique personalities and sonic landscapes of our AI-driven musical collaborators.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {artists.map((artist, index) => (
                        <div key={artist.id} className="animate-fade-in-up" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                            <ArtistCard artist={artist} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ArtistsPage;
