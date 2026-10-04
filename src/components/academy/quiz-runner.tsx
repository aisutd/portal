"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Flame } from "lucide-react";
import { QuizReview } from "@/components/academy/quiz-review";
import type { MemberQuizQuestion, QuizQuestionResult } from "@/lib/academy-quiz";

type QuizRunnerProps = {
  workshopId: string;
  workshopTitle: string;
  questions: MemberQuizQuestion[];
  /** ISO string, or null when the quiz stays open indefinitely. */
  dueAt: string | null;
};

type Outcome = {
  passed: boolean;
  score: number;
  correctCount: number;
  total: number;
  results: QuizQuestionResult[];
  answerKey: Record<string, number> | null;
};

function daysUntil(dueAt: string | null): number {
  if (!dueAt) return Infinity;
  return Math.ceil((new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Walks the member through one question at a time. Answers are held locally
 * and submitted together at the end, so moving back and forth costs nothing
 * and grading still happens in a single server round-trip.
 */
export function QuizRunner({
  workshopId,
  workshopTitle,
  questions,
  dueAt,
}: QuizRunnerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = questions.length;
  const question = questions[index];
  const isLast = index === total - 1;
  const answered = answers[question.id] !== undefined;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const daysLeft = daysUntil(dueAt);

  async function submit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/academy/workshops/${workshopId}/quiz/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Couldn't submit your quiz.");
      }

      setOutcome({
        passed: body.passed,
        score: body.score,
        correctCount: body.correctCount,
        total: body.total,
        results: body.results ?? [],
        answerKey: body.answerKey ?? null,
      });

      if (body.passed) router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAnswers({});
    setOutcome(null);
    setError(null);
    setIndex(0);
  }

  if (outcome) {
    return (
      <div className="flex flex-col gap-[24px]">
        {outcome.passed ? (
          <div className="flex flex-col items-center gap-[10px] rounded-[20px] border border-emerald-200 bg-[#d2ecd9] p-6 text-center md:p-[36px]">
            <CheckCircle2 className="h-9 w-9 text-emerald-800" />
            <p className="style-card-title text-emerald-900">Nice work!</p>
            <p className="style-body-text text-emerald-900/80">
              You scored {outcome.correctCount}/{outcome.total} — attendance has been recorded
              for this workshop.
            </p>
            <Link
              href={`/academy/workshops/${workshopId}`}
              className="mt-[8px] rounded-full bg-[#2563eb] px-[22px] py-[12px] style-button-text text-white transition-colors hover:bg-[#1e4fc7]"
            >
              Back to the workshop
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[10px] rounded-[20px] border border-red-200 bg-[#fdf2f2] p-6 text-center md:p-[36px]">
            <XCircle className="h-9 w-9 text-red-600" />
            <p className="style-card-title text-red-700">Not quite</p>
            <p className="style-body-text text-red-700/80">
              You scored {outcome.correctCount}/{outcome.total}. Review the recording and try
              again — there&apos;s no limit on attempts.
            </p>
            <div className="mt-[8px] flex flex-wrap items-center justify-center gap-[10px]">
              <button
                type="button"
                onClick={retry}
                className="rounded-full bg-[#2563eb] px-[22px] py-[12px] style-button-text text-white transition-colors hover:bg-[#1e4fc7]"
              >
                Retake Quiz
              </button>
              <Link
                href={`/academy/workshops/${workshopId}`}
                className="rounded-full border border-[#2a2f3a] px-[22px] py-[12px] style-button-text text-ink transition-colors hover:bg-black/5"
              >
                Rewatch Recording
              </Link>
            </div>
          </div>
        )}

        <QuizReview
          questions={questions}
          results={outcome.results}
          answerKey={outcome.answerKey}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px] rounded-[20px] border border-[#2a2f3a] bg-[#181c25] p-5 md:p-[28px]">
      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <div className="flex flex-col gap-[2px]">
          <span className="style-caption text-white/60">{workshopTitle}</span>
          <span className="style-card-title text-white">
            Question {index + 1} of {total}
          </span>
        </div>
        {daysLeft <= 3 && daysLeft >= 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-[#fbe3cb] px-3 py-1 style-badge-text text-[#7a4416]">
            <Flame className="h-3.5 w-3.5" />
            Due in {daysLeft}d
          </span>
        )}
      </div>

      <div
        className="h-[6px] w-full overflow-hidden rounded-full bg-[#2a2f3a]"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-[#d4af37] transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[12px] border border-red-200 bg-[#fdf2f2] px-[16px] py-[12px]">
          <XCircle className="h-4 w-4 shrink-0 text-red-600" />
          <p className="style-body-text text-red-700">{error}</p>
        </div>
      )}

      <p className="style-body-text text-lg font-semibold text-white">{question.prompt}</p>

      <div className="flex flex-col gap-[10px]">
        {question.options.map((option, optionIdx) => (
          <label
            key={optionIdx}
            className={`flex cursor-pointer items-center gap-[12px] rounded-[10px] border px-[16px] py-[12px] style-body-text transition-colors ${
              answers[question.id] === optionIdx
                ? "border-[#d4af37] bg-[#d4af37]/15 text-[#f2c95c]"
                : "border-[#2a2f3a] text-white/80 hover:border-[#d4af37]/40"
            }`}
          >
            <input
              type="radio"
              name={question.id}
              className="accent-[#d4af37]"
              checked={answers[question.id] === optionIdx}
              onChange={() =>
                setAnswers((prev) => ({ ...prev, [question.id]: optionIdx }))
              }
            />
            {option}
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-[12px] border-t border-[#2a2f3a] pt-[20px]">
        <button
          type="button"
          onClick={() => setIndex((i) => i - 1)}
          disabled={index === 0}
          className="min-h-[44px] rounded-full border border-[#2a2f3a] px-[22px] py-[12px] style-button-text text-white/80 transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="min-h-[44px] rounded-full bg-[#d4af37] px-[22px] py-[12px] style-button-text text-ink transition-colors hover:bg-[#c19d2e] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            disabled={!answered}
            className="min-h-[44px] rounded-full bg-[#d4af37] px-[22px] py-[12px] style-button-text text-ink transition-colors hover:bg-[#c19d2e] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        )}
      </div>

      {isLast && !allAnswered && (
        <p className="style-caption text-center text-white/50">
          Answer every question before submitting.
        </p>
      )}
    </div>
  );
}
