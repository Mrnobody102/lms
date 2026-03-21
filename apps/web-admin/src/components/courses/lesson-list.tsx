"use client";

import { useTranslations } from "next-intl";
import { Lesson } from "@/lib/course-api";
import {
  Plus,
  Video,
  FileText,
  HelpCircle,
  Edit2,
  Trash2,
} from "lucide-react";

interface LessonListProps {
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onAddClick: () => void;
}

export function LessonList({ lessons, onEdit, onDelete, onAddClick }: LessonListProps) {
  const t = useTranslations("Admin");

  const typeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-6 h-6" />;
      case "quiz":
        return <HelpCircle className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <section className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-2xl p-10">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-xl font-black italic">
          {t("Admin.curriculum")} ({lessons.length})
        </h3>
        <button
          onClick={onAddClick}
          className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-inner"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {[...lessons]
          .sort((a, b) => a.order - b.order)
          .map((lesson, idx) => (
            <div
              key={lesson.id}
              className="p-6 rounded-[2rem] bg-muted/10 border border-border/50 flex items-center gap-6 hover:bg-muted/30 transition-all group"
            >
              <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-xs font-black opacity-30 italic">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-muted flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                {typeIcon(lesson.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black truncate group-hover:text-primary transition-colors">
                  {lesson.title}
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                  {lesson.type} • {lesson.duration} {t("Admin.minutes")}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(lesson)}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => onDelete(lesson.id)}
                  className="p-2 hover:bg-destructive/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
