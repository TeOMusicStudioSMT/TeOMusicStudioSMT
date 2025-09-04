import React, { useState, useRef, useEffect } from 'react';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../hooks/useAuth';
import { GalleryImage, UserProject, UserProjectType } from '../types';
import { generateImage } from '../services/geminiService';
import toast from 'react-hot-toast';
import { SparklesIcon, DownloadIcon, MaximizeIcon, FolderPlusIcon, PlusCircleIcon, XIcon } from '../components/icons';
import * as ReactRouterDOM from 'react-router-dom';
import { IMAGE_GENERATION_COST } from '../constants';

// Modal Component for viewing and interacting with a generated image
const ImageModal: React.FC<{ item: GalleryImage; onClose: () => void }> = ({ item, onClose }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const { user, addUserProject } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();

    // Handle Esc key to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleFullscreen = () => {
        imageRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            toast.error("Could not enter fullscreen mode.");
        });
    };
    
    const handleSaveToProjects = () => {
        if (!user) return;
        const newProject: UserProject = {
            id: `proj_${Date.now()}`,
            type: UserProjectType.SAVED_IMAGE,
            title: item.title,
            description: `Image generated from prompt: "${item.prompt}"`,
            timestamp: new Date().toISOString(),
            content: {
                imageUrl: item.imageUrl,
                prompt: item.prompt,
            }
        };
        addUserProject(newProject);
        onClose();
    };

    const handleAddToMusicProject = () => {
        navigate('/studio', { state: { imageUrl: item.imageUrl, prompt: item.prompt } });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-brand-bg rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col lg:flex-row gap-4 p-4 relative animate-burst-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-grow lg:w-3/4 h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                        ref={imageRef}
                        src={item.imageUrl} 
                        alt={item.title}
                        className="max-w-full max-h-[80vh] object-contain"
                    />
                </div>
                <div className="lg:w-1/4 flex flex-col gap-4">
                    <div className="bg-brand-surface p-4 rounded-lg flex-grow">
                         <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                         <p className="text-sm text-brand-text-secondary mb-4">Generated on {item.date}</p>
                         <p className="text-xs text-brand-text-secondary mb-1">PROMPT:</p>
                         <p className="text-sm text-brand-text italic">{item.prompt}</p>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-brand-surface/50">
                            <img 
                                src={item.userAvatarUrl || `https://ui-avatars.com/api/?name=${item.userName}&background=8A42DB&color=fff`} 
                                alt={item.userName} 
                                className="w-8 h-8 rounded-full object-cover" 
                            />
                            <div>
                                <p className="text-xs text-brand-text-secondary">Created by</p>
                                <p className="text-white font-semibold">{item.userName}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <a href={item.imageUrl} download={`${item.title.replace(/\s+/g, '_')}.jpeg`} className="flex items-center justify-center gap-2 p-3 bg-brand-surface text-brand-text rounded-lg font-semibold transition-colors hover:bg-brand-primary">
                            <DownloadIcon className="w-5 h-5"/>
                            <span>Download</span>
                        </a>
                         <button onClick={handleFullscreen} className="flex items-center justify-center gap-2 p-3 bg-brand-surface text-brand-text rounded-lg font-semibold transition-colors hover:bg-brand-primary">
                            <MaximizeIcon className="w-5 h-5"/>
                            <span>Fullscreen</span>
                        </button>
                         <button onClick={handleAddToMusicProject} className="col-span-2 flex items-center justify-center gap-2 p-3 bg-brand-surface text-brand-text rounded-lg font-semibold transition-colors hover:bg-brand-primary">
                             <PlusCircleIcon className="w-5 h-5"/>
                            <span>Add to Music Project</span>
                        </button>
                         <button onClick={handleSaveToProjects} className="col-span-2 flex items-center justify-center gap-2 p-3 bg-brand-surface text-brand-text rounded-lg font-semibold transition-colors hover:bg-brand-primary">
                            <FolderPlusIcon className="w-5 h-5"/>
                            <span>Save to My Projects</span>
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="absolute top-2 right-2 text-brand-text-secondary hover:text-white bg-black/50 rounded-full p-1">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>
    );
};

const GalleryCard: React.FC<{ item: GalleryImage; onCardClick: () => void; index: number; }> = ({ item, onCardClick, index }) => (
    <div 
        onClick={onCardClick} 
        className="cursor-pointer group relative bg-brand-surface rounded-full overflow-hidden shadow-lg aspect-square w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-brand-primary/30"
        style={{ animation: `bubbleFloat 8s ease-in-out infinite`, animationDelay: `${index * 0.3}s` }}
    >
        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center text-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 rounded-full">
            <div>
                <p className="text-white text-sm font-medium line-clamp-3">{item.prompt}</p>
                <p className="text-xs text-brand-text-secondary mt-2">by {item.userName}</p>
            </div>
        </div>
    </div>
);


