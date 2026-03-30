'use client';

import { useChat } from '@ai-sdk/react';
import React, { useState, useEffect } from 'react';

export default function ReviewChat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading, error, status } = useChat({
    maxSteps: 10,
    onError: (err) => {
      console.error('Chat Error (onError hook):', err);
    }
  });

  // Debug: Log messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      console.log('--- Messages Updated ---');
      messages.forEach((m, idx) => {
        console.log(`Msg ${idx} (${m.role}):`, m);
      });
    }
  }, [messages]);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    setInput('');

    try {
      await sendMessage({ text: currentInput });
    } catch (err) {
      console.error('sendMessage failed:', err);
      setInput(currentInput);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 bg-zinc-950 text-zinc-100">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Knowledge Architect</h1>
        <p className="text-zinc-400 text-sm">Reviewing your Obsidian Vault</p>
      </header>
      
      {error && (
        <div className="p-4 mb-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <p>No active session. Start by asking about your notes.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[90%] px-4 py-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none shadow-xl'
                }`}
              >
                <div className="text-[10px] opacity-50 mb-1.5 font-bold uppercase tracking-wider">
                  {m.role === 'user' ? 'User' : 'Architect'}
                </div>
                
                <div className="space-y-3">
                  {/* Standard content */}
                  {m.content && <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>}
                  
                  {/* Multi-part content rendering */}
                  {m.parts?.map((part: any, i) => {
                    // 1. Text Content
                    if (part.text) {
                      const isReasoning = part.type === 'reasoning' || part.type === 'thought';
                      return (
                        <div key={i} className={isReasoning ? "text-xs italic text-zinc-400 bg-zinc-800/30 p-2 rounded-lg border-l-2 border-zinc-700 my-2" : "whitespace-pre-wrap text-sm leading-relaxed"}>
                          {isReasoning && <span className="block text-[10px] non-italic font-bold mb-1 opacity-50 uppercase">Internal Reasoning</span>}
                          {part.text}
                        </div>
                      );
                    }
                    
                    // 2. Tool Results (The meat of the vault search)
                    if (part.type?.startsWith('tool-')) {
                      const toolName = part.type.replace('tool-', '');
                      return (
                        <div key={i} className="my-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                          <div className="flex items-center space-x-2 text-[10px] font-mono text-blue-400 mb-2 font-bold uppercase">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            <span>{toolName} result</span>
                          </div>
                          
                          {/* Search Results Rendering */}
                          {toolName === 'searchNotes' && Array.isArray(part.output) && (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {part.output.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">No matches found.</p>
                              ) : (
                                part.output.map((res: any, idx: number) => (
                                  <div key={idx} className="group cursor-default">
                                    <div className="text-xs font-semibold text-zinc-300 group-hover:text-blue-400 transition-colors truncate">
                                      📄 {res.path}
                                    </div>
                                    <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-snug">
                                      {res.excerpt}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Read Note Rendering */}
                          {toolName === 'readNote' && typeof part.output === 'string' && (
                            <div className="text-xs text-zinc-400 max-h-60 overflow-y-auto font-mono bg-zinc-900/50 p-2 rounded">
                              {part.output}
                            </div>
                          )}

                          {/* General JSON fallback for other tools */}
                          {toolName !== 'searchNotes' && toolName !== 'readNote' && part.output && (
                            <pre className="text-[10px] text-zinc-500 overflow-x-auto">
                              {JSON.stringify(part.output, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Empty state during multi-step processes */}
                  {!m.content && (!m.parts || m.parts.length === 0) && (
                    <div className="flex items-center space-x-2 text-zinc-500 text-xs italic">
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-ping"></div>
                      <span>Architect is analyzing the vault...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Global Loading State */}
        {(isLoading || status === 'submitted' || status === 'streaming') && (
          <div className="flex items-center space-x-2 px-2 text-zinc-500 text-xs animate-pulse">
            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
            <span>Deep in the vault...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={onFormSubmit} className="relative mt-auto pt-4 border-t border-zinc-900/50">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your vault (e.g., 'Summarize my dopamine notes')"
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-zinc-600 shadow-2xl"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 p-2 text-zinc-400 hover:text-blue-400 disabled:opacity-20 transition-all hover:scale-110 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
        </button>
      </form>
    </div>
  );
}
