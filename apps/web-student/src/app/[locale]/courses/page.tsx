"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Map,
  GraduationCap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { ThemeToggle, LanguageToggle } from "@repo/ui";
import { Link, useRouter } from "../../../navigation";
import { courseApi, Course } from "../../../lib/course-api";

export default function CoursesPage() {
  const t = useTranslations("Student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        setCourses(data || []);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch courses:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen font-sans bg-background selection:bg-primary/20">
      {/* Navbar Minimalist */}
      <nav className="border-b bg-card/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tighter">
            LMS<span className="text-primary italic">Student</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <header className="mb-16 text-center md:text-left">
          <h1 className="text-5xl font-black tracking-tighter mb-4 italic">
            {t("courses.title")}
          </h1>
          <p className="text-lg text-muted-foreground font-bold opacity-60 max-w-2xl">
            {t("courses.subtitle")}
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="font-black text-xs uppercase tracking-[0.2em]">
              Đang chuẩn bị nội dung...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-2xl shadow-foreground/5 overflow-hidden flex flex-col hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="p-10 pb-0">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 border border-primary/20 shadow-inner group-hover:rotate-12 transition-transform">
                    <GraduationCap className="w-8 h-8" />
                  </div>

                  <h3 className="text-2xl font-black mb-3 line-clamp-2 leading-tight min-h-[4rem] group-hover:text-primary transition-colors italic">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-60">
                      <BookOpen className="w-3 h-3" />
                      {t("courses.lessonsCount", {
                        count: course.lessons?.length || 0,
                      })}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-60">
                      <Map className="w-3 h-3" />
                      {t("courses.duration", {
                        minutes:
                          course.lessons?.reduce(
                            (acc: number, l: any) => acc + (l.duration || 0),
                            0,
                          ) || 0,
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-6 pt-0">
                  <Link
                    href={
                      course.lessons?.[0]?.id
                        ? `/lessons/${course.lessons[0].id}`
                        : "#"
                    }
                    className="w-full flex items-center justify-between px-8 py-5 bg-primary text-primary-foreground rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all group/btn"
                  >
                    {t("courses.startNow")}
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
