"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { SectionHeader } from "@/components/ui/section-header";
import { ProgramCard } from "@/components/apply/program-card";
import { Marquee } from "@/components/apply/marquee";
import { OpenAppRow, type OpenApp } from "@/components/apply/open-app-row";
import { Button } from "@/components/ui/button";
import { MobileApply } from "@/components/mobile/apply/MobileApply";
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
    <div className="flex w-full flex-col items-start gap-[16px] rounded-[16px] border border-border-soft bg-white p-[25px] sm:flex-row sm:items-center sm:justify-between sm:gap-[24px]">
      <div className="min-w-0 flex-1 animate-pulse">
        <div className="h-[21px] w-[280px] rounded-full bg-[#efece3]" />
        <div className="mt-[10px] h-[14px] w-[440px] max-w-full rounded-full bg-[#f4f1ea]" />
        <div className="mt-[10px] h-[12px] w-[240px] rounded-full bg-[#f4f1ea]" />
      </div>
      <div className="flex shrink-0 gap-[10px]">
        <div className="h-[38px] w-[112px] rounded-[10px] bg-[#f4f1ea]" />
        <div className="h-[38px] w-[98px] rounded-[10px] bg-[#f4f1ea]" />
      </div>
    </div>
  );
}

function ApplicationEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[16px] border border-border-soft bg-white px-[25px] py-[22px] font-body text-[14px] leading-[20.3px] text-ink-muted">
      {message}
    </div>
  );
}

function ApplicationSection({
  title,
  items,
  loading,
  emptyMessage,
  action,
  buildRow,
}: {
  title: string;
  items: ApplicationResponse["applications"];
  loading: boolean;
  emptyMessage: string;
  action?: ReactNode;
  buildRow: (
    application: ApplicationResponse["applications"][number],
  ) => OpenApp;
}) {
  return (
    <section className="mt-[22.05px] flex flex-col gap-[16px] px-[46px]">
      <SectionHeader title={title} action={action} />
      {loading ? (
        <div className="flex flex-col gap-[14px]">
          <ApplicationSkeleton />
          <ApplicationSkeleton />
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-[14px]">
          {items.map((application) => (
            <OpenAppRow key={application.id} {...buildRow(application)} />
          ))}
        </div>
      ) : (
        <ApplicationEmptyState message={emptyMessage} />
      )}
    </section>
  );
}

function ProgramFlowArrow() {
  return (
    <div
      className="flex shrink-0 items-center justify-center text-brand"
      aria-hidden="true"
    >
      <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-[20px] leading-none shadow-[0px_1px_0px_rgba(0,0,0,0.03)] lg:hidden">
        ↓
      </span>
      <span className="hidden h-full w-[48px] items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-[22px] leading-none shadow-[0px_1px_0px_rgba(0,0,0,0.03)] lg:flex">
        →
      </span>
    </div>
  );
}

export default function ApplyPage() {
  const [applications, setApplications] = useState<
    ApplicationResponse["applications"]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setLoading(true);

      try {
        const response = await fetch("/api/applications", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load applications: ${response.status}`);
        }

        const payload = (await response.json()) as ApplicationResponse;
        setApplications(
          Array.isArray(payload.applications) ? payload.applications : [],
        );
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

    return () => {
      controller.abort();
    };
  }, []);

  const openApplications = sortApplications(applications, "open");
  const upcomingApplications = sortApplications(applications, "upcoming");
  const closedApplications = sortApplications(applications, "closed");
  const submittedApplications = sortSubmittedApplications(applications);

  return (
    <>
      {/* --- MOBILE LAYOUT --- */}
      <div className="md:hidden">
        <MobileApply />
      </div>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:block">
        <div className="flex min-h-screen w-full flex-col bg-cream">
          <Navbar active="Apply" />

          <div className="relative w-full pb-[46px] pt-[46px]">
            <section className="px-[46px] pt-[8px]">
              <h1 className="font-display text-[65px] font-bold leading-[47.52px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
                Choose Your <span className="text-brand">AIS Path</span>
              </h1>
              <p className="mt-[7.76px] max-w-[1000px] pl-[20.94px] font-body text-[20px] font-normal leading-[24px] text-ink">
                Welcome to the enrollment hub. Whether you&apos;re here to learn,
                lead, or build, there&apos;s a place waiting for you.
              </p>
            </section>

            <section className="mt-[31.49px] px-[46px]">
              <div className="flex flex-col gap-[20px] lg:flex-row lg:items-stretch">
                {programs.map((program, index) => (
                  <Fragment key={program.title}>
                    <ProgramCard {...program} showActionButton={false} />
                    {index < programs.length - 1 ? <ProgramFlowArrow /> : null}
                  </Fragment>
                ))}
              </div>
            </section>

            <div className="mt-[29.59px]">
              <Marquee text="JOIN THE MOVEMENT · AIS UTD · BUILD THE FUTURE · LEARN. BUILD. LEAD. · YOUR AI COMMUNITY AT UTD · AIS UTD" />
            </div>

            <ApplicationSection
              title="Open Applications"
              items={openApplications}
              loading={loading}
              emptyMessage="There are no open applications right now."
              buildRow={buildOpenRow}
            />
            <ApplicationSection
              title="Upcoming Applications"
              items={upcomingApplications}
              loading={loading}
              emptyMessage="There are no upcoming applications."
              buildRow={buildOpenRow}
            />
            <ApplicationSection
              title="Closed Applications"
              items={closedApplications}
              loading={loading}
              emptyMessage="There are no closed applications to show."
              buildRow={buildOpenRow}
            />
            <ApplicationSection
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
          </div>
        </div>
      </div>
    </>
  );
}