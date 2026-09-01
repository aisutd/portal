"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatChicagoDateTimeInput } from "@/lib/utils";
import Link from "next/link";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";

type Status = ApplicationStatus;

type Question = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
};

type Summary = {
  id: string;
  title: string;
  description: string;
  programType: string;
  openAt: string;
  closeAt: string;
  decisionDate: string | null;
  visibleToUsers: boolean;
  submissionCount: number;
  acceptedCount: number;
  inReviewCount: number;
};

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
      resumeFile: { id: string; fileName: string; storageKey: string } | null;
    } | null;
  };
  reviews: Array<{
    notesInternal: string | null;
    reviewer: {
      email: string;
      profile: { firstName: string; lastName: string } | null;
    };
  }>;
};

type Detail = Summary & {
  questions?: Question[];
  submissions: Submission[];
};

// Zod Validation for Date Logic
const appDatesSchema = z
  .object({
    openAt: z.string().optional(),
    closeAt: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.openAt && data.closeAt) {
        return new Date(data.closeAt) > new Date(data.openAt);
      }
      return true;
    },
    {
      message: "Close date/time must occur after Open date/time.",
      path: ["closeAt"],
    }
  );

// Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const statusLabel = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const statusBadgeColor = (status: Status) => {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "REJECTED":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "IN_CONSIDERATION":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "IN_REVIEW":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "WAITLISTED":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-stone-100 text-stone-700 border-stone-200";
  }
};

const localValue = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "TBD";

function parseChicagoInputToUTC(dateTimeString: string): string | null {
  if (!dateTimeString) return null;
  const [datePart, timePart] = dateTimeString.split("T");
  if (!datePart || !timePart) return new Date(dateTimeString).toISOString();

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const targetDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(targetDate);
  const timeZonePart = parts.find((p) => p.type === "timeZoneName")?.value || "";
  const match = timeZonePart.match(/GMT([+-]\d+)/);
  const offsetHours = match ? parseInt(match[1], 10) : -5;

  targetDate.setUTCHours(targetDate.getUTCHours() - offsetHours);
  return targetDate.toISOString();
}

