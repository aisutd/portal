"use client";

import { useEffect, useState, Fragment } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
    <div className="flex flex-col gap-[10px] rounded-[14px] border border-border-soft bg-white p-[16px] shadow-xs">
      <div className="h-[16px] w-[70%] animate-pulse rounded-full bg-[#efece3]" />
      <div className="h-[12px] w-[90%] animate-pulse rounded-full bg-[#f4f1ea]" />
      <div className="flex gap-[8px]">
        <div className="h-[34px] flex-1 animate-pulse rounded-[8px] bg-[#f4f1ea]" />
        <div className="h-[34px] flex-1 animate-pulse rounded-[8px] bg-[#f4f1ea]" />
      </div>
    </div>
  );
}

function ProgramFlowArrow() {
  return (
    <div className="flex justify-center text-brand py-1" aria-hidden="true">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-[#fbfaf7] text-sm font-medium shadow-xs">
        ↓
      </span>
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
  collapsible = false,
  initialLimit = 2,
}: {
  title: string;
  items: Application[];
  loading: boolean;
  emptyMessage: string;
  action?: React.ReactNode;
  buildRow: (application: Application) => ReturnType<typeof buildOpenRow>;
  collapsible?: boolean;
  initialLimit?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldCollapse = collapsible && items.length > initialLimit;
  const displayedItems = shouldCollapse && !isExpanded ? items.slice(0, initialLimit) : items;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-[12px]"
    >
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
            <div className="mt-1 flex justify-center">
              <Button
                variant="soft"
                size="sm"
                pill
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
                className="gap-1 font-bold text-xs shadow-2xs transition-all duration-200 hover:shadow-xs"
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
        <div className="rounded-[14px] border border-border-soft bg-white p-[16px] font-mobile-body text-[13px] text-ink-muted">
          {emptyMessage}
        </div>
      )}
    </motion.div>
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

  const hasActiveApplications = openApplications.length > 0 || upcomingApplications.length > 0;

  const renderOpenSection = () => (
    <MobileApplicationSection
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
    <MobileApplicationSection
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
    <MobileApplicationSection
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
    <MobileApplicationSection
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
    <MobileScreen>
      <div className="flex flex-col gap-[6px]">
        <h1 className="style-page-title leading-tight tracking-tight text-ink">
          Choose Your <span className="bg-[linear-gradient(90deg,#f2a968_0%,#7d64c4_100%)] bg-clip-text text-transparent pr-3">AIS Path</span>
        </h1>
        <p className="style-page-subtitle text-ink-muted">
          Welcome to the enrollment hub. Whether you&apos;re here to learn,
          lead, or build, there&apos;s a place waiting for you.
        </p>
      </div>

      {/* Program Flow */}
<div className="flex flex-col">
  {programs.map((program, index) => (
    <Fragment key={program.title}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          ease: "easeOut",
        }}
        className="flex flex-row rounded-[16px] border bg-white overflow-hidden"
        style={{ borderColor: program.borderColor }}
      >
        {/* Left Side: Full-height Icon / Image Container */}
        <div
          className="relative flex w-[80px] sm:w-[100px] shrink-0 items-center justify-center p-3 border-r border-border-soft/60"
          style={{
            backgroundColor: program.image
              ? `color-mix(in srgb, ${program.iconBg} 20%, transparent)`
              : program.iconBg,
          }}
        >
          {program.image ? (
            <Image
              src={program.image}
              alt={`${program.title} Logo`}
              width={64}
              height={64}
              className="max-h-full max-w-full object-contain mix-blend-multiply"
            />
          ) : (
            <span
              className="text-[24px]"
              style={{ color: program.iconColor }}
            >
              {program.icon}
            </span>
          )}
        </div>

        {/* Right Side: Content */}
        <div className="flex flex-1 flex-col gap-[10px] p-[18px]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mobile-display text-[17px] font-bold text-ink">
              {program.title}
            </h3>
            {program.badge && (
              <Badge label={program.badge} bg="#fbe3cb" color="#7a4416" />
            )}
          </div>

          <p className="font-mobile-body text-[13px] text-ink-muted line-clamp-3">
            {program.description}
          </p>

          <div className="flex flex-wrap gap-[6px] mt-auto pt-1">
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
        </div>
      </motion.div>

      {index < programs.length - 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.05 }}
        >
          <ProgramFlowArrow />
        </motion.div>
      )}
    </Fragment>
  ))}
</div>

      {/* Slogan banner */}
      <div>
        <Marquee text="JOIN THE MOVEMENT · BUILD THE FUTURE · AIS UTD" />
      </div>

      {/* Dynamic Section Rendering */}
      <div className="flex flex-col gap-6">
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

      <BottomNav />
    </MobileScreen>
  );
}