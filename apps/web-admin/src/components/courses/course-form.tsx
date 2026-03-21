"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, Loader2 } from "lucide-react";

interface CourseFormProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function CourseForm({ title, onTitleChange, onSave, saving }: CourseFormProps) {
  const t = useTranslations("Admin");

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-2xl p-10">
      <h3 className="text-xl font-black mb-8">{t("Admin.basicInfo")}</h3>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-2">
            {t("Admin.courseName")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
            placeholder={t("Admin.courseNamePlaceholder")}
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {t("Admin.save")}
        </button>
      </div>
    </div>
  );
}
