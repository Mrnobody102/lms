'use client';

import dynamic from 'next/dynamic';
import { Clock, BookOpen, Trophy } from 'lucide-react';
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
        return <TextContent content={lesson.content ?? undefined} title={lesson.title} />;
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
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 flex-1">
      {/* Dynamic Lesson Content */}
      <div className="mb-12">{renderContent()}</div>

      <div className="max-w-3xl mx-auto md:mx-0">
        <div className="flex items-center gap-3 mb-6">
          <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-primary/20">
            {t('lesson.lesson')} {lesson.id}
          </span>
          <span className="text-muted-foreground text-xs flex items-center gap-1.5 font-bold bg-muted/30 px-3 py-1.5 rounded-full border">
            <Clock className="w-3.5 h-3.5" />
            {lesson.duration} {t('lesson.duration', { minutes: '' }).trim()}
          </span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
          {lesson.title}
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          {lesson.type === 'video' && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 font-medium opacity-90">
              {t('lesson.sampleDesc')}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
            <div className="p-8 rounded-[2rem] bg-card/40 backdrop-blur-sm border border-primary/10 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                {t('lesson.goals')}
              </h4>
              <ul className="text-sm space-y-3 text-muted-foreground font-semibold">
                {(t.raw('lesson.goalItems') as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 rounded-[2rem] bg-card/40 backdrop-blur-sm border border-orange-500/10 shadow-xl shadow-orange-500/5 hover:shadow-orange-500/10 transition-all duration-300 group">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                {t('lesson.requirements')}
              </h4>
              <ul className="text-sm space-y-3 text-muted-foreground font-semibold">
                {(t.raw('lesson.reqItems') as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
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
