'use client';

import { Clock, BookOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useTranslations } from 'next-intl';

interface TextContentProps {
  content?: string;
  title: string;
  duration?: number;
}

export function TextContent({ content, title, duration }: TextContentProps) {
  const t = useTranslations('Student');
  const safeContent = content
    ? DOMPurify.sanitize(content, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick'],
      })
    : '';

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
              {duration} phút đọc
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-snug">
          {title}
        </h1>
      </div>

      {/* Article body */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div
          className={`
            prose prose-base dark:prose-invert max-w-none p-6 sm:p-8 lg:p-10
            prose-headings:font-black prose-headings:tracking-tight
            prose-h2:text-xl prose-h2:border-b prose-h2:pb-3 prose-h2:mb-5 prose-h2:border-border
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
            prose-table:w-full prose-table:border-collapse
            prose-thead:bg-muted/60
            prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:text-sm prose-th:font-bold
            prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2.5 prose-td:text-sm
            prose-tr:even:bg-muted/20
            prose-ul:space-y-1.5 prose-li:text-sm
            prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:not-italic
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-strong:text-foreground prose-strong:font-bold
          `}
        >
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: safeContent }} />
          ) : (
            <p className="opacity-50 text-center py-8">Chưa có nội dung cho bài học này.</p>
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
