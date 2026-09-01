"use client";

import type { MembershipType, UserRole, TEAM } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePopoverPlacement } from "@/hooks/use-popover-placement";
import { PROGRAM_BADGES, USER_ROLE_BADGES } from "@/lib/members/badges";
import {
  ASSIGNABLE_PROGRAMS,
  ASSIGNABLE_USER_ROLES,
  ASSIGNABLE_TEAMS,
  PROGRAM_LABELS,
  USER_ROLE_LABELS,
  TEAM_LABELS,
} from "@/lib/roles";

type Props = {
  memberId: string;
  memberName: string;
  role: UserRole;
  team?: TEAM | null;
  programs: MembershipType[];
};

const PANEL_HEIGHT = 480;
const SAVED_MS = 1400;

export function MemberRolesEditor({ memberId, memberName, role, team = null, programs }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [draftRole, setDraftRole] = useState<UserRole>(role);
  const [draftTeam, setDraftTeam] = useState<TEAM | null>(team);
  const [draftPrograms, setDraftPrograms] = useState<MembershipType[]>(programs);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { dropUp, maxHeight, measure } = usePopoverPlacement(triggerRef, PANEL_HEIGHT);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      measure();
      setDraftRole(role);
      setDraftTeam(team);
      setDraftPrograms(programs);
      setConfirmRemove(false);
      setSaved(false);
      setError(null);
    }
    setOpen(!open);
  };

  const toggleProgram = (program: MembershipType) => {
    setDraftPrograms((current) =>
      current.includes(program) ? current.filter((p) => p !== program) : [...current, program]
    );
  };

  const dirty =
    draftRole !== role ||
    draftTeam !== team ||
    draftPrograms.length !== programs.length ||
    draftPrograms.some((p) => !programs.includes(p));

  const save = async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/members/${memberId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: draftRole, team: draftTeam, programs: draftPrograms }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error?.message ?? "Couldn't save roles. Try again.");
        setBusy(false);
        return;
      }

      setBusy(false);
      setSaved(true);
      router.refresh();

      timeoutRef.current = setTimeout(() => setOpen(false), SAVED_MS);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error?.message ?? "Couldn't remove this member.");
        setBusy(false);
        setConfirmRemove(false);
        return;
      }

      setOpen(false);
      setBusy(false);
      router.push("/admin/members");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setBusy(false);
    }
  };

  const currentBadges = [
    ...(role !== "MEMBER" && USER_ROLE_BADGES[role] ? [USER_ROLE_BADGES[role]] : []),
    ...programs.map((p) => PROGRAM_BADGES[p]).filter(Boolean),
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={`Manage ${memberName}`}
        aria-expanded={open}
        className={`flex size-[28px] cursor-pointer items-center justify-center rounded-full leading-none transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft ${
          open ? "bg-brand-soft text-brand-dark" : "text-ink-faint hover:bg-row-soft hover:text-ink"
        }`}
      >
        ⋯
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={`Manage ${memberName}`}
          style={{ maxHeight }}
          className={`absolute right-0 z-50 flex w-[288px] flex-col overflow-y-auto overscroll-contain rounded-[14px] border border-border-soft bg-white shadow-[0_16px_36px_-14px_rgba(22,22,28,0.32)] ${
            dropUp ? "bottom-[32px]" : "top-[32px]"
          }`}
        >
          <div className="sticky top-0 z-10 shrink-0 border-b border-border-soft bg-row-soft px-[14px] py-[10px]">
            <p className="truncate style-body-text text-ink">{memberName}</p>
            <div className="mt-[5px] flex flex-wrap items-center gap-[4px]">
              {currentBadges.length > 0 ? (
                currentBadges.map((badge) => (
                  <span
                    key={badge.label}
                    className="rounded-full px-[7px] py-[2px] style-caption"
                    style={{
                      backgroundColor: badge.bg ?? "#fff",
                      color: badge.color ?? "#55555f",
                      border: badge.outline ? "1px solid #e7e2d4" : undefined,
                    }}
                  >
                    {badge.label}
                  </span>
                ))
              ) : (
                <span className="style-caption text-ink-faint">Member · no programs</span>
              )}
            </div>
          </div>

          {confirmRemove ? (
            <div className="flex flex-col gap-[10px] p-[14px]">
              <p className="style-body-text leading-[17px] text-ink">
                Remove <span className="font-bold">{memberName}</span> from the portal?
              </p>
              <p className="style-body-text leading-[16px] text-ink-faint">
                Deletes their profile, program memberships, RSVPs
                <span className="font-semibold text-danger-ink"> and their login</span>. This cannot be undone.
              </p>

              {error && (
                <p role="alert" className="rounded-[8px] bg-danger-ink/10 px-[10px] py-[7px] style-body-text leading-[16px] text-danger-ink">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-[8px]">
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={remove} disabled={busy}>
                  {busy ? "Removing…" : "Remove"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[14px] p-[14px]">
              {/* Role Section */}
              <div>
                <p className="font-techno uppercase tracking-[1.2px] text-ink-faint">Role</p>
                <div className="mt-[6px] flex flex-col gap-[3px]">
                  {ASSIGNABLE_USER_ROLES.map((option) => {
                    const selected = draftRole === option;
                    const badge = USER_ROLE_BADGES[option];
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDraftRole(option)}
                        aria-pressed={selected}
                        className={`flex cursor-pointer items-center justify-between rounded-[9px] border px-[11px] py-[7px] text-left style-body-text transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft ${
                          selected
                            ? "border-brand bg-brand-soft font-bold text-brand-dark"
                            : "border-transparent text-ink hover:bg-row-soft"
                        }`}
                      >
                        {USER_ROLE_LABELS[option]}
                        {badge && (
                          <span
                            aria-hidden
                            className="size-[9px] shrink-0 rounded-full"
                            style={{ backgroundColor: badge.outline ? "#d8d3c4" : badge.bg }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Section (Only shown if Officer or Director) */}
              {(draftRole === "OFFICER" || draftRole === "DIRECTOR") && (
                <div>
                  <p className="font-techno uppercase tracking-[1.2px] text-ink-faint">Team Assignment</p>
                  <select
                    value={draftTeam ?? ""}
                    onChange={(e) => setDraftTeam(e.target.value ? (e.target.value as TEAM) : null)}
                    className="mt-[6px] w-full rounded-[9px] border border-border-soft bg-white p-[8px] style-body-text text-ink"
                  >
                    <option value="">No Assigned Team</option>
                    {ASSIGNABLE_TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {TEAM_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Programs Section */}
              <div>
                <p className="font-techno uppercase tracking-[1.2px] text-ink-faint">Programs</p>
                <div className="mt-[6px] flex flex-wrap gap-[5px]">
                  {ASSIGNABLE_PROGRAMS.map((program) => {
                    const selected = draftPrograms.includes(program);
                    const badge = PROGRAM_BADGES[program];
                    return (
                      <button
                        key={program}
                        type="button"
                        onClick={() => toggleProgram(program)}
                        aria-pressed={selected}
                        className={`cursor-pointer rounded-full border px-[11px] py-[5px] style-body-text transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft ${
                          selected ? "border-transparent" : "border-border-soft bg-white text-ink-muted hover:bg-row-soft"
                        }`}
                        style={
                          selected
                            ? {
                                backgroundColor: badge?.bg ?? "#efece3",
                                color: badge?.color ?? "#16161c",
                              }
                            : undefined
                        }
                      >
                        {selected ? "✓ " : ""}
                        {PROGRAM_LABELS[program]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {saved && (
                <p role="status" className="rounded-[8px] bg-[#eaf4e8] px-[10px] py-[7px] style-body-text">
                  ✓ Saved successfully.
                </p>
              )}

              {error && (
                <p role="alert" className="rounded-[8px] bg-danger-ink/10 px-[10px] py-[7px] style-body-text leading-[16px] text-danger-ink">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-[8px]">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setConfirmRemove(true);
                  }}
                  className="cursor-pointer rounded-[6px] px-[2px] style-body-text text-danger-ink underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-danger-ink/25"
                >
                  Remove
                </button>

                <div className="flex gap-[8px]">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={save} disabled={busy || saved || !dirty}>
                    {busy ? "Saving…" : saved ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}