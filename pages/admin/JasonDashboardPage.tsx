

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SendIcon, StarIcon, GlobeIcon } from '../../components/icons';
import { GoogleGenAI, Chat } from '@google/genai';
import { useContent } from '../../hooks/useContent';
import { JasonChatMessage, SpecializedAgent, Artist, SubscriptionTier } from '../../types';
import CodeAssistantPanel from '../../components/admin/CodeAssistantPanel';
import { routeUserPromptToAgent, generateArtistPageFromSuno, generateImage } from '../../services/geminiService';

const Section: React.FC<{ title: string; children: React.ReactNode; titleAction?: React.ReactNode }> = ({ title, children, titleAction }) => (
    <div className="bg-brand-surface p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-brand-primary">{title}</h2>
            {titleAction}
        </div>
        <div className="text-brand-text-secondary space-y-4">
            {children}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <label htmlFor="toggle" className="flex items-center cursor-pointer">
        <div className="relative">
            <input id="toggle" type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-brand-primary' : 'bg-brand-bg'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
    </label>
);

const JasonDashboardPage: React.FC = () => {
    const { specializedAgents, specializedAgentChats, setSpecializedAgentChats, specializedAgentSessions, addArtist } = useContent();
    const navigate = useNavigate();
    const [isDirectorMode, setIsDirectorMode] = useState(true);
    const [activeAgentId, setActiveAgentId] = useState('jason-executive');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sunoUrl, setSunoUrl] = useState('');
    const [isPageGenerating, setIsPageGenerating] = useState(false);

    const jasonAgent = useMemo(() => specializedAgents.find(a => a.id === 'jason-executive'), [specializedAgents]);
    const activeAgent = useMemo(() => specializedAgents.find(a => a.id === activeAgentId), [activeAgentId, specializedAgents]);

    const currentAgent = isDirectorMode ? jasonAgent : activeAgent;
    const messages = currentAgent ? specializedAgentChats[currentAgent.id] || [] : [];

    const getSystemInstructionForAgent = (agent: SpecializedAgent) => {
        let instruction = agent.systemInstruction;
        if (instruction.includes('[AGENT_LIST_PLACEHOLDER]')) {
            const agentList = specializedAgents.map(a => `- ${a.name}: ${a.description}`).join('\n');
            instruction = instruction.replace('[AGENT_LIST_PLACEHOLDER]', agentList);
        }
        return instruction;
    };

    const getOrCreateChatSession = (agent: SpecializedAgent): Chat => {
        if (specializedAgentSessions.current[agent.id]) {
            return specializedAgentSessions.current[agent.id]!;
        }
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const session = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: getSystemInstructionForAgent(agent) },
                history: (specializedAgentChats[agent.id] || []).map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }))
            });
            specializedAgentSessions.current[agent.id] = session;
            return session;
        } catch (e) {
            console.error(`Failed to initialize Chat for ${agent.name}`, e);
            toast.error(`Failed to initialize ${agent.name}'s AI Matrix. API Key might be missing.`);
            throw e;
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);
    
    const handleGenerateArtistPage = async () => {
        if (!sunoUrl.trim()) {
            toast.error("Please enter a Suno playlist URL.");
            return;
        }
        setIsPageGenerating(true);
        toast.loading("Jason is conceptualizing the artist...", { id: 'artist-gen' });

        try {
            const artistDataWithPrompts = await generateArtistPageFromSuno(sunoUrl);
            
            toast.loading("Generating artist visuals... (this may take a moment)", { id: 'artist-gen' });

            const promptsToGenerate: { key: (string|number)[]; prompt: string }[] = [];
            promptsToGenerate.push({ key: ['imageUrl'], prompt: artistDataWithPrompts.imageUrl });
            promptsToGenerate.push({ key: ['headerImageUrl'], prompt: artistDataWithPrompts.headerImageUrl });
            artistDataWithPrompts.discography.forEach((release, index) => {
                promptsToGenerate.push({ key: ['discography', index, 'coverImageUrl'], prompt: release.coverImageUrl });
            });
            artistDataWithPrompts.gallery.forEach((prompt, index) => {
                promptsToGenerate.push({ key: ['gallery', index], prompt: prompt });
            });

            const imageGenerationPromises = promptsToGenerate.map(p => generateImage(p.prompt));
            const generatedImages = await Promise.all(imageGenerationPromises);

            const finalArtist: Artist = JSON.parse(JSON.stringify(artistDataWithPrompts));
            finalArtist.spotifyArtistEmbedUrl = '';

            generatedImages.forEach((base64, i) => {
                const { key } = promptsToGenerate[i];
                const url = `data:image/jpeg;base64,${base64}`;
                let current: any = finalArtist;
                for (let j = 0; j < key.length - 1; j++) {
                    current = current[key[j]];
                }
                current[key[key.length - 1]] = url;
            });
            
            finalArtist.discography.forEach(release => {
                release.tracks = (release.tracks as any[]).map(track => ({
                    ...track,
                    sourceUrl: '',
                    accessTier: SubscriptionTier.FREE
                }));
            });
            
            addArtist(finalArtist);
            
            toast.success(
                (t) => (
                  <span>
                    Artist <b>{finalArtist.name}</b> created!
                    <button 
                        onClick={() => {
                            navigate(`/artists/${finalArtist.id}`);
                            toast.dismiss(t.id);
                        }} 
                        className="ml-2 font-bold text-brand-primary underline"
                    >
                      View Page
                    </button>
                  </span>
                ),
                { id: 'artist-gen', duration: 10000 }
            );

        } catch (error: any) {
            console.error("Artist page generation failed:", error);
            toast.error(`Error: ${error.message}`, { id: 'artist-gen' });
        } finally {
            setIsPageGenerating(false);
            setSunoUrl('');
        }
    };


    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        if (isDirectorMode && jasonAgent) {
            // DIRECTOR MODE
            const userMessage: JasonChatMessage = { sender: 'user', text: currentInput };
            setSpecializedAgentChats(prev => ({ ...prev, [jasonAgent.id]: [...(prev[jasonAgent.id] || []), userMessage] }));

            try {
                const delegatedAgentId = await routeUserPromptToAgent(currentInput);
                const delegatedAgent = specializedAgents.find(a => a.id === delegatedAgentId);

                if (!delegatedAgent) throw new Error("Could not find an appropriate agent.");

                if (delegatedAgent.type === 'code') {
                    toast.success(`Jason is delegating to ${delegatedAgent.name}.`, { duration: 4000 });
                    const delegationMsg: JasonChatMessage = { sender: 'jason', text: `This is a coding task. I'm handing you over to ${delegatedAgent.name}. His interface is now active.` };
                    setSpecializedAgentChats(prev => ({ ...prev, [jasonAgent.id]: [...(prev[jasonAgent.id] || []), delegationMsg] }));
                    setIsDirectorMode(false);
                    setActiveAgentId(delegatedAgent.id);
                    return;
                }

                const delegationMsg: JasonChatMessage = { sender: 'jason', text: `Thinking... I'll pass this to ${delegatedAgent.name}.` };
                const aiResponsePlaceholder: JasonChatMessage = { sender: 'jason', text: '' };
                setSpecializedAgentChats(prev => ({ ...prev, [jasonAgent.id]: [...(prev[jasonAgent.id] || []), delegationMsg, aiResponsePlaceholder] }));
                
                const delegatedSession = getOrCreateChatSession(delegatedAgent);
                const stream = await delegatedSession.sendMessageStream({ message: currentInput });

                let fullText = '';
                for await (const chunk of stream) {
                    fullText += chunk.text;
                    setSpecializedAgentChats(prev => {
                        const jasonHistory = [...(prev[jasonAgent.id] || [])];
                        jasonHistory[jasonHistory.length - 1] = { sender: 'jason', text: fullText };
                        return { ...prev, [jasonAgent.id]: jasonHistory };
                    });
                }
            } catch (error: any) {
                const errorMessage: JasonChatMessage = { sender: 'jason', text: `Error: ${error.message || "Could not get a response."}` };
                setSpecializedAgentChats(prev => ({...prev, [jasonAgent.id]: [...(prev[jasonAgent.id] || []), errorMessage] }));
            } finally {
                setIsLoading(false);
            }
        } else if (currentAgent) {
            // MANUAL MODE
            const session = getOrCreateChatSession(currentAgent);
            const userMessage: JasonChatMessage = { sender: 'user', text: currentInput };
            const aiResponsePlaceholder: JasonChatMessage = { sender: 'jason', text: '' };
            setSpecializedAgentChats(prev => ({ ...prev, [currentAgent.id]: [...(prev[currentAgent.id] || []), userMessage, aiResponsePlaceholder] }));

            try {
                const stream = await session.sendMessageStream({ message: currentInput });
                let fullText = '';
                for await (const chunk of stream) {
                    fullText += chunk.text;
                    setSpecializedAgentChats(prev => {
                        const agentHistory = [...(prev[currentAgent.id] || [])];
                        agentHistory[agentHistory.length - 1] = { sender: 'jason', text: fullText };
                        return { ...prev, [currentAgent.id]: agentHistory };
                    });
                }
            } catch (error: any) {
                const errorMessage: JasonChatMessage = { sender: 'jason', text: `Error: ${error.message}` };
                setSpecializedAgentChats(prev => {
                    const agentHistory = [...(prev[currentAgent.id] || [])];
                    agentHistory[agentHistory.length - 1] = errorMessage;
                    return { ...prev, [currentAgent.id]: agentHistory };
                });
                toast.error(`An error occurred with ${currentAgent.name}.`);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    if (!currentAgent) return <div>Loading agent configuration...</div>;

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-4xl font-extrabold text-white mb-8">S.M.T. Agent Console</h1>
            <div className="space-y-8 flex-grow flex flex-col">
                <Section title="Site Generation">
                    <p className="text-sm mb-4">
                        Provide a Suno playlist URL. Jason will analyze its theme and generate a complete artist profile, including bio, discography, and AI-generated artwork.
                    </p>
                    <div className="flex items-center gap-4">
                        <input
                            type="url"
                            value={sunoUrl}
                            onChange={e => setSunoUrl(e.target.value)}
                            placeholder="https://suno.com/playlist/..."
                            className="w-full bg-brand-bg rounded-lg p-3 text-white placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            disabled={isPageGenerating}
                        />
                        <button
                            onClick={handleGenerateArtistPage}
                            disabled={isPageGenerating || !sunoUrl}
                            className="bg-brand-primary p-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0 flex items-center gap-2"
                        >
                            <GlobeIcon className="w-5 h-5"/>
                            <span>{isPageGenerating ? 'Generating...' : 'Generate Page'}</span>
                        </button>
                    </div>
                </Section>
                <Section title="Console Mode" titleAction={
                    <div className="flex items-center gap-4">
                        <span className={`font-semibold transition-colors ${!isDirectorMode ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>Manual</span>
                        <ToggleSwitch checked={isDirectorMode} onChange={setIsDirectorMode} />
                        <span className={`font-semibold transition-colors ${isDirectorMode ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>Director</span>
                    </div>
                }>
                    <p className="text-sm">
                       {isDirectorMode 
                         ? "You are in Director Mode. All commands go through Jason, who will delegate tasks to his specialist team."
                         : "You are in Manual Mode. Use the tabs below to select and communicate with a specific agent directly."
                       }
                    </p>
                </Section>
                
                <div className="bg-brand-surface p-6 rounded-lg shadow-lg flex-grow flex flex-col">
                     <div className={`flex border-b border-brand-primary/20 overflow-x-auto transition-opacity ${isDirectorMode ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {specializedAgents.filter(a => a.id !== 'agent-router').map(agent => (
                            <button 
                                key={agent.id} 
                                onClick={() => setActiveAgentId(agent.id)} 
                                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                                    activeAgentId === agent.id 
                                    ? 'border-b-2 border-brand-primary text-white' 
                                    : 'text-brand-text-secondary hover:text-white'
                                }`}
                                disabled={isDirectorMode}
                            >
                               {agent.id === 'jason-executive' && <StarIcon className="w-4 h-4 inline-block mr-2 text-yellow-400" />}
                               {agent.name}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 flex-grow flex flex-col">
                        {currentAgent.type === 'code' ? (
                            <CodeAssistantPanel agent={currentAgent} />
                        ) : (
                           <>
                                <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.sender === 'jason' && (
                                                <div className="w-8 h-8 rounded-full bg-brand-primary/50 flex items-center justify-center font-bold text-white flex-shrink-0">{currentAgent.name.charAt(0)}</div>
                                            )}
                                            <div className={`max-w-xl px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-bg text-brand-text'}`}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && messages.length > 0 && messages[messages.length-1]?.text === '' && (
                                        <div className="flex items-start gap-3 justify-start">
                                            <div className="w-8 h-8 rounded-full bg-brand-primary/50 flex items-center justify-center font-bold text-white flex-shrink-0">{currentAgent.name.charAt(0)}</div>
                                            <div className="max-w-lg px-4 py-3 rounded-lg bg-brand-bg">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                                    <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                                    <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="mt-auto pt-4 border-t border-brand-primary/20 flex items-center gap-4">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                        placeholder={`Enter command for ${currentAgent.name}...`}
                                        className="w-full bg-brand-bg rounded-lg p-3 text-white placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                                        rows={1}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={isLoading || !input.trim()}
                                        className="bg-brand-primary p-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
                                    >
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JasonDashboardPage;
