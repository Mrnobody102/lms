'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@repo/ui';
import { Send, CheckCircle2, User, Bot } from 'lucide-react';
import {
  useGetRoleplaySession,
  useSendMessage,
  useCompleteRoleplaySession,
} from '../api/use-roleplay';

export function ChatInterface({ sessionId }: { sessionId: string }) {
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
        <span className="animate-pulse">Loading conversation...</span>
      </div>
    );
  if (isError || !session) return <div>Failed to load session</div>;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    sendMessage({ id: sessionId, content: input });
    setInput('');
  };

  const handleComplete = () => {
    if (confirm('Are you sure you want to end the conversation and get feedback?')) {
      completeSession(sessionId);
    }
  };

  const isCompleted = session.status === 'COMPLETED';

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border rounded-xl overflow-hidden shadow-sm bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div>
          <h2 className="font-semibold text-lg">Roleplay Session</h2>
          <p className="text-sm text-muted-foreground">{session.scenario}</p>
        </div>
        {!isCompleted && (
          <Button variant="outline" size="sm" onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? 'Evaluating...' : 'End Conversation'}
            {!isCompleting && <CheckCircle2 className="w-4 h-4 ml-2" />}
          </Button>
        )}
      </div>

      {/* Evaluation Results */}
      {isCompleted && session.feedback && (
        <div className="p-4 bg-primary/5 border-b">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-bold text-lg text-primary">Final Evaluation</h3>
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-sm font-semibold">
              Score: {session.score}/100
            </span>
          </div>
          <div className="grid gap-2 text-sm">
            <p>
              <strong>Overall:</strong> {session.feedback.overall}
            </p>
            <p>
              <strong>Grammar:</strong> {session.feedback.grammar}
            </p>
            <p>
              <strong>Vocabulary:</strong> {session.feedback.vocabulary}
            </p>
          </div>
        </div>
      )}

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
        <form
          onSubmit={handleSend}
          className="p-4 border-t bg-background flex space-x-2 items-center"
        >
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending || isCompleting}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isSending || isCompleting} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
