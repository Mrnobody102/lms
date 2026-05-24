import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { useSocraticChat, ChatMessage } from '@/hooks/use-socratic-chat';

interface SocraticTutorPanelProps {
  questionPrompt: string;
  studentAnswer: unknown;
  correctAnswer: unknown;
}

export function SocraticTutorPanel({
  questionPrompt,
  studentAnswer,
  correctAnswer,
}: SocraticTutorPanelProps) {
  const t = useTranslations('Student');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { mutate: sendSocraticChat, isPending } = useSocraticChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      sendSocraticChat(
        { questionPrompt, studentAnswer, correctAnswer, messages: [] },
        {
          onSuccess: (data) => {
            setMessages([data]);
          },
        },
      );
    }
  }, [correctAnswer, messages.length, questionPrompt, sendSocraticChat, studentAnswer]);

  const handleSend = () => {
    if (!inputText.trim() || isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');

    sendSocraticChat(
      { questionPrompt, studentAnswer, correctAnswer, messages: newMessages },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, data]);
        },
      },
    );
  };

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-card overflow-hidden shadow-sm">
      <div className="bg-primary/5 px-4 py-3 border-b border-primary/10 flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        <h4 className="font-bold text-sm text-primary">{t('practice.socraticChatTitle')}</h4>
      </div>

      <div ref={scrollRef} className="p-4 space-y-4 max-h-60 overflow-y-auto">
        {messages.length === 0 && isPending && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'assistant'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <Bot className="w-3 h-3" />
                ) : (
                  <User className="w-3 h-3" />
                )}
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-muted border rounded-tl-sm'
                    : 'bg-primary text-primary-foreground rounded-tr-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {messages.length > 0 && isPending && (
          <div className="flex justify-start animate-in fade-in">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3" />
              </div>
              <div className="px-4 py-3 rounded-xl bg-muted border rounded-tl-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-muted/10 relative">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('practice.socraticInputPlaceholder')}
          className="w-full h-10 pl-4 pr-12 rounded-lg border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none text-sm transition-all"
          disabled={isPending}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isPending}
          className="absolute right-4 top-4 h-8 w-8 bg-primary text-primary-foreground rounded-md flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
