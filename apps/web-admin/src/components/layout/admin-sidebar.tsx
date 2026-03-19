"use client";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/auth.store";

export function AdminSidebar() {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const { user } = useAuthStore();

  const menuItems = [
    { name: t("dashboard"), icon: LayoutDashboard, href: "/" },
    { name: t("students"), icon: Users, href: "/students" },
    { name: t("courses"), icon: BookOpen, href: "/courses" },
    { name: t("finance"), icon: DollarSign, href: "/finance" },
    { name: t("schedule"), icon: Calendar, href: "/schedule" },
    { name: t("settings"), icon: Settings, href: "/settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname.endsWith("/")) return true;
    if (href !== "/" && pathname.includes(href)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r fixed h-full hidden md:flex flex-col z-20 shadow-sm transition-all duration-300">
      <div className="p-6 border-sidebar-border border-b">
        <Link
          href="/"
          className="flex items-center gap-2 text-sidebar-primary group"
        >
          <div className="h-8 w-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold shadow-lg shadow-sidebar-primary/20 group-hover:scale-110 transition-transform">
            C
          </div>
          <span className="font-bold text-lg tracking-tight">Center Admin</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${active ? "animate-pulse" : ""}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-sidebar-border/50 bg-sidebar-accent/5">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center font-bold text-primary group-hover:rotate-12 transition-transform">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.name || user?.email || "Admin"}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
              {user?.role || "Admin"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
