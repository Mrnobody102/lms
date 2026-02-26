import Link from "next/link";
import { BookOpen, PlayCircle, Trophy, User } from "lucide-react";
import { ThemeToggle } from "@repo/ui";

export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
            L
          </div>
          <span className="font-bold text-xl tracking-tight">LMS Learning</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">
            Khóa học
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Lộ trình HSK
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Từ vựng
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Blog
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-all active:scale-95">
            Đăng nhập
          </button>
          <button className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 shadow-md active:scale-95 transition-all">
            Đăng ký ngay
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-background">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Học tiếng Trung chuẩn HSK
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            Chinh Phục{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
              Tiếng Trung
            </span>{" "}
            Dễ Dàng.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
            Nền tảng học trực tuyến toàn diện với lộ trình HSK 1-6. Luyện phát
            âm AI, Flashcard thông minh, và Video bài giảng chất lượng cao.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-1 flex items-center gap-2 active:scale-95">
              <PlayCircle className="w-5 h-5" />
              Học Thử Miễn Phí
            </button>
            <button className="px-8 py-4 bg-card text-foreground border text-lg font-bold rounded-xl hover:bg-muted transition-all active:scale-95">
              Xem Lộ Trình
            </button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative aspect-video bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border flex items-center justify-center group cursor-pointer">
            <div className="text-center">
              <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-primary group-hover:scale-110 transition-all duration-300 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">Xem Video Giới Thiệu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-card/50 py-24 border-t border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
              Phương pháp học hiện đại kết hợp công nghệ AI giúp bạn nhớ từ vựng
              lâu hơn 300% so với cách học truyền thống.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Lộ Trình HSK Chuẩn",
                icon: Trophy,
                desc: "Bài học được thiết kế bám sát giáo trình HSK mới nhất từ HSK 1 đến HSK 6.",
              },
              {
                title: "Thư Viện Khổng Lồ",
                icon: BookOpen,
                desc: "Hơn 5000 video bài giảng, 10.000 từ vựng flashcard và kho đề thi thử phong phú.",
              },
              {
                title: "Cộng Đồng Sôi Nổi",
                icon: User,
                desc: "Kết nối với hàng ngàn học viên khác, cùng thi đua bảng xếp hạng hàng tuần.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-background rounded-xl shadow-sm border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-all">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-12 border-t">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-medium">
            &copy; 2024 LMS Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
