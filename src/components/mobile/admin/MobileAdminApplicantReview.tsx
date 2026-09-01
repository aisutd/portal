"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { MobileScreen } from "@/components/mobile/ui/MobileScreen";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { ApplicationStatus } from "@prisma/client";

type Status = ApplicationStatus;

type Submission = {
  id: string;
  userId: string;
  status: Status;
  submittedAt: string;
  formPayloadJson: Record<string, unknown>;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      utdNetId: string | null;
      linkedinUrl: string | null;
      githubUrl: string | null;
      portfolioUrl: string | null;
      resumeFile: { id: string; fileName: string } | null;
    } | null;
  };
  reviews: Array<{ notesInternal: string | null }>;
};

type Detail = {
  id: string;
  title: string;
  submissions: Submission[];
  questions?: Array<{ id: string; label: string; type: string }>;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function MobileAdminApplicantReview({ applicationId }: { applicationId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [rawQuery, setRawQuery] = useState("");
  const debouncedQuery = useDebounce(rawQuery, 300);
  const [filter, setFilter] = useState<"all" | "new" | "shortlisted" | "reviewed">("all");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (!applicationId) return;
      const res = await fetch(`/api/admin/applications/${applicationId}`);
      if (!res.ok) return;
      const data = await res.json();
      setDetail(data.application);
      if (data.application.submissions?.length > 0) {
        setSelectedSubmissionId(data.application.submissions[0].id);
      }
    }
    void loadDetail();
  }, [applicationId]);

  const submissions = useMemo(() => {
    return (detail?.submissions ?? []).filter((sub) => {
      const name = `${sub.user.profile?.firstName ?? ""} ${
        sub.user.profile?.lastName ?? ""
      } ${sub.user.profile?.utdNetId ?? ""} ${sub.user.email}`.toLowerCase();
      
      if (debouncedQuery && !name.includes(debouncedQuery.toLowerCase())) return false;
      if (filter === "new") return sub.status === "SUBMITTED";
      if (filter === "shortlisted") return sub.status === "IN_CONSIDERATION";
      if (filter === "reviewed") return sub.reviews.length > 0;
      return true;
    });
  }, [detail, filter, debouncedQuery]);

  const selectedSubmission =
    detail?.submissions.find((s) => s.id === selectedSubmissionId) ?? null;

  useEffect(() => {
    setNotes(selectedSubmission?.reviews[0]?.notesInternal ?? "");
  }, [selectedSubmission]);

  async function updateSubmission(statusToApply?: Status) {
    if (!detail || !selectedSubmission) return;
    setSaving(true);
    try {
      await fetch(
        `/api/admin/applications/${detail.id}/submissions/${selectedSubmission.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, ...(statusToApply ? { status: statusToApply } : {}) }),
        }
      );
      // Reload application details to reflect status updates
      const res = await fetch(`/api/admin/applications/${detail.id}`);
      if (res.ok) setDetail((await res.json()).application);
    } finally {
      setSaving(false);
    }
  }

  const orderedResponses = useMemo(() => {
    if (!selectedSubmission) return [];
    const payload = (selectedSubmission.formPayloadJson ?? {}) as Record<string, unknown>;

    if (detail?.questions && detail.questions.length > 0) {
      return detail.questions.map((q) => ({
        label: q.label,
        value: String(payload[q.id] ?? payload[q.label] ?? "No response"),
      }));
    }
    return Object.entries(payload).map(([key, val]) => ({
      label: key,
      value: String(val ?? "No response"),
    }));
  }, [selectedSubmission, detail]);

  return (
    <MobileScreen withBottomNavPadding={false}>
      <MobileAdminNav active="Applications" />

      {/* Header Info */}
      <div className="flex flex-col gap-[4px]">
        <h2 className="style-mobile-title text-ink">
          {detail?.title ?? "Loading Application..."}
        </h2>
        <p className="style-caption text-ink-faint">
          Showing {submissions.length} of {detail?.submissions.length ?? 0} applicants
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-[10px]">
        <input
          type="text"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          placeholder="search name / netid…"
          className="h-[40px] w-full rounded-[8px] bg-search-field px-[12px] style-caption text-search-ink placeholder:text-search-ink focus:outline-none"
        />
        <div className="-mx-[20px] flex items-center gap-[8px] overflow-x-auto px-[20px]">
          {(["all", "new", "shortlisted", "reviewed"] as const).map((f) => (
            <span key={f} className="shrink-0" onClick={() => setFilter(f)}>
              <Tag
                label={f}
                bg={filter === f ? "#e1e8ff" : "#efece3"}
                color={filter === f ? "#1f3aa3" : "#6a685f"}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Applicant List Selector */}
      <div className="-mx-[20px] flex gap-[8px] overflow-x-auto px-[20px]">
        {submissions.map((sub) => {
          const isSelected = sub.id === selectedSubmissionId;
          const name = sub.user.profile
            ? `${sub.user.profile.firstName} ${sub.user.profile.lastName}`
            : sub.user.email;
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubmissionId(sub.id)}
              className={`shrink-0 rounded-[10px] border px-3 py-2 text-left ${
                isSelected ? "border-brand bg-brand-soft" : "border-border-soft bg-white"
              }`}
            >
              <p className="style-caption font-bold text-ink">{name}</p>
              <p className="text-[10px] text-ink-faint">{sub.status}</p>
            </button>
          );
        })}
      </div>

      {/* Applicant Details & Review Panel */}
      {selectedSubmission ? (
        <div className="flex flex-col gap-[16px] rounded-[16px] border border-border-soft bg-white p-[18px]">
          <div className="flex items-center gap-[12px]">
            <span className="size-[44px] shrink-0 rounded-full border border-border-soft bg-photo" />
            <div className="min-w-0 flex-1">
              <h3 className="style-mobile-title text-ink">
                {selectedSubmission.user.profile
                  ? `${selectedSubmission.user.profile.firstName} ${selectedSubmission.user.profile.lastName}`
                  : selectedSubmission.user.email}
              </h3>
              <p className="style-caption leading-[15px] text-ink-faint">
                {selectedSubmission.user.profile?.utdNetId ?? "No NetID"} · {selectedSubmission.user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-[8px]">
            <Badge label={selectedSubmission.status} variant="outline" />
          </div>

          {/* Social / Resume External Links */}
          <div className="flex flex-wrap gap-[8px]">
            {selectedSubmission.user.profile?.resumeFile && (
              <a href={`/api/admin/applications/${detail?.id}/submissions/${selectedSubmission.id}/resume`}>
                <Button variant="soft" size="sm">Resume ↗</Button>
              </a>
            )}
            {selectedSubmission.user.profile?.linkedinUrl && (
              <a href={selectedSubmission.user.profile.linkedinUrl} target="_blank" rel="noreferrer">
                <Button variant="soft" size="sm">LinkedIn ↗</Button>
              </a>
            )}
            {selectedSubmission.user.profile?.githubUrl && (
              <a href={selectedSubmission.user.profile.githubUrl} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">GitHub ↗</Button>
              </a>
            )}
          </div>

          <div className="h-px w-full bg-border-soft" />

          {/* Dynamic Question Responses */}
          <div className="flex flex-col gap-[12px]">
            {orderedResponses.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-[4px]">
                <h4 className="style-caption font-semibold text-ink-muted">{item.label}</h4>
                <p className="style-mobile-body text-ink whitespace-pre-wrap">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-border-soft" />

          {/* Evaluator Notes Form */}
          <div className="flex flex-col gap-[8px]">
            <h4 className="style-mobile-title text-ink">Evaluator Notes</h4>
            <textarea
              className="w-full rounded-[8px] border border-border-soft bg-search-field p-[10px] style-caption text-ink"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal evaluation notes..."
            />
          </div>

          {/* Decision Buttons */}
          <div className="flex flex-wrap gap-[8px]">
            <Button
              variant="danger"
              size="sm"
              disabled={saving}
              onClick={() => void updateSubmission("REJECTED")}
            >
              ✕ Reject
            </Button>
            <Button
              variant="accent"
              size="sm"
              disabled={saving}
              onClick={() => void updateSubmission("IN_CONSIDERATION")}
            >
              ★ Shortlist
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              disabled={saving}
              onClick={() => void updateSubmission("ACCEPTED")}
            >
              ✓ Accept
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center style-caption text-ink-faint">
          No applicant selected.
        </div>
      )}
    </MobileScreen>
  );
}