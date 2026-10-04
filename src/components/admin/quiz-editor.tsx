"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  QuestionBuilder,
  cleanQuestions,
  createEmptyQuestion,
  type BuilderQuestion,
} from "@/components/admin/question-builder";

type QuizEditorProps = {
  workshopId: string;
  initialQuestions: BuilderQuestion[];
  initialPassingScore: number;
  initialIsPublished: boolean;
};

/**
 * Quiz builder. Reuses the application question builder with the correct-answer
 * affordance switched on; everything a quiz needs beyond that is the passing
 * score and whether members can see it yet.
 */
export function QuizEditor({
  workshopId,
  initialQuestions,
  initialPassingScore,
  initialIsPublished,
}: QuizEditorProps) {
  const router = useRouter();

  const [questions, setQuestions] = useState<BuilderQuestion[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [createEmptyQuestion("MULTIPLE_CHOICE", 4)]
  );
  const [passingScore, setPassingScore] = useState(initialPassingScore);
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      questions: cleanQuestions(questions).map((q) => ({
        id: q.id,
        prompt: q.label,
        options: q.options,
        correctIndex: q.correctIndex ?? 0,
      })),
      passingScore,
      isPublished,
    };

    try {
      const response = await fetch(`/api/admin/academy/workshops/${workshopId}/quiz`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to save the quiz.");
      }

      setSaved(true);
      router.push("/admin/academy/workshops");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-danger-border bg-white p-4 style-body-text text-danger-ink">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6 rounded-2xl border border-border-soft bg-white p-5 shadow-sm md:p-6">
        <div>
          <h2 className="style-body-text text-lg font-semibold text-ink">Quiz Questions</h2>
          <p className="style-caption mt-0.5 text-ink-faint">
            Multiple choice only. Select the radio next to the correct answer for each question.
          </p>
        </div>

        <QuestionBuilder
          questions={questions}
          onChange={setQuestions}
          markCorrectAnswer
          showRequiredToggle={false}
          showDescription={false}
          labelText="Question"
          labelPlaceholder="e.g. What does an activation function do?"
          newQuestionType="MULTIPLE_CHOICE"
          newQuestionOptionCount={4}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-white p-5 shadow-sm md:p-6">
        <h2 className="style-body-text text-lg font-semibold text-ink">Settings</h2>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="passingScore" className="style-caption font-medium text-ink-muted">
            Passing score (%)
          </label>
          <input
            id="passingScore"
            type="number"
            min={1}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            className="h-[42px] w-[140px] rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
          />
          <p className="style-caption text-ink-faint">
            Members must reach this to earn attendance credit. 100 means every answer must be right.
          </p>
        </div>

        <label className="flex cursor-pointer select-none items-start gap-2.5 rounded-xl border border-border-soft p-3.5 transition-colors hover:bg-row-soft">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-brand"
          />
          <span className="flex flex-col gap-0.5">
            <span className="style-body-text font-medium text-ink">Visible to members</span>
            <span className="style-caption text-ink-faint">
              Off by default. Until this is checked the workshop page reads &ldquo;no quiz has
              been posted&rdquo;, even with questions saved.
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span role="status" className="style-caption text-ink-faint">
            ✓ Saved — returning to workshops…
          </span>
        )}
        <Button variant="primary" onClick={save} disabled={saving} className="h-[42px] px-6">
          {saving ? "Saving…" : "Save quiz"}
        </Button>
      </div>
    </div>
  );
}
