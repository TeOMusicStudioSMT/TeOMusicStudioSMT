
import React, { useState, useMemo } from 'react';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';
import { Track } from '../../types';

// Modal Component for picking a track
const TrackPickerModal: React.FC<{
    onClose: () => void;
    onTrackSelect: (trackId: string) => void;
    allTracks: (Track & { artistName: string })[];
}> = ({ onClose, onTrackSelect, allTracks }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTracks = useMemo(() => 
        allTracks.filter(track => 
            track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            track.artistName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    , [allTracks, searchTerm]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-bg rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Select a Track</h3>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white text-2xl">&times;</button>
                </div>
                <input 
                    type="text"
                    placeholder="Search by title or artist..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-surface rounded-lg px-4 py-2 mb-4 text-white placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredTracks.map(track => (
                        <div 
                            key={track.id}
                            onClick={() => onTrackSelect(track.id)}
                            className="bg-brand-surface p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-brand-primary transition-colors"
                        >
                            <div>
                                <p className="font-semibold text-white">{track.title}</p>
                                <p className="text-sm text-brand-text-secondary">{track.artistName}</p>
                            </div>
                            <span className="text-xs font-mono text-brand-text-secondary">{track.id}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const AdminTrendingPage: React.FC = () => {
    const { artists, trendingTrackIds, updateTrendingTrackIds } = useContent();
    const [currentTrending, setCurrentTrending] = useState<string[]>(
        [...trendingTrackIds, '', '', ''].slice(0, 3)
    );

    const allTracks = useMemo(() => {
        return artists.flatMap(artist => 
            artist.discography.flatMap(release => 
                release.tracks.map(track => ({ ...track, artistName: artist.name }))
            )
        );
    }, [artists]);

    const handleInputChange = (index: number, trackId: string) => {
        const newTrending = [...currentTrending];
        newTrending[index] = trackId;
        setCurrentTrending(newTrending);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validIds = currentTrending.filter(id => id);
        const finalIds = validIds.filter(id => allTracks.some(t => t.id === id));
        
        if (finalIds.length !== validIds.length) {
            toast.error("Some entered Track IDs were invalid and have been ignored.");
        }
        
        updateTrendingTrackIds(finalIds);
        toast.success('Trending tracks updated successfully!');
    };
    
    // New component that uses an input field and a modal
    const TrackInput: React.FC<{ index: number }> = ({ index }) => {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const selectedId = currentTrending[index] || "";
        const selectedTrack = allTracks.find(t => t.id === selectedId);

        const handleSelectFromModal = (trackId: string) => {
            handleInputChange(index, trackId);
            setIsModalOpen(false);
        };

        return (
            <div className="bg-brand-surface p-4 rounded-lg">
                 {isModalOpen && (
                    <TrackPickerModal 
                        allTracks={allTracks}
                        onClose={() => setIsModalOpen(false)}
                        onTrackSelect={handleSelectFromModal}
                    />
                )}
                <label className="text-sm font-semibold text-white mb-2 block">Trending Slot #{index + 1}</label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={selectedId}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        placeholder="Paste Track ID here..."
                        className="w-full bg-brand-dark rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-primary/80 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-primary transition-colors flex-shrink-0"
                    >
                        Browse
                    </button>
                </div>
                 {selectedId && (
                     <div className="mt-2 text-xs bg-brand-dark p-2 rounded">
                        {selectedTrack ? (
                             <p className="text-brand-text-secondary">Selected: <span className="text-white font-bold">{selectedTrack.title}</span> by <span className="text-white font-bold">{selectedTrack.artistName}</span></p>
                        ) : (
                             <p className="text-yellow-400">Warning: Track ID not found in the current library.</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Manage Trending Tracks</h1>
            <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl">
                <div>
                    <p className="text-brand-text-secondary mb-4">Select up to 3 tracks to feature in the "Trending Tracks" section on the homepage.</p>
                    <div className="space-y-4">
                        <TrackInput index={0} />
                        <TrackInput index={1} />
                        <TrackInput index={2} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                        Save Trending Tracks
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminTrendingPage;
