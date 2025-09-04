

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as ReactRouterDOM from 'react-router-dom';
import { Artist, ChatMessage, SubscriptionTier } from '../types';
import { COAI_ARTISTS, CHAT_QUERY_LIMITS, CHAT_MESSAGE_COST } from '../constants';
import { getArtistChatResponse } from '../services/geminiService';
import { SendIcon } from '../components/icons';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState<Artist>(COAI_ARTISTS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryLimit = user ? CHAT_QUERY_LIMITS[user.tier] : CHAT_QUERY_LIMITS[SubscriptionTier.FREE];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    // Reset chat when artist changes
    setMessages([]);
    setQueryCount(0);
  }, [selectedArtist]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    if (queryLimit !== null && queryCount >= queryLimit) {
        toast.error("You've reached your message limit for this artist.");
        return;
    }

    if (user.points < CHAT_MESSAGE_COST) {
        toast.error(`Not enough SMT points. You need ${CHAT_MESSAGE_COST} to send a message.`);
        return;
    }

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const aiResponseText = await getArtistChatResponse(input, selectedArtist);
        const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText, artist: selectedArtist };
        setMessages(prev => [...prev, aiMessage]);
        
        // Deduct points for chatting
        updateUser({ ...user, points: user.points - CHAT_MESSAGE_COST });
        toast(`-${CHAT_MESSAGE_COST} SMT`, { duration: 2000 });

    } catch (error) {
        const errorMessage: ChatMessage = { sender: 'ai', text: 'Sorry, I am unable to respond right now.', artist: selectedArtist };
        setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
    setQueryCount(prev => prev + 1);
  };
  
  if (!user) {
    return (
        <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white">Chat With Our Artists</h2>
            <p className="text-brand-text-secondary mt-4">You need to be signed in to talk with our CoAI artists.</p>
            <ReactRouterDOM.Link to="/signin" className="mt-6 inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                Sign In to Chat
            </ReactRouterDOM.Link>
        </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-brand-dark text-white">
      {/* Artist Sidebar */}
      <aside className="w-1/4 bg-brand-bg p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Select an Artist</h2>
        <div className="space-y-2">
          {COAI_ARTISTS.map(artist => (
            <button
              key={artist.id}
              onClick={() => setSelectedArtist(artist)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                selectedArtist.id === artist.id ? 'bg-brand-primary' : 'hover:bg-brand-surface'
              }`}
            >
              <img src={artist.imageUrl} alt={artist.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-semibold">{artist.name}</p>
                <p className="text-sm text-brand-text-secondary">{artist.genre}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="w-3/4 flex flex-col">
        {/* Chat Header */}
        <header className="bg-brand-surface p-4 border-b border-brand-surface/50 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chatting with {selectedArtist.name}</h1>
          <div className="text-sm text-brand-text-secondary">
            {queryLimit !== null ? `${queryCount} / ${queryLimit} Messages Sent` : `Unlimited Messages`}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-brand-dark">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <img src={msg.artist?.imageUrl} alt={msg.artist?.name} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div className={`max-w-lg px-4 py-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-brand-primary rounded-br-none'
                      : 'bg-brand-surface rounded-bl-none'
                  }`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex items-end gap-3 justify-start">
                    <img src={selectedArtist.imageUrl} alt={selectedArtist.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="max-w-lg px-4 py-3 rounded-2xl bg-brand-surface rounded-bl-none">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce"></div>
                        </div>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-brand-bg p-4 border-t border-brand-surface/50">
          <div className="flex items-center space-x-4 bg-brand-surface rounded-lg pr-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder={`Send a message to ${selectedArtist.name}...`}
              className="w-full bg-transparent p-4 text-white placeholder-brand-text-secondary focus:outline-none"
              disabled={isLoading || (queryLimit !== null && queryCount >= queryLimit)}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || (queryLimit !== null && queryCount >= queryLimit)}
              className="bg-brand-primary p-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-primary/80 transition-colors"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
