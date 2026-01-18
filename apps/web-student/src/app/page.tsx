
import Link from 'next/link';
import { BookOpen, PlayCircle, Trophy, User } from 'lucide-react';
import { Card } from '@repo/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      {/* Navbar */}
      <nav className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="font-bold text-xl tracking-tight text-slate-800">LMS Learning</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-slate-600">
          <Link href="#" className="hover:text-red-600 transition-colors">Khóa học</Link>
          <Link href="#" className="hover:text-red-600 transition-colors">Lộ trình HSK</Link>
          <Link href="#" className="hover:text-red-600 transition-colors">Từ vựng</Link>
          <Link href="#" className="hover:text-red-600 transition-colors">Blog</Link>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Đăng nhập</button>
          <button className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm transition-all hover:shadow-md">Đăng ký ngay</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Học tiếng Trung chuẩn HSK
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
            Chinh Phục <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Tiếng Trung</span> Dễ Dàng.
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
            Nền tảng học trực tuyến toàn diện với lộ trình HSK 1-6. Luyện phát âm AI, Flashcard thông minh, và Video bài giảng chất lượng cao.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-slate-900 text-white text-lg font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Học Thử Miễn Phí
            </button>
            <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-semibold rounded-xl hover:bg-slate-50 transition-all hover:border-slate-300">
              Xem Lộ Trình
            </button>
          </div>
        </div>
        <div className="relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-red-500 to-orange-400 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative aspect-video bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex items-center justify-center group cursor-pointer">
                 <div className="text-center">
                    <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300 mx-auto mb-4" />
                    <p className="text-slate-300 font-medium">Xem Video Giới Thiệu</p>
                 </div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Tại sao chọn chúng tôi?</h2>
                <p className="text-slate-500 max-w-2xl mx-auto">Phương pháp học hiện đại kết hợp công nghệ AI giúp bạn nhớ từ vựng lâu hơn 300% so với cách học truyền thống.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { title: "Lộ Trình HSK Chuẩn", icon: Trophy, desc: "Bài học được thiết kế bám sát giáo trình HSK mới nhất từ HSK 1 đến HSK 6." },
                    { title: "Thư Viện Khổng Lồ", icon: BookOpen, desc: "Hơn 5000 video bài giảng, 10.000 từ vựng flashcard và kho đề thi thử phong phú." },
                    { title: "Cộng Đồng Sôi Nổi", icon: User, desc: "Kết nối với hàng ngàn học viên khác, cùng thi đua bảng xếp hạng hàng tuần." }
                ].map((item, i) => (
                    <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 hover:bg-red-50/30 transition-all duration-300 group">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform">
                            <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p>&copy; 2024 LMS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
