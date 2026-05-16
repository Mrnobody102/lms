'use client';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Dumbbell,
  FileCheck2,
  Settings,
  DollarSign,
  Calendar,
  LogOut,
  User,
  Moon,
  Sun,
  ChevronDown,
  Layers,
  BarChart3,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/features/auth/auth.store';
import { cn } from '@/lib/utils';
import { Link, usePathname, useRouter } from '@/navigation';
import { LanguageToggle } from '@repo/ui';

export function AdminSidebar() {
  const t = useTranslations('Admin');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { name: t('dashboard'), icon: LayoutDashboard, href: '/' },
    { name: t('students'), icon: Users, href: '/students' },
    { name: t('programs'), icon: Layers, href: '/programs' },
    { name: t('courses'), icon: BookOpen, href: '/courses' },
    { name: t('practice'), icon: Dumbbell, href: '/practice' },
    { name: t('exams'), icon: FileCheck2, href: '/exams' },
    { name: t('reports.navLabel'), icon: BarChart3, href: '/reports' },
    { name: t('finance'), icon: DollarSign, href: '/finance' },
    { name: t('schedule'), icon: Calendar, href: '/schedule' },
    { name: t('settingsLabel'), icon: Settings, href: '/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <aside className="w-64 bg-card border-r fixed h-full hidden md:flex flex-col z-20">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow">
            C
          </div>
          <span className="font-semibold text-base">{t('brandName')}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-border p-3">
        {/* Theme & Language Row */}
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={t('themeToggle')}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <LanguageToggle />

          {/* Profile Trigger */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors group"
          >
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {user?.fullName?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase() ||
                '?'}
            </div>
            <span className="text-sm font-medium truncate max-w-[100px] text-foreground">
              {user?.fullName || user?.email || t('profileNameFallback')}
            </span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0',
                dropdownOpen && 'rotate-180',
              )}
            />
          </button>
        </div>

        {/* Profile Dropdown */}
        {dropdownOpen && (
          <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Profile Header */}
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                  {user?.fullName?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() ||
                    '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">
                    {user?.fullName || t('profileNameFallback')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || t('profileEmailFallback')}
                  </p>
                </div>
              </div>
              {user?.role && (
                <div className="mt-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {user.role}
                  </span>
                </div>
              )}
            </div>

            {/* Dropdown Items */}
            <div className="py-1">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4" />
                {t('settingsLabel')}
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  void handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
