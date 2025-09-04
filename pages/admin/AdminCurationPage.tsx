
import React, { useState, useMemo } from 'react';
import { useContent } from '../../hooks/useContent';
import { useAuth } from '../../hooks/useAuth';
import { StudioSubmission, SubmissionStatus, SoundStemCategory } from '../../types';
import toast from 'react-hot-toast';
import { COAI_ARTISTS, SOUND_CATALOG } from '../../constants';

const CurationModal: React.FC<{
    submission: StudioSubmission;
    onClose: () => void;
    onAward: (submissionId: string, points: number, comment: string, rating: number) => void;
}> = ({ submission, onClose, onAward }) => {
    const [rating, setRating] = useState(75); // Percentage rating
    const [comment, setComment] = useState('');

    const pointsToAward = useMemo(() => {
        // Simple linear scale: 0% = 0 points, 100% = 500 points
        return Math.round((rating / 100) * 500);
    }, [rating]);

    const handleAward = () => {
        onAward(submission.id, pointsToAward, comment, rating);
        onClose();
    };
    
    const coaiArtist = COAI_ARTISTS.find(a => a.id === submission.selectedCoAiArtistId);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-bg rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Review & Showcase</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white">&times;</button>
                </div>
                
                <div className="space-y-6">
                    {/* Submission Info */}
                    <div className="bg-brand-surface p-4 rounded-md">
                        <p className="text-sm text-brand-text-secondary">User: <span className="font-semibold text-white">{submission.userName} ({submission.userEmail})</span></p>
                        <p className="text-sm text-brand-text-secondary mt-1">CoAI Collaborator: <span className="font-semibold text-white">{coaiArtist?.name || 'Unknown'}</span></p>
                        <p className="text-sm text-brand-text-secondary mt-2">Prompt:</p>
                        <p className="text-white italic">"{submission.prompt}"</p>
                    </div>

                    {/* Creative Direction & Lyrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-brand-dark p-4 rounded-lg">
                            <h3 className="font-semibold text-brand-primary mb-2">Creative Direction</h3>
                            <p className="text-sm text-brand-text-secondary whitespace-pre-wrap">{submission.generatedIdea}</p>
                        </div>
                         <div className="bg-brand-dark p-4 rounded-lg">
                            <h3 className="font-semibold text-brand-primary mb-2">Lyrics</h3>
                            <p className="text-sm text-brand-text-secondary whitespace-pre-wrap font-mono">{submission.lyrics}</p>
                        </div>
                    </div>

                    {/* Sound & Video */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-brand-dark p-4 rounded-lg">
                            <h3 className="font-semibold text-brand-primary mb-2">Sound Palette</h3>
                            <div className="space-y-1">
                                {submission.soundPalette.map(p => {
                                    const stem = SOUND_CATALOG.find(s => s.id === p.stemId);
                                    return <p key={p.stemId} className="text-sm"><span className="font-bold text-white">{p.category}:</span> <span className="text-brand-text-secondary">{stem?.name}</span></p>
                                })}
                            </div>
                        </div>
                        <div className="bg-brand-dark p-4 rounded-lg">
                            <h3 className="font-semibold text-brand-primary mb-2">Video Storyboard Stills</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {submission.videoStoryboard.flatMap(s => [s.stillUrl_entry, s.stillUrl_exit]).filter(Boolean).map((url, index) => (
                                    <img key={index} src={url} alt={`Storyboard still ${index + 1}`} className="w-full h-auto object-cover rounded-md"/>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Suno Parameters Section */}
                    {submission.sunoStyle && (
                        <div className="bg-brand-dark p-4 rounded-lg">
                            <h3 className="font-semibold text-brand-primary mb-2">Suno Parameters</h3>
                            <div className="space-y-2 text-sm text-brand-text-secondary">
                                <p><strong>Title:</strong> <span className="text-white font-mono">{submission.sunoTitle}</span></p>
                                <p><strong>Style:</strong> <span className="text-white font-mono">{submission.sunoStyle}</span></p>
                                <p><strong>Tags:</strong> <span className="text-white font-mono">{submission.sunoTags?.join(', ')}</span></p>
                                <p>
                                    <strong>Advanced:</strong>
                                    <span className="text-white font-mono">
                                        {' '}Weirdness: {submission.weirdness}% |
                                        Style Influence: {submission.styleInfluence}% |
                                        Audio Influence: {submission.audioInfluence}%
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                
                    {/* Award Section */}
                    <div className="border-t border-brand-surface pt-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Curator Rating: <span className="font-bold text-white">{rating}%</span></label>
                            <input type="range" min="0" max="100" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full h-2 bg-brand-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                            <p className="text-sm text-brand-text-secondary mt-1">This will award the user <span className="font-bold text-white">{pointsToAward} SMT Points</span>.</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Curator's Comment (Optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="e.g., 'A truly inspired direction, captures the mood perfectly!'"
                                className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">Cancel</button>
                    <button onClick={handleAward} className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">Confirm & Showcase</button>
                </div>
            </div>
        </div>
    );
};


const AdminCurationPage: React.FC = () => {
    const { studioSubmissions, showcaseSubmission } = useContent();
    const { allUsers, updateUser } = useAuth();
    const [selectedSubmission, setSelectedSubmission] = useState<StudioSubmission | null>(null);

    const pendingSubmissions = studioSubmissions.filter(s => s.status === SubmissionStatus.PENDING);
    const showcasedSubmissions = studioSubmissions.filter(s => s.status === SubmissionStatus.SHOWCASED);

    const handleAwardAndShowcase = (submissionId: string, points: number, comment: string, rating: number) => {
        const submission = studioSubmissions.find(s => s.id === submissionId);
        if (!submission) return;

        const userToAward = allUsers.find(u => u.email === submission.userEmail);
        if(userToAward) {
            updateUser({ ...userToAward, points: userToAward.points + points });
        }

        showcaseSubmission(submissionId, comment, rating);
        toast.success(`Awarded ${points} points to ${submission.userName} and showcased their work!`);
    };

    return (
        <div>
            {selectedSubmission && (
                <CurationModal
                    submission={selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    onAward={handleAwardAndShowcase}
                />
            )}
            <h1 className="text-3xl font-bold text-white mb-8">Studio Curation</h1>
            
            <div className="bg-brand-bg p-6 rounded-lg mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Pending Submissions ({pendingSubmissions.length})</h2>
                {pendingSubmissions.length > 0 ? (
                    <div className="space-y-4">
                        {pendingSubmissions.map(sub => (
                             <div key={sub.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
                                 <div className="flex items-center space-x-4">
                                     {sub.videoStoryboard && sub.videoStoryboard.length > 0 && sub.videoStoryboard[0].stillUrl_entry && (
                                        <img src={sub.videoStoryboard[0].stillUrl_entry} alt="Submission still" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                                     )}
                                     <div>
                                        <p className="text-sm text-brand-text-secondary">From: <span className="font-semibold text-white">{sub.userName}</span></p>
                                        <p className="text-lg font-semibold text-white italic mt-1">"{sub.prompt}"</p>
                                     </div>
                                 </div>
                                 <button
                                     onClick={() => setSelectedSubmission(sub)}
                                     className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90 flex-shrink-0"
                                >
                                     Review & Award
                                 </button>
                             </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-brand-text-secondary">No new submissions to review.</p>
                )}
            </div>

            <div className="bg-brand-bg p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Showcased Submissions ({showcasedSubmissions.length})</h2>
                 {showcasedSubmissions.length > 0 ? (
                    <div className="space-y-4">
                        {showcasedSubmissions.map(sub => (
                             <div key={sub.id} className="bg-brand-surface/50 p-4 rounded-lg flex items-center justify-between">
                                 <div className="flex items-center space-x-4">
                                     <div>
                                        <p className="text-lg font-semibold text-white italic">"{sub.prompt}"</p>
                                        <p className="text-sm text-brand-text-secondary mt-1">By: {sub.userName}</p>
                                     </div>
                                 </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-primary text-lg">{sub.curatorRating}%</p>
                                    <p className="text-xs text-brand-text-secondary">Curator Rating</p>
                                </div>
                             </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-brand-text-secondary">No works have been showcased yet.</p>
                )}
            </div>
        </div>
    );
};

export default AdminCurationPage;
