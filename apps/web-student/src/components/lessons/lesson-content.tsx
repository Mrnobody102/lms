'use client';

import dynamic from 'next/dynamic';
import { BookOpen, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Lesson } from '../../lib/course-api';
import { withReturnLessonId } from '../../lib/lesson-return';
import { Link } from '../../navigation';
import { MicroCardContent } from './micro-card-content';
import { TextContent } from './text-content';
import { VideoPlayer } from './video-player';
import { QuizContent } from './quiz-content';

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
            onComplete={onComplete}
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
      case 'quiz':
        return <QuizContent quiz={parseLessonQuizContent(lesson.content)} />;
      case 'practice':
        return lesson.practiceExerciseSetId ? (
          <LinkedLessonResource
            href={withReturnLessonId(`/practice/${lesson.practiceExerciseSetId}`, lesson.id)}
            label={t('lesson.openPractice')}
            description={t('lesson.openPracticeDesc')}
          />
        ) : null;
      case 'exam':
        return lesson.examId ? (
          <LinkedLessonResource
            href={withReturnLessonId(`/exams/${lesson.examId}`, lesson.id)}
            label={t('lesson.openExam')}
            description={t('lesson.openExamDesc')}
          />
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

function LinkedLessonResource({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border bg-card/40 p-8 text-center">
      <Trophy className="mx-auto mb-4 h-10 w-10 text-primary" />
      <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
      >
        {label}
      </Link>
    </div>
  );
}

interface LessonQuizContent {
  questions: {
    correctAnswer: number;
    options: string[];
    question: string;
  }[];
}

function parseLessonQuizContent(content: string | null | undefined): LessonQuizContent | undefined {
  if (!content) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    return isLessonQuizContent(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isLessonQuizContent(value: unknown): value is LessonQuizContent {
  if (!value || typeof value !== 'object' || !('questions' in value)) {
    return false;
  }

  const questions = (value as { questions: unknown }).questions;
  return Array.isArray(questions) && questions.every(isLessonQuizQuestion);
}

function isLessonQuizQuestion(value: unknown): value is LessonQuizContent['questions'][number] {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const question = value as {
    correctAnswer?: unknown;
    options?: unknown;
    question?: unknown;
  };

  return (
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.every((option) => typeof option === 'string') &&
    typeof question.correctAnswer === 'number'
  );
}