const CreativeFeedPage: React.FC = () => {
    const { galleryImages, addGalleryImage, updateHeroBackgroundImage } = useContent();
    const { user, updateUser, isAdmin } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 12;
    const gridRef = useRef<HTMLDivElement>(null);

    const displayedImages = React.useMemo(() => {
        return [...galleryImages].reverse().slice(0, page * ITEMS_PER_PAGE);
    }, [galleryImages, page]);

    const hasMore = displayedImages.length < galleryImages.length;

    const loadMore = () => {
        setPage(prev => prev + 1);
    }
    
    const handleGenerate = async () => {
        if (!prompt || !user) {
            setError('Please enter a prompt to generate an image.');
            return;
        }
        
        const canGenerate = user.points >= IMAGE_GENERATION_COST;

        if (!canGenerate) {
            toast.error(`Not enough SMT Points. You need ${IMAGE_GENERATION_COST}.`);
            return;
        }

        const adminCommandMatch = prompt.match(/^TeOadmin:\s*Change main theme to\s*(.*)$/i);

        if (adminCommandMatch && isAdmin) {
            const themePrompt = adminCommandMatch[1];
            if (!themePrompt) {
                toast.error("Admin command requires a description for the new theme.");
                return;
            }

            setIsLoading(true);
            setError('');
            toast.loading("Admin command received. Generating new theme...", { id: 'admin-theme-toast' });

            try {
                const imageData = await generateImage(themePrompt);
                const newImageUrl = `data:image/jpeg;base64,${imageData}`;
                updateHeroBackgroundImage(newImageUrl);
                toast.success("Main theme background updated!", { id: 'admin-theme-toast' });
                setPrompt('');
            } catch (err: any) {
                const errorMessage = err.message || 'Failed to generate new theme.';
                setError(errorMessage);
                toast.error(errorMessage, { id: 'admin-theme-toast' });
            } finally {
                setIsLoading(false);
            }
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const imageData = await generateImage(prompt);
            const newImage: GalleryImage = {
                id: `gallery_${Date.now()}`,
                imageUrl: `data:image/jpeg;base64,${imageData}`,
                title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
                date: new Date().toISOString().split('T')[0],
                description: `Generated on ${new Date().toLocaleDateString()}`,
                prompt: prompt,
                userName: user.vanityName || user.name,
                userAvatarUrl: user.avatarUrl,
            };
            addGalleryImage(newImage);
            updateUser({...user, points: user.points - IMAGE_GENERATION_COST });
            toast.success(`Image generated! (-${IMAGE_GENERATION_COST} SMT)`);
            setPrompt('');
        } catch (err: any) {
            setError(err.message || 'Failed to generate image. Please try again.');
            toast.error(err.message || 'Failed to generate image.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!user) {
         return (
            <div className="text-center py-20">
                <h2 className="text-3xl font-bold text-white">Enter the Creative Feed</h2>
                <p className="text-brand-text-secondary mt-4">You need to be signed in to generate images with AI.</p>
                <ReactRouterDOM.Link to="/signin" className="mt-6 inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                    Sign In to Generate
                </ReactRouterDOM.Link>
            </div>
        )
    }
    
    const canGenerate = user.points >= IMAGE_GENERATION_COST;

    return (
        <div className="bg-brand-bg min-h-screen" style={{ perspective: '1000px' }}>
            {selectedImage && <ImageModal item={selectedImage} onClose={() => setSelectedImage(null)} />}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block">Creative Feed</h1>
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                       Explore a universe of AI-generated visuals from our community. Create your own and add to the collection.
                    </p>
                </div>
                
                <div className="max-w-3xl mx-auto bg-brand-dark p-8 rounded-xl shadow-2xl shadow-brand-primary/10 mb-16 sticky top-24 z-20">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A robot DJing on a neon-lit stage, cinematic lighting"
                        className="w-full bg-brand-surface rounded-lg p-4 text-white placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[100px] text-lg"
                        disabled={isLoading}
                    />
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !canGenerate}
                        className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <SparklesIcon className="w-6 h-6" />
                       <span>{isLoading ? 'Generating...' : `Generate Image (-${IMAGE_GENERATION_COST} SMT)`}</span>
                    </button>
                </div>

                {displayedImages.length > 0 ? (
                    <div ref={gridRef} className="flex flex-wrap justify-center gap-8 md:gap-12 py-8">
                        {displayedImages.map((item, index) => (
                            <GalleryCard key={item.id} item={item} onCardClick={() => setSelectedImage(item)} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-brand-surface rounded-lg">
                        <p className="text-2xl text-white">The Gallery is Eager for Your Vision</p>
                        <p className="text-brand-text-secondary mt-2">
                            Be the first to create and add an image!
                        </p>
                    </div>
                )}

                 {hasMore && (
                    <div className="text-center mt-12">
                        <button 
                            onClick={loadMore} 
                            className="bg-brand-surface text-white font-semibold px-8 py-3 rounded-lg hover:bg-brand-primary transition-colors"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreativeFeedPage;
