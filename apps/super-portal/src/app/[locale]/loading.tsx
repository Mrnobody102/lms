"use client";

import { Server } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("SuperPortal");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Server className="w-10 h-10 text-primary animate-pulse mb-4" />
      <p className="text-muted-foreground font-medium">{t("loading")}</p>
    </div>
  );
}
