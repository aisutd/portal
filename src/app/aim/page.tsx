import Image from "next/image";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { TopographyBackground } from "@/components/academy/topography-background";
import { AcademyGradientBackground } from "@/components/academy/gradient-background";
import { getAuthenticatedUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { canManageRoles } from "@/lib/roles";
import { listAimEvents, getNextAimNight } from "@/lib/aim-content";
import { AimEventCard } from "@/components/aim/aim-event-card";

export const dynamic = "force-dynamic";

// Infer event item type directly from the return type of listAimEvents
type AimEventItem = Awaited<ReturnType<typeof listAimEvents>>[number];

export default async function AimPage() {
  const viewer = await getAuthenticatedUser();

  // 1. Unauthenticated users -> Redirect to login
  if (!viewer) {
    redirect("/onboarding?mode=login");
  }

  // 2. Auth check: Must be AIM_MENTOR, AIM_MENTEE, AIM Team Officer, or Admin/Director
  const isMentor = viewer.memberships.some(
    (m) => m.membershipType === "AIM_MENTOR" && m.activeFlag
  );

  const hasActiveAimMembership =
    isMentor ||
    viewer.memberships.some(
      (m) => m.membershipType === "AIM_MENTEE" && m.activeFlag
    );

  const isAimOfficerOrAdmin =
    (viewer.team === "AIM" && viewer.role === "OFFICER") ||
    canManageRoles(viewer.role);

  const isAimMember = hasActiveAimMembership || isAimOfficerOrAdmin;

  if (!isAimMember) {
    redirect("/dashboard?error=aim_access_required");
  }

  // Determine if user can scan (Mentors, AIM Officers, or Admins)
  const canScanMentees = isMentor || isAimOfficerOrAdmin;

  // 3. Fetch AIM Events and Featured Next AIM Night
  const [aimEvents, nextAimNight] = await Promise.all([
    listAimEvents(viewer.id),
    getNextAimNight(viewer.id),
  ]);

  // Check if the event occurs today (local date matching)
  let isEventToday = false;
  if (nextAimNight?.startTime) {
    const eventDate = new Date(nextAimNight.startTime);
    const today = new Date();
    isEventToday =
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate();
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <AcademyGradientBackground />
      <Navbar active="AIM" />

      <main className="mx-auto flex w-full max-w-[1300px] flex-col gap-[40px] px-[24px] pb-[64px] pt-28 lg:px-[46px]">
        {/* Intro */}
        <section className="flex flex-col items-start gap-[28px] text-left lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-[16px] text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
              AI Mentorship <span className="text-[#2563eb]">(AIM)</span>
            </h1>
            <p className="style-body-text max-w-xl text-white/80">
              Exclusive mentor-mentee workshops, networking nights, and pod check-ins designed
              to accelerate your career and AI journey.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-[12px]">
            <Button
              className="rounded-full border border-[#d4af37] bg-[#d4af37] px-[22px] py-[14px] style-button-text text-ink transition-colors hover:bg-[#c19d2e]"
              variant="accent"
              href="/id"
            >
              AIM ID
            </Button>
          </div>
        </section>

        {/* Next/Featured AIM Night */}
        <section className="relative flex flex-col gap-[20px] overflow-hidden rounded-[16px] border-t-[10px] border-b-[10px] border-[#2f5fe8] bg-[#181c25] p-[36px] lg:p-[46px]">
          <TopographyBackground />
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-[4px]">
              <h2 className="style-section-header uppercase text-white">Next AIM Event</h2>
              <p className="style-body-text text-white/80">
                Join our upcoming session for mentorship check-ins and structured networking.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-pill-amber px-[16px] py-[8px] style-badge-text text-orange-text sm:inline-block">
              Mandatory Attendance
            </span>
          </div>

          {nextAimNight ? (
            <div className="relative z-10 flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">{nextAimNight.title}</h3>
                  <p className="text-sm text-white/70">{nextAimNight.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#9db8ff]">
                    {new Date(nextAimNight.startTime).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-white/60">
                    {new Date(nextAimNight.startTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <p className="text-white/90">{nextAimNight.description}</p>

              {/* Mentors Scan Button (Displays if user can scan & event is today) */}
              {canScanMentees && isEventToday && (
                <div className="mt-2 flex border-t border-white/10 pt-4">
                  <Button
                    href={`/admin/events/${nextAimNight.id}/scan`}
                    className="rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#1d4ed8]"
                  >
                    📷 Scan Mentees In
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-[20px] border border-dashed border-white/20 p-[24px] text-center style-body-text text-white/60">
              No upcoming AIM events scheduled at the moment.
            </p>
          )}
        </section>

        {/* Upcoming AIM Nights & Events List */}
        <ScrollReveal>
          <section className="flex flex-col gap-[20px]">
            <h2 className="style-section-header uppercase text-white">AIM Schedule & Events</h2>
            {aimEvents.length === 0 ? (
              <p className="rounded-[20px] border border-dashed border-white/20 p-[24px] text-center style-body-text text-white/60">
                No past or future AIM events found.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {aimEvents.map((e: AimEventItem) => (
                  <AimEventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}