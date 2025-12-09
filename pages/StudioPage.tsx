import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import * as geminiService from '../services/geminiService';
import { Artist, StudioSubmission, SoundStemCategory, UserProject, UserProjectType, VideoStoryboardEntry } from '../types';
import { PlayIcon, SparklesIcon, MusicNoteIcon, VideoIcon, FolderIcon } from '../components/icons';
import toast from 'react-hot-toast';
import WavySeparator from '../components/WavySeparator';
import { SOUND_CATALOG } from '../constants';

// Component for selecting an artist
const ArtistSelector: React.FC<{ artists: Artist[], onSelect: (artist: Artist) => void }> = ({ artists, onSelect }) => (
    <div className="animate-fade-in-up">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Choose Your Collaborator</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {artists.map(artist => (
                <div key={artist.id} onClick={() => onSelect(artist)} className="group cursor-pointer text-center space-y-3 transition-transform hover:-translate-y-2">
                    <img src={artist.imageUrl} alt={artist.name} className="w-40 h-40 rounded-full mx-auto object-cover border-4 border-transparent group-hover:border-brand-primary transition-all shadow-lg" />
                    <h3 className="text-xl font-semibold text-white">{artist.name}</h3>
                </div>
            ))}
        </div>
    </div>
);

// Component for displaying generated lyrics
const LyricsDisplay: React.FC<{ lyrics: string }> = ({ lyrics }) => (
    <div className="bg-brand-dark rounded-lg p-6">
        <h4 className="text-xl font-bold text-brand-secondary mb-3">Lyrics</h4>
        <pre className="text-brand-text-secondary whitespace-pre-wrap font-sans text-sm">{lyrics}</pre>
    </div>
);

// Component for displaying sound palette
const SoundPaletteDisplay: React.FC<{ palette: { category: SoundStemCategory, stemId: string }[] }> = ({ palette }) => {
    return (
        <div className="bg-brand-dark rounded-lg p-6">
            <h4 className="text-xl font-bold text-brand-secondary mb-3">Sound Palette</h4>
            <div className="space-y-3">
                {palette.map(item => {
                    const stem = SOUND_CATALOG.find(s => s.id === item.stemId);
                    if (!stem) return null;
                    return (
                        <div key={stem.id} className="flex items-center justify-between bg-brand-surface p-3 rounded-md">
                            <div>
                                <p className="font-semibold text-white">{stem.name}</p>
                                <p className="text-xs text-brand-text-secondary">{stem.category}</p>
                            </div>
                            <button onClick={() => new Audio(stem.url).play()} className="p-2 rounded-full bg-brand-primary/20 hover:bg-brand-primary text-white transition-colors">
                                <PlayIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Component for displaying video storyboard
const StoryboardDisplay: React.FC<{ storyboard: VideoStoryboardEntry[] }> = ({ storyboard }) => (
    <div className="bg-brand-dark rounded-lg p-6">
        <h4 className="text-xl font-bold text-brand-secondary mb-3">Video Storyboard</h4>
        <div className="space-y-6">
            {storyboard.map(scene => (
                <div key={scene.scene} className="border-b border-brand-surface/50 pb-4 last:border-b-0 last:pb-0">
                    <h5 className="font-bold text-white mb-2">Scene {scene.scene}</h5>
                    <p className="text-sm text-brand-text-secondary mb-4">{scene.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {scene.stillUrl_entry && <img src={scene.stillUrl_entry} alt={`Scene ${scene.scene} entry`} className="rounded-lg object-cover" />}
                        {scene.stillUrl_exit && <img src={scene.stillUrl_exit} alt={`Scene ${scene.scene} exit`} className="rounded-lg object-cover" />}
                    </div>
                </div>
            ))}
        </div>
    </div>
);


// Main Studio Page Component
const StudioPage: React.FC = () => {
    // FIX: Added missing context hooks and state initializations to resolve numerous 'Cannot find name' errors.
    const { user, updateUser, addUserProject } = useAuth();
    const { artists, studioCosts } = useContent();

    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState<Partial<Omit<StudioSubmission, 'id' | 'userEmail' | 'userName' | 'status'>>>({});
    const [loadingStates, setLoadingStates] = useState({ concept: false, palette: false, storyboard: false, full: false });
    
    const canGeneratePalette = !!(generatedContent.generatedIdea && generatedContent.lyrics);
    const canGenerateStoryboard = !!(generatedContent.generatedIdea && generatedContent.lyrics);

    const handleGeneration = async (type: 'concept' | 'palette' | 'storyboard' | 'full') => {
        if (!user || !selectedArtist) return;

        const cost = type === 'concept' ? studioCosts.ideaAndLyrics : 
                     type === 'palette' ? studioCosts.soundPalette :
                     type === 'storyboard' ? studioCosts.videoStoryboard : studioCosts.fullProject;

        if (user.points < cost) {
            toast.error(`Not enough SMT Points. You need ${cost}, but have ${user.points}.`);
            return;
        }

        setLoadingStates(prev => ({ ...prev, [type]: true }));
        const toastId = toast.loading(`Generating ${type}... This may take a moment.`);

        try {
            let result: Partial<Omit<StudioSubmission, 'id'>> = {};
            if (type === 'concept') {
                result = await geminiService.generateCreativeConcept(prompt, selectedArtist);
            } else if (type === 'palette' && canGeneratePalette) {
                result = await geminiService.generateSoundPaletteForIdea(prompt, generatedContent.generatedIdea!, selectedArtist);
            } else if (type === 'storyboard' && canGenerateStoryboard) {
                result = await geminiService.generateStoryboardForIdea(prompt, generatedContent.generatedIdea!, selectedArtist);
            } else if (type === 'full') {
                result = await geminiService.generateStudioIdea(prompt, selectedArtist);
            }

            setGeneratedContent(prev => ({ ...prev, ...result }));
            updateUser({ ...user, points: user.points - cost });
            toast.success(`Generated ${type}! -${cost} points`, { id: toastId });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || `Failed to generate ${type}.`, { id: toastId });
        } finally {
            // FIX: Set loading state to false after generation attempt completes.
            setLoadingStates(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleSaveProject = () => {
        if (!user || !selectedArtist || !generatedContent.generatedIdea) {
            toast.error("Cannot save an empty project.");
            return;
        }
        const project: UserProject = {
            id: `proj_${Date.now()}`,
            type: UserProjectType.STUDIO_PROJECT,
            title: generatedContent.sunoTitle || "Untitled Studio Project",
            description: `A collaboration with ${selectedArtist.name}. Prompt: ${prompt}`,
            timestamp: new Date().toISOString(),
            content: {
                projectData: generatedContent as any, // Cast because some fields might be missing
                artistName: selectedArtist.name,
            }
        };
        addUserProject(project);
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">AI Co-Creation Studio</h1>
                <p className="text-brand-text-secondary mb-8">You must be signed in to collaborate with our artists.</p>
                <Link to="/signin" className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90">Sign In</Link>
            </div>
        );
    }
    
    if (!selectedArtist) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-white">AI Co-Creation Studio</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-2">Begin your musical journey by choosing an AI partner.</p>
                </div>
                <ArtistSelector artists={artists} onSelect={setSelectedArtist} />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="flex justify-between items-start mb-12">
                <div>
                    <button onClick={() => setSelectedArtist(null)} className="text-brand-primary hover:text-white mb-4">&larr; Change Artist</button>
                    <h1 className="text-5xl font-extrabold text-white">Studio Session</h1>
                    <p className="text-lg text-brand-text-secondary mt-2">Collaborating with <span className="text-white font-semibold">{selectedArtist.name}</span></p>
                </div>
                <div className="text-right bg-brand-surface p-3 rounded-lg">
                    <p className="font-bold text-xl text-white">{user.points.toLocaleString()} SMT Points</p>
                    <Link to="/store" className="text-xs text-brand-primary hover:underline">Get More Points</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Controls */}
                <div className="lg:col-span-4 space-y-6">
                     <div className="bg-brand-surface p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">1. Your Creative Spark</h3>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder={`e.g., "A song about a lone spaceship discovering a lost civilization"`}
                            className="w-full bg-brand-dark rounded-lg p-3 text-white placeholder-brand-text-secondary min-h-[120px]"
                        />
                    </div>
                    <div className="bg-brand-surface p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">2. Generate Content</h3>
                        <div className="space-y-3">
                            <button onClick={() => handleGeneration('concept')} disabled={!prompt || loadingStates.concept} className="w-full flex items-center justify-between p-3 bg-brand-dark rounded-lg hover:bg-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> Generate Idea & Lyrics</span>
                                <span className="font-semibold text-brand-accent">{studioCosts.ideaAndLyrics} pts</span>
                            </button>
                            <button onClick={() => handleGeneration('palette')} disabled={!canGeneratePalette || loadingStates.palette} className="w-full flex items-center justify-between p-3 bg-brand-dark rounded-lg hover:bg-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                 <span className="flex items-center gap-2"><MusicNoteIcon className="w-5 h-5"/> Generate Sound Palette</span>
                                <span className="font-semibold text-brand-accent">{studioCosts.soundPalette} pts</span>
                            </button>
                            <button onClick={() => handleGeneration('storyboard')} disabled={!canGenerateStoryboard || loadingStates.storyboard} className="w-full flex items-center justify-between p-3 bg-brand-dark rounded-lg hover:bg-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="flex items-center gap-2"><VideoIcon className="w-5 h-5"/> Generate Video Storyboard</span>
                                <span className="font-semibold text-brand-accent">{studioCosts.videoStoryboard} pts</span>
                            </button>
                             <hr className="border-brand-surface/50"/>
                             <button onClick={() => handleGeneration('full')} disabled={!prompt || loadingStates.full} className="w-full flex items-center justify-between p-3 bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> Generate Full Project</span>
                                <span className="font-semibold">{studioCosts.fullProject} pts</span>
                            </button>
                        </div>
                    </div>
                     {generatedContent.generatedIdea && (
                         <div className="bg-brand-surface p-6 rounded-lg">
                            <h3 className="text-xl font-bold text-white mb-4">3. Finalize</h3>
                             <button onClick={handleSaveProject} className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg font-semibold hover:opacity-90">
                                <FolderIcon className="w-5 h-5"/> Save to My Projects
                            </button>
                        </div>
                     )}
                </div>
                {/* Results */}
                <div className="lg:col-span-8 space-y-6">
                    {generatedContent.generatedIdea && (
                        <div className="bg-brand-dark rounded-lg p-6 animate-fade-in-up">
                            <h4 className="text-xl font-bold text-brand-secondary mb-3">Creative Direction</h4>
                            <p className="text-brand-text-secondary">{generatedContent.generatedIdea}</p>
                        </div>
                    )}
                    {generatedContent.lyrics && <LyricsDisplay lyrics={generatedContent.lyrics} />}
                    {generatedContent.soundPalette && <SoundPaletteDisplay palette={generatedContent.soundPalette} />}
                    {generatedContent.videoStoryboard && <StoryboardDisplay storyboard={generatedContent.videoStoryboard} />}
                </div>
            </div>
        </div>
    );
};

export default StudioPage;