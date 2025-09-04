
import React, { useState, useEffect, useRef } from 'react';
import { getCodeAssistantResponseStream } from '../../services/geminiService';
import { SendIcon, CopyIcon } from '../icons';
import { SpecializedAgent } from '../../types';
import toast from 'react-hot-toast';

const FILE_PATHS = [
  'index.tsx',
  'App.tsx',
  'types.ts',
  'constants.ts',
  'services/geminiService.ts',
  'pages/HomePage.tsx',
  'components/Header.tsx',
  'components/Footer.tsx',
  'pages/admin/AdminCodeEditorPage.tsx',
];

type ChatMessage = {
    sender: 'user' | 'ai';
    text: string;
};

const AiMessage: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Code copied to clipboard!");
    };

    return (
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const codeBlock = part.replace(/```(tsx|ts|jsx|js|html|css)?\n/g, '').replace(/```/g, '').trim();
                    return (
                        <div key={index} className="relative bg-brand-dark p-3 my-2 rounded-md font-mono text-xs">
                            <button 
                                onClick={() => handleCopy(codeBlock)}
                                className="absolute top-2 right-2 p-1.5 bg-brand-surface/50 text-brand-text-secondary hover:bg-brand-primary hover:text-white rounded-md transition-colors"
                            >
                                <CopyIcon className="w-4 h-4" />
                            </button>
                            <pre className="overflow-x-auto">
                                <code>{codeBlock}</code>
                            </pre>
                        </div>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
};

interface CodeAssistantPanelProps {
    agent: SpecializedAgent;
}

const CodeAssistantPanel: React.FC<CodeAssistantPanelProps> = ({ agent }) => {
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [codeContent, setCodeContent] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleFileSelect = (path: string) => {
        setSelectedFile(path);
        setCodeContent('');
        setMessages([]);
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        if (!selectedFile) {
            toast.error("Please select a file first.");
            return;
        }

        if (!codeContent.trim()) {
            toast.error("Please paste the file content into the editor.");
            return;
        }

        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        const aiResponsePlaceholder: ChatMessage = { sender: 'ai', text: '' };
        
        setMessages(prev => [...prev, userMessage, aiResponsePlaceholder]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        const chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        try {
            const stream = await getCodeAssistantResponseStream(selectedFile, codeContent, currentInput, chatHistory, agent.systemInstruction);
            
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'ai') {
                        lastMessage.text = fullText;
                    }
                    return newMessages;
                });
            }
        } catch (error: any) {
            console.error("Gemini API error:", error);
            const errorMessage: ChatMessage = { sender: 'ai', text: `Error: ${error.message}` };
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = errorMessage;
                return newMessages;
            });
            toast.error(error.message || "An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="h-full flex gap-4 overflow-hidden">
            {/* File List */}
            <div className="w-1/4 bg-brand-bg p-4 rounded-lg flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-3">Project Files</h2>
                <ul className="space-y-1 overflow-y-auto">
                    {FILE_PATHS.map(path => (
                        <li key={path}>
                            <button 
                                onClick={() => handleFileSelect(path)}
                                className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${selectedFile === path ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-surface hover:text-white'}`}
                            >
                                {path}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Editor & Chat */}
            <div className="w-3/4 flex flex-col gap-4">
                <div className="h-1/2 bg-brand-bg p-4 rounded-lg flex flex-col">
                     <h2 className="text-lg font-semibold text-white mb-2">{selectedFile || 'No file selected'}</h2>
                     <textarea 
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        placeholder={selectedFile ? `Paste content of '${selectedFile}' here...` : 'Select a file to begin...'}
                        className="w-full h-full bg-brand-dark rounded-md p-3 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                </div>
                <div className="h-1/2 bg-brand-bg p-4 rounded-lg flex flex-col">
                    <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-primary/50 flex items-center justify-center font-bold text-white flex-shrink-0">AI</div>}
                                <div className={`max-w-xl px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-brand-primary' : 'bg-brand-surface'}`}>
                                    {msg.sender === 'ai' ? <AiMessage text={msg.text} /> : <p className="text-sm">{msg.text}</p>}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length-1]?.text === '' && (
                            <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-brand-primary/50 flex-shrink-0"></div><div className="px-4 py-2 rounded-lg bg-brand-surface animate-pulse">...</div></div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="flex items-center gap-2">
                         <input
                            type="text"
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder={`Ask ${agent.name.split(' ')[0]} to generate, debug, or explain...`}
                            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            disabled={isLoading}
                        />
                        <button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} className="bg-brand-primary p-3 rounded-lg text-white disabled:opacity-50 transition-opacity">
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeAssistantPanel;
