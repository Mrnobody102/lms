'use client';

import dynamic from 'next/dynamic';
import { BookOpen, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Lesson } from '../../lib/course-api';
import { Link } from '../../navigation';
import { VideoPlayer } from './video-player';
import { TextContent } from './text-content';
import { MicroCardContent } from './micro-card-content';

const SimulationContent = dynamic(
  () => import('./simulation-content').then((m) => ({ default: m.SimulationContent })),
  {
    loading: () => (
      <div className="p-12 rounded-[2rem] bg-card/30 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  },
);

interface LessonContentProps {
  lesson: Lesson;
  onComplete?: () => void;
}

export function LessonContent({ lesson, onComplete }: LessonContentProps) {
  const t = useTranslations('Student');
  const isVideoLesson = lesson.type === 'video';

  const renderContent = () => {
    switch (lesson.type) {
      case 'video':
        return (
          <VideoPlayer
            lessonId={lesson.id}
            videoUrl={lesson.videoUrl ?? undefined}
            title={lesson.title}
            onComplete={onComplete}
          />
        );
      case 'text':
        return (
          <TextContent
            content={lesson.content ?? undefined}
            title={lesson.title}
            duration={lesson.duration}
          />
        );
      case 'micro_card':
        return (
          <MicroCardContent
            lessonId={lesson.id}
            content={lesson.content ?? undefined}
            onComplete={onComplete}
          />
        );
      case 'simulation':
        return <SimulationContent aiPrompt={lesson.aiPrompt ?? undefined} />;
      case 'practice':
        return lesson.practiceExerciseSetId ? (
          <LinkedLessonResource
            href={`/practice/${lesson.practiceExerciseSetId}`}
            label={t('lesson.openPractice')}
          />
        ) : null;
      case 'exam':
        return lesson.examId ? (
          <LinkedLessonResource href={`/exams/${lesson.examId}`} label={t('lesson.openExam')} />
        ) : null;
      default:
        return (
          <div className="p-12 rounded-[2rem] bg-muted flex flex-col items-center justify-center text-center">
            <BookOpen className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">
              {t('lesson.unsupportedType')}
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`mx-auto w-full flex-1 ${
        isVideoLesson ? 'max-w-none px-4 py-5 sm:px-6 lg:px-8' : 'max-w-5xl p-4 sm:p-6 lg:p-10'
      }`}
    >
      <div className="w-full">{renderContent()}</div>
    </div>
  );
}

function LinkedLessonResource({ href, label }: { href: string; label: string }) {
  return (
    <div className="rounded-[2rem] border bg-card/40 p-8 text-center">
      <Trophy className="mx-auto mb-4 h-10 w-10 text-primary" />
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
      >
        {label}
      </Link>
    </div>
  );
}
