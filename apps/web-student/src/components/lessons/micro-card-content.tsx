'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, RotateCw, Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MicroCardData {
  front: string;
  pinyin?: string;
  back: string;
  example?: string;
  audioUrl?: string;
}

interface MicroCardContentProps {
  content?: string | null;
}

export function MicroCardContent({ content }: MicroCardContentProps) {
  const t = useTranslations('Student');
  const cards = parseMicroCardContent(content);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);

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
            className="snap-center"
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <MicroCard
              card={card}
              flipped={Boolean(flippedCards[index])}
              onFlip={() =>
                setFlippedCards((current) => ({ ...current, [index]: !current[index] }))
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function MicroCard({
  card,
  flipped,
  onFlip,
}: {
  card: MicroCardData;
  flipped: boolean;
  onFlip: () => void;
}) {
  const t = useTranslations('Student');

  const playAudio = (event: React.SyntheticEvent) => {
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
    <button
      type="button"
      onClick={onFlip}
      className="group relative flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-card p-8 text-center shadow-sm transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <RotateCw className="absolute right-6 top-6 h-5 w-5 text-muted-foreground/40 transition group-hover:text-primary" />

      {!flipped ? (
        <>
          {card.pinyin ? (
            <p className="mb-5 text-lg font-bold text-primary">{card.pinyin}</p>
          ) : null}
          <h3 className="mb-10 max-w-full break-words text-6xl font-black leading-tight text-foreground">
            {card.front}
          </h3>
          <span
            role="button"
            tabIndex={0}
            onClick={playAudio}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') playAudio(event);
            }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/20"
            aria-label={t('lesson.microCardListen')}
          >
            <Volume2 className="h-7 w-7" />
          </span>
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
    </button>
  );
}

function parseMicroCardContent(content: string | null | undefined): MicroCardData[] {
  if (!content) {
    return [];
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeMicroCard).filter((card): card is MicroCardData => card !== null);
    }

    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.cards)) {
      return record.cards
        .map(normalizeMicroCard)
        .filter((card): card is MicroCardData => card !== null);
    }

    const legacyCard = normalizeMicroCard(record);
    return legacyCard ? [legacyCard] : [];
  } catch {
    return [];
  }
}

function normalizeMicroCard(value: unknown): MicroCardData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const front = readRequiredString(record.front);
  const back = readRequiredString(record.back);

  if (!front || !back) {
    return null;
  }

  return {
    front,
    back,
    pinyin: readOptionalString(record.pinyin),
    example: readOptionalString(record.example),
    audioUrl: readOptionalString(record.audioUrl),
  };
}

function readRequiredString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
