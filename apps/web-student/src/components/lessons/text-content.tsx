"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

interface TextContentProps {
  content?: string;
  title: string;
}

export function TextContent({ content, title }: TextContentProps) {
  const t = useTranslations("Student");

  return (
    <div className="p-8 sm:p-12 rounded-[2rem] bg-card/30 backdrop-blur-md border border-border shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
        <BookOpen className="w-48 h-48 rotate-12" />
      </div>

      <div className="relative z-10">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 border border-primary/20">
          <BookOpen className="w-6 h-6" />
        </div>

        <h3 className="text-2xl font-black mb-6 tracking-tight text-foreground/90">
          {title}
        </h3>

        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground font-medium leading-relaxed space-y-4">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="italic opacity-50">
              No content available for this reading lesson.
            </p>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-dashed flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground/50">
          <span>{t("lesson.readingMaterial")}</span>
          <span>{t("lesson.endOfContent")}</span>
        </div>
      </div>
    </div>
  );
}
