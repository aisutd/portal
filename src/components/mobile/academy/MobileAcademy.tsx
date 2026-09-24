import Image from "next/image";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { Footer } from "@/components/footer";
import { VideoNotesPanel } from "@/components/academy/video-notes-panel";
import { CourseSequence } from "@/components/academy/course-sequence";
import type { AcademyWorkshopSummary, AcademyResource } from "@/lib/academy-content";
import { AcademyGradientBackground } from "@/components/academy/gradient-background";
import { Button } from "@/components/ui/button";

type MobileAcademyProps = {
  workshops: AcademyWorkshopSummary[];
  resources: AcademyResource[];
  featuredLesson?: {
    title: string;
    videoUrl: string | null;
    workshopId?: string;
    userId?: string;
    completed?: boolean;
  };
};

export function MobileAcademy({ workshops, resources, featuredLesson }: MobileAcademyProps) {
  const safeFeaturedLesson = featuredLesson ?? { title: "Featured workshop", videoUrl: null };

  return (
    <MobileScreen>
      <AcademyGradientBackground/>
      {/* Intro */}
      <div className="flex flex-col items-start gap-4">
        <Image
          src="/images/academy/wordmark.png"
          alt="AI Academy"
          width={893}
          height={279}
          className="h-[70px] w-auto object-contain"
          priority
        />
        <p className="style-mobile-body text-white">
          Weekly workshops to provide resources and teach you everything you need
          to know to start your first AI project.
        </p>
        <div className="flex w-full justify-between gap-3">
         <Button href="#course-sequence-mobile" variant="primary">
              Browse Courses
            </Button>
          <Button variant="accent" href="/id">
            Academy ID
          </Button>
        </div>
      </div>

      {/* Featured video course + notes */}
      <section className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border-t-[6px] border-b-[6px] border-[#2f5fe8] bg-[#181c25] p-5">
        <div className="flex flex-col gap-1">
          <h2 className="style-section-header uppercase text-white text-lg">
            Featured Workshop
          </h2>
        </div>
        <VideoNotesPanel
          key={safeFeaturedLesson.workshopId ?? "featured-lesson-3"}
          title={safeFeaturedLesson.title}
          videoUrl={safeFeaturedLesson.videoUrl}
          notesKey="featured-lesson-3"
          workshopId={safeFeaturedLesson.workshopId}
          userId={safeFeaturedLesson.userId}
          initiallyCompleted={safeFeaturedLesson.completed}
        />
      </section>

      {/* Course Sequence */}
     <section id="course-sequence-mobile" className="flex flex-col gap-4">
            <h2 className="style-section-header uppercase text-white text-lg">
          Course Sequence
        </h2>
        <CourseSequence workshops={workshops} />
      </section>

      {/* Resources */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="style-section-header uppercase text-white text-lg">
            Resources
          </h2>
          <p className="style-mobile-body text-white/70">
            Downloadable materials, guides, and toolkits to help you prepare and keep
            learning outside of workshops.
          </p>
        </div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.href}
              className="flex w-[220px] shrink-0 snap-start flex-col gap-4 rounded-2xl border border-[#2a2f3a] bg-[#181c25] p-4 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex flex-col gap-2">
                <span className="style-card-title text-white text-sm">{resource.title}</span>
                <span className="style-caption text-white/70">{resource.description}</span>
              </div>
              {resource.category && (
                <div className="mt-auto flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#2563eb]/15 px-3 py-1.5 style-badge-text text-[#9db8ff] text-xs">
                    {resource.category}
                  </span>
                </div>
              )}
            </a>
          ))}
        </div>
      </section>

      <div className="-mx-5 mt-4 pt-6">
        <Footer />
      </div>
      <BottomNav />
    </MobileScreen>
  );
}
