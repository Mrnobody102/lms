"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useCreateCourse } from "@/hooks/use-courses";
import {
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  const t = useTranslations("Admin");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const { mutate: createCourse, isPending: loading, error: createError } = useCreateCourse();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLocalError(null);
    createCourse(
      { title },
      {
        onSuccess: (newCourse) => {
          router.push(`/courses/${newCourse.id}/edit`);
        },
        onError: () => {
          setLocalError(t("Admin.cannotCreateCourse"));
        },
      },
    );
  };

  const error = createError?.message ?? localError;

  return (
    <div className="min-h-screen font-sans flex bg-background/50">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 lg:p-16">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/courses"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-bold text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
{t("Admin.backToList")}
          </Link>

          <AdminHeader
            title={t("Admin.createNewCourse")}
            description={t("Admin.createNewCourseDesc")}
          />

          {error && (
            <div className="mb-8 p-6 rounded-3xl border bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-4 animate-in slide-in-from-top duration-500">
              <AlertCircle className="w-6 h-6" />
              <p className="font-black text-sm">{error}</p>
            </div>
          )}

          <div className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-2xl p-10">
            <form onSubmit={handleCreateCourse} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-2">
                  {t("Admin.courseName")}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-5 font-black focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xl"
                  placeholder={t("Admin.courseNamePlaceholder")}
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-2xl shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6" />
                  )}
                  {t("Admin.startBuilding")}
                </button>
                <p className="text-center text-xs text-muted-foreground font-bold italic opacity-60">
                  {t("Admin.startBuildingDesc")}
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
