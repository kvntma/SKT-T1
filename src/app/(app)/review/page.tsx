'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useChat } from '@ai-sdk/react';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Search, FileText, Sparkles, AlertCircle, User, Bot, Loader2, BrainCircuit, BookOpen, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function ReviewChat() {
  const [inputValue, setInputValue] = useState('');
  const [agentId, setAgentId] = useState('philosopher');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, setMessages, sendMessage, error, status } = useChat({
    onError: (err) => {
      console.error('Chat Error (onError hook):', err);
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const currentInput = inputValue;
    setInputValue('');

    try {
      await sendMessage({ text: currentInput }, { body: { agentId } });
    } catch (err) {
      console.error('sendMessage failed:', err);
      setInputValue(currentInput);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto bg-background text-foreground">
      {/* Header - Tactical/Functional */}
      <header className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10 flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            {agentId === 'philosopher' && <BrainCircuit className="w-4 h-4 text-primary" />}
            {agentId === 'journal' && <BookOpen className="w-4 h-4 text-primary" />}
            {agentId === 'orchestrator' && <CalendarClock className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase flex items-center gap-2">
              {agentId === 'philosopher' && 'The Philosopher'}
              {agentId === 'journal' && 'Journal Assistant'}
              {agentId === 'orchestrator' && 'Time Orchestrator'}
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-mono">v2.0</span>
            </h1>
            <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest">Neural Bridge Active</p>
          </div>
        </div>

        <Tabs value={agentId} onValueChange={setAgentId} className="flex-1 max-w-sm mx-4">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/40 border border-border/40">
            <TabsTrigger value="philosopher" className="text-[10px] uppercase font-mono tracking-widest">Philosopher</TabsTrigger>
            <TabsTrigger value="journal" className="text-[10px] uppercase font-mono tracking-widest">Journal</TabsTrigger>
            <TabsTrigger value="orchestrator" className="text-[10px] uppercase font-mono tracking-widest">Scheduler</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            isLoading ? "bg-amber-500" : "bg-emerald-500"
          )} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase">{isLoading ? 'Processing' : 'Standby'}</span>
        </div>
      </header>
      
      {/* Error State */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p><strong>Error:</strong> {error.message}</p>
        </div>
      )}

      {/* Messages Area - More Spacious */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-12 max-w-5xl mx-auto w-full scroll-smooth custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 space-y-4 py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center border border-dashed border-muted-foreground/20">
              <Terminal className="w-8 h-8" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Initializing Neural Bridge...</p>
              <p className="text-xs font-mono uppercase tracking-tighter">Awaiting vault query</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={cn(
                "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                m.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div className={cn(
                "flex items-center gap-2 mb-2 px-1",
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}>
                <div className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center border",
                  m.role === 'user' ? "bg-muted border-border" : "bg-primary/10 border-primary/20"
                )}>
                  {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-primary" />}
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                  {m.role === 'user' ? 'User' : 'Architect'}
                </span>
              </div>

              <div 
                className={cn(
                  "max-w-[85%] md:max-w-[80%] px-6 py-5 rounded-3xl shadow-sm transition-all",
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-card border border-border text-card-foreground rounded-tl-none shadow-md'
                )}
              >
                <div className="space-y-4">
                  {/* Multi-part content rendering */}
                  {m.parts?.map((part: any, i) => {
                    // 1. Text Content
                    if (part.text) {
                      const isReasoning = part.type === 'reasoning' || part.type === 'thought';
                      return (
                        <div key={i} className={cn(
                          isReasoning 
                            ? "text-[12px] leading-relaxed italic text-muted-foreground bg-muted/50 p-4 rounded-xl border-l-2 border-primary/30 my-4 font-mono" 
                            : "prose prose-base dark:prose-invert max-w-none text-[15px] leading-relaxed mb-6 prose-p:my-4 prose-headings:mb-4 prose-headings:mt-6 prose-li:my-1.5 prose-ul:my-4"
                        )}>
                          {isReasoning && (
                            <div className="flex items-center gap-1.5 text-[9px] non-italic font-bold mb-2 opacity-70 uppercase tracking-tighter">
                              <Terminal className="w-2.5 h-2.5" />
                              Internal Analysis Cycle
                            </div>
                          )}
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      );
                    }
                    
                    // 2. Tool Results (Modernized)
                    if (part.type?.startsWith('tool-')) {
                      const toolName = part.type.replace('tool-', '');
                      return (
                        <div key={i} className="my-3 border border-border/60 rounded-xl overflow-hidden bg-background/40 backdrop-blur-sm shadow-inner">
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/40">
                            <div className="flex items-center space-x-2 text-[9px] font-mono text-primary font-bold uppercase tracking-wider">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                              </span>
                              <span>{toolName} output</span>
                            </div>
                            {toolName === 'searchNotes' && part.output && (
                              <span className="text-[9px] font-mono text-muted-foreground italic">
                                {Array.isArray(part.output) ? `${part.output.length} nodes matched` : ''}
                              </span>
                            )}
                          </div>
                          
                          <div className="p-3">
                            {/* Search Results Rendering */}
                            {toolName === 'searchNotes' && Array.isArray(part.output) && (
                              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                {part.output.length === 0 ? (
                                  <div className="flex flex-col items-center py-4 text-muted-foreground/60 italic text-[10px]">
                                    <Search className="w-4 h-4 mb-1 opacity-20" />
                                    No cognitive nodes discovered.
                                  </div>
                                ) : (
                                  part.output.map((res: any, idx: number) => (
                                    <div key={idx} className="group p-2 rounded-md hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                                      <div className="flex items-start gap-2">
                                        <FileText className="w-3 h-3 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors truncate font-mono">
                                            {res.path}
                                          </div>
                                          {res.excerpt && (
                                            <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100">
                                              {res.excerpt}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}

                            {/* Read Note Rendering */}
                            {toolName === 'readNote' && typeof part.output === 'string' && (
                              <div className="text-[11px] text-muted-foreground max-h-80 overflow-y-auto font-mono bg-background/60 p-3 rounded border border-border/40 whitespace-pre-wrap leading-relaxed custom-scrollbar">
                                {part.output}
                              </div>
                            )}

                            {/* General JSON fallback for other tools */}
                            {toolName !== 'searchNotes' && toolName !== 'readNote' && part.output && (
                              <pre className="text-[10px] text-muted-foreground overflow-x-auto p-2 font-mono">
                                {JSON.stringify(part.output, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Global Loading State */}
        {isLoading && (
          <div className="flex items-center space-x-3 px-1 animate-in fade-in duration-500">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest animate-pulse">Syncing with vault</span>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-tighter">Parsing semantic clusters...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Redesigned for focus */}
      <div className="p-6 border-t border-border/40 bg-background/50 backdrop-blur-md">
        <form onSubmit={onFormSubmit} className="relative max-w-4xl mx-auto flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Query the architect..."
              className="h-12 pl-11 pr-4 bg-muted/30 border-border/60 hover:border-border transition-all rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary"
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            size="icon-lg"
            className="rounded-xl shrink-0 shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="mt-3 text-center text-[9px] text-muted-foreground/40 font-mono uppercase tracking-[0.2em]">
          End-to-end semantic bridge active • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
