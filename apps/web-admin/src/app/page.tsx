
import Link from 'next/link';
import {  LayoutDashboard, Users, BookOpen, Settings, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Card } from '@repo/ui/card';

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
             <div className="flex items-center gap-2 text-indigo-600">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                <span className="font-bold text-lg tracking-tight text-slate-900">Center Admin</span>
             </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {[
                { name: 'Tổng quan', icon: LayoutDashboard, active: true },
                { name: 'Học viên', icon: Users },
                { name: 'Khóa học', icon: BookOpen },
                { name: 'Tài chính', icon: DollarSign },
                { name: 'Lịch học', icon: Calendar },
                { name: 'Cài đặt', icon: Settings },
            ].map((item) => (
                <a key={item.name} href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <item.icon className="w-5 h-5" />
                    {item.name}
                </a>
            ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                <div>
                    <p className="text-sm font-medium text-slate-900">Admin User</p>
                    <p className="text-xs text-slate-500">Trung Tâm A</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">Chào mừng quay trở lại, đây là tình hình trung tâm hôm nay.</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">
                + Tạo khóa học mới
            </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
                { label: 'Tổng doanh thu', value: '128.5M ₫', trend: '+12.5%', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Học viên mới', value: '24', trend: '+4.3%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Khóa học Active', value: '12', trend: '0%', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Tỷ lệ hoàn thành', value: '86%', trend: '+2.1%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{stat.trend}</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
            ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Đăng ký mới gần đây</h2>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium text-sm">HV</div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Nguyễn Văn {String.fromCharCode(64 + i)}</p>
                                    <p className="text-xs text-slate-500">nguyenvan{i}@gmail.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-indigo-600">HSK 3 - Basic</p>
                                <p className="text-xs text-slate-400">2 phút trước</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                 <h2 className="text-lg font-bold text-slate-900 mb-6">Thao tác nhanh</h2>
                 <div className="space-y-3">
                    <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700 flex items-center justify-between group">
                        <span>Duyệt học viên chờ (3)</span>
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</div>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700">
                        Gửi thông báo lớp học
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700">
                        Xuất báo cáo doanh thu
                    </button>
                 </div>
            </div>
        </div>
      </main>
    </div>
  );
}
