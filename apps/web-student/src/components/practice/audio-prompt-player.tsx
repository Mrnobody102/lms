'use client';

import { Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  url: string;
  replayLimit: number | null;
  unrestricted?: boolean;
}

export function AudioPromptPlayer({ url, replayLimit, unrestricted = false }: Props) {
  const t = useTranslations('Student.audio');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setPlayCount(0);
    setPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setStarting(false);
  }, [url]);

  const limit = unrestricted ? null : replayLimit;
  const canPlay = limit === null || playCount < limit;
  const remaining = limit === null ? null : Math.max(0, limit - playCount);
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handlePlay = async () => {
    if (!audioRef.current || !canPlay || starting) return;

    setStarting(true);
    audioRef.current.currentTime = 0;
    try {
      await audioRef.current.play();
      setPlayCount((count) => count + 1);
    } catch {
      setPlaying(false);
    } finally {
      setStarting(false);
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playing ? handlePause : handlePlay}
          disabled={(!canPlay && !playing) || starting}
          aria-label={playing ? t('pause') : t('play')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            {t('label')}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {limit === null ? t('unlimited') : t('replayCountdown', { count: remaining ?? 0 })}
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={url}
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      >
        <track kind="captions" />
      </audio>
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00';

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
