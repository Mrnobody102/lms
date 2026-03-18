"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { courseApi, Course } from "@/lib/course-api";
import {
  BookOpen,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function CoursesPage() {
  const t = useTranslations("Admin");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await courseApi.getCourses();
        setCourses(data);
      } catch (err: any) {
        console.error("Failed to fetch courses:", err);
        setError("Không thể tải danh sách khóa học. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen font-sans flex transition-colors duration-300 bg-background/50">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 lg:p-16">
        <AdminHeader
          title={t("courses")}
          description="Quản lý các khóa học trong trung tâm của bạn."
          showCreateCourse={true}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-bold text-sm uppercase tracking-[0.2em]">
              {t("loading", { defaultValue: "Đang tải dữ liệu..." })}
            </p>
          </div>
        ) : error ? (
          <div className="p-10 rounded-[2rem] bg-destructive/5 border border-destructive/20 text-destructive text-center space-y-4">
            <p className="font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-destructive text-white rounded-xl font-bold text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-20 rounded-[3rem] bg-card/30 border border-dashed flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center text-muted-foreground opacity-20">
              <BookOpen className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black">Chưa có khóa học nào</h3>
              <p className="text-muted-foreground font-medium max-w-xs">
                Hãy bắt đầu bằng cách tạo khóa học đầu tiên cho trung tâm của
                bạn.
              </p>
            </div>
            <Link
              href="/courses/new"
              className="px-8 py-3 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              + Tạo khóa học ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border shadow-2xl shadow-foreground/5 overflow-hidden flex flex-col group hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="p-8 pb-0">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:rotate-6 transition-transform">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                      <MoreVertical className="w-5 h-5 opacity-40" />
                    </button>
                  </div>

                  <h3 className="text-xl font-black mb-2 line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60 mb-8">
                    {course.lessons?.length || 0} bài học •{" "}
                    {course.lessons?.reduce(
                      (acc, l) => acc + (l.duration || 0),
                      0,
                    ) || 0}{" "}
                    phút
                  </p>
                </div>

                <div className="mt-auto p-4 bg-muted/30 border-t border-border/50 flex gap-2">
                  <Link
                    href={`/courses/${course.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-card border border-border rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95 group/btn"
                  >
                    <Edit2 className="w-3.5 h-3.5 group-hover/btn:-rotate-12 transition-transform" />
                    Chỉnh sửa
                  </Link>
                  <Link
                    href={`/courses/${course.id}`} // Preview or specific view
                    className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-95 shadow-inner"
                  >
                    <ExternalLink className="w-5 h-5" />
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
