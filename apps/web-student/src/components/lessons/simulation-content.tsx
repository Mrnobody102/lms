'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Info, Mic, Send, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Message {
  role: 'ai' | 'user';
  text: string;
  audioUrl?: string;
}

interface SimulationContentProps {
  aiPrompt?: string;
}

export function SimulationContent({ aiPrompt }: SimulationContentProps) {
  const t = useTranslations('Student');
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: 'ai',
      text: t('lesson.simulationGreeting'),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { role: 'user', text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    setTimeout(() => {
      const aiResponse: Message = {
        role: 'ai',
        text: t('lesson.simulationReply'),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[600px] bg-card/40 backdrop-blur-sm border rounded-[2.5rem] shadow-2xl overflow-hidden">
      <div className="p-6 border-b bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight">
              {t('lesson.simulationTitle')}
            </h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {t('lesson.simulationActive')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black border border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          {t('lesson.simulationLive')}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        {aiPrompt && (
          <div className="mb-8 p-4 rounded-2xl bg-muted/50 border border-dashed flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                {t('lesson.simulationScenarioPrompt')}
              </p>
              <p className="text-xs text-muted-foreground italic leading-relaxed">{aiPrompt}</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'ai'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div
                className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                  msg.role === 'ai'
                    ? 'bg-card border border-primary/10 rounded-tl-none'
                    : 'bg-primary text-primary-foreground rounded-tr-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t bg-muted/20">
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            aria-label={isRecording ? t('practice.aiStopSpeaking') : t('practice.aiStartSpeaking')}
            title={isRecording ? t('practice.aiStopSpeaking') : t('practice.aiStartSpeaking')}
            className={`p-4 rounded-2xl transition-all active:scale-95 border ${
              isRecording
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-card hover:bg-muted text-muted-foreground'
            }`}
          >
            <Mic className="w-6 h-6" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('lesson.simulationInputPlaceholder')}
              className="w-full h-14 pl-6 pr-16 rounded-2xl bg-card border-2 border-transparent focus:border-primary/30 focus:outline-none transition-all font-medium text-sm shadow-inner"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              aria-label={t('lesson.simulationSend')}
              title={t('lesson.simulationSend')}
              className="absolute right-2 top-2 h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-30 active:scale-90"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary), 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
