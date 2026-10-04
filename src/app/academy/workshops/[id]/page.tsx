import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { TopographyBackground } from "@/components/academy/topography-background";
import { AcademyGradientBackground } from "@/components/academy/gradient-background";
import { WorkshopDetailClient } from "@/components/academy/workshop-detail-client";
import { MobileWorkshopDetail } from "@/components/mobile/academy/MobileWorkshopDetail";
import {
  getAcademyWorkshop,
  hasWorkshopStarted,
  isWorkshopPast,
} from "@/lib/academy-content";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatEventDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface WorkshopDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkshopDetailPage({ params }: WorkshopDetailPageProps) {
  const { id } = await params;

  const viewer = await getAuthenticatedUser();
  const workshop = await getAcademyWorkshop(id, viewer?.id ?? null);
  if (!workshop) notFound();

  // Fetch initial video progress if user is signed in
  let initiallyCompleted = false;
  if (viewer?.id) {
    const progress = await prisma.videoProgress.findUnique({
      where: {
        userId_workshopId: {
          userId: viewer.id,
          workshopId: workshop.id,
        },
      },
      select: { completed: true },
    });
    initiallyCompleted = progress?.completed ?? false;
  }

  // Content unlocks as soon as the workshop starts — waiting for its end time
  // hid the recording for the whole session and beyond. A recording posted
  // early also opens it, since there's nothing left to wait for.
  const hasStarted = hasWorkshopStarted(workshop);
  const hasConcluded = isWorkshopPast(workshop);
  const showContent = hasStarted || workshop.hasRecording;

  const stage = hasConcluded
    ? { label: "Concluded", className: "bg-white/10 text-white/70" }
    : hasStarted
      ? { label: "Happening Now", className: "bg-[#dc2626] text-white" }
      : { label: "Upcoming", className: "bg-[#2563eb] text-white" };

  return (
    <>
      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden">
        <MobileWorkshopDetail
          workshop={workshop}
          stage={stage}
          showContent={showContent}
          isSignedIn={Boolean(viewer)}
          initiallyWatched={initiallyCompleted}
        />
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block">
          <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <AcademyGradientBackground />
            <Navbar active="Academy" />

            {/* No fixed height here: a flex column with `h-screen` shrinks its
                children past their content, which clipped the title. */}
            <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-[24px] px-[24px] pb-[64px] pt-28 lg:px-[46px]">
              <Link
                href="/academy"
                className="style-caption w-fit leading-[16.8px] tracking-[0.2px] text-[#d4af37]"
              >
                ← Back to AI Academy
              </Link>

              <section className="relative overflow-hidden rounded-[16px] border-t-[10px] border-b-[10px] border-[#2f5fe8] bg-[#181c25] p-[32px]">
                <TopographyBackground />
                <span
                  className={`mb-[10px] inline-block w-fit rounded-full px-[12px] py-[6px] style-badge-text ${stage.className}`}
                >
                  {stage.label}
                </span>
                <h1 className="style-page-title leading-tight text-white">{workshop.title}</h1>
                <p className="style-body-text mt-[8px] max-w-2xl text-white/75 whitespace-pre-wrap">
                  {workshop.description}
                </p>
                <div className="mt-[16px] flex flex-wrap items-center gap-x-[24px] gap-y-[8px] style-caption text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatEventDate(workshop.startTime, true)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {workshop.location}
                  </span>
                  {workshop.questions.length > 0 && workshop.quizDueAt && (
                    <span className="flex items-center gap-1.5 text-[#f2c95c]">
                      <Calendar className="h-3.5 w-3.5" />
                      Quiz due: {formatEventDate(workshop.quizDueAt, true)}
                    </span>
                  )}
                </div>
              </section>

              {!showContent ? (
                <div className="rounded-[20px] border border-dashed border-[#2a2f3a] bg-[#181c25] p-[24px] text-center style-body-text text-white/70">
                  This workshop hasn&apos;t started yet. The recording and quiz will appear here post workshop.
                </div>
              ) : !viewer ? (
                <div className="rounded-[20px] border border-dashed border-[#2a2f3a] bg-[#181c25] p-[24px] text-center style-body-text text-white/70">
                  <Link href="/sign-in" className="text-[#7aa2ff] underline">
                    Sign in
                  </Link>{" "}
                  to watch the recording and take the attendance quiz.
                </div>
              ) : (
                <WorkshopDetailClient workshop={workshop} />
              )}
            </main>

            <Footer />
          </div>
      </div>
    </>
  );
}
