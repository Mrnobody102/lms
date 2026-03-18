"use client";

import { Link, useRouter } from "../../navigation";
import {
  BookOpen,
  PlayCircle,
  Trophy,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { ThemeToggle, LanguageToggle } from "@repo/ui";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { AuthModal } from "../../features/auth/components/auth-modal";
import { useAuthStore } from "../../features/auth/auth.store";

export default function Home() {
  const t = useTranslations("Student");
  const router = useRouter();
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    tab: "login" | "register";
  }>({
    open: false,
    tab: "login",
  });

  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
            {t("nav.courses")}
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            {t("nav.hsk")}
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            {t("nav.vocab")}
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            {t("nav.blog")}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-4 ml-2">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-black truncate max-w-[120px]">
                    {user?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-xl hover:bg-destructive/10"
                title={t("cta.logout") || "Logout"}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setAuthModal({ open: true, tab: "login" })}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-all active:scale-95"
              >
                {t("cta.login")}
              </button>
              <button
                onClick={() => setAuthModal({ open: true, tab: "register" })}
                className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 shadow-md active:scale-95 transition-all"
              >
                {t("cta.register")}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-background">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {t("hero.badge")}
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            {t("hero.title")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
              {t("hero.titleAlt")}
            </span>{" "}
            {t("hero.titleEnd")}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
            {t("hero.desc")}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  // Navigate to courses if already logged in
                  router.push("/courses");
                } else {
                  setAuthModal({ open: true, tab: "register" });
                }
              }}
              className="px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-1 flex items-center gap-2 active:scale-95"
            >
              <PlayCircle className="w-5 h-5" />
              {t("hero.trial")}
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setAuthModal({ open: true, tab: "login" });
                } else {
                  router.push("/courses");
                }
              }}
              className="px-8 py-4 bg-card text-foreground border text-lg font-bold rounded-xl hover:bg-muted transition-all active:scale-95"
            >
              {t("hero.roadmap")}
            </button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative aspect-video bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border flex items-center justify-center group cursor-pointer">
            <div className="text-center">
              <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-primary group-hover:scale-110 transition-all duration-300 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">{t("hero.watchVideo")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-card/50 py-24 border-t border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">
              {t("features.whyUs")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
              {t("features.whyUsDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t("features.items.hsk.title"),
                icon: Trophy,
                desc: t("features.items.hsk.desc"),
              },
              {
                title: t("features.items.library.title"),
                icon: BookOpen,
                desc: t("features.items.library.desc"),
              },
              {
                title: t("features.items.community.title"),
                icon: UserIcon,
                desc: t("features.items.community.desc"),
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

      <AuthModal
        isOpen={authModal.open}
        onClose={() => setAuthModal({ ...authModal, open: false })}
        defaultTab={authModal.tab}
      />
    </div>
  );
}
