"use client";

import { useState } from "react";
import { Link } from "../../../../navigation";
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Circle,
  Menu,
  X,
  ArrowLeft,
  Clock,
  BookOpen,
  Trophy,
} from "lucide-react";
import { ThemeToggle, LanguageToggle } from "@repo/ui";
import { useTranslations } from "next-intl";

// Mock data for the lesson/course
const MOCK_COURSE = {
  title: "Tiếng Trung HSK 1: Giao tiếp cơ bản",
  lessons: [
    {
      id: "1",
      title: "Chào hỏi và giới thiệu bản thân",
      duration: "15",
      type: "video",
      completed: true,
    },
    {
      id: "2",
      title: "Số đếm từ 1 đến 100",
      duration: "10",
      type: "video",
      completed: true,
    },
    {
      id: "3",
      title: "Gia đình và các thành viên",
      duration: "20",
      type: "video",
      completed: false,
    },
    {
      id: "4",
      title: "Hỏi giờ và thời gian",
      duration: "12",
      type: "video",
      completed: false,
    },
    {
      id: "5",
      title: "Mua sắm và mặc cả",
      duration: "25",
      type: "video",
      completed: false,
    },
    {
      id: "6",
      title: "Sở thích và thói quen",
      duration: "18",
      type: "text",
      completed: false,
    },
    {
      id: "7",
      title: "Kiểm tra cuối khóa",
      duration: "45",
      type: "quiz",
      completed: false,
    },
  ],
};

export default function LessonPage({
  params,
}: {
  params: { lessonId: string | string[] };
}) {
  const t = useTranslations("Student");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const lessonId = Array.isArray(params.lessonId)
    ? params.lessonId[0]
    : params.lessonId;
  const currentLesson =
    MOCK_COURSE.lessons.find((l) => l.id === lessonId) ||
    MOCK_COURSE.lessons[0];
  const currentIndex = MOCK_COURSE.lessons.findIndex(
    (l) => l.id === currentLesson.id,
  );

  const prevLesson =
    currentIndex > 0 ? MOCK_COURSE.lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < MOCK_COURSE.lessons.length - 1
      ? MOCK_COURSE.lessons[currentIndex + 1]
      : null;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden selection:bg-primary/20">
      {/* Header */}
      <header className="h-16 border-b bg-background/80 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-muted rounded-xl transition-all active:scale-95 text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            title={t("lesson.backToCourse")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block"></div>
          <div>
            <h1 className="font-bold text-sm sm:text-base line-clamp-1 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {MOCK_COURSE.title}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium hidden sm:block">
              {t("lesson.totalLessons", { count: MOCK_COURSE.lessons.length })}{" "}
              • {t("lesson.duration", { minutes: 145 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border">
            <ThemeToggle />
            <LanguageToggle />
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-muted rounded-xl transition-all active:scale-95 border border-transparent hover:border-border"
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-background via-background to-primary/5 flex flex-col scroll-smooth">
          {/* Video Player Section */}
          <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 flex-1">
            <div className="relative aspect-video bg-black rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white/5 group mb-10 transition-transform duration-500 hover:scale-[1.01]">
              {/* This would be a real player like YouTube/Vimeo/Internal */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-black/20 to-black/60">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse"></div>
                  <PlayCircle className="w-24 h-24 text-white/90 group-hover:text-primary group-hover:scale-110 transition-all duration-500 drop-shadow-[0_0_20px_rgba(var(--primary),0.5)] relative z-10" />
                </div>
                <p className="text-white font-bold mt-6 tracking-widest text-sm uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                  {t("hero.watchVideo")}
                </p>
              </div>

              {/* Progress bar simulation */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 backdrop-blur-md">
                <div className="h-full bg-gradient-to-r from-primary to-orange-500 w-1/3 shadow-[0_0_20px_rgba(var(--primary),0.6)] transition-all duration-300"></div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto md:mx-0">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-primary/20">
                  Lesson {currentLesson.id}
                </span>
                <span className="text-muted-foreground text-xs flex items-center gap-1.5 font-bold bg-muted/30 px-3 py-1.5 rounded-full border">
                  <Clock className="w-3.5 h-3.5" />
                  {currentLesson.duration}{" "}
                  {t("lesson.duration", { minutes: "" }).replace(" ", "")}
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                {currentLesson.title}
              </h2>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-xl text-muted-foreground leading-relaxed mb-10 font-medium italic opacity-90">
                  {t("lesson.sampleDesc")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
                  <div className="p-8 rounded-[2rem] bg-card/40 backdrop-blur-sm border border-primary/10 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                      {t("lesson.goals")}
                    </h4>
                    <ul className="text-sm space-y-3 text-muted-foreground font-semibold">
                      {(t.raw("lesson.goalItems") as string[]).map(
                        (item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div className="p-8 rounded-[2rem] bg-card/40 backdrop-blur-sm border border-orange-500/10 shadow-xl shadow-orange-500/5 hover:shadow-orange-500/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                      {t("lesson.requirements")}
                    </h4>
                    <ul className="text-sm space-y-3 text-muted-foreground font-semibold">
                      {(t.raw("lesson.reqItems") as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
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

              <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-2xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 group overflow-hidden relative">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform relative z-10" />
                <span className="relative z-10">{t("lesson.complete")}</span>
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar - Course Curriculum */}
        <aside
          className={`
          fixed inset-0 z-[60] bg-background lg:relative lg:inset-auto lg:z-0
          w-full sm:w-[22rem] border-l flex flex-col shrink-0 transition-all duration-500 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:hidden lg:w-0"}
          ${!isSidebarOpen && "lg:hidden shadow-none border-l-0"}
        `}
        >
          <div className="p-8 border-b flex items-center justify-between shrink-0 bg-muted/20">
            <h3 className="font-black text-xl uppercase tracking-tighter text-foreground/80">
              {t("lesson.curriculum")}
            </h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-muted rounded-xl lg:hidden border"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {MOCK_COURSE.lessons.map((lesson, idx) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className={`
                  flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                  ${
                    lesson.id === currentLesson.id
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02] z-10"
                      : "hover:bg-muted border border-transparent hover:border-border"
                  }
                `}
              >
                <div className="pt-0.5 shrink-0 relative z-10">
                  {lesson.completed ? (
                    <div
                      className={`rounded-lg p-1 ${lesson.id === currentLesson.id ? "bg-white/20" : "bg-emerald-500/10"}`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${lesson.id === currentLesson.id ? "text-white" : "text-emerald-500"}`}
                      />
                    </div>
                  ) : lesson.id === currentLesson.id ? (
                    <div className="rounded-lg p-1 bg-white/20 animate-pulse">
                      <PlayCircle className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="rounded-lg p-1 bg-muted group-hover:bg-background transition-colors">
                      <Circle className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] font-black uppercase tracking-[0.2em] italic ${lesson.id === currentLesson.id ? "text-white/70" : "text-muted-foreground"}`}
                    >
                      Part {idx + 1}
                    </span>
                    <span
                      className={`text-[9px] font-bold ${lesson.id === currentLesson.id ? "text-white/70" : "text-muted-foreground"}`}
                    >
                      {lesson.duration}m
                    </span>
                  </div>
                  <p
                    className={`text-sm font-black leading-tight tracking-tight ${lesson.id === currentLesson.id ? "text-white" : "text-foreground"}`}
                  >
                    {lesson.title}
                  </p>
                </div>

                {lesson.id === currentLesson.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 animate-[shimmer_2s_infinite]"></div>
                )}
              </Link>
            ))}
          </div>
        </aside>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55] lg:hidden transition-opacity duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
