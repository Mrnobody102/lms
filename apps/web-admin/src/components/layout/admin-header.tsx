"use client";

import { ThemeToggle, LanguageToggle } from "@repo/ui";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  title: string;
  description?: string;
  showCreateCourse?: boolean;
}

export function AdminHeader({
  title,
  description,
  showCreateCourse = false,
}: AdminHeaderProps) {
  const t = useTranslations("Admin");

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground font-bold text-sm tracking-tight opacity-70">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto self-end md:self-auto">
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl border border-border/50 backdrop-blur-sm">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {showCreateCourse && (
          <Link
            href="/courses/new"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-black rounded-2xl hover:opacity-90 shadow-xl shadow-primary/20 active:scale-95 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            {t("createCourse")}
          </Link>
        )}
      </div>
    </header>
  );
}
