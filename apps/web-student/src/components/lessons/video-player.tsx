'use client';

import { useEffect, useRef } from 'react';
import { PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  onComplete?: () => void;
}

export function VideoPlayer({ videoUrl, title, onComplete }: VideoPlayerProps) {
  const t = useTranslations('Student');
  const hasTriggeredComplete = useRef(false);

  useEffect(() => {
    hasTriggeredComplete.current = false;
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <div className="relative aspect-video bg-black rounded-[2rem] shadow-2xl flex flex-col items-center justify-center border border-white/5 overflow-hidden">
        <PlayCircle className="w-16 h-16 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground mt-4 font-medium uppercase tracking-widest text-xs">
          {t('lesson.videoComingSoon')}
        </p>
      </div>
    );
  }

  // Validate URL scheme to prevent javascript: XSS
  const safeUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return '';
      return url;
    } catch {
      return '';
    }
  };

  // Normalize YouTube URLs to safe embed format
  const getYouTubeEmbedUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      // youtu.be short links
      if (parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}`;
      }
      // youtube.com watch links
      if (parsed.hostname.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
      // Already an embed URL
      if (parsed.pathname.startsWith('/embed/')) return url;
    } catch {
      // fall through
    }
    return url;
  };

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(videoUrl) : videoUrl;
  const safeSrc = safeUrl(embedUrl);

  return (
    <div className="relative aspect-video bg-black rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white/5 group transition-transform duration-500 hover:scale-[1.005]">
      {!safeSrc ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p className="text-sm font-medium">{t('lesson.videoUnavailable')}</p>
        </div>
      ) : isYouTube ? (
        <iframe
          src={safeSrc}
          title={`${title} video player`}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ) : (
        <video
          src={safeSrc}
          controls
          className="absolute inset-0 w-full h-full object-cover"
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            if (onComplete && !hasTriggeredComplete.current && video.duration > 0) {
              const progress = video.currentTime / video.duration;
              if (progress >= 0.85) {
                hasTriggeredComplete.current = true;
                onComplete();
              }
            }
          }}
        >
          {t('lesson.videoUnsupported')}
        </video>
      )}

      {/* Premium overlay shimmer (optional, can be disabled when video plays) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-orange-500/50 blur-sm"></div>
    </div>
  );
}
