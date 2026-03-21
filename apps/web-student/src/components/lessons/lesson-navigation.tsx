"use client";

import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link } from "../../navigation";
import { useTranslations } from "next-intl";
import { Lesson } from "../../lib/course-api";

interface LessonNavigationProps {
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  onComplete: () => void;
  isCompleted: boolean;
}

export function LessonNavigation({
  prevLesson,
  nextLesson,
  onComplete,
  isCompleted,
}: LessonNavigationProps) {
  const t = useTranslations("Student");

  return (
    <div className="mt-auto border-t bg-background/80 px-6 py-6 sticky bottom-0 backdrop-blur-xl shrink-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex gap-4 w-full sm:w-auto">
          <Link
            href={prevLesson ? `/lessons/${prevLesson.id}` : "#"}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all active:scale-95 border ${
              prevLesson
                ? "bg-card hover:bg-muted text-foreground border-border hover:border-foreground/20"
                : "opacity-40 cursor-not-allowed bg-muted text-muted-foreground border-transparent"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            {t("lesson.prev")}
          </Link>
          <Link
            href={nextLesson ? `/lessons/${nextLesson.id}` : "#"}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all active:scale-95 ${
              nextLesson
                ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:opacity-95 hover:translate-x-1"
                : "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {t("lesson.next")}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <button
          onClick={onComplete}
          disabled={isCompleted}
          className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black shadow-2xl transition-all active:scale-95 group overflow-hidden relative ${
            isCompleted
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default shadow-none"
              : "bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600"
          }`}
        >
          {!isCompleted && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          )}
          <CheckCircle2
            className={`w-5 h-5 relative z-10 ${!isCompleted && "group-hover:scale-110 transition-transform"}`}
          />
          <span className="relative z-10">
            {isCompleted
              ? t("lesson.completed", { defaultValue: "Đã hoàn thành" })
              : t("lesson.complete")}
          </span>
        </button>
      </div>
    </div>
  );
}
