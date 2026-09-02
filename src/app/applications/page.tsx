"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
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
} from "@/lib/applications-utils"; // Adjust import path to your applications utility file

type ApplicationResponse = {
  applications: Application[];
};

function ApplicationSkeleton() {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-2xl border border-border-soft bg-white/80 p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1 animate-pulse space-y-2.5">
        <div className="h-5 w-64 rounded-full bg-stone-soft" />
        <div className="h-3.5 w-full max-w-lg rounded-full bg-[#f4f1ea]" />
        <div className="h-3 w-48 rounded-full bg-[#f4f1ea]" />
      </div>
      <div className="flex shrink-0 gap-2.5">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-[#f4f1ea]" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-[#f4f1ea]" />
      </div>
    </div>
  );
}

function ApplicationEmptyState({ message }: { message: string }) {
  return (
    <div className="style-body-text rounded-2xl border border-border-soft/80 bg-white/60 px-6 py-6 leading-relaxed text-ink-muted transition-colors">
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
  collapsible = false,
  initialLimit = 2,
}: {
  title: string;
  items: Application[];
  loading: boolean;
  emptyMessage: string;
  action?: ReactNode;
  buildRow: (application: Application) => OpenApp;
  collapsible?: boolean;
  initialLimit?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldCollapse = collapsible && items.length > initialLimit;
  const displayedItems =
    shouldCollapse && !isExpanded ? items.slice(0, initialLimit) : items;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-8 flex flex-col gap-4 px-8 lg:px-12"
    >
      <SectionHeader title={title} action={action} />
      {loading ? (
        <div className="flex flex-col gap-3.5">
          <ApplicationSkeleton />
          <ApplicationSkeleton />
        </div>
      ) : items.length > 0 ? (
        <div className="relative flex flex-col gap-3.5">
          {displayedItems.map((application, idx) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: idx * 0.06,
                ease: "easeOut",
              }}
            >
              <OpenAppRow {...buildRow(application)} />
            </motion.div>
          ))}

          {shouldCollapse && (
            <div className="mt-2 flex justify-center">
              <Button
                variant="soft"
                size="sm"
                pill
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
                className="gap-1.5 shadow-2xs transition-all duration-200 hover:shadow-xs"
              >
                {isExpanded ? (
                  <>Show less ↑</>
                ) : (
                  <>View more ({items.length - initialLimit} more) ↓</>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ApplicationEmptyState message={emptyMessage} />
      )}
    </motion.section>
  );
}

function ProgramFlowArrow() {
  return (
    <div
      className="flex shrink-0 items-center justify-center text-brand"
      aria-hidden="true"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-lg font-medium shadow-xs transition-transform hover:scale-105 lg:hidden">
        ↓
      </span>
      <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-xl font-medium shadow-xs transition-transform hover:scale-105 lg:flex">
        →
      </span>
    </div>
  );
}

export default function ApplyPage() {
  const [applications, setApplications] = useState<Application[]>([]);
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

  const hasActiveApplications =
    openApplications.length > 0 || upcomingApplications.length > 0;

  const renderOpenSection = () => (
    <ApplicationSection
      key="open"
      title="Open Applications"
      items={openApplications}
      loading={loading}
      emptyMessage="There are no open applications right now."
      buildRow={buildOpenRow}
      collapsible={true}
      initialLimit={2}
    />
  );

  const renderUpcomingSection = () => (
    <ApplicationSection
      key="upcoming"
      title="Upcoming Applications"
      items={upcomingApplications}
      loading={loading}
      emptyMessage="There are no upcoming applications."
      buildRow={buildOpenRow}
      collapsible={true}
      initialLimit={2}
    />
  );

  const renderSubmittedSection = () => (
    <ApplicationSection
      key="submitted"
      title="Submitted Applications"
      items={submittedApplications}
      loading={loading}
      emptyMessage="You have not submitted any applications yet."
      action={
        <Button href="/applications/history" variant="ghost" size="sm">
          View All
        </Button>
      }
      buildRow={buildSubmittedRow}
      collapsible={true}
      initialLimit={2}
    />
  );

  const renderClosedSection = () => (
    <ApplicationSection
      key="closed"
      title="Closed Applications"
      items={closedApplications}
      loading={loading}
      emptyMessage="There are no closed applications to show."
      buildRow={buildOpenRow}
      collapsible={true}
      initialLimit={2}
    />
  );

  return (
    <>
      {/* --- MOBILE LAYOUT --- */}
      <div className="md:hidden">
        <MobileApply />
      </div>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:block">
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-cream antialiased">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-[15%] -z-10 h-[420px] w-[420px] rounded-full bg-orange-300/25 blur-[110px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-[20%] right-[10%] -z-10 h-[380px] w-[380px] rounded-full bg-purple-400/20 blur-[110px]"
          />

          <Navbar active="Apply" />

          <main className="relative w-full pb-16 pt-8">
            {/* Header Hero Section */}
            <section className="px-8 pt-4 lg:px-12">
              <h1 className="font-display style-page-title font-bold leading-[1.05] tracking-[-0.02em] text-ink lg:text-5xl [font-variation-settings:'wdth'_100]">
                Choose Your{" "}
                <span className="bg-[linear-gradient(90deg,#f2a968_0%,#7d64c4_100%)] bg-clip-text pr-3 text-transparent">
                  AIS Path
                </span>
              </h1>
              <p className="style-page-subtitle lg: mt-3 max-w-4xl font-normal leading-relaxed text-ink/80">
                Welcome to the enrollment hub. Whether you&apos;re here to learn,
                lead, or build, there&apos;s a place waiting for you.
              </p>
            </section>

            {/* Program Workflow */}
            <section className="mt-10 px-8 lg:px-12">
              <div className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-stretch">
                {programs.map((program, index) => (
                  <Fragment key={program.title}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.15,
                        ease: "easeOut",
                      }}
                      className="flex h-full flex-1 flex-col"
                    >
                      <ProgramCard {...program} showActionButton={false} />
                    </motion.div>
                    {index < programs.length - 1 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.15 + 0.1,
                        }}
                        className="self-center"
                      >
                        <ProgramFlowArrow />
                      </motion.div>
                    ) : null}
                  </Fragment>
                ))}
              </div>
            </section>

            {/* Marquee Divider */}
            <div className="mt-10 overflow-visible">
              <Marquee text="JOIN THE MOVEMENT · AIS UTD · BUILD THE FUTURE" />
            </div>

            {/* Application List Sections */}
            <div className="space-y-4">
              {loading ? (
                <>
                  {renderOpenSection()}
                  {renderUpcomingSection()}
                  {renderSubmittedSection()}
                  {renderClosedSection()}
                </>
              ) : hasActiveApplications ? (
                <>
                  {renderOpenSection()}
                  {renderUpcomingSection()}
                  {renderSubmittedSection()}
                  {renderClosedSection()}
                </>
              ) : (
                <>
                  {renderSubmittedSection()}
                  {renderOpenSection()}
                  {renderUpcomingSection()}
                  {renderClosedSection()}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}