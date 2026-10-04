import { Check, X } from "lucide-react";
import type { MemberQuizQuestion, QuizQuestionResult } from "@/lib/academy-quiz";

type QuizReviewProps = {
  questions: MemberQuizQuestion[];
  results: QuizQuestionResult[];
  /**
   * Correct option per question id. Only supplied once the member has passed —
   * without it the review shows what they picked and whether it was right,
   * but not the right answer.
   */
  answerKey?: Record<string, number> | null;
};

/** Read-only recap of a submitted attempt. */
export function QuizReview({ questions, results, answerKey }: QuizReviewProps) {
  const byQuestion = new Map(results.map((r) => [r.questionId, r]));

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[2px]">
        <h2 className="style-card-title text-white">Your Answers</h2>
        {!answerKey && (
          <p className="style-caption text-white/60">
            Correct answers stay hidden until you pass, so a retake still counts for something.
          </p>
        )}
      </div>

      {questions.map((question, idx) => {
        const result = byQuestion.get(question.id);
        const correctIndex = answerKey?.[question.id];

        return (
          <div
            key={question.id}
            className="flex flex-col gap-[10px] rounded-[16px] border border-[#2a2f3a] bg-[#181c25] p-4 md:p-[20px]"
          >
            <div className="flex items-start gap-[10px]">
              <span
                className={`mt-[2px] flex size-[20px] shrink-0 items-center justify-center rounded-full ${
                  result?.correct ? "bg-emerald-600" : "bg-red-600"
                }`}
                aria-label={result?.correct ? "Correct" : "Incorrect"}
              >
                {result?.correct ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <X className="h-3 w-3 text-white" />
                )}
              </span>
              <p className="style-body-text font-semibold text-white">
                {idx + 1}. {question.prompt}
              </p>
            </div>

            <div className="flex flex-col gap-[6px] pl-[30px]">
              {question.options.map((option, optionIdx) => {
                const picked = result?.selectedIndex === optionIdx;
                const isCorrect = correctIndex === optionIdx;

                return (
                  <div
                    key={optionIdx}
                    className={`flex items-center justify-between gap-[12px] rounded-[10px] border px-[14px] py-[10px] style-body-text ${
                      isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                        : picked
                          ? "border-red-500/50 bg-red-500/10 text-red-200"
                          : "border-[#2a2f3a] text-white/50"
                    }`}
                  >
                    <span>{option}</span>
                    {picked && (
                      <span className="style-badge-text shrink-0 text-white/70">
                        Your answer
                      </span>
                    )}
                    {isCorrect && !picked && (
                      <span className="style-badge-text shrink-0 text-emerald-300">
                        Correct answer
                      </span>
                    )}
                  </div>
                );
              })}

              {result?.selectedIndex === null && (
                <p className="style-caption text-white/50">You skipped this question.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
