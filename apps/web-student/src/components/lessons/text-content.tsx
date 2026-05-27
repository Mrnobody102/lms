'use client';

import { useEffect, useMemo, useRef } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useTranslations } from 'next-intl';

interface TextContentProps {
  content?: string;
  title: string;
  duration?: number;
  onComplete?: () => void;
}

export function TextContent({ content, title, duration, onComplete }: TextContentProps) {
  const t = useTranslations('Student');
  const completionRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const hasTriggeredCompleteRef = useRef(false);
  const safeContent = useMemo(
    () =>
      content
        ? DOMPurify.sanitize(content, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
            FORBID_ATTR: ['style'],
            ADD_ATTR: ['target', 'rel', 'data-callout', 'data-lesson-diagram'],
          })
        : '',
    [content],
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    hasTriggeredCompleteRef.current = false;
  }, [content]);

  useEffect(() => {
    if (!safeContent) {
      return;
    }

    const node = completionRef.current;
    if (!node) {
      return;
    }

    let completionTimer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasTriggeredCompleteRef.current) {
          completionTimer = window.setTimeout(() => {
            if (hasTriggeredCompleteRef.current) {
              return;
            }

            hasTriggeredCompleteRef.current = true;
            onCompleteRef.current?.();
          }, 1200);
          return;
        }

        if (completionTimer) {
          window.clearTimeout(completionTimer);
          completionTimer = undefined;
        }
      },
      { threshold: 0.75 },
    );

    observer.observe(node);
    return () => {
      if (completionTimer) {
        window.clearTimeout(completionTimer);
      }
      observer.disconnect();
    };
  }, [safeContent]);

  return (
    <div className="w-full">
      {/* Article header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
            <BookOpen className="w-5 h-5" />
          </div>
          {duration && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border">
              <Clock className="w-3.5 h-3.5" />
              {t('lesson.readingDurationValue', { minutes: duration })}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-snug">
          {title}
        </h1>
      </div>

      {/* Article body */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="lesson-rich-content p-6 sm:p-8 lg:p-10">
          {content ? (
            <>
              <div dangerouslySetInnerHTML={{ __html: safeContent }} />
              <div ref={completionRef} className="h-px" aria-hidden="true" />
            </>
          ) : (
            <p className="opacity-50 text-center py-8">{t('lesson.emptyTextContent')}</p>
          )}
        </div>
        <div className="px-6 sm:px-8 lg:px-10 py-4 border-t border-dashed flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/40 bg-muted/20">
          <span>{t('lesson.readingMaterial')}</span>
          <span>{t('lesson.endOfContent')}</span>
        </div>
      </div>
    </div>
  );
}
