"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Lesson } from "@/lib/course-api";
import { Edit2, Loader2 } from "lucide-react";

interface EditLessonFormProps {
  lesson: Lesson;
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
}

export function EditLessonForm({ lesson, onSubmit, onCancel, saving }: EditLessonFormProps) {
  const t = useTranslations("Admin");

  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState<"video" | "text" | "quiz">(lesson.type as "video" | "text" | "quiz");
  const [duration, setDuration] = useState(lesson.duration);

  // Sync form state when lesson prop changes
  useEffect(() => {
    setTitle(lesson.title);
    setType(lesson.type as "video" | "text" | "quiz");
    setDuration(lesson.duration);
  }, [lesson]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit({ title, type, duration });
  };

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-orange-500/20 shadow-2xl p-8 sticky top-10 border-t-4 border-t-orange-500 animate-in slide-in-from-right duration-500">
      <h3 className="text-lg font-black mb-6 flex items-center gap-3">
        <Edit2 className="w-5 h-5 text-orange-500" />
        {t("Admin.editLesson")}
      </h3>
      <div className="space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
            {t("Admin.lessonTitleLabel")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-muted/50 border-none rounded-2xl px-5 py-4 font-bold text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
            {t("Admin.contentType")}
          </label>
          <div className="flex gap-2">
            {(["video", "text", "quiz"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  type === t
                    ? "bg-orange-500 text-white"
                    : "bg-muted/50 opacity-50 hover:opacity-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-black uppercase tracking-widest opacity-40">
            {t("Admin.durationMinutes")}
          </span>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            className="w-20 bg-muted/50 border-none rounded-xl px-4 py-2 font-bold text-center"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 font-black text-xs uppercase tracking-widest opacity-50 hover:opacity-100"
          >
            {t("Admin.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="flex-1 py-4 bg-orange-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 disabled:opacity-30"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("Admin.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
