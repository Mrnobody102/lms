'use client';

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Settings,
  DollarSign,
  Calendar,
  LogOut,
  Moon,
  Sun,
  Layers,
  BarChart3,
  Sparkles,
  Bell,
  Menu,
  Store,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/auth.store';
import { cn } from '@/lib/utils';
import { Link, usePathname, useRouter } from '@/navigation';
import { LanguageToggle, useTheme, Sheet, SheetContent, SheetTrigger, SheetTitle } from '@repo/ui';

interface MenuItem {
  name: string;
  icon: LucideIcon;
  href: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'lms-admin-sidebar-collapsed';
const EXPANDED_SIDEBAR_WIDTH = '16rem';
const COLLAPSED_SIDEBAR_WIDTH = '4.5rem';

export function AdminSidebar() {
  const t = useTranslations('Admin');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => {
      if (mediaQuery.matches) {
        setIsMobileMenuOpen(false);
      }
    };

    closeOnDesktop();
    mediaQuery.addEventListener('change', closeOnDesktop);
    return () => mediaQuery.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (stored) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  useEffect(() => {
    const width = isCollapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;
    document.documentElement.style.setProperty('--admin-sidebar-width', width);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const fullMenuGroups: MenuGroup[] = [
    {
      label: t('nav.groups.overview'),
      items: [{ name: t('dashboard'), icon: LayoutDashboard, href: '/' }],
    },
    {
      label: t('nav.groups.teaching'),
      items: [
        { name: t('programs'), icon: Layers, href: '/programs' },
        { name: t('courses'), icon: BookOpen, href: '/courses' },
        { name: t('skills.navLabel'), icon: Sparkles, href: '/skills' },
      ],
    },
    {
      label: t('nav.groups.people'),
      items: [
        { name: t('students'), icon: Users, href: '/students' },
        { name: t('instructors.navLabel'), icon: GraduationCap, href: '/instructors' },
        { name: t('cohorts.navLabel'), icon: Users, href: '/cohorts' },
      ],
    },
    {
      label: t('nav.groups.operations'),
      items: [
        { name: t('schedule'), icon: Calendar, href: '/schedule' },
        { name: t('finance'), icon: DollarSign, href: '/finance' },
        { name: t('reports.navLabel'), icon: BarChart3, href: '/reports' },
        { name: t('notifications.title'), icon: Bell, href: '/notifications' },
      ],
    },
    {
      label: t('nav.groups.marketplace'),
      items: [
        { name: t('marketplace.providerNav'), icon: Store, href: '/marketplace/provider' },
        { name: t('marketplace.exploreNav'), icon: PackageSearch, href: '/marketplace/explore' },
      ],
    },
    {
      label: t('nav.groups.system'),
      items: [{ name: t('settingsLabel'), icon: Settings, href: '/settings' }],
    },
  ];
  const instructorMenuGroups: MenuGroup[] = [
    {
      label: t('nav.groups.overview'),
      items: [{ name: t('dashboard'), icon: LayoutDashboard, href: '/' }],
    },
    {
      label: t('nav.groups.teaching'),
      items: [
        { name: t('instructorNav.myCourses'), icon: BookOpen, href: '/courses' },
        { name: t('instructorNav.myClasses'), icon: Users, href: '/course-runs' },
        { name: t('schedule'), icon: Calendar, href: '/schedule' },
      ],
    },
    {
      label: t('nav.groups.operations'),
      items: [{ name: t('reports.navLabel'), icon: BarChart3, href: '/reports' }],
    },
    {
      label: t('nav.groups.system'),
      items: [{ name: t('settingsLabel'), icon: Settings, href: '/settings' }],
    },
  ];
  const menuGroups = user?.role === 'INSTRUCTOR' ? instructorMenuGroups : fullMenuGroups;

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

  const renderSidebarContent = (collapsed: boolean) => (
    <>
      {/* Logo */}
      <div className={cn('border-b border-border py-5', collapsed ? 'px-3' : 'px-6')}>
        <Link
          href="/"
          className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}
          title={collapsed ? t('brandName') : undefined}
        >
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow">
            C
          </div>
          {!collapsed && <span className="font-semibold text-base">{t('brandName')}</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className={cn('flex-1 pb-5 overflow-y-auto', collapsed ? 'p-2 space-y-2' : 'p-3 space-y-4')}
      >
        {menuGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Section */}
      <div
        className={cn(
          'relative z-30 flex flex-col gap-3 border-t border-border bg-card shadow-[0_-8px_18px_rgba(15,23,42,0.04)]',
          collapsed ? 'items-center p-2' : 'p-4',
        )}
      >
        {/* User Profile Section */}
        <div className={cn('flex items-center gap-3 px-1', collapsed && 'justify-center px-0')}>
          <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
            {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.fullName || t('profileNameFallback')}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || t('profileEmailFallback')}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions Row */}
        <div
          className={cn('flex items-center pt-1', collapsed ? 'flex-col gap-1' : 'justify-between')}
        >
          <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={t('themeToggle')}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              href="/settings"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={t('settingsLabel')}
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={() => void handleLogout()}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <LanguageToggle menuAlign="end" menuPlacement="top" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="-ml-2 p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] p-0 flex flex-col"
              aria-describedby={undefined}
            >
              <SheetTitle className="sr-only">{t('common.menu')}</SheetTitle>
              {renderSidebarContent(false)}
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm">{t('brandName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'bg-card border-r fixed h-full hidden md:flex flex-col z-20 transition-[width] duration-200',
          isCollapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          className="absolute -right-3 top-6 z-30 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          title={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
        {renderSidebarContent(isCollapsed)}
      </aside>
    </>
  );
}
