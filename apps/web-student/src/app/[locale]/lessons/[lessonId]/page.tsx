"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { LessonHeader } from "../../../../components/lessons/lesson-header";
import { LessonSidebar } from "../../../../components/lessons/lesson-sidebar";
import { LessonContent } from "../../../../components/lessons/lesson-content";
import { LessonNavigation } from "../../../../components/lessons/lesson-navigation";
import { courseApi } from "../../../../lib/course-api";
import { Course, Lesson } from "../../../../types/lesson";
import {
  progressApi,
  ProgressStatus,
  UserLessonProgress,
} from "../../../../lib/progress-api";

interface LessonPageProps {
  params: {
    lessonId: string | string[];
    locale: string;
  };
}

export default function LessonPage({ params }: LessonPageProps) {
  const t = useTranslations("Student");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserLessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve lessonId from params
  const lessonId = Array.isArray(params.lessonId)
    ? params.lessonId[0]
    : params.lessonId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Find the lesson first to get the courseId
        const lesson = await courseApi.getLesson(lessonId);
        setCurrentLesson(lesson);

        // Then find the course to get siblings for sidebar/nav
        const [courseData, progressData] = await Promise.all([
          courseApi.getCourse(lesson.courseId),
          progressApi.getCourseProgress(lesson.courseId),
        ]);

        setCourse(courseData);
        setProgress(progressData);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch lesson data:", err);
        setError(err.response?.data?.message || err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !currentLesson || !course) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 rounded-[2rem] bg-card border shadow-2xl max-w-md mx-auto animate-in fade-in zoom-in duration-500">
          <h1 className="text-3xl font-black mb-4 tracking-tighter">
            {t("lesson.error")}
          </h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            {error || t("lesson.notFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = course.lessons.findIndex(
    (l) => l.id === currentLesson.id,
  );
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < course.lessons.length - 1
      ? course.lessons[currentIndex + 1]
      : null;

  const handleComplete = async () => {
    if (!currentLesson) return;
    try {
      const updated = await progressApi.updateProgress(
        currentLesson.id,
        ProgressStatus.COMPLETED,
      );
      // Update local progress state
      setProgress((prev) => {
        const index = prev.findIndex((p) => p.lessonId === currentLesson.id);
        if (index !== -1) {
          const newProgress = [...prev];
          newProgress[index] = updated;
          return newProgress;
        }
        return [...prev, updated];
      });

      // Show success feedback - simple alert for now
      // toast.success("Bài học đã hoàn thành!");
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden selection:bg-primary/20">
      <LessonHeader
        course={course}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-background via-background to-primary/5 flex flex-col scroll-smooth">
          <LessonContent lesson={currentLesson} />
          <LessonNavigation
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onComplete={handleComplete}
            isCompleted={progress.some(
              (p) =>
                p.lessonId === currentLesson.id &&
                p.status === ProgressStatus.COMPLETED,
            )}
          />
        </main>

        <LessonSidebar
          course={course}
          currentLesson={currentLesson}
          progress={progress}
          isSidebarOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
