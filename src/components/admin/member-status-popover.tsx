"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type {
  MemberBadge,
  MemberStatusDetail,
} from "@/components/admin/members-table";
import type { StatusKey } from "@/lib/members/badges";
import { PROGRAM_LABELS } from "@/lib/roles";
import { usePopoverPlacement } from "@/hooks/use-popover-placement";

type Props = {
  memberName: string;
  badge: MemberBadge;
  detail: MemberStatusDetail;
};

/** Height the panel would like, used to pick a side and a cap. */
const PANEL_HEIGHT = 300;

/** The panel takes its colour from the status it is explaining. */
const THEME: Record<StatusKey, { head: string; text: string; bar: string; track: string }> = {
  active: { head: "#eaf4e8", text: "#356b2e", bar: "#4c9440", track: "#dcebd9" },
  atRisk: { head: "#fdf0e3", text: "#7a4416", bar: "#d98b3f", track: "#f6e3cf" },
  inactive: { head: "#f1efe8", text: "#6a685f", bar: "#a8a49a", track: "#e6e3da" },
};

export function MemberStatusPopover({ memberName, badge, detail }: Props) {
  // Hover previews the panel; a click pins it open until dismissed.
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { dropUp, maxHeight, measure } = usePopoverPlacement(triggerRef, PANEL_HEIGHT);

  const open = hovered || pinned;
  const { attended, countable, needed, programs, events, statusKey } = detail;
  const theme = THEME[statusKey];
  const percent = countable === 0 ? 0 : Math.round((attended / countable) * 100);

  useEffect(() => {
    if (!pinned) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setPinned(false);
        setHovered(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPinned(false);
        setHovered(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pinned]);

  const summary =
    countable === 0
      ? "No events have finished yet this semester."
      : attended === 0
        ? `Missed all ${countable} counted event${countable === 1 ? "" : "s"}.`
        : `${percent}% attended — ${percent < 50 ? "below" : "at or above"} the 50% mark.`;

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => {
        measure();
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          measure();
          setPinned(!pinned);
        }}
        onFocus={() => {
          measure();
          setHovered(true);
        }}
        onBlur={() => setHovered(false)}
        aria-expanded={open}
        aria-label={`Why ${memberName} is ${badge.label}`}
        className="cursor-pointer rounded-full transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft"
      >
        {badge.outline ? (
          <Badge label={badge.label} variant="outline" />
        ) : (
          <Badge label={badge.label} bg={badge.bg} color={badge.color} />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Status detail for ${memberName}`}
          style={{ maxHeight }}
          className={`absolute left-[-6px] z-50 flex w-[264px] flex-col overflow-y-auto overscroll-contain rounded-[14px] border border-border-soft bg-white shadow-[0_16px_36px_-14px_rgba(22,22,28,0.32)] ${
            dropUp ? "bottom-[32px]" : "top-[32px]"
          }`}
        >
          {/* Header carries the status colour and the headline number. */}
          <div
            className="sticky top-0 z-10 flex shrink-0 items-center justify-between px-[13px] py-[9px]"
            style={{ backgroundColor: theme.head }}
          >
            <div>
              <p
                className="font-techno  uppercase tracking-[1.2px]"
                style={{ color: theme.text }}
              >
                {badge.label}
              </p>
              <p className="font-display  font-bold leading-[22px] text-ink">
                {attended}
                <span className="text-ink-faint">/{countable}</span>
              </p>
            </div>
            <p className="font-mono " style={{ color: theme.text }}>
              {countable === 0 ? "—" : `${percent}% of 50%`}
            </p>
          </div>

          <div
            className="h-[5px] w-full shrink-0"
            style={{ backgroundColor: theme.track }}
          >
            <div
              className="h-full"
              style={{ width: `${percent}%`, backgroundColor: theme.bar }}
            />
          </div>

          <div className="flex flex-col gap-[9px] p-[13px]">
            <p className="font-body  leading-[16px] text-ink-muted">{summary}</p>

            {needed > 0 && (
              <p className="rounded-[8px] bg-brand-soft px-[10px] py-[6px] font-body  font-semibold text-brand-dark">
                Attend the next {needed} to reach Active.
              </p>
            )}

            {events.length > 0 && (
              <div>
                <p className="font-techno  uppercase tracking-[1.2px] text-ink-faint">
                  {programs.length > 0
                    ? `${programs.map((p) => PROGRAM_LABELS[p]).join(" + ")} + general`
                    : "General events"}
                </p>

                <ul className="mt-[5px] flex max-h-[118px] flex-col overflow-y-auto">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center gap-[7px] border-b border-border-soft/50 py-[5px] last:border-b-0"
                    >
                      <span
                        aria-hidden
                        className="flex size-[14px] shrink-0 items-center justify-center rounded-full  font-bold text-white"
                        style={{
                          backgroundColor: event.attended ? THEME.active.bar : "#d8d3c4",
                        }}
                      >
                        {event.attended ? "✓" : "✕"}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate font-body  ${
                          event.attended ? "text-ink" : "text-ink-muted"
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </span>
                      {!event.general && (
                        <span className="shrink-0 rounded-full bg-purple-soft px-[6px] py-[1px] font-mono  text-purple-ink">
                          program
                        </span>
                      )}
                      <span className="shrink-0 font-mono  text-ink-faint">
                        {event.date}
                      </span>
                      <span className="sr-only">
                        {event.attended ? "attended" : "missed"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