export function AdminApplicationsManager({
  initialApplicationId,
  userRole = "OFFICER",
  embedded = false,
}: {
  initialApplicationId?: string;
  userRole?: string;
  embedded?: boolean;
}) {
  const [applications, setApplications] = useState<Summary[]>([]);
  const [selectedId, setSelectedId] = useState(initialApplicationId ?? "");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");

  const [rawQuery, setRawQuery] = useState("");
  const debouncedQuery = useDebounce(rawQuery, 300);
  const [filter, setFilter] = useState<"all" | "new" | "shortlisted" | "reviewed">("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isEditingApp, setIsEditingApp] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Summary>>({});
  const [editOpenAt, setEditOpenAt] = useState("");
  const [editCloseAt, setEditCloseAt] = useState("");

  const [notes, setNotes] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pendingVisibilityState, setPendingVisibilityState] = useState<boolean>(false);

  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);

  const router = useRouter();

  const canEditOrPublish = userRole === "DIRECTOR" || userRole === "EXECUTIVE";
  const canChangeStatus = userRole === "DIRECTOR" || userRole === "EXECUTIVE";
  const canDelete = userRole === "EXECUTIVE";

  async function loadApplications() {
    setLoading(true);
    const response = await fetch("/api/admin/applications");
    if (!response.ok) throw new Error("Unable to load applications.");
    const payload = (await response.json()) as { applications: Summary[] };
    setApplications(payload.applications);
    setSelectedId((current) => current || payload.applications[0]?.id || "");
    setLoading(false);
  }

  async function loadDetail(applicationId: string) {
    if (!applicationId) {
      setDetail(null);
      return;
    }
    const response = await fetch(`/api/admin/applications/${applicationId}`);
    if (!response.ok) throw new Error("Unable to load application details.");
    const payload = (await response.json()) as { application: Detail };
    setDetail(payload.application);
    setEditForm(payload.application);
    setEditOpenAt(formatChicagoDateTimeInput(payload.application.openAt));
    setEditCloseAt(formatChicagoDateTimeInput(payload.application.closeAt));
    setSelectedSubmissionId((current) =>
      payload.application.submissions.some((item) => item.id === current)
        ? current
        : payload.application.submissions[0]?.id || ""
    );
  }

  useEffect(() => {
    void loadApplications().catch((caught) => {
      setError((caught as Error).message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setIsEditingApp(false);
    void loadDetail(selectedId).catch((caught) => setError((caught as Error).message));
  }, [selectedId]);

  const submissions = useMemo(
    () =>
      (detail?.submissions ?? []).filter((submission) => {
        const name = `${submission.user.profile?.firstName ?? ""} ${
          submission.user.profile?.lastName ?? ""
        } ${submission.user.profile?.utdNetId ?? ""} ${submission.user.email}`.toLowerCase();
        if (debouncedQuery && !name.includes(debouncedQuery.toLowerCase())) return false;
        if (filter === "new") return submission.status === "SUBMITTED";
        if (filter === "shortlisted") return submission.status === "IN_CONSIDERATION";
        if (filter === "reviewed") return submission.reviews.length > 0;
        return true;
      }),
    [detail, filter, debouncedQuery]
  );

  const selectedSubmission =
    detail?.submissions.find((submission) => submission.id === selectedSubmissionId) ?? null;

  useEffect(() => {
    const review = selectedSubmission?.reviews[0];
    setNotes(review?.notesInternal ?? "");
  }, [selectedSubmissionId, selectedSubmission]);

  async function updateSubmission(statusToApply?: Status) {
    if (!detail || !selectedSubmission) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/applications/${detail.id}/submissions/${selectedSubmission.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, ...(statusToApply ? { status: statusToApply } : {}) }),
        }
      );
      if (!response.ok) throw new Error("Unable to save this review.");

      setPendingStatus(null);
      await Promise.all([loadDetail(detail.id), loadApplications()]);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateApplication() {
    if (!detail) return;
    setSaving(true);
    setError(null);

    const validation = appDatesSchema.safeParse({ openAt: editOpenAt, closeAt: editCloseAt });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setSaving(false);
      setShowSaveModal(false);
      return;
    }

    try {
      const payload = {
        ...editForm,
        openAt: editOpenAt ? parseChicagoInputToUTC(editOpenAt) : null,
        closeAt: editCloseAt ? parseChicagoInputToUTC(editCloseAt) : null,
      };

      const response = await fetch(`/api/admin/applications/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.message || "Failed to update application details.");
      }

      await Promise.all([loadDetail(detail.id), loadApplications()]);
      setIsEditingApp(false);
      setShowSaveModal(false);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(targetState: boolean) {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/applications/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleToUsers: targetState }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.message || "Failed to change publish status.");
      }

      await Promise.all([loadDetail(detail.id), loadApplications()]);
      setShowPublishModal(false);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteApplication() {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/applications/${detail.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.message || "Failed to delete application posting.");
      }

      setShowDeleteModal(false);
      setSelectedId("");
      await loadApplications();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function selectNextApplicant() {
    if (!submissions.length) return;
    const index = submissions.findIndex((submission) => submission.id === selectedSubmissionId);
    setSelectedSubmissionId(
      submissions[(index + 1 + submissions.length) % submissions.length].id
    );
  }

  const orderedResponses = useMemo(() => {
    if (!selectedSubmission) return [];
    const payload = (selectedSubmission.formPayloadJson ?? {}) as Record<string, unknown>;

    const processAnswer = (val: unknown, type?: string) => {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const obj = val as Record<string, any>;
        if (obj.fileName && (obj.url || obj.key)) {
          return {
            isFile: true,
            fileName: obj.fileName,
            url: obj.url || obj.key,
            raw: JSON.stringify(val),
          };
        }
      }

      const rawString = String(val ?? "No response provided");

      try {
        const parsed = JSON.parse(rawString);
        if (parsed && typeof parsed === "object") {
          if (parsed.fileName && (parsed.url || parsed.key)) {
            return {
              isFile: true,
              fileName: parsed.fileName,
              url: parsed.url || parsed.key,
              raw: rawString,
            };
          }
        }
      } catch (err) {}

      if (rawString.startsWith("http://") || rawString.startsWith("https://")) {
        const rawName = rawString.split("/").pop() || "Uploaded File";
        const cleanName = decodeURIComponent(rawName.replace(/^\d+_\s*/, ""));
        return {
          isFile: true,
          fileName: cleanName,
          url: rawString,
          raw: rawString,
        };
      }

      return { isFile: type === "FILE", raw: rawString, fileName: "Uploaded File", url: rawString };
    };

    if (detail?.questions && detail.questions.length > 0) {
      return detail.questions.map((q, idx) => ({
        index: idx + 1,
        question: q.label,
        type: q.type,
        answer: processAnswer(payload[q.id] ?? payload[q.label], q.type),
      }));
    }

    return Object.entries(payload).map(([key, val], idx) => ({
      index: idx + 1,
      question: key,
      type: "TEXT",
      answer: processAnswer(val),
    }));
  }, [selectedSubmission, detail]);

  return (
    <div className={embedded ? "min-w-0 flex-1 p-6 lg:p-10" : "min-h-screen bg-cream p-5 md:p-10"}>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
          <div>
            <h1 className="style-section-header text-ink text-2xl font-bold">Applications Portal</h1>
            <p className="style-caption text-ink-faint">
              Manage postings, inspect dynamic questions, publish cycles, and evaluate candidate submissions.
            </p>
          </div>
          {canEditOrPublish ? (
            <Button onClick={() => router.push("/admin/applications/new")}>
              + Create Application
            </Button>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-danger-border bg-white p-4 text-danger-ink">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="flex flex-col gap-3">
            <h2 className="style-body-text font-semibold text-ink">All Cohorts & Listings</h2>
            {loading ? (
              <p className="text-ink-muted">Loading postings…</p>
            ) : applications.length ? (
              applications.map((app) => (
                <button
                  type="button"
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedId === app.id
                      ? "border-brand bg-brand-soft shadow-sm"
                      : "border-border-soft bg-white hover:border-brand/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="style-body-text font-medium text-ink">{app.title}</p>
                    <span
                      className={`inline-block size-2 rounded-full ${
                        app.visibleToUsers ? "bg-emerald-500" : "bg-stone-300"
                      }`}
                      title={app.visibleToUsers ? "Visible to users" : "Draft / Hidden"}
                    />
                  </div>
                  <p className="style-caption mt-1 text-ink-faint">
                    {app.submissionCount} submissions · Closes {localValue(app.closeAt)}
                  </p>
                </button>
              ))
            ) : (
              <p className="rounded-xl border border-border-soft bg-white p-4 text-ink-muted">
                No active applications found.
              </p>
            )}
          </aside>

          <section className="min-w-0 rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
            {detail ? (
              <>
                <div className="border-b border-border-soft pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="style-section-header text-xl font-bold text-ink">
                          {detail.title}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            detail.visibleToUsers
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {detail.visibleToUsers ? "Live & Published" : "Hidden from Applicants"}
                        </span>
                      </div>
                      <p className="style-caption mt-1 text-ink-faint">
                        {detail.submissions.length} total submissions · {detail.acceptedCount ?? 0}{" "}
                        accepted
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canEditOrPublish ? (
                        <Button
                          size="sm"
                          variant={detail.visibleToUsers ? "outline" : "primary"}
                          onClick={() => {
                            setPendingVisibilityState(!detail.visibleToUsers);
                            setShowPublishModal(true);
                          }}
                        >
                          {detail.visibleToUsers ? "Unpublish" : "Publish Live"}
                        </Button>
                      ) : null}

                      {canEditOrPublish ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingApp((prev) => !prev)}
                        >
                          {isEditingApp ? "Close Settings" : "Edit Settings"}
                        </Button>
                      ) : null}

                      {canDelete ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {isEditingApp && canEditOrPublish ? (
                    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-border-soft bg-row-soft p-5">
                      <div className="flex items-center justify-between border-b border-border-soft pb-3">
                        <h3 className="style-body-text font-semibold text-ink">
                          Application Configuration & Questions
                        </h3>
                        <span className="style-caption text-ink-faint">Timezone: America/Chicago</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="style-caption font-medium text-ink-muted">Posting Title</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-sm"
                            value={editForm.title ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, title: e.target.value }))
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="style-caption font-medium text-ink-muted">Program Category</label>
                          <select
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-sm"
                            value={editForm.programType ?? "AI_ACADEMY"}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, programType: e.target.value }))
                            }
                          >
                            <option value="AI_ACADEMY">AI Academy</option>
                            <option value="AI_INNOVATION">AI Innovation</option>
                            <option value="AI_MENTORSHIP_MENTOR">AIM Mentor</option>
                            <option value="AI_MENTORSHIP_MENTEE">AIM Mentee</option>
                            <option value="OFFICER">Officer</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="style-caption font-medium text-ink-muted">Cohort Description</label>
                          <textarea
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-sm"
                            rows={3}
                            value={editForm.description ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                          />
                        </div>

                        <div>
                          <label className="style-caption font-medium text-ink-muted">
                            Opening Date & Time (CT)
                          </label>
                          <input
                            type="datetime-local"
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-sm"
                            value={editOpenAt}
                            onChange={(e) => setEditOpenAt(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="style-caption font-medium text-ink-muted">
                            Closing Date & Time (CT)
                          </label>
                          <input
                            type="datetime-local"
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-sm"
                            value={editCloseAt}
                            onChange={(e) => setEditCloseAt(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 border-t border-border-soft pt-4">
                        <Button
                          type="button"
                          size="sm"
                          disabled={saving}
                          onClick={() => setShowSaveModal(true)}
                        >
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingApp(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-6 xl:grid-cols-[300px_1fr]">
                  <div className="flex min-h-0 flex-col gap-3">
                    <input
                      className="rounded-lg border border-border-soft bg-search-field p-2.5 text-sm"
                      value={rawQuery}
                      onChange={(event) => setRawQuery(event.target.value)}
                      placeholder="Search candidate name or NetID…"
                    />

                    <div className="flex flex-wrap gap-1">
                      {(["all", "new", "shortlisted", "reviewed"] as const).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setFilter(item)}
                          className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                            filter === item
                              ? "bg-brand text-white font-medium"
                              : "bg-row-soft text-ink-muted hover:bg-stone-200"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
                      {submissions.map((submission) => {
                        const profile = submission.user.profile;
                        const name = profile
                          ? `${profile.firstName} ${profile.lastName}`
                          : submission.user.email;
                        const isSelected = submission.id === selectedSubmissionId;

                        return (
                          <button
                            type="button"
                            onClick={() => setSelectedSubmissionId(submission.id)}
                            key={submission.id}
                            className={`w-full rounded-xl border p-3 text-left transition-all ${
                              isSelected
                                ? "border-brand bg-brand-soft/40 shadow-sm"
                                : "border-border-soft bg-white hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="style-body-text font-medium text-ink">{name}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusBadgeColor(
                                  submission.status
                                )}`}
                              >
                                {statusLabel(submission.status)}
                              </span>
                            </div>
                            <p className="style-caption mt-1 text-ink-faint">
                              {profile?.utdNetId ?? submission.user.email}
                            </p>
                          </button>
                        );
                      })}
                      {!submissions.length ? (
                        <p className="p-4 text-center text-sm text-ink-muted">
                          No matching applicants found.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-0">
                    {selectedSubmission ? (
                      <div className="flex flex-col gap-6">
                        <div className="rounded-xl border border-border-soft bg-row-soft p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <Link 
                                href={`/admin/members/${selectedSubmission.userId}`} 
                                className="hover:underline transition-opacity hover:opacity-80 block"
                              >
                                <h3 className="style-section-header text-lg font-bold text-ink">
                                  {selectedSubmission.user.profile
                                    ? `${selectedSubmission.user.profile.firstName} ${selectedSubmission.user.profile.lastName}`
                                    : selectedSubmission.user.email}
                                </h3>
                              </Link>
                              <p className="style-caption text-ink-faint">
                                {selectedSubmission.user.profile?.utdNetId ?? "No NetID"} ·{" "}
                                {selectedSubmission.user.email} · Submitted{" "}
                                {localValue(selectedSubmission.submittedAt)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusBadgeColor(
                                selectedSubmission.status
                              )}`}
                            >
                              {statusLabel(selectedSubmission.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-soft/60 pt-3">
                            {selectedSubmission.user.profile?.resumeFile ? (
                              <a
                                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                href={`/api/admin/applications/${detail.id}/submissions/${selectedSubmission.id}/resume`}
                                rel="noreferrer"
                              >
                                Resume ↗
                              </a>
                            ) : null}
                            {selectedSubmission.user.profile?.linkedinUrl ? (
                              <a
                                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                href={selectedSubmission.user.profile.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                LinkedIn ↗
                              </a>
                            ) : null}
                            {selectedSubmission.user.profile?.githubUrl ? (
                              <a
                                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                href={selectedSubmission.user.profile.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                GitHub ↗
                              </a>
                            ) : null}
                            {selectedSubmission.user.profile?.portfolioUrl ? (
                              <a
                                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                href={selectedSubmission.user.profile.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Portfolio ↗
                              </a>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <h4 className="style-body-text font-semibold text-ink">
                            Application Responses
                          </h4>

                          <div className="space-y-4">
                            {orderedResponses.map((item) => (
                              <div
                                key={item.index}
                                className="rounded-xl border border-border-soft bg-white p-4 shadow-xs"
                              >
                                <p className="style-caption font-semibold text-ink-muted">
                                  Q{item.index}. {item.question}
                                </p>
                                {item.answer.isFile ? (
                                  <a
                                    href={item.answer.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 font-medium text-brand hover:underline style-body-text"
                                  >
                                    {item.answer.fileName} ↗
                                  </a>
                                ) : (
                                  <p className="mt-2 whitespace-pre-wrap style-body-text text-ink">
                                    {item.answer.raw}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-border-soft bg-white p-5 shadow-sm">
                          <h4 className="style-body-text font-semibold text-ink">
                            Evaluator Notes
                          </h4>

                          <textarea
                            className="mt-3 min-h-24 w-full rounded-lg border border-border-soft bg-search-field p-3 text-sm focus:border-brand outline-none"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Add internal evaluation feedback or notes for reviewers..."
                          />

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={saving}
                                onClick={() => void updateSubmission()}
                              >
                                Save Notes Only
                              </Button>

                              {/*Restricted Access to Only DIRECTOR & EXECUTIVE*/}
                              {canChangeStatus ? (
                                <>
                                <Button
                                  size="sm"
                                  variant="accent"
                                  disabled={saving}
                                  onClick={() => setPendingStatus("IN_CONSIDERATION")}
                                >
                                  Shortlist
                                </Button>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={saving}
                                  onClick={() => setPendingStatus("ACCEPTED")}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={saving}
                                  onClick={() => setPendingStatus("REJECTED")}
                                >
                                  Reject
                                </Button>
                                </>
                              ) : null}
                              </div>
                              

                            <Button size="sm" variant="outline" onClick={selectNextApplicant}>
                              Next Candidate →
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border-soft text-ink-muted">
                        Select an applicant from the list to view their response details.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center text-ink-muted">
                Select an application to view applicants.
              </div>
            )}
          </section>
        </div>
      </div>

      {pendingStatus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-lg font-bold text-ink">
              Confirm Candidate Status Decision
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Are you sure you want to change this applicant's status to{" "}
              <strong className="text-ink">{statusLabel(pendingStatus)}</strong>?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setPendingStatus(null)}>
                Cancel
              </Button>
              <Button
                variant={pendingStatus === "REJECTED" ? "danger" : "primary"}
                size="sm"
                disabled={saving}
                onClick={() => void updateSubmission(pendingStatus)}
              >
                {saving ? "Updating..." : "Confirm Status Change"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal && canDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-lg font-bold text-ink">
              Delete Application Posting
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Are you sure you want to delete <strong className="text-ink">{detail?.title}</strong>? This action will remove all candidate submissions and internal reviews associated with this cohort.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" disabled={saving} onClick={handleDeleteApplication}>
                {saving ? "Deleting…" : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showSaveModal && canEditOrPublish ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-lg font-bold text-ink">
              Save Configuration Changes
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              You are updating dates and settings for <strong className="text-ink">{detail?.title}</strong>. Open/Close timestamps will be synced using Central Time (Chicago timezone).
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" disabled={saving} onClick={handleUpdateApplication}>
                {saving ? "Saving…" : "Confirm Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showPublishModal && canEditOrPublish ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-lg font-bold text-ink">
              {pendingVisibilityState ? "Publish Application Posting" : "Unpublish Application Posting"}
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              {pendingVisibilityState
                ? `Making "${detail?.title}" live will allow eligible applicants to view and submit applications.`
                : `Unpublishing "${detail?.title}" will hide it from the applicant portal.`}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowPublishModal(false)}>
                Cancel
              </Button>
              <Button
                variant={pendingVisibilityState ? "primary" : "outline"}
                size="sm"
                disabled={saving}
                onClick={() => handleTogglePublish(pendingVisibilityState)}
              >
                {saving ? "Updating…" : pendingVisibilityState ? "Confirm Publish" : "Confirm Unpublish"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}