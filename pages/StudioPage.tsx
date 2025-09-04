import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MicIcon, SparklesIcon, VideoIcon, PlayCircleIcon, PauseCircleIcon, ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon, XIcon, CopyIcon, FolderPlusIcon, DownloadIcon, MaximizeIcon, InfoIcon, FileTextIcon } from '../components/icons';
import { generateStudioIdea, generateCreativeConcept, generateSoundPaletteForIdea, generateStoryboardForIdea } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { COAI_ARTISTS, SOUND_CATALOG } from '../constants';
import { Artist, SoundStemCategory, StudioSubmission, AssetType, UserProject, UserProjectType } from '../types';

type ProjectData = Partial<Omit<StudioSubmission, 'id' | 'userEmail' | 'userName' | 'prompt' | 'status' | 'selectedCoAiArtistId'>>;
type GenerationType = 'concept' | 'palette' | 'storyboard' | 'full';

const WaveformVisual: React.FC<{ color?: string }> = ({ color = 'text-green-500' }) => (
    <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none" className={`w-full h-full ${color}`}>
        <path d="M0 50 L10 55 L20 45 L30 60 L40 40 L50 50 L60 35 L70 65 L80 50 L90 52 L100 48 L110 53 L120 47 L130 58 L140 42 L150 50 L160 33 L170 67 L180 50 L190 54 L200 46 L210 55 L220 45 L230 60 L240 40 L250 50 L260 35 L270 65 L280 50 L290 52 L300 48 L310 53 L320 47 L330 58 L340 42 L350 50 L360 33 L370 67 L380 50 L390 54 L400 46 L410 55 L420 45 L430 60 L440 40 L450 50 L460 35 L470 65 L480 50 L490 52 L500 48 L510 53 L520 47 L530 58 L540 42 L550 50 L560 33 L570 67 L580 50 L590 54 L600 46 L610 55 L620 45 L630 60 L640 40 L650 50 L660 35 L670 65 L680 50 L690 52 L700 48 L710 53 L720 47 L730 58 L740 42 L750 50 L760 33 L770 67 L780 50 L790 54 L800 46 L810 55 L820 45 L830 60 L840 40 L850 50 L860 35 L870 65 L880 50 L890 52 L900 48 L910 53 L920 47 L930 58 L940 42 L950 50 L960 33 L970 67 L980 50 L990 54 L1000 46" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const ImageModal: React.FC<{ 
    imageData: { imageUrl: string; prompt: string }; 
    projectTitle: string;
    onClose: () => void; 
}> = ({ imageData, projectTitle, onClose }) => {
    const { user, addUserProject } = useAuth();
    
    const handleSaveToProjects = () => {
        if (!user) {
            toast.error("You must be logged in to save images.");
            return;
        };
        const newProject: UserProject = {
            id: `proj_${Date.now()}`,
            type: UserProjectType.SAVED_IMAGE,
            title: `Scene for "${projectTitle || 'Studio Project'}"`,
            description: `Image generated from prompt: "${imageData.prompt}"`,
            timestamp: new Date().toISOString(),
            content: {
                imageUrl: imageData.imageUrl,
                prompt: imageData.prompt,
            }
        };
        addUserProject(newProject);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img src={imageData.imageUrl} alt="Enlarged storyboard scene" className="max-w-full max-h-[90vh] object-contain rounded-lg"/>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg flex justify-end items-center gap-4">
                     <button onClick={handleSaveToProjects} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold transition-colors hover:bg-blue-500">
                        <FolderPlusIcon className="w-5 h-5"/>
                        <span>Save to Projects</span>
                    </button>
                     <a href={imageData.imageUrl} download="storyboard-scene.jpg" className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-semibold transition-colors hover:opacity-90">
                        <DownloadIcon className="w-5 h-5"/>
                        <span>Download</span>
                    </a>
                    <button onClick={onClose} className="p-2 bg-brand-surface/50 text-white rounded-full font-semibold transition-colors hover:bg-red-500">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const SunoParameters: React.FC<{ data: ProjectData }> = ({ data }) => {
    const { sunoTitle, sunoStyle, sunoTags, weirdness = 50, styleInfluence = 50, audioInfluence = 25 } = data;

    const Slider: React.FC<{ label: string; value: number; }> = ({ label, value }) => (
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <label className="text-brand-text-secondary flex items-center gap-1.5">
                    <InfoIcon className="w-4 h-4" />
                    {label}
                </label>
                <span className="font-bold text-white">{value}%</span>
            </div>
            <div className="w-full bg-brand-dark rounded-full h-2.5">
                <div className="bg-brand-secondary h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );

    if (!sunoStyle) return null;

    return (
        <div className="border-t border-brand-surface pt-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><SparklesIcon/> Suno Generation Parameters</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-brand-text-secondary block mb-2">Style Description</label>
                        <textarea
                            readOnly
                            value={sunoStyle}
                            className="w-full bg-brand-surface rounded-lg p-3 text-white font-mono text-sm"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-brand-text-secondary block mb-2">Style Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {sunoTags?.map(tag => (
                                <span key={tag} className="bg-brand-surface px-3 py-1 rounded-full text-sm text-brand-text">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-brand-surface/50 p-4 rounded-lg space-y-4">
                    <div className='flex justify-between items-center'>
                     <h4 className="font-bold text-white flex items-center gap-2">Advanced Options</h4>
                     <span className="text-xs bg-brand-secondary text-white font-bold px-2 py-0.5 rounded-full">NEW</span>
                    </div>
                    <Slider label="Weirdness" value={weirdness} />
                    <Slider label="Style Influence" value={styleInfluence} />
                    <Slider label="Audio Influence" value={audioInfluence} />
                    <div className="pt-2 border-t border-brand-primary/10">
                        <h4 className="font-bold text-white mb-2">More Options</h4>
                         <div>
                            <label className="text-sm font-semibold text-brand-text-secondary block mb-1">Song Title</label>
                            <input
                                readOnly
                                value={sunoTitle}
                                className="w-full bg-brand-dark rounded-lg p-2 text-white font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const StudioPage: React.FC = () => {
    const { user, updateUser, addUserProject } = useAuth();
    const { addStudioSubmission, assetVault, studioCosts } = useContent();
    const location = ReactRouterDOM.useLocation();
    const navigate = ReactRouterDOM.useNavigate();
    
    const [localInspirationUrl, setLocalInspirationUrl] = useState(location.state?.imageUrl);
    const [localInspirationPrompt, setLocalInspirationPrompt] = useState(location.state?.prompt);

    const [randomizedArtists] = useState(() => 
        [...COAI_ARTISTS].sort(() => Math.random() - 0.5)
    );
    
    const [prompt, setPrompt] = useState(localInspirationPrompt ? `A song inspired by the image for: ${localInspirationPrompt}` : '');
    const [selectedArtistId, setSelectedArtistId] = useState<string>(randomizedArtists.length > 0 ? randomizedArtists[0].id : '');
    const [projectData, setProjectData] = useState<ProjectData | null>(null);
    const [loadingStates, setLoadingStates] = useState<Record<GenerationType, boolean>>({ concept: false, palette: false, storyboard: false, full: false });
    const [error, setError] = useState('');
    const [modalImage, setModalImage] = useState<{ imageUrl: string; prompt: string; } | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});
    const playingSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
    const [isReplacingStem, setIsReplacingStem] = useState<boolean>(false);
    
    useEffect(() => {
        if (location.state?.savedProject && location.state.savedProject.type === UserProjectType.STUDIO_PROJECT) {
            const { savedProject } = location.state;
            const projectContent = savedProject.content;
            const loadedProjectData = projectContent.projectData;
            const loadedPrompt = projectContent.prompt; 

            if (loadedProjectData && loadedPrompt) {
                const { prompt: _, selectedCoAiArtistId, ...restOfData } = loadedProjectData;
                setPrompt(loadedPrompt);
                if(selectedCoAiArtistId) setSelectedArtistId(selectedCoAiArtistId);
                setProjectData(restOfData as ProjectData);
                toast.success(`Loaded project: "${loadedPrompt}"`);
                navigate('.', { replace: true, state: {} });
            }
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            if (playingSourcesRef.current.length > 0) {
                playingSourcesRef.current.forEach(source => source.stop());
                playingSourcesRef.current = [];
            }
            audioContextRef.current?.close();
        };
    }, []);

    const fetchAndDecodeAudio = async (url: string, id: string) => {
        if (audioBuffersRef.current[id] || !audioContextRef.current) return;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch audio from ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            const decodedData = await audioContextRef.current.decodeAudioData(arrayBuffer);
            audioBuffersRef.current[id] = decodedData;
        } catch (e) {
            console.error(`Failed to load audio for ${id}:`, e);
            toast.error(`Could not load stem: ${id}`);
        }
    };
    
    useEffect(() => {
        if (projectData?.soundPalette) {
            projectData.soundPalette.forEach(p => {
                const stem = SOUND_CATALOG.find(s => s.id === p.stemId) || assetVault.find(a => a.id === p.stemId);
                if (stem && stem.url) {
                    fetchAndDecodeAudio(stem.url, stem.id);
                }
            });
        }
    }, [projectData?.soundPalette, assetVault]);


    const handleGenerate = async (type: GenerationType) => {
        if (!prompt || !user || !selectedArtistId) return;
        
        const costs: Record<GenerationType, number> = {
            concept: studioCosts.ideaAndLyrics,
            palette: studioCosts.soundPalette,
            storyboard: studioCosts.videoStoryboard,
            full: studioCosts.fullProject,
        };
        const cost = costs[type];

        if (user.points < cost) {
            toast.error(`Not enough SMT Points. You need ${cost}.`);
            return;
        }
        
        const selectedArtist = COAI_ARTISTS.find(a => a.id === selectedArtistId);
        if (!selectedArtist) return;

        setError('');
        setLoadingStates(prev => ({ ...prev, [type]: true }));
        if (type === 'full') setProjectData(null);
        handlePlayPause(true);
        
        try {
            let newData: ProjectData = {};
            if (type === 'full') {
                newData = await generateStudioIdea(prompt, selectedArtist);
            } else if (type === 'concept') {
                newData = await generateCreativeConcept(prompt, selectedArtist);
            } else if (type === 'palette' && projectData?.generatedIdea) {
                newData = await generateSoundPaletteForIdea(prompt, projectData.generatedIdea, selectedArtist);
            } else if (type === 'storyboard' && projectData?.generatedIdea) {
                newData = await generateStoryboardForIdea(prompt, projectData.generatedIdea, selectedArtist);
            }
            
            setProjectData(prev => ({ ...prev, ...newData }));
            updateUser({ ...user, points: user.points - cost });
            toast.success(`Generated successfully! (-${cost} SMT)`);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate project part.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoadingStates(prev => ({ ...prev, [type]: false }));
        }
    };

    const handlePlayPause = (forceStop = false) => {
        const context = audioContextRef.current;
        if (!context) return;

        if (isPlaying || forceStop) {
            playingSourcesRef.current.forEach(source => source.stop());
            playingSourcesRef.current = [];
            setIsPlaying(false);
        } else {
            if (!projectData?.soundPalette) return;
            const sources: AudioBufferSourceNode[] = [];
            projectData.soundPalette.forEach(({ stemId }) => {
                const buffer = audioBuffersRef.current[stemId];
                if (buffer) {
                    const source = context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(context.destination);
                    sources.push(source);
                }
            });
            sources.forEach(s => s.start(0));
            playingSourcesRef.current = sources;
            setIsPlaying(true);
        }
    };
    
    const handleStemChange = (categoryToChange: SoundStemCategory, newStemId: string) => {
        if (!projectData) return;
        const newPalette = projectData.soundPalette?.map(p => 
            p.category === categoryToChange ? { ...p, stemId: newStemId } : p
        );
        const newProjectData = { ...projectData, soundPalette: newPalette };
        setProjectData(newProjectData);
        
        const newStem = SOUND_CATALOG.find(s => s.id === newStemId) || assetVault.find(a => a.id === newStemId);
        if (newStem?.url) {
            fetchAndDecodeAudio(newStem.url, newStem.id);
        }
    };

    const isProjectComplete = projectData && projectData.generatedIdea && projectData.lyrics && projectData.soundPalette && projectData.videoStoryboard;

    const handleSubmitForCuration = () => {
        if (!user || !isProjectComplete) {
            toast.error("Cannot submit, project is incomplete.");
            return;
        }
        const submissionData: Omit<StudioSubmission, 'id' | 'status'> = {
            ...projectData,
            userEmail: user.email,
            userName: user.name,
            prompt,
            selectedCoAiArtistId: selectedArtistId,
        } as Omit<StudioSubmission, 'id' | 'status'>;
        addStudioSubmission(submissionData);
        toast.success("Project submitted for curation!");
        setProjectData(null);
        setPrompt('');
    };

    const handleSaveProject = async () => {
        if (!user || !projectData || !selectedArtistInfo) return;
        
        const projectToSave: UserProject = {
            id: `studio_proj_${Date.now()}`,
            type: UserProjectType.STUDIO_PROJECT,
            title: prompt,
            description: projectData.generatedIdea || "A studio project.",
            timestamp: new Date().toISOString(),
            content: {
                prompt,
                projectData: {
                    ...projectData,
                    prompt: prompt,
                    selectedCoAiArtistId: selectedArtistId,
                } as Omit<StudioSubmission, 'id' | 'userEmail' | 'userName' | 'status' | 'curatorComment' | 'curatorRating'>,
                artistName: selectedArtistInfo.name
            }
        };
        addUserProject(projectToSave);
    };

    const handleClearInspiration = () => {
        const originalPromptText = `A song inspired by the image for: ${localInspirationPrompt}`;
        setLocalInspirationUrl(null);
        setLocalInspirationPrompt(null);
        if (prompt === originalPromptText) {
            setPrompt('');
        }
        toast.success("Inspiration image removed.");
    };

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-3xl font-bold text-white">Join the Studio</h2>
                <p className="text-brand-text-secondary mt-4">You need to be signed in to collaborate with our AI artists.</p>
                <ReactRouterDOM.Link to="/signin" className="mt-6 inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                    Sign In to Create
                </ReactRouterDOM.Link>
            </div>
        )
    }

    const selectedArtistInfo = COAI_ARTISTS.find(a => a.id === selectedArtistId);
    
    const songStructure = useMemo(() => {
        if (!projectData?.lyrics) return [];
        const sections = projectData.lyrics.split(/(\[.*?\])/g).filter(Boolean);
        const structure = [];
        for (let i = 0; i < sections.length; i += 2) {
            structure.push({
                title: sections[i]?.replace(/[\[\]]/g, '').trim() || 'Part',
                lyrics: sections[i+1]?.trim() || '',
            });
        }
        return structure;
    }, [projectData?.lyrics]);

    const selectedSegmentCategory = useMemo(() => {
        if (selectedSegmentIndex === null || !projectData?.soundPalette) return null;
        const categoryMap = [SoundStemCategory.DRUMS, SoundStemCategory.BASS, SoundStemCategory.MELODY, SoundStemCategory.PADS, SoundStemCategory.FX];
        return categoryMap[selectedSegmentIndex % categoryMap.length];
    }, [selectedSegmentIndex, projectData?.soundPalette]);

    const stemsForCategory = useMemo(() => {
        if (!selectedSegmentCategory) return [];
        const catalogStems = SOUND_CATALOG
            .filter(s => s.category === selectedSegmentCategory)
            .map(s => ({ id: s.id, name: s.name, url: s.url, source: 'Catalog' }));

        const vaultStems = assetVault
            .filter(a => a.type === AssetType.AUDIO && a.category === selectedSegmentCategory)
            .map(a => ({ id: a.id, name: a.name, url: a.url, source: 'Vault' }));
        
        return [...catalogStems, ...vaultStems];
    }, [selectedSegmentCategory, assetVault]);
    
    const cycleStem = (direction: 'next' | 'prev') => {
        if (selectedSegmentCategory === null || !projectData?.soundPalette || stemsForCategory.length === 0) return;
        
        const currentStemId = projectData.soundPalette.find(p => p.category === selectedSegmentCategory)?.stemId;
        const currentIndex = stemsForCategory.findIndex(s => s.id === currentStemId);

        if (currentIndex === -1) return;

        let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= stemsForCategory.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = stemsForCategory.length - 1;

        handleStemChange(selectedSegmentCategory, stemsForCategory[nextIndex].id);
    };

    return (
        <div className="bg-brand-bg min-h-screen">
            {modalImage && <ImageModal imageData={modalImage} projectTitle={prompt} onClose={() => setModalImage(null)} />}
            {isReplacingStem && selectedSegmentCategory && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-bg rounded-lg shadow-xl p-6 w-full max-w-2xl">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Replace Stem for: <span className="text-brand-primary">{selectedSegmentCategory}</span></h3>
                            <button onClick={() => setIsReplacingStem(false)} className="text-brand-text-secondary hover:text-white"><XIcon/></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                            {stemsForCategory.map(stem => (
                                <button key={stem.id} onClick={() => { handleStemChange(selectedSegmentCategory, stem.id); setIsReplacingStem(false); }}
                                    className="p-3 bg-brand-surface rounded-lg text-center hover:bg-brand-primary transition-colors">
                                    <p className="font-semibold">{stem.name}</p>
                                    <p className="text-xs text-brand-text-secondary">{stem.source}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
            )}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block">AI Co-Creation Studio</h1>
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Choose your CoAI collaborator, provide a prompt, and direct a complete audio-visual project.
                    </p>
                </div>
                <div className="max-w-6xl mx-auto">
                    <div className="bg-brand-dark rounded-xl p-8 shadow-2xl shadow-brand-primary/10 space-y-6">
                        {localInspirationUrl && (
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-white mb-3 block">Visual Inspiration</h3>
                                <div className="relative inline-block">
                                    <img src={localInspirationUrl} alt="Inspiration from Gallery" className="rounded-lg max-w-sm mx-auto shadow-lg" />
                                    <button onClick={handleClearInspiration} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors" aria-label="Remove inspiration image">
                                        <XIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-lg font-semibold text-white mb-3 block">1. Choose your CoAI collaborator</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                {randomizedArtists.map(artist => (
                                    <button key={artist.id} onClick={() => setSelectedArtistId(artist.id)}
                                        className={`p-2 rounded-lg transition-all duration-200 ${selectedArtistId === artist.id ? 'ring-2 ring-brand-primary scale-105' : 'opacity-70 hover:opacity-100'}`}>
                                        <img src={artist.imageUrl} alt={artist.name} className="w-full h-auto aspect-square object-cover rounded-md"/>
                                        <p className="text-xs font-semibold mt-2 text-white">{artist.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'A rainy night in a cyberpunk city' or 'An epic fantasy battle theme'"
                            className="w-full bg-brand-surface rounded-lg p-4 text-white placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[120px]"
                        />
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        <div className="space-y-4">
                             {!projectData && (
                                <button onClick={() => handleGenerate('full')} disabled={loadingStates.full || user.points < studioCosts.fullProject} className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                                    <SparklesIcon className="w-6 h-6"/>
                                    <span>{loadingStates.full ? 'Generating...' : `Generate Full Project (-${studioCosts.fullProject} SMT)`}</span>
                                </button>
                             )}
                            <div className="text-center text-sm text-brand-text-secondary">or, build incrementally:</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <button onClick={() => handleGenerate('concept')} disabled={!!projectData?.generatedIdea || loadingStates.concept || user.points < studioCosts.ideaAndLyrics} className="btn-secondary">
                                    <FileTextIcon className="w-5 h-5"/><span>{loadingStates.concept ? '...' : `Idea & Lyrics (-${studioCosts.ideaAndLyrics})`}</span>
                                </button>
                                <button onClick={() => handleGenerate('palette')} disabled={!projectData?.generatedIdea || !!projectData?.soundPalette || loadingStates.palette || user.points < studioCosts.soundPalette} className="btn-secondary">
                                    <MicIcon className="w-5 h-5"/><span>{loadingStates.palette ? '...' : `Sound Palette (-${studioCosts.soundPalette})`}</span>
                                </button>
                                <button onClick={() => handleGenerate('storyboard')} disabled={!projectData?.generatedIdea || !!projectData?.videoStoryboard || loadingStates.storyboard || user.points < studioCosts.videoStoryboard} className="btn-secondary">
                                    <VideoIcon className="w-5 h-5"/><span>{loadingStates.storyboard ? '...' : `Video Storyboard (-${studioCosts.videoStoryboard})`}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {(Object.values(loadingStates).some(s => s)) && <div className="text-center p-10 text-white animate-pulse">Generating... Please wait.</div>}
                    
                    {projectData && (
                       <div className="mt-8 bg-brand-dark rounded-xl p-6 space-y-8">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setProjectData(null)} className="text-sm bg-brand-surface px-4 py-2 rounded-lg hover:bg-opacity-80">Start Over</button>
                            </div>
                            {projectData.soundPalette && (
                               <div className="bg-black/50 p-4 rounded-xl">
                                   <div className="flex items-center gap-4 mb-4">
                                        <button onClick={() => handlePlayPause()} className="text-brand-primary hover:text-white">
                                           {isPlaying ? <PauseCircleIcon className="w-12 h-12"/> : <PlayCircleIcon className="w-12 h-12"/>}
                                       </button>
                                       <div>
                                           <h3 className="font-bold text-lg text-white">Now composing: "{prompt}"</h3>
                                           <p className="text-sm text-brand-text-secondary">Click a segment to edit, or play the full composition.</p>
                                       </div>
                                   </div>
                                   <div className="w-full bg-black rounded-lg p-2 flex items-center gap-1 overflow-x-auto">
                                       {projectData.soundPalette.map((segment, index) => (
                                           <div key={index} onClick={() => setSelectedSegmentIndex(index)}
                                               className={`relative h-24 flex-shrink-0 w-32 p-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedSegmentIndex === index ? 'bg-blue-500/30 ring-2 ring-blue-400' : 'bg-green-500/10'}`}>
                                               <div className="absolute inset-2">
                                                    <WaveformVisual color={selectedSegmentIndex === index ? 'text-blue-400' : 'text-green-500'}/>
                                               </div>
                                               <span className="absolute top-1 left-2 text-xs font-bold bg-black/50 px-1.5 py-0.5 rounded">{segment.category.toUpperCase()}</span>
                                           </div>
                                       ))}
                                   </div>
                                   {selectedSegmentIndex !== null && (
                                       <div className="flex items-center justify-center gap-2 mt-2">
                                           <button onClick={() => cycleStem('prev')} className="bg-brand-surface w-10 h-10 rounded-full flex items-center justify-center hover:bg-brand-primary"><ChevronLeftIcon/></button>
                                           <button onClick={() => setIsReplacingStem(true)} className="bg-brand-surface w-10 h-10 rounded-full flex items-center justify-center hover:bg-brand-primary"><MoreHorizontalIcon/></button>
                                           <button onClick={() => cycleStem('next')} className="bg-brand-surface w-10 h-10 rounded-full flex items-center justify-center hover:bg-brand-primary"><ChevronRightIcon/></button>
                                       </div>
                                   )}
                              </div>
                            )}
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {projectData.generatedIdea && <div>
                                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-between">
                                        <span>Creative Direction</span>
                                        <button onClick={() => { navigator.clipboard.writeText(projectData.generatedIdea!); toast.success("Copied!"); }} className="text-brand-text-secondary hover:text-white transition-colors p-2 rounded-full hover:bg-brand-surface">
                                            <CopyIcon className="w-5 h-5"/>
                                        </button>
                                    </h3>
                                    <p className="text-brand-text whitespace-pre-wrap bg-brand-surface/50 p-4 rounded-lg">{projectData.generatedIdea}</p>
                               </div>}
                               {projectData.lyrics && <div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Lyrics by {selectedArtistInfo?.name}</h3>
                                    <p className="text-brand-text whitespace-pre-wrap font-mono text-sm bg-brand-surface/50 p-4 rounded-lg max-h-80 overflow-y-auto">{projectData.lyrics}</p>
                               </div>}
                           </div>
                           {projectData.videoStoryboard && <div className="border-t border-brand-surface pt-8">
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><VideoIcon/> Video Storyboard</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projectData.videoStoryboard.map(scene => (
                                        <div key={scene.scene} className="flex flex-col gap-3 p-4 bg-brand-surface/50 rounded-lg">
                                            <div className="flex-shrink-0">
                                                <h4 className="font-bold text-white">Scene {scene.scene}</h4>
                                                <p className="text-sm text-brand-text-secondary">{scene.description}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <img src={scene.stillUrl_entry} onClick={() => setModalImage({ imageUrl: scene.stillUrl_entry!, prompt: scene.generatedImagePrompt_entry })} alt={`Scene ${scene.scene} Entry`} className="w-full h-auto object-cover rounded-lg cursor-pointer hover:ring-2 ring-brand-primary transition-all"/>
                                                <img src={scene.stillUrl_exit} onClick={() => setModalImage({ imageUrl: scene.stillUrl_exit!, prompt: scene.generatedImagePrompt_exit })} alt={`Scene ${scene.scene} Exit`} className="w-full h-auto object-cover rounded-lg cursor-pointer hover:ring-2 ring-brand-primary transition-all"/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                           </div>}
                           {projectData.sunoStyle && <SunoParameters data={projectData} />}
                           {isProjectComplete && <div className="border-t border-brand-surface pt-8 flex items-center justify-center gap-4">
                                <button onClick={handleSaveProject} className="flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                    <FolderPlusIcon className="w-6 h-6"/>
                                    <span>Save Project</span>
                                </button>
                                <button onClick={handleSubmitForCuration} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-accent to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg text-lg hover:opacity-90 transition-opacity">
                                    <SparklesIcon className="w-6 h-6"/>
                                    <span>Submit for Curation</span>
                                </button>
                                <button disabled className="flex items-center justify-center space-x-2 bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg text-lg opacity-50 cursor-not-allowed">
                                    <span>smot....</span>
                                </button>
                           </div>}
                       </div>
                    )}
                </div>
            </div>
            <style>{`
                .btn-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    background-color: #242038; /* brand-surface */
                    color: #F0F0F0; /* brand-text */
                    font-weight: 600;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }
                .btn-secondary:hover:not(:disabled) {
                    background-color: #8A42DB; /* brand-primary */
                }
                .btn-secondary:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default StudioPage;
