import Image from "next/image";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { TopographyBackground } from "@/components/academy/topography-background";
import { AcademyGradientBackground } from "@/components/academy/gradient-background";
import { CourseSequence } from "@/components/academy/course-sequence";
import { VideoNotesPanel } from "@/components/academy/video-notes-panel";
import { MobileAcademy } from "@/components/mobile/academy/MobileAcademy";
import { FeaturedWorkshop } from "@/components/academy/featured-workshop";
import {
  getFeaturedWorkshop,
  listAcademyResources,
  listAcademyWorkshops,
} from "@/lib/academy-content";
import { getAuthenticatedUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { canManageRoles, isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const viewer = await getAuthenticatedUser();

  // 1. Unauthenticated users -> Redirect to login
  if (!viewer) {
    redirect("/onboarding?mode=login");
  }

  const hasActiveAcademyMembership = viewer.memberships.some(
    (m) => m.membershipType === "AI_ACADEMY" && m.activeFlag
  );

  const isAcademyMember =
    hasActiveAcademyMembership ||
    (viewer.team === "AI_ACADEMY" && viewer.role === "OFFICER" || canManageRoles(viewer.role));

  if (!isAcademyMember) {
    redirect("/dashboard?error=academy_access_required");
  }

  const [workshops, resources, featured] = await Promise.all([
    listAcademyWorkshops(viewer.id),
    listAcademyResources(),
    getFeaturedWorkshop(viewer.id),
  ]);

  return (
    <>
      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden">
        <MobileAcademy
          workshops={workshops}
          resources={resources}
          featuredLesson={
            featured
              ? {
                  title: featured.title,
                  videoUrl: featured.recordingUrl ?? null,
                  workshopId: featured.id,
                  userId: viewer.id,
                  completed: featured.progressCompleted,
                }
              : undefined
          }
        />
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <AcademyGradientBackground />
      <Navbar active="Academy" />

      <main className="mx-auto flex w-full max-w-[1300px] flex-col gap-[40px] px-[24px] pb-[64px] pt-28 lg:px-[46px]">
        {/* Intro */}
        <section className="flex flex-col items-start gap-[28px] text-left lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-[16px] text-left">
            <Image
              src="/images/academy/wordmark.png"
              alt="AI Academy"
              width={893}
              height={279}
              className="h-[130px] w-auto object-contain"
              priority
            />
            <p className="style-body-text max-w-xl text-white">
              Weekly workshops to provide resources and teach you everything you need
              to know to start your first AI project.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-[12px]">
            <a
              href="#course-sequence-desktop"
              className="flex-1 rounded-full bg-[#2563eb] px-4 py-3 style-button-text text-white shadow-[0_5px_14px_rgba(0,0,0,0.5)] transition-colors hover:bg-[#1e4fc7] inline-flex items-center justify-center text-center"
            >
              Browse Courses
            </a>
            <Button
              className="rounded-full border border-[#d4af37] bg-[#d4af37] px-[22px] py-[14px] style-button-text text-ink transition-colors hover:bg-[#c19d2e]"
              variant="accent"
              href="/id"
            >
              Academy ID
            </Button>
          </div>
        </section>

        {/* Featured video course + notes */}
        <section className="relative flex flex-col gap-[20px] overflow-hidden rounded-[16px] border-t-[10px] border-b-[10px] border-[#2f5fe8] bg-[#181c25] p-[36px] lg:p-[46px]">
          <TopographyBackground />
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-[4px]">
              <h2 className="style-section-header uppercase text-white">Recently</h2>
            </div>
            <span className="hidden shrink-0 rounded-full bg-pill-amber px-[16px] py-[8px] style-badge-text text-orange-text sm:inline-block">
              View all
            </span>
          </div>
          {featured ? (
            <FeaturedWorkshop workshop={featured} />
          ) : (
            <p className="rounded-[20px] border border-dashed border-white/20 p-[24px] text-center style-body-text text-white/60">
              No workshops have been published yet.
            </p>
          )}
        </section>

        {/* Course Sequence */}
        <ScrollReveal>
          <section id="course-sequence-desktop" className="flex flex-col gap-[20px]">
            <h2 className="style-section-header uppercase text-white">Course Sequence</h2>
            <CourseSequence workshops={workshops} />
          </section>
        </ScrollReveal>

        {/* Resources */}
        <section className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[4px]">
            <h2 className="style-section-header uppercase text-white">Resources</h2>
            <p className="style-body-text text-white/70">
              Downloadable materials, guides, and toolkits to help you prepare and keep
              learning outside of workshops.
            </p>
          </div>
          {resources.length === 0 ? (
            <p className="rounded-[20px] border border-dashed border-white/20 p-[24px] text-center style-body-text text-white/60">
              No resources have been published yet.
            </p>
          ) : (
            <div className="flex snap-x snap-mandatory gap-[20px] overflow-x-auto pb-[8px] scrollbar-none">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-[260px] shrink-0 snap-start flex-col gap-[16px] rounded-[20px] border border-[#2a2f3a] bg-[#181c25] p-[16px] transition-all duration-200 hover:-translate-y-[2px] hover:border-[#2563eb]/60"
                >
                  <div className="flex flex-col gap-[8px]">
                    <span className="style-card-title text-white">{resource.title}</span>
                    {resource.description && (
                      <span className="style-caption text-white/70">{resource.description}</span>
                    )}
                  </div>
                  {resource.category && (
                    <div className="mt-auto flex flex-wrap gap-[8px]">
                      <span className="rounded-full bg-[#2563eb]/15 px-[12px] py-[6px] style-badge-text text-[#9db8ff]">
                        {resource.category}
                      </span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
      </div>
      </div>
    </>
  );
}
