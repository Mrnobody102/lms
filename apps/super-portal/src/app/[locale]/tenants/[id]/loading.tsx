"use client";

import { Activity } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Activity className="w-10 h-10 text-primary animate-pulse mb-4" />
      <p className="text-muted-foreground font-medium">
        Đang tải thông tin chi tiết...
      </p>
    </div>
  );
}
