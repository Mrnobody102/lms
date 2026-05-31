'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@repo/ui';
import { Bot, CheckCircle2, Send, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  useGetRoleplaySession,
  useSendMessage,
  useCompleteRoleplaySession,
} from '../api/use-roleplay';
import { AudioRecorder } from './audio-recorder';
import { PronunciationScorePanel } from './pronunciation-score-panel';

export function ChatInterface({ sessionId }: { sessionId: string }) {
  const t = useTranslations('Student');
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading, isError } = useGetRoleplaySession(sessionId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: completeSession, isPending: isCompleting } = useCompleteRoleplaySession();

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [session?.messages]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="animate-pulse">{t('roleplay.loadingConversation')}</span>
      </div>
    );
  if (isError || !session) return <div>{t('roleplay.sessionLoadError')}</div>;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;
    sendMessage(
      { id: sessionId, content: message },
      {
        onSuccess: () => setInput(''),
      },
    );
  };

  const isCompleted = session.status === 'COMPLETED';

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border rounded-xl overflow-hidden shadow-sm bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div>
          <h2 className="font-semibold text-lg">{t('roleplay.sessionTitle')}</h2>
          <p className="text-sm text-muted-foreground">{session.scenario}</p>
          <p className="mt-1 text-xs font-semibold uppercase text-primary">
            {t(`roleplay.mode.${session.mode}`)}
          </p>
        </div>
        {!isCompleted && (
          <ConfirmDialog
            description={t('roleplay.confirmComplete')}
            confirmLabel={t('roleplay.endConversation')}
            onConfirm={() => completeSession(sessionId)}
          >
            <Button variant="outline" size="sm" disabled={isCompleting}>
              {isCompleting ? t('roleplay.evaluating') : t('roleplay.endConversation')}
              {!isCompleting && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </Button>
          </ConfirmDialog>
        )}
      </div>

      {/* Evaluation Results */}
      {isCompleted && session.feedback && (
        <div className="p-4 bg-primary/5 border-b">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-bold text-lg text-primary">{t('roleplay.finalEvaluation')}</h3>
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-sm font-semibold">
              {t('roleplay.score', { score: session.score ?? 0 })}
            </span>
          </div>
          <div className="grid gap-2 text-sm">
            <p>
              <strong>{t('roleplay.feedbackOverall')}:</strong> {session.feedback.overall}
            </p>
            <p>
              <strong>{t('roleplay.feedbackGrammar')}:</strong> {session.feedback.grammar}
            </p>
            <p>
              <strong>{t('roleplay.feedbackVocabulary')}:</strong> {session.feedback.vocabulary}
            </p>
            {session.pronunciationScore !== null && session.pronunciationScore !== undefined && (
              <p>
                <strong>{t('roleplay.pronunciation')}:</strong>{' '}
                {t('roleplay.pronunciationScore', { score: session.pronunciationScore })}
              </p>
            )}
          </div>
        </div>
      )}

      <PronunciationScorePanel assessments={session.pronunciationAssessments ?? []} />

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-4 pb-4 pr-4">
          {session.messages.map((msg) => {
            const isUser = msg.role === 'USER';
            const isSystem = msg.role === 'SYSTEM';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`flex items-start max-w-[80%] space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl ${isUser ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-muted rounded-tl-none flex space-x-1 items-center h-10">
                  <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      {!isCompleted && (
        <>
          <form
            onSubmit={handleSend}
            className="flex items-center space-x-2 border-t bg-background p-4"
          >
            <Input
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              placeholder={t('roleplay.messagePlaceholder')}
              disabled={isSending || isCompleting}
              className="flex-1"
            />
            <Button
              type="submit"
              aria-label={t('roleplay.sendMessage')}
              disabled={!input.trim() || isSending || isCompleting}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {session.mode !== 'TEXT' ? (
            <AudioRecorder sessionId={sessionId} disabled={isSending || isCompleting} />
          ) : null}
        </>
      )}
    </div>
  );
}
