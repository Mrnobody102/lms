'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Info, Mic, Send, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useCreateRoleplaySession,
  useSendRoleplayMessage,
  useCompleteRoleplaySession,
  RoleplaySession,
} from '@/hooks/use-roleplay';
import { Loader2 } from 'lucide-react';

interface Message {
  role: 'ai' | 'user' | 'system';
  text: string;
}

interface SimulationContentProps {
  aiPrompt?: string;
  onComplete?: () => void;
}

export function SimulationContent({ aiPrompt, onComplete }: SimulationContentProps) {
  const t = useTranslations('Student');
  const [session, setSession] = useState<RoleplaySession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createSession = useCreateRoleplaySession();
  const sendMessage = useSendRoleplayMessage();
  const completeSession = useCompleteRoleplaySession();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, session?.feedback]);

  const handleStart = () => {
    if (!aiPrompt) return;
    createSession.mutate(
      { scenario: aiPrompt },
      {
        onSuccess: (data) => {
          setSession(data);
          setMessages(
            data.messages
              .filter((m) => m.role !== 'SYSTEM')
              .map((m) => ({
                role: m.role.toLowerCase() as 'ai' | 'user',
                text: m.content,
              })),
          );
        },
      },
    );
  };

  const handleSend = () => {
    if (!inputText.trim() || !session || sendMessage.isPending) return;

    const text = inputText;
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text }]);

    sendMessage.mutate(
      { sessionId: session.id, content: text },
      {
        onSuccess: (data) => {
          setSession(data);
          setMessages(
            data.messages
              .filter((m) => m.role !== 'SYSTEM')
              .map((m) => ({
                role: m.role.toLowerCase() as 'ai' | 'user',
                text: m.content,
              })),
          );
        },
        onError: () => {
          // Revert optimistic UI on error
          setMessages((prev) => prev.slice(0, -1));
          setInputText(text);
        },
      },
    );
  };

  const handleComplete = () => {
    if (!session) return;
    completeSession.mutate(session.id, {
      onSuccess: (data) => {
        setSession(data);
        if (onComplete) onComplete();
      },
    });
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
            {session?.status === 'IN_PROGRESS' && (
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {t('lesson.simulationActive')}
              </p>
            )}
          </div>
        </div>
        {session?.status === 'IN_PROGRESS' && (
          <button
            onClick={handleComplete}
            disabled={completeSession.isPending}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black transition-colors"
          >
            {completeSession.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {t('practice.examSubmit')}
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        {aiPrompt && !session && (
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

        {!session && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleStart}
              disabled={createSession.isPending || !aiPrompt}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm rounded-full transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('practice.examStart')}
            </button>
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

        {sendMessage.isPending && (
          <div className="flex justify-start animate-in fade-in">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm bg-card border border-primary/10 rounded-tl-none flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-75" />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}

        {session?.status === 'COMPLETED' && session.feedback && (
          <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-primary">{t('practice.reviewAttempt')}</h4>
              <span className="px-3 py-1 bg-primary text-primary-foreground font-black rounded-full text-sm">
                {session.score}/100
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-bold text-muted-foreground">{t('practice.feedbackDetails')}</p>
                <p className="mt-1">{session.feedback.overall || session.feedback.summary}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t bg-muted/20">
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            disabled={session?.status !== 'IN_PROGRESS'}
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
              disabled={session?.status !== 'IN_PROGRESS'}
              placeholder={t('lesson.simulationInputPlaceholder')}
              className="w-full h-14 pl-6 pr-16 rounded-2xl bg-card border-2 border-transparent focus:border-primary/30 focus:outline-none transition-all font-medium text-sm shadow-inner disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={
                !inputText.trim() || session?.status !== 'IN_PROGRESS' || sendMessage.isPending
              }
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
