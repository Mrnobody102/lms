"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Trophy,
  HelpCircle,
  ArrowRightCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface QuizContentProps {
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
  };
}

export function QuizContent({ quiz }: QuizContentProps) {
  const t = useTranslations("Student");
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showResults, setShowResults] = useState(false);

  if (!quiz || !quiz.questions.length) {
    return (
      <div className="p-12 rounded-[2rem] bg-card/30 border border-dashed flex flex-col items-center justify-center text-muted-foreground">
        <HelpCircle className="w-12 h-12 mb-4 opacity-20" />
        <p>{t("quiz.noQuestions")}</p>
      </div>
    );
  }

  const handleOptionSelect = (qIdx: number, oIdx: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 flex items-center justify-between transition-all duration-700">
        <div>
          <h3 className="text-xl font-black tracking-tight mb-2">
            {t("quiz.finalAssessment")}
          </h3>
          <p className="text-sm text-muted-foreground font-medium italic">
            {t("quiz.testKnowledge")}
          </p>
        </div>
        <Trophy className="w-12 h-12 text-primary opacity-20" />
      </div>

      <div className="space-y-10 group/list">
        {quiz.questions.map((q, qIdx) => (
          <div
            key={qIdx}
            className="space-y-6 transition-all duration-700"
            style={{ transitionDelay: `${qIdx * 100}ms` }}
          >
            <h4 className="text-lg font-black flex gap-4">
              <span className="text-primary opacity-30 italic">
                {String(qIdx + 1).padStart(2, "0")}
              </span>
              {q.question}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {q.options.map((option, oIdx) => {
                const isSelected = selectedAnswers[qIdx] === oIdx;
                const isCorrect = q.correctAnswer === oIdx;

                let containerClass =
                  "p-5 rounded-2xl border-2 transition-all duration-300 font-bold text-sm flex items-center justify-between relative overflow-hidden group/item ";

                if (showResults) {
                  if (isSelected && isCorrect)
                    containerClass +=
                      "bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10";
                  else if (isSelected && !isCorrect)
                    containerClass +=
                      "bg-red-500/10 border-red-500 text-red-600";
                  else if (isCorrect)
                    containerClass +=
                      "bg-emerald-500/5 border-emerald-500/30 text-emerald-600/80";
                  else
                    containerClass +=
                      "bg-muted/50 border-transparent opacity-50";
                } else {
                  if (isSelected)
                    containerClass +=
                      "bg-primary/10 border-primary text-primary shadow-xl shadow-primary/10 scale-[1.02]";
                  else
                    containerClass +=
                      "bg-card hover:bg-muted border-transparent hover:border-border cursor-pointer active:scale-95";
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleOptionSelect(qIdx, oIdx)}
                    disabled={showResults}
                    className={containerClass}
                  >
                    <span className="relative z-10">{option}</span>
                    <div className="relative z-10">
                      {showResults && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 animate-bounce" />
                      )}
                      {!showResults && isSelected && (
                        <ArrowRightCircle className="w-5 h-5 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!showResults ? (
        <button
          onClick={() => setShowResults(true)}
          disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
          className="w-full py-5 rounded-[2rem] bg-foreground text-background font-black text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 mt-10 focus:outline-none focus:ring-4 focus:ring-primary/20"
        >
          {t("quiz.checkAnswers")}
        </button>
      ) : (
        <div className="p-10 rounded-[2rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 flex flex-col items-center justify-center text-center transition-all duration-500 mt-10 scale-in-center">
          <Trophy className="w-16 h-16 mb-6" />
          <h3 className="text-3xl font-black mb-2">{t("quiz.greatEffort")}</h3>
          <p className="text-emerald-50 font-bold mb-8 italic">
            {t("quiz.yourScore", {
              score: calculateScore(),
              total: quiz.questions.length,
            })}
          </p>
          <button
            onClick={() => {
              setShowResults(false);
              setSelectedAnswers({});
            }}
            className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-colors focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            {t("quiz.tryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
