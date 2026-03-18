"use client";

import { Users, BookOpen, TrendingUp, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminHome() {
  const t = useTranslations("Admin");

  return (
    <div className="min-h-screen font-sans flex transition-colors duration-300 bg-background/50">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 lg:p-16">
        <AdminHeader
          title={t("dashboard")}
          description={t("welcome")}
          showCreateCourse={true}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: t("revenue"),
              value: "128.5M ₫",
              trend: "+12.5%",
              icon: DollarSign,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: t("newStudents"),
              value: "24",
              trend: "+4.3%",
              icon: Users,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: t("activeCourses"),
              value: "12",
              trend: "0%",
              icon: BookOpen,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: t("completionRate"),
              value: "86%",
              trend: "+2.1%",
              icon: TrendingUp,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card/40 backdrop-blur-md p-8 rounded-[2rem] border border-border shadow-2xl shadow-foreground/5 hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500 group"
            >
              <div className="flex items-center justify-between mb-8">
                <div
                  className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:rotate-12 transition-transform shadow-inner`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                    stat.trend.startsWith("+")
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground border"
                  }`}
                >
                  {stat.trend}
                </span>
              </div>
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-card/40 backdrop-blur-sm rounded-[2.5rem] border border-border/50 shadow-2xl p-10">
            <h2 className="text-xl font-black mb-8 tracking-tight">
              Đăng ký mới gần đây
            </h2>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-5 border-b border-muted/50 last:border-0 hover:bg-muted/30 px-4 -mx-4 rounded-3xl transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center text-primary font-black text-sm border border-primary/20 group-hover:scale-110 transition-transform">
                      {String.fromCharCode(64 + i)}
                    </div>
                    <div>
                      <p className="font-black text-foreground/90">
                        Nguyễn Văn {String.fromCharCode(64 + i)}
                      </p>
                      <p className="text-xs text-muted-foreground font-bold opacity-60">
                        nguyenvan{i}@gmail.com
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary uppercase tracking-wider">
                      HSK 3 - Basic
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">
                      {i * 2} phút trước
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-sm rounded-[2.5rem] border border-border/50 shadow-2xl p-10 flex flex-col gap-6">
            <h2 className="text-xl font-black mb-2 tracking-tight">
              Thao tác nhanh
            </h2>
            <div className="space-y-4">
              <button className="w-full text-left px-6 py-5 rounded-2xl bg-white dark:bg-muted/20 border border-border/50 hover:bg-muted/50 transition-all text-sm font-black flex items-center justify-between group shadow-lg shadow-foreground/5">
                <span className="uppercase tracking-widest text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">
                  Duyệt học viên chờ
                </span>
                <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center text-xs font-black border border-destructive/20 shadow-inner">
                  3
                </div>
              </button>
              <button className="w-full text-left px-6 py-5 rounded-2xl bg-white dark:bg-muted/20 border border-border/50 hover:bg-muted/50 transition-all text-[11px] font-black uppercase tracking-widest opacity-70 hover:opacity-100 shadow-lg shadow-foreground/5">
                Gửi thông báo lớp học
              </button>
              <button className="w-full text-left px-6 py-5 rounded-2xl bg-white dark:bg-muted/20 border border-border/50 hover:bg-muted/50 transition-all text-[11px] font-black uppercase tracking-widest opacity-70 hover:opacity-100 shadow-lg shadow-foreground/5">
                Xuất báo cáo doanh thu
              </button>
            </div>

            <div className="mt-auto p-6 rounded-3xl bg-primary/10 border border-primary/20 relative overflow-hidden group">
              <div className="relative z-10 text-primary">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                  Hết dung lượng
                </p>
                <div className="h-2 w-full bg-primary/20 rounded-full mb-3 overflow-hidden p-0.5">
                  <div className="h-full w-4/5 bg-primary rounded-full animate-pulse transition-all"></div>
                </div>
                <p className="text-xs font-bold italic opacity-70">
                  Sử dụng 1.2GB / 1.5GB
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
