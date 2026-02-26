import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  TrendingUp,
  DollarSign,
  Calendar,
} from "lucide-react";
import { ThemeToggle } from "@repo/ui";

export default function AdminHome() {
  return (
    <div className="min-h-screen font-sans flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r fixed h-full hidden md:flex flex-col z-10 shadow-sm">
        <div className="p-6 border-sidebar-border border-b">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <div className="h-8 w-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold shadow-lg shadow-sidebar-primary/20">
              C
            </div>
            <span className="font-bold text-lg tracking-tight">
              Center Admin
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { name: "Tổng quan", icon: LayoutDashboard, active: true },
            { name: "Học viên", icon: Users },
            { name: "Khóa học", icon: BookOpen },
            { name: "Tài chính", icon: DollarSign },
            { name: "Lịch học", icon: Calendar },
            { name: "Cài đặt", icon: Settings },
          ].map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                item.active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted border"></div>
            <div>
              <p className="text-sm font-semibold">Admin User</p>
              <p className="text-xs text-muted-foreground">Trung Tâm A</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 bg-background">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Chào mừng quay trở lại, đây là tình hình trung tâm hôm nay.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 shadow-md active:scale-95 transition-all">
              + Tạo khóa học mới
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Tổng doanh thu",
              value: "128.5M ₫",
              trend: "+12.5%",
              icon: DollarSign,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Học viên mới",
              value: "24",
              trend: "+4.3%",
              icon: Users,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Khóa học Active",
              value: "12",
              trend: "0%",
              icon: BookOpen,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Tỷ lệ hoàn thành",
              value: "86%",
              trend: "+2.1%",
              icon: TrendingUp,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card p-6 rounded-xl border border-transparent dark:border-border shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    stat.trend.startsWith("+")
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stat.trend}
                </span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card rounded-xl border dark:border-border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-6">Đăng ký mới gần đây</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-muted last:border-0 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                      HV
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Nguyễn Văn {String.fromCharCode(64 + i)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        nguyenvan{i}@gmail.com
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      HSK 3 - Basic
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2 phút trước
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border dark:border-border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-6">Thao tác nhanh</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted/50 transition-all text-sm font-semibold flex items-center justify-between group">
                <span>Duyệt học viên chờ (3)</span>
                <div className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">
                  3
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted/50 transition-all text-sm font-semibold">
                Gửi thông báo lớp học
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg border hover:bg-muted/50 transition-all text-sm font-semibold">
                Xuất báo cáo doanh thu
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
