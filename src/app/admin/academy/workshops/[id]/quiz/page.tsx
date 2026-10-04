import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminAcademyShell } from "@/components/admin/academy-shell";
import { QuizEditor } from "@/components/admin/quiz-editor";
import { parseQuizQuestions } from "@/lib/academy-quiz";
import type { BuilderQuestion } from "@/components/admin/question-builder";

export const metadata: Metadata = {
  title: "AIS Admin — Workshop Quiz",
  description: "Build the attendance quiz for an AI Academy workshop.",
};

export default async function WorkshopQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Query the standalone Workshop model
  const workshop = await prisma.workshop.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      quiz: true,
    },
  });

  if (!workshop) return notFound();

  const quiz = workshop.quiz;

  // 2. The builder speaks `label`; quizzes store `prompt`. Translate at the edge
  // so the shared component doesn't need to know about either domain.
  const initialQuestions: BuilderQuestion[] = parseQuizQuestions(quiz?.questionsJson).map(
    (q) => ({
      id: q.id,
      label: q.prompt,
      type: "MULTIPLE_CHOICE",
      required: true,
      options: q.options,
      correctIndex: q.correctIndex,
    })
  );

  return (
    <AdminAcademyShell>
      <div>
        <Link
          href="/admin/academy/workshops"
          className="style-caption leading-[16.8px] tracking-[0.2px] text-brand"
        >
          ← Back to Workshops
        </Link>
        <h2 className="mt-[6px] style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
          Quiz — {workshop.title}
        </h2>
        <p className="style-caption mt-1 text-ink-faint">
          Members who missed this workshop watch the recording, then pass this quiz to earn
          attendance credit.{" "}
          <Link
            href={`/academy/workshops/${workshop.id}`}
            className="text-brand underline"
            target="_blank"
          >
            View the member page ↗
          </Link>
        </p>
      </div>

      <div className="max-w-4xl">
        <QuizEditor
          workshopId={workshop.id}
          initialQuestions={initialQuestions}
          initialPassingScore={quiz?.passingScore ?? 100}
          initialIsPublished={quiz?.isPublished ?? false}
        />
      </div>
    </AdminAcademyShell>
  );
}
