"use client";

import { ArrowLeft, Menu, X } from "lucide-react";
import { Link } from "../../navigation";
import { ThemeToggle, LanguageToggle } from "@repo/ui";
import { useTranslations } from "next-intl";
import { Course } from "../../types/lesson";

interface LessonHeaderProps {
  course: Course;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function LessonHeader({
  course,
  isSidebarOpen,
  toggleSidebar,
}: LessonHeaderProps) {
  const t = useTranslations("Student");

  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-50">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 hover:bg-muted rounded-xl transition-all active:scale-90 text-muted-foreground hover:text-foreground border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t("lesson.backToCourse")}
          title={t("lesson.backToCourse")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block"></div>
        <div>
          <h1 className="font-bold text-sm sm:text-base line-clamp-1 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {course.title}
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium hidden sm:block">
            {t("lesson.totalLessons", { count: course.lessons.length })} •{" "}
            {t("lesson.duration", { minutes: course.totalDuration })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-muted rounded-xl transition-all active:scale-90 border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={
            isSidebarOpen
              ? "Close curriculum sidebar"
              : "Open curriculum sidebar"
          }
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>
    </header>
  );
}
