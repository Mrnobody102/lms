"use client";

import { PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const t = useTranslations("Student");

  if (!videoUrl) {
    return (
      <div className="relative aspect-video bg-black rounded-[2rem] shadow-2xl flex flex-col items-center justify-center border border-white/5 overflow-hidden">
        <PlayCircle className="w-16 h-16 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground mt-4 font-medium uppercase tracking-widest text-xs">
          {t("lesson.videoComingSoon")}
        </p>
      </div>
    );
  }

  // Check if it's a YouTube URL
  const isYouTube =
    videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  return (
    <div className="relative aspect-video bg-black rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white/5 group transition-transform duration-500 hover:scale-[1.005]">
      {isYouTube ? (
        <iframe
          src={videoUrl}
          title={`${title} video player`}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        <video
          src={videoUrl}
          controls
          className="absolute inset-0 w-full h-full object-cover"
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* Premium overlay shimmer (optional, can be disabled when video plays) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-orange-500/50 blur-sm"></div>
    </div>
  );
}
