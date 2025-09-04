
import React, { useState } from 'react';
import { SparklesIcon, XIcon, ImageIcon, MusicNoteIcon } from '../icons';
import { generateImage } from '../../services/geminiService';
import toast from 'react-hot-toast';
import { useContent } from '../../hooks/useContent';
import { AssetType } from '../../types';

interface AssetPickerModalProps {
    onClose: () => void;
    onAssetSelect: (url: string) => void;
    assetType: AssetType;
}

const AssetPickerModal: React.FC<AssetPickerModalProps> = ({ onClose, onAssetSelect, assetType }) => {
    const { assetVault } = useContent();
    const filteredAssets = assetVault.filter(a => a.type === assetType);

    const handleSelect = (url: string) => {
        onAssetSelect(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
            <div className="bg-brand-bg rounded-xl shadow-2xl w-full max-w-3xl p-6 relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white"><XIcon/></button>
                <h3 className="text-xl font-bold text-white mb-4">Select {assetType} from Vault</h3>
                {filteredAssets.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                        {filteredAssets.map(asset => (
                            <div key={asset.id} onClick={() => handleSelect(asset.url)} className="cursor-pointer bg-brand-surface p-3 rounded-lg text-center hover:bg-brand-primary transition-colors group">
                                {assetType === AssetType.IMAGE && (
                                    <img src={asset.url} alt={asset.name} className="w-full h-24 object-cover rounded-md mb-2"/>
                                )}
                                {assetType === AssetType.AUDIO && (
                                    <div className="w-full h-24 bg-brand-dark rounded-md mb-2 flex items-center justify-center">
                                        <MusicNoteIcon className="w-10 h-10 text-brand-primary"/>
                                    </div>
                                )}
                                <p className="text-xs text-white truncate group-hover:text-white">{asset.name}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-brand-text-secondary text-center py-8">No {assetType.toLowerCase()} assets found in the vault.</p>
                )}
            </div>
        </div>
    );
};


interface ImageGenerationModalProps {
    onClose: () => void;
    onImageSelect: (imageUrl: string) => void;
}

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ onClose, onImageSelect }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt) {
            toast.error("Please enter a prompt.");
            return;
        }
        setIsGenerating(true);
        setError('');
        setGeneratedImageUrl(null);
        try {
            const base64Bytes = await generateImage(prompt);
            const fullUrl = `data:image/jpeg;base64,${base64Bytes}`;
            setGeneratedImageUrl(fullUrl);
            toast.success("Image generated!");
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
            toast.error(err.message || "Failed to generate image.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseImage = () => {
        if (generatedImageUrl) {
            onImageSelect(generatedImageUrl);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-brand-bg rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white"><XIcon/></button>
                <h3 className="text-xl font-bold text-white mb-4">Generate Image</h3>
                <div className="space-y-4">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want to create..."
                        className="w-full bg-brand-surface rounded-lg p-3 text-white placeholder-brand-text-secondary min-h-[80px]"
                        disabled={isGenerating}
                    />
                    <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="btn-primary-gen w-full">
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {isGenerating && (
                        <div className="text-center p-4">
                            <p className="animate-pulse text-white">Contacting creative matrix...</p>
                        </div>
                    )}
                    {generatedImageUrl && (
                        <div className="space-y-4">
                            <img src={generatedImageUrl} alt="Generated preview" className="rounded-lg w-full max-h-96 object-contain bg-black"/>
                             <button onClick={handleUseImage} className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-500">
                                Use This Image
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
            .btn-primary-gen {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                background-color: #8A42DB;
                color: white;
                font-weight: 600;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                transition: opacity 0.2s;
            }
            .btn-primary-gen:hover:not(:disabled) {
                opacity: 0.9;
            }
            .btn-primary-gen:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            `}</style>
        </div>
    );
};


interface ImageGenerationInputProps {
    value: string;
    onValueChange: (newValue: string) => void;
    placeholder?: string;
    inputClassName?: string;
    assetType?: AssetType;
}

export const ImageGenerationInput: React.FC<ImageGenerationInputProps> = ({ value, onValueChange, placeholder, inputClassName, assetType = AssetType.IMAGE }) => {
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

    const defaultClasses = "w-full bg-brand-surface rounded-lg px-4 py-3 pr-20 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary";

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={placeholder}
                className={inputClassName || defaultClasses}
            />
            <div className="absolute inset-y-0 right-0 px-2 flex items-center gap-1">
                 <button
                    type="button"
                    onClick={() => setIsVaultModalOpen(true)}
                    className="p-2 text-brand-text-secondary hover:text-white transition-colors"
                    title="Select from Asset Vault"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                {assetType === AssetType.IMAGE && (
                     <button
                        type="button"
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="text-brand-primary hover:text-brand-accent transition-colors p-2"
                        title="Generate image with AI"
                    >
                        <SparklesIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isGenerateModalOpen && assetType === AssetType.IMAGE && (
                <ImageGenerationModal
                    onClose={() => setIsGenerateModalOpen(false)}
                    onImageSelect={onValueChange}
                />
            )}
            {isVaultModalOpen && (
                 <AssetPickerModal
                    onClose={() => setIsVaultModalOpen(false)}
                    onAssetSelect={onValueChange}
                    assetType={assetType}
                />
            )}
        </div>
    );
};

export default ImageGenerationInput;
