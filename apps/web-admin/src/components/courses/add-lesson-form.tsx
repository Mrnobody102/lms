"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lesson } from "@/lib/course-api";
import { Plus, Loader2 } from "lucide-react";

interface AddLessonFormProps {
  existingLessonsCount: number;
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
}

export function AddLessonForm({
  existingLessonsCount,
  onSubmit,
  onCancel,
  saving,
}: AddLessonFormProps) {
  const t = useTranslations("Admin");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "text" | "quiz">("video");
  const [duration, setDuration] = useState(10);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const success = await onSubmit({
      title,
      type,
      duration,
      order: existingLessonsCount + 1,
    });
    if (success) {
      setTitle("");
      setType("video");
      setDuration(10);
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-primary/20 shadow-2xl p-8 sticky top-10 border-t-4 border-t-primary animate-in slide-in-from-right duration-500">
      <h3 className="text-lg font-black mb-6 flex items-center gap-3">
        <Plus className="w-5 h-5 text-primary" />
        {t("Admin.newLesson")}
      </h3>
      <div className="space-y-6">
        <input
          type="text"
          placeholder={t("Admin.lessonTitle")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-muted/50 border-none rounded-2xl px-5 py-4 font-bold text-sm"
        />

        <div className="flex gap-2">
          {(["video", "text", "quiz"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                type === t
                  ? "bg-primary text-white"
                  : "bg-muted/50 opacity-50 hover:opacity-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-black uppercase tracking-widest opacity-40">
            Thời lượng (phút)
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
            className="flex-1 py-4 bg-primary text-primary-foreground font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 disabled:opacity-30"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("Admin.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
