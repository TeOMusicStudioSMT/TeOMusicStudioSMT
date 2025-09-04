
import React, { useState } from 'react';
import { SparklesIcon, XIcon } from '../icons';
import { generateDescriptionText } from '../../services/geminiService';
import toast from 'react-hot-toast';

interface TextGenerationInputProps {
    value: string;
    onValueChange: (newValue: string) => void;
    placeholder?: string;
    label: string;
    generationContext: object;
    minHeight?: string;
}

const TextGenerationModal: React.FC<{
    onClose: () => void;
    onTextSelect: (text: string) => void;
    generationContext: object;
    label: string;
}> = ({ onClose, onTextSelect, generationContext, label }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedText, setGeneratedText] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        setGeneratedText(null);
        try {
            const text = await generateDescriptionText(generationContext, prompt, label);
            setGeneratedText(text);
            toast.success("Text generated!");
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
            toast.error(err.message || "Failed to generate text.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseText = () => {
        if (generatedText) {
            onTextSelect(generatedText);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-brand-bg rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white"><XIcon/></button>
                <h3 className="text-xl font-bold text-white mb-4">Generate {label}</h3>
                <div className="space-y-4">
                    <div className="bg-brand-surface p-3 rounded-lg">
                        <p className="text-xs text-brand-text-secondary mb-1">Based on this context:</p>
                        <pre className="text-xs text-white whitespace-pre-wrap font-mono max-h-24 overflow-y-auto">
                            {JSON.stringify(generationContext, null, 2)}
                        </pre>
                    </div>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Add keywords or specific instructions (e.g., 'Make it sound mysterious', 'focus on the cinematic aspect')..."
                        className="w-full bg-brand-surface rounded-lg p-3 text-white placeholder-brand-text-secondary min-h-[80px]"
                        disabled={isGenerating}
                    />
                    <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary-gen w-full">
                        {isGenerating ? 'Generating...' : 'Generate Text'}
                    </button>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {isGenerating && (
                        <div className="text-center p-4">
                            <p className="animate-pulse text-white">Jason is thinking...</p>
                        </div>
                    )}
                    {generatedText && (
                        <div className="space-y-4">
                            <textarea
                                readOnly
                                value={generatedText}
                                className="w-full bg-brand-dark rounded-lg p-3 text-white min-h-[150px]"
                            />
                             <button onClick={handleUseText} className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-500">
                                Use This Text
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


export const TextGenerationInput: React.FC<TextGenerationInputProps> = ({ value, onValueChange, placeholder, label, generationContext, minHeight = '150px' }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-brand-text-secondary">{label}</label>
                 <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-accent transition-colors"
                    title={`Generate ${label} with AI`}
                >
                    <SparklesIcon className="w-4 h-4" />
                    Generate
                </button>
            </div>
            <textarea
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                style={{ minHeight }}
            />
            {isModalOpen && (
                <TextGenerationModal
                    onClose={() => setIsModalOpen(false)}
                    onTextSelect={onValueChange}
                    generationContext={generationContext}
                    label={label}
                />
            )}
        </div>
    );
};

export default TextGenerationInput;
