"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { BottomNav } from "@/components/mobile/ui/BottomNav";
import { Marquee } from "@/components/apply/marquee";
import { OpenAppRow } from "@/components/apply/open-app-row";
import { programs } from "@/lib/data";
import {
  type Application,
  buildOpenRow,
  buildSubmittedRow,
  sortApplications,
  sortSubmittedApplications,
} from "@/lib/applications-utils";

type ApplicationResponse = {
  applications: Application[];
};

function ApplicationSkeleton() {
  return (
    <div className="flex flex-col gap-[10px] rounded-[14px] border border-border-soft bg-white p-[16px]">
      <div className="h-[16px] w-[70%] animate-pulse rounded-full bg-[#efece3]" />
      <div className="h-[12px] w-[90%] animate-pulse rounded-full bg-[#f4f1ea]" />
      <div className="flex gap-[8px]">
        <div className="h-[34px] flex-1 animate-pulse rounded-[8px] bg-[#f4f1ea]" />
        <div className="h-[34px] flex-1 animate-pulse rounded-[8px] bg-[#f4f1ea]" />
      </div>
    </div>
  );
}

function MobileApplicationSection({
  title,
  items,
  loading,
  emptyMessage,
  action,
  buildRow,
}: {
  title: string;
  items: Application[];
  loading: boolean;
  emptyMessage: string;
  action?: React.ReactNode;
  buildRow: (application: Application) => ReturnType<typeof buildOpenRow>;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-center justify-between gap-[8px]">
        <h2 className="font-mobile-display text-[17px] font-bold text-ink">
          {title}
        </h2>
        {action}
      </div>
      {loading ? (
        <div className="flex flex-col gap-[12px]">
          <ApplicationSkeleton />
          <ApplicationSkeleton />
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-[12px]">
          {items.map((application) => (
            <OpenAppRow key={application.id} {...buildRow(application)} />
          ))}
        </div>
      ) : (
        <div className="rounded-[14px] border border-border-soft bg-white p-[16px] font-mobile-body text-[13px] text-ink-muted">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export function MobileApply() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setLoading(true);

      try {
        const response = await fetch("/api/applications", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load applications: ${response.status}`);
        }
        const payload = (await response.json()) as ApplicationResponse;
        setApplications(Array.isArray(payload.applications) ? payload.applications : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setApplications([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadApplications();
    return () => controller.abort();
  }, []);

  const openApplications = sortApplications(applications, "open");
  const upcomingApplications = sortApplications(applications, "upcoming");
  const closedApplications = sortApplications(applications, "closed");
  const submittedApplications = sortSubmittedApplications(applications);

  return (
    <MobileScreen>
      <div className="flex flex-col gap-2 pt-4">
        <h1 className="font-mobile-display text-[36px] font-bold leading-7.5 text-ink">
          Choose Your <span className="text-brand">AIS Path</span>
        </h1>
        <p className="font-mobile-body text-[14px] text-ink">
          Welcome to the enrollment hub. Whether you&apos;re here to learn,
          lead, or build, there&apos;s a place waiting for you.
        </p>
      </div>

      {/* Programs */}
      <div className="flex flex-col gap-[12px]">
        {programs.map((program) => (
          <div
            key={program.title}
            className="flex flex-col gap-[12px] rounded-[16px] border bg-white p-[18px]"
            style={{ borderColor: program.borderColor }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex size-[40px] items-center justify-center rounded-[10px] text-[18px]"
                style={{ backgroundColor: program.iconBg, color: program.iconColor }}
              >
                {program.icon}
              </span>
              {program.badge && (
                <Badge label={program.badge} bg="#fbe3cb" color="#7a4416" />
              )}
            </div>
            <h3 className="font-mobile-display text-[17px] font-bold text-ink">
              {program.title}
            </h3>
            <p className="font-mobile-body text-[13px] text-ink-muted">
              {program.description}
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {program.tags.map((label) => (
                <Tag
                  key={label}
                  label={label}
                  bg="#efece3"
                  color="#6a685f"
                  border="#e2ded2"
                />
              ))}
            </div>
            <Button variant={program.cta} size="md" pill block>
              Apply Now →
            </Button>
            {/* TODO: point at the real AIS website page for this program once it exists. */}
            <Button variant="soft" size="md" pill block href="#">
              Learn more →
            </Button>
          </div>
        ))}
      </div>

      {/* Slogan banner (bleeds past the screen padding) */}
      <div className="-mx-[20px]">
        <Marquee text="JOIN THE MOVEMENT · AIS UTD · BUILD THE FUTURE · LEARN. BUILD. LEAD. · YOUR AI COMMUNITY AT UTD · AIS UTD" />
      </div>

      <MobileApplicationSection
        title="Open Applications"
        items={openApplications}
        loading={loading}
        emptyMessage="There are no open applications right now."
        buildRow={buildOpenRow}
      />
      <MobileApplicationSection
        title="Upcoming Applications"
        items={upcomingApplications}
        loading={loading}
        emptyMessage="There are no upcoming applications."
        buildRow={buildOpenRow}
      />
      <MobileApplicationSection
        title="Closed Applications"
        items={closedApplications}
        loading={loading}
        emptyMessage="There are no closed applications to show."
        buildRow={buildOpenRow}
      />
      <MobileApplicationSection
        title="Submitted Applications"
        items={submittedApplications}
        loading={loading}
        emptyMessage="You have not submitted any applications yet."
        action={
          <Button href="/applications/history" variant="ghost" size="sm">
            View history
          </Button>
        }
        buildRow={buildSubmittedRow}
      />

      <BottomNav />
    </MobileScreen>
  );
}
