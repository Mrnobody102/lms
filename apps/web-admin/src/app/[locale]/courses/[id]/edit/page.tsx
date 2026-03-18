"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { courseApi, Course, Lesson } from "@/lib/course-api";
import {
  Save,
  Plus,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function CourseEditorPage() {
  const t = useTranslations("Admin");
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form states for new lesson
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    title: "",
    type: "video",
    duration: 10,
    order: 0,
  });

  // State for editing lesson
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await courseApi.getCourse(courseId);
        setCourse(data);
      } catch (err) {
        console.error("Failed to fetch course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleUpdateCourse = async () => {
    if (!course) return;
    try {
      setSaving(true);
      await courseApi.updateCourse(courseId, { title: course.title });
      setMessage({ type: "success", text: "Đã lưu thay đổi khóa học!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi khi lưu khóa học." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.title) return;
    try {
      setSaving(true);
      const added = await courseApi.createLesson(courseId, {
        ...newLesson,
        order: (course?.lessons?.length || 0) + 1,
      });
      setCourse((prev) =>
        prev ? { ...prev, lessons: [...(prev.lessons || []), added] } : null,
      );
      setShowAddLesson(false);
      setNewLesson({ title: "", type: "video", duration: 10 });
      setMessage({ type: "success", text: "Đã thêm bài học mới!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi khi thêm bài học." });
    } finally {
      setSaving(false);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson({ ...lesson });
    setShowAddLesson(false);
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    try {
      setSaving(true);
      const updated = await courseApi.updateLesson(
        editingLesson.id,
        editingLesson,
      );
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              lessons: prev.lessons.map((l) =>
                l.id === updated.id ? updated : l,
              ),
            }
          : null,
      );
      setEditingLesson(null);
      setMessage({ type: "success", text: "Đã cập nhật bài học!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi khi cập nhật bài học." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
    try {
      setSaving(true);
      await courseApi.deleteLesson(lessonId);
      setCourse((prev) =>
        prev
          ? { ...prev, lessons: prev.lessons.filter((l) => l.id !== lessonId) }
          : null,
      );
      setMessage({ type: "success", text: "Đã xóa bài học thành công!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi khi xóa bài học." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-black text-sm uppercase tracking-widest opacity-50">
          Đang tải trình chỉnh sửa...
        </p>
      </div>
    );
  }

  if (!course)
    return <div className="p-20 text-center font-black">Course not found.</div>;

  return (
    <div className="min-h-screen font-sans flex bg-background/50">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 lg:p-16">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/courses"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-bold text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t("courses")}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <AdminHeader
              title={course.title}
              description={`ID: ${course.id}`}
            />
            <Link
              href={`http://localhost:3000/vi/lessons/${course.lessons?.[0]?.id || ""}`}
              target="_blank"
              className="px-6 py-3 bg-white border border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-all active:scale-95 flex items-center gap-2 shadow-sm shrink-0"
            >
              Xem trước bài học đầu tiên
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {message && (
            <div
              className={`mb-8 p-6 rounded-3xl border flex items-center gap-4 animate-in slide-in-from-top duration-500 ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <p className="font-black text-sm">{message.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left side: Course info */}
            <div className="lg:col-span-2 space-y-12">
              <section className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-2xl p-10">
                <h3 className="text-xl font-black mb-8">Thông tin cơ bản</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 ml-2">
                      Tên khóa học
                    </label>
                    <input
                      type="text"
                      value={course.title}
                      onChange={(e) =>
                        setCourse({ ...course!, title: e.target.value })
                      }
                      className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
                      placeholder="Ví dụ: Tiếng Trung Giao Tiếp HSK 1"
                    />
                  </div>
                  <button
                    onClick={handleUpdateCourse}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Lưu tiêu đề khóa học
                  </button>
                </div>
              </section>

              <section className="bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-2xl p-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black italic">
                    Giáo trình bài học ({course.lessons?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowAddLesson(true)}
                    className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-inner"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {(course.lessons || [])
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
                          {lesson.type === "video" ? (
                            <Video className="w-6 h-6" />
                          ) : lesson.type === "quiz" ? (
                            <HelpCircle className="w-6 h-6" />
                          ) : (
                            <FileText className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black truncate group-hover:text-primary transition-colors">
                            {lesson.title}
                          </h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                            {lesson.type} • {lesson.duration} phút
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditLesson(lesson)}
                            className="p-2 hover:bg-muted rounded-xl transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-2 hover:bg-destructive/10 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </div>

            {/* Right side: Add info or Sidebar */}
            <div className="space-y-8">
              {showAddLesson && (
                <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-primary/20 shadow-2xl p-8 sticky top-10 border-t-4 border-t-primary animate-in slide-in-from-right duration-500">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                    <Plus className="w-5 h-5 text-primary" />
                    Bài học mới
                  </h3>
                  <div className="space-y-6">
                    <input
                      type="text"
                      placeholder="Tiêu đề bài học..."
                      value={newLesson.title}
                      onChange={(e) =>
                        setNewLesson({ ...newLesson, title: e.target.value })
                      }
                      className="w-full bg-muted/50 border-none rounded-2xl px-5 py-4 font-bold text-sm"
                    />

                    <div className="flex gap-2">
                      {["video", "text", "quiz"].map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setNewLesson({ ...newLesson, type: type as any })
                          }
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            newLesson.type === type
                              ? "bg-primary text-white"
                              : "bg-muted/50 opacity-50 hover:opacity-100"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black uppercase tracking-widest opacity-40">
                        Thời lượng (phút)
                      </span>
                      <input
                        type="number"
                        value={newLesson.duration}
                        onChange={(e) =>
                          setNewLesson({
                            ...newLesson,
                            duration: parseInt(e.target.value),
                          })
                        }
                        className="w-20 bg-muted/50 border-none rounded-xl px-4 py-2 font-bold text-center"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setShowAddLesson(false)}
                        className="flex-1 py-4 font-black text-xs uppercase tracking-widest opacity-50 hover:opacity-100"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleAddLesson}
                        disabled={saving || !newLesson.title}
                        className="flex-1 py-4 bg-primary text-primary-foreground font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 disabled:opacity-30"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {editingLesson && (
                <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] border border-orange-500/20 shadow-2xl p-8 sticky top-10 border-t-4 border-t-orange-500 animate-in slide-in-from-right duration-500">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                    <Edit2 className="w-5 h-5 text-orange-500" />
                    Chỉnh sửa bài học
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                        Tiêu đề
                      </label>
                      <input
                        type="text"
                        value={editingLesson.title}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            title: e.target.value,
                          })
                        }
                        className="w-full bg-muted/50 border-none rounded-2xl px-5 py-4 font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2">
                        Loại nội dung
                      </label>
                      <div className="flex gap-2">
                        {["video", "text", "quiz"].map((type) => (
                          <button
                            key={type}
                            onClick={() =>
                              setEditingLesson({
                                ...editingLesson,
                                type: type as any,
                              })
                            }
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              editingLesson.type === type
                                ? "bg-orange-500 text-white"
                                : "bg-muted/50 opacity-50 hover:opacity-100"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black uppercase tracking-widest opacity-40">
                        Thời lượng (phút)
                      </span>
                      <input
                        type="number"
                        value={editingLesson.duration}
                        onChange={(e) =>
                          setEditingLesson({
                            ...editingLesson,
                            duration: parseInt(e.target.value),
                          })
                        }
                        className="w-20 bg-muted/50 border-none rounded-xl px-4 py-2 font-bold text-center"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setEditingLesson(null)}
                        className="flex-1 py-4 font-black text-xs uppercase tracking-widest opacity-50 hover:opacity-100"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdateLesson}
                        disabled={saving || !editingLesson.title}
                        className="flex-1 py-4 bg-orange-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 disabled:opacity-30"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="text-xl font-black mb-4 flex items-center gap-3 italic">
                    <TrendingUp className="w-5 h-5" />
                    Thống kê nội dung
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold opacity-80">
                      <span>Tổng bài giảng</span>
                      <span>{course.lessons?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold opacity-80">
                      <span>Dung lượng dự kiến</span>
                      <span>
                        {course.lessons?.reduce(
                          (acc, l) => acc + (l.duration || 0),
                          0,
                        ) || 0}{" "}
                        phút
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
