'use client';

import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { parseMicroCardContent, type MicroCardItem } from '@repo/shared';
import {
  BookmarkPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RotateCw,
  Volume2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAddMicroCardToReview, useTrackMicroCardEvent } from './use-micro-card-events';

interface MicroCardContentProps {
  lessonId: string;
  content?: string | null;
  onComplete?: () => void;
}

export function MicroCardContent({ lessonId, content, onComplete }: MicroCardContentProps) {
  const t = useTranslations('Student');
  const cards = useMemo(
    () => (content ? parseMicroCardContent(content).content.cards : []),
    [content],
  );
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const viewedCardsRef = useRef<Set<string>>(new Set());
  const flippedCardsRef = useRef<Set<string>>(new Set());
  const completedRef = useRef(false);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const trackEvent = useTrackMicroCardEvent(lessonId);
  const addToReview = useAddMicroCardToReview(lessonId);
  const trackEventRef = useRef(trackEvent.mutate);

  useEffect(() => {
    trackEventRef.current = trackEvent.mutate;
  }, [trackEvent.mutate]);

  useEffect(() => {
    if (cards.length === 0 || !lessonId) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
            return;
          }

          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isInteger(index)) {
            return;
          }

          setActiveIndex(index);
          const key = getCardKey(cards[index], index);
          if (!viewedCardsRef.current.has(key)) {
            viewedCardsRef.current.add(key);
            trackEventRef.current({ cardKey: key, eventType: 'MICRO_CARD_VIEWED' });
          }
        });
      },
      { threshold: [0.6] },
    );

    cardRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [cards, lessonId]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/30 p-12 text-muted-foreground">
        <Lightbulb className="mb-4 h-12 w-12 opacity-20" />
        <p>{t('lesson.microCardInvalid')}</p>
      </div>
    );
  }

  const scrollToCard = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), cards.length - 1);
    setActiveIndex(nextIndex);
    cardRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-muted-foreground">
          {t('lesson.microCardCounter', { current: activeIndex + 1, total: cards.length })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToCard(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('lesson.microCardPrevious')}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToCard(activeIndex + 1)}
            disabled={activeIndex === cards.length - 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('lesson.microCardNext')}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[72vh] snap-y snap-mandatory space-y-5 overflow-y-auto pr-1">
        {cards.map((card, index) => (
          <div
            key={`${card.front}-${index}`}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            data-index={index}
            className="snap-center"
            onFocus={() => setActiveIndex(index)}
          >
            <MicroCard
              card={card}
              flipped={Boolean(flippedCards[index])}
              completed={completedCards.has(getCardKey(card, index))}
              onFlip={() => {
                const key = getCardKey(card, index);
                setFlippedCards((current) => ({ ...current, [index]: !current[index] }));
                if (!flippedCardsRef.current.has(key)) {
                  flippedCardsRef.current.add(key);
                  trackEvent.mutate({ cardKey: key, eventType: 'MICRO_CARD_FLIPPED' });
                  setCompletedCards((current) => {
                    const next = new Set(current);
                    next.add(key);
                    if (next.size === cards.length && !completedRef.current) {
                      completedRef.current = true;
                      trackEvent.mutate({ cardKey: key, eventType: 'MICRO_CARD_COMPLETED' });
                      onComplete?.();
                    }
                    return next;
                  });
                }
              }}
              onAddToReview={() => addToReview.mutate(getCardKey(card, index))}
              addingToReview={addToReview.isPending}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.round((completedCards.size / cards.length) * 100)}%` }}
        />
      </div>
    </section>
  );
}

function MicroCard({
  card,
  flipped,
  completed,
  onFlip,
  onAddToReview,
  addingToReview,
}: {
  card: MicroCardItem;
  flipped: boolean;
  completed: boolean;
  onFlip: () => void;
  onAddToReview: () => void;
  addingToReview: boolean;
}) {
  const t = useTranslations('Student');

  const playAudio = (event: SyntheticEvent) => {
    event.stopPropagation();
    if (card.audioUrl) {
      const audio = new Audio(card.audioUrl);
      audio.play().catch(() => undefined);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(card.front);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onFlip();
        }
      }}
      className="group relative flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-card p-8 text-center shadow-sm transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <RotateCw className="absolute right-6 top-6 h-5 w-5 text-muted-foreground/40 transition group-hover:text-primary" />
      {completed ? (
        <CheckCircle2 className="absolute left-6 top-6 h-5 w-5 text-emerald-500" />
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAddToReview();
        }}
        className="absolute bottom-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:text-primary"
        aria-label={t('lesson.microCardAddToReview')}
        disabled={addingToReview}
      >
        <BookmarkPlus className="h-5 w-5" />
      </button>

      {!flipped ? (
        <>
          {card.phonetics ? (
            <p className="mb-5 text-lg font-bold text-primary">{card.phonetics}</p>
          ) : null}
          <h3 className="mb-10 max-w-full break-words text-6xl font-black leading-tight text-foreground">
            {card.front}
          </h3>
          <button
            type="button"
            onClick={playAudio}
            className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/20"
            aria-label={t('lesson.microCardListen')}
          >
            <Volume2 className="h-7 w-7" />
          </button>
          <p className="mt-12 text-xs font-black uppercase text-muted-foreground">
            {t('lesson.microCardFlip')}
          </p>
        </>
      ) : (
        <>
          <p className="mb-4 text-xs font-black uppercase text-primary">
            {t('lesson.microCardMeaning')}
          </p>
          <h3 className="max-w-full break-words text-4xl font-black leading-tight text-foreground">
            {card.back}
          </h3>
          {card.example ? (
            <div className="mt-8 max-w-sm rounded-lg border bg-muted/30 p-5 text-left">
              <p className="mb-2 text-xs font-black uppercase text-muted-foreground">
                {t('lesson.microCardExample')}
              </p>
              <p className="text-base font-semibold leading-relaxed">{card.example}</p>
            </div>
          ) : null}
          <p className="mt-12 text-xs font-black uppercase text-muted-foreground">
            {t('lesson.microCardFlipBack')}
          </p>
        </>
      )}
    </div>
  );
}

function getCardKey(card: MicroCardItem | undefined, index: number) {
  return card?.id || String(index);
}
