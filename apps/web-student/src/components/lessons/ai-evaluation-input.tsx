'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AIFeedbackPanel } from './ai-feedback-panel';

interface AIEvaluationInputProps {
  type: 'AI_EVALUATED_AUDIO' | 'AI_EVALUATED_TEXT';
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  aiFeedback?: unknown;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ [index: number]: { transcript: string } }>;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function AIEvaluationInput({
  type,
  value,
  onChange,
  disabled,
  aiFeedback,
}: AIEvaluationInputProps) {
  const t = useTranslations('Student');
  const isAudioQuestion = type === 'AI_EVALUATED_AUDIO';
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionConstructor()));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const toggleRecording = () => {
    if (disabled || !isAudioQuestion) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setSpeechError(t('practice.aiSpeechUnsupported'));
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) {
        onChange(transcript);
      }
    };
    recognition.onerror = () => {
      setSpeechError(t('practice.aiSpeechUnsupported'));
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    setSpeechError(null);
    setIsRecording(true);
    recognition.start();
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-[2rem] border-2 p-5 transition-all ${
          isRecording
            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
            : 'border-primary/10 bg-card'
        }`}
      >
        {isAudioQuestion && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={disabled || !speechSupported}
              onClick={toggleRecording}
              aria-label={
                isRecording ? t('practice.aiStopSpeaking') : t('practice.aiStartSpeaking')
              }
              title={isRecording ? t('practice.aiStopSpeaking') : t('practice.aiStartSpeaking')}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
                isRecording
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              }`}
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-black uppercase tracking-widest ${
                  isRecording ? 'text-red-500' : 'text-muted-foreground'
                }`}
              >
                {isRecording ? t('practice.aiRecording') : t('practice.aiStartSpeaking')}
              </p>
              {speechError && (
                <p className="mt-1 text-xs font-medium text-muted-foreground">{speechError}</p>
              )}
            </div>

            {isRecording && (
              <div className="flex gap-1">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-1.5 animate-bounce rounded-full bg-red-500"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <textarea
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isAudioQuestion ? t('practice.aiAudioPlaceholder') : t('practice.aiTextPlaceholder')
            }
            className="min-h-[160px] w-full resize-none rounded-3xl border-2 border-primary/10 bg-background p-6 font-medium leading-relaxed shadow-inner outline-none transition-all focus:border-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <div className="pointer-events-none absolute bottom-4 right-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            {t('practice.aiEvaluationMode')}
          </div>
        </div>
      </div>

      <AIFeedbackPanel aiFeedback={aiFeedback} />
    </div>
  );
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}
