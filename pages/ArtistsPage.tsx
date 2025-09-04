import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent'; 
import { Artist, FriendArtist } from '../types';
import { SearchIcon, GlobeIcon } from '../components/icons';
import WavySeparator from '../components/WavySeparator';

const useTilt = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { left, top, width, height } = el.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;

            const rotateY = x * 20;
            const rotateX = -y * 20;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            el.style.boxShadow = `${-x * 15}px ${-y * 15}px 30px -5px rgba(0,0,0,0.3)`;
        };

        const handleMouseLeave = () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            el.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
        };
        
        el.style.transition = 'transform 0.2s, box-shadow 0.2s';
        el.style.willChange = 'transform, box-shadow';
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return ref;
};

const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
    const tiltRef = useTilt<HTMLAnchorElement>();
    return (
    <Link ref={tiltRef} to={`/artists/${artist.id}`} className="block bg-brand-surface/50 backdrop-blur-sm rounded-2xl overflow-hidden group shadow-lg">
        <div className="relative">
            <img src={artist.imageUrl} alt={artist.name} className="w-full h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-white mb-1">{artist.name}</h3>
                <p className="text-brand-primary font-semibold">{artist.genre}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/80 to-brand-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <p className="text-white text-lg font-bold">View Profile</p>
            </div>
        </div>
    </Link>
    )
};

const FriendCard: React.FC<{ friend: FriendArtist }> = ({ friend }) => {
    const tiltRef = useTilt<HTMLAnchorElement>();
    return (
    <a ref={tiltRef} href={friend.websiteUrl} target="_blank" rel="noopener noreferrer" className="block bg-brand-surface/50 backdrop-blur-sm rounded-2xl overflow-hidden group shadow-lg">
        <div className="relative">
            <img src={friend.imageUrl} alt={friend.name} className="w-full h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-white mb-1">{friend.name}</h3>
                <p className="text-brand-accent font-semibold">{friend.role}</p>
            </div>
             <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/70 to-brand-secondary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <GlobeIcon className="w-12 h-12 text-white" />
            </div>
        </div>
    </a>
    )
};


const ArtistsPage: React.FC = () => {
    const { artists: allArtists, friendArtists } = useContent(); 
    const [searchTerm, setSearchTerm] = useState('');
    const [genreFilter, setGenreFilter] = useState('All Genres');
    const [sortOrder, setSortOrder] = useState('Sort by Name');

    const filteredAndSortedArtists = useMemo(() => {
        let artists = [...allArtists];

        if (searchTerm) {
            artists = artists.filter(artist =>
                artist.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (genreFilter !== 'All Genres') {
            artists = artists.filter(artist => artist.genre === genreFilter);
        }

        if (sortOrder === 'Name (A-Z)') {
            artists.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOrder === 'Name (Z-A)') {
            artists.sort((a, b) => b.name.localeCompare(a.name));
        }

        return artists;
    }, [searchTerm, genreFilter, sortOrder, allArtists]);
    
    const allGenres = ['All Genres', ...new Set(allArtists.map(a => a.genre))];
    const sortOptions = ['Sort by Name', 'Name (A-Z)', 'Name (Z-A)'];

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow">Our CoAI Artists</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Meet the revolutionary CoAI musicians who are redefining the boundaries of music creation. Each artist brings their own unique personality, style, and artistic vision.
                    </p>
                </div>

                <div className="bg-brand-dark p-4 rounded-xl mb-12 sticky top-20 z-40">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search artists..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-brand-surface rounded-lg pl-12 pr-4 py-3 text-white placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        <select
                            value={genreFilter}
                            onChange={e => setGenreFilter(e.target.value)}
                            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
                        >
                            {allGenres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                        </select>
                         <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
                        >
                           {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                {filteredAndSortedArtists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredAndSortedArtists.map(artist => (
                            <ArtistCard key={artist.id} artist={artist} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-2xl text-white">No artists found.</p>
                        <p className="text-brand-text-secondary mt-2">Try adjusting your search or filters.</p>
                    </div>
                )}

                {/* Friends & Collaborators Section */}
                <div className="mt-24">
                    <div className="text-center mb-12">
                         <h2 className="text-4xl font-bold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow">Our Friends & Collaborators</h2>
                         <WavySeparator />
                         <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                            The extended S.M.T. family.
                        </p>
                    </div>
                     {friendArtists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {friendArtists.map(friend => (
                                <FriendCard key={friend.id} friend={friend} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-brand-text-secondary">Our network is growing. Check back soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArtistsPage;