import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { AcademyGradientBackground } from "@/components/academy/gradient-background";
import { QuizRunner } from "@/components/academy/quiz-runner";
import { QuizReview } from "@/components/academy/quiz-review";
import { getAcademyWorkshop } from "@/lib/academy-content";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface WorkshopQuizPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ retake?: string }>;
}

/**
 * Responsive rather than a separate mobile component: every branch below
 * renders the same content, so only the page chrome needs to change. The
 * navbar/footer are desktop-only and BottomNav hides itself above `md`.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <AcademyGradientBackground />
      <div className="hidden md:block">
        <Navbar active="Academy" />
      </div>
      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-[20px] px-5 pb-24 pt-6 md:gap-[24px] md:px-[24px] md:pb-[64px] md:pt-28 lg:px-[46px]">
        {children}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}

export default async function WorkshopQuizPage({
  params,
  searchParams,
}: WorkshopQuizPageProps) {
  const { id } = await params;
  const { retake } = await searchParams;

  const viewer = await getAuthenticatedUser();
  if (!viewer) redirect(`/onboarding?mode=login&redirect_url=/academy/workshops/${id}/quiz`);

  const workshop = await getAcademyWorkshop(id, viewer.id);
  if (!workshop) notFound();

  const backLink = (
    <Link
      href={`/academy/workshops/${workshop.id}`}
      className="style-caption w-fit leading-[16.8px] tracking-[0.2px] text-[#d4af37]"
    >
      ← Back to {workshop.title}
    </Link>
  );

  if (workshop.questions.length === 0) {
    return (
      <Shell>
        {backLink}
        <div className="rounded-[20px] border border-dashed border-[#2a2f3a] bg-[#181c25] p-6 text-center md:p-[28px] style-body-text text-white/70">
          No quiz has been posted for this workshop.
        </div>
      </Shell>
    );
  }

  // Mirrors the API's own check so the closed state is a page, not a failed
  // submission after the member has answered everything.
  const isPastDue = workshop.quizDueAt !== null && new Date(workshop.quizDueAt) < new Date();
  const attempt = workshop.latestAttempt;

  // A previous attempt is shown as a recap first; retaking is an explicit
  // choice rather than something that wipes the record on page load.
  const showRecap = attempt !== null && retake !== "1";

  if (showRecap) {
    const submitted = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(attempt.submittedAt));

    const canRetake = !workshop.hasAttended && !isPastDue;

    return (
      <Shell>
        {backLink}

        <div
          className={`flex flex-col items-center gap-[10px] rounded-[20px] border p-6 text-center md:p-[32px] ${
            attempt.passed
              ? "border-emerald-200 bg-[#d2ecd9]"
              : "border-red-200 bg-[#fdf2f2]"
          }`}
        >
          {attempt.passed ? (
            <CheckCircle2 className="h-9 w-9 text-emerald-800" />
          ) : (
            <XCircle className="h-9 w-9 text-red-600" />
          )}
          <p
            className={`style-card-title ${
              attempt.passed ? "text-emerald-900" : "text-red-700"
            }`}
          >
            {attempt.passed ? "You passed this quiz" : "You didn't pass this attempt"}
          </p>
          <p
            className={`style-body-text ${
              attempt.passed ? "text-emerald-900/80" : "text-red-700/80"
            }`}
          >
            Scored {attempt.correctCount}/{attempt.total} on {submitted}.
            {attempt.passed
              ? " Attendance has been recorded for this workshop."
              : isPastDue
                ? " The make-up window has since closed."
                : " There's no limit on attempts."}
          </p>

          {canRetake && (
            <Link
              href={`/academy/workshops/${workshop.id}/quiz?retake=1`}
              className="mt-[8px] rounded-full bg-[#2563eb] px-[22px] py-[12px] style-button-text text-white transition-colors hover:bg-[#1e4fc7]"
            >
              Retake Quiz
            </Link>
          )}
        </div>

        <QuizReview
          questions={workshop.questions}
          results={attempt.results}
          answerKey={attempt.answerKey}
        />
      </Shell>
    );
  }

  if (workshop.hasAttended) {
    return (
      <Shell>
        {backLink}
        <div className="flex flex-col items-center gap-[10px] rounded-[20px] border border-emerald-200 bg-[#d2ecd9] p-6 text-center md:p-[36px]">
          <CheckCircle2 className="h-9 w-9 text-emerald-800" />
          <p className="style-card-title text-emerald-900">You&apos;re all set</p>
          <p className="style-body-text text-emerald-900/80">
            You already have attendance credit for this workshop, so there&apos;s nothing to make
            up.
          </p>
        </div>
      </Shell>
    );
  }

  if (isPastDue) {
    return (
      <Shell>
        {backLink}
        <div className="flex flex-col items-center gap-[10px] rounded-[20px] border border-red-200 bg-[#fdf2f2] p-6 text-center md:p-[36px]">
          <XCircle className="h-9 w-9 text-red-600" />
          <p className="style-card-title text-red-700">Quiz Closed</p>
          <p className="style-body-text text-red-700/80">
            The window to make up attendance for this workshop has ended.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {backLink}
      <QuizRunner
        workshopId={workshop.id}
        workshopTitle={workshop.title}
        questions={workshop.questions}
        dueAt={workshop.quizDueAt}
      />
    </Shell>
  );
}
