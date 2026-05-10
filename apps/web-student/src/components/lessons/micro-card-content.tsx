'use client';

import { useState } from 'react';
import { Volume2, RotateCw, Lightbulb } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MicroCardData {
  front: string;
  pinyin?: string;
  back: string;
  example?: string;
  audioUrl?: string;
}

interface MicroCardContentProps {
  content?: string; // Expecting JSON string
}

export function MicroCardContent({ content }: MicroCardContentProps) {
  const t = useTranslations('Student');
  const [isFlipped, setIsFlipped] = useState(false);

  let data: MicroCardData | null = null;
  try {
    data = content ? JSON.parse(content) : null;
  } catch (e) {
    console.error('Failed to parse micro_card content', e);
  }

  if (!data) {
    return (
      <div className="p-12 rounded-[2rem] bg-card/30 border border-dashed flex flex-col items-center justify-center text-muted-foreground">
        <Lightbulb className="w-12 h-12 mb-4 opacity-20" />
        <p>{t('lesson.microCardInvalid')}</p>
      </div>
    );
  }

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.audioUrl) {
      const audio = new Audio(data.audioUrl);
      audio.play().catch(console.error);
    } else {
      // Fallback to Web Speech API for TTS if no audioUrl
      const utterance = new SpeechSynthesisUtterance(data?.front);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-md mx-auto perspective-1000 py-10">
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className={`relative w-full aspect-[3/4] transition-transform duration-700 transform-style-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden bg-card border-4 border-primary/20 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10 text-center overflow-hidden group">
          <div className="absolute top-8 right-8 text-primary/20 group-hover:text-primary/40 transition-colors">
            <RotateCw className="w-6 h-6" />
          </div>

          {data.pinyin && (
            <p className="text-xl text-primary font-bold mb-4 tracking-widest opacity-80">
              {data.pinyin}
            </p>
          )}

          <h3 className="text-7xl font-black mb-10 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            {data.front}
          </h3>

          <button
            onClick={playAudio}
            className="p-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl transition-all active:scale-90"
            title={t('lesson.microCardListen')}
          >
            <Volume2 className="w-8 h-8" />
          </button>

          <div className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
            {t('lesson.microCardFlip')}
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10 text-center text-primary-foreground overflow-hidden">
          <div className="absolute top-8 right-8 text-white/20">
            <RotateCw className="w-6 h-6" />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-60">
            {t('lesson.microCardMeaning')}
          </p>
          <h3 className="text-4xl font-black mb-8 leading-tight">{data.back}</h3>

          {data.example && (
            <div className="mt-4 p-6 bg-white/10 rounded-2xl border border-white/10 max-w-xs">
              <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-60">
                {t('lesson.microCardExample')}
              </p>
              <p className="text-lg font-bold leading-relaxed">{data.example}</p>
            </div>
          )}

          <div className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic text-white">
            {t('lesson.microCardFlipBack')}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
