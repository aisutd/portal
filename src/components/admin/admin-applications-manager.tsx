"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { ApplicationStatus, MembershipType, ProgramType, UserRole } from "@prisma/client";
import { chicagoInputToUtc, formatChicagoDisplayDate, formatChicagoDateTimeInput } from "@/lib/timezone";

export function ExportCustomizerModal({
  application,
  onClose,
}: {
  application: { id: string; title: string; questionsJson?: any };
  onClose: () => void;
}) {
  const systemFields = [
    { id: "profile.firstName", label: "First Name" },
    { id: "profile.lastName", label: "Last Name" },
    { id: "profile.middleName", label: "Middle Name" },
    { id: "profile.prefName", label: "Preferred Name" },
    { id: "user.email", label: "Email Address" },
    { id: "profile.utdEmail", label: "UTD Email" },
    { id: "profile.personalEmail", label: "Personal Email" },
    { id: "profile.utdNetId", label: "UTD NetID" },
    { id: "profile.phoneNumber", label: "Phone Number" },
    { id: "profile.degree", label: "Degree" },
    { id: "profile.major", label: "Major" },
    { id: "profile.year", label: "Year" },
    { id: "profile.githubUrl", label: "GitHub URL" },
    { id: "profile.linkedinUrl", label: "LinkedIn URL" },
    { id: "profile.portfolioUrl", label: "Portfolio URL" },
    { id: "profile.resumeFileId", label: "Resume File ID" },
    { id: "profile.profileCompletionStatus", label: "Profile Completion Status" },
    { id: "profile.createdAt", label: "Profile Created At" },
    { id: "profile.updatedAt", label: "Profile Updated At" },
    { id: "submission.status", label: "Application Status" },
    { id: "submission.submittedAt", label: "Submission Date" },
  ];

  const dynamicQuestions = (application.questionsJson as Array<{ id: string; label: string }>) || [];

  const allAvailableFields = [
    ...systemFields,
    ...dynamicQuestions.map((q) => ({ id: `q_${q.id}`, label: `Question: ${q.label}` })),
  ];

  const [selectedFields, setSelectedFields] = useState<string[]>(
    systemFields.map((f) => f.id)
  );

  const toggleAll = () => {
    if (selectedFields.length === allAvailableFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(allAvailableFields.map((f) => f.id));
    }
  };

  const handleDownload = () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to export.");
      return;
    }

    const fieldsParam = encodeURIComponent(JSON.stringify(selectedFields));
    window.open(
      `/api/admin/applications/${application.id}/export?fields=${fieldsParam}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">Export CSV Fields</h3>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {selectedFields.length === allAvailableFields.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto border border-border-soft rounded-xl p-3 divide-y divide-border-soft/50">
          {allAvailableFields.map((field) => (
            <label key={field.id} className="flex items-center gap-2 text-xs py-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFields.includes(field.id)}
                onChange={(e) => {
                  setSelectedFields(
                    e.target.checked
                      ? [...selectedFields, field.id]
                      : selectedFields.filter((id) => id !== field.id)
                  );
                }}
              />
              <span className="truncate">{field.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleDownload}>
            Download CSV ({selectedFields.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  programType: ProgramType;
  roles?: string[];
  eligibility?: string[];
  link?: string[];
  openAt: string;
  closeAt: string;
  decisionDate: string | null;
  visibleToUsers: boolean;
  submissionCount: number;
  acceptedCount: number;
  inReviewCount: number;
  questionsJson?: Question[];
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

const appDatesSchema = z
  .object({
    openAt: z.string().optional(),
    closeAt: z.string().optional(),
    decisionDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.openAt && data.closeAt && data.decisionDate) {
        return new Date(data.closeAt) > new Date(data.openAt);
      }
      return true;
    },
    {
      message: "Close date/time must occur after Open date/time.",
      path: ["closeAt"],
    }
  );

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


export function AdminApplicationsManager({
  initialApplicationId,
  userRole = "OFFICER",
  userMemberships = [],
  embedded = false,
}: {
  initialApplicationId?: string;
  userRole?: UserRole | string;
  userMemberships?: MembershipType[];
  embedded?: boolean;
}) {
  const [applications, setApplications] = useState<Summary[]>([]);
  const [selectedId, setSelectedId] = useState(initialApplicationId ?? "");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");

  const [isAppsListOpen, setIsAppsListOpen] = useState(true);
  const [isSubmissionsListOpen, setIsSubmissionsListOpen] = useState(true);

  const [isBlindReviewMode, setIsBlindReviewMode] = useState(false);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

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
  const [editDecisionDate, setEditDecisionDate] = useState("");
  const [editRolesInput, setEditRolesInput] = useState("");
  const [editEligibilityInput, setEditEligibilityInput] = useState("");
  const [editLinkInput, setEditLinkInput] = useState("");

  const [notes, setNotes] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pendingVisibilityState, setPendingVisibilityState] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);

  const router = useRouter();

  const isAIMMentor = userMemberships.includes("AIM_MENTOR");
  const isExecutiveOrDirector = userRole === "EXECUTIVE" || userRole === "DIRECTOR";
  const isOfficerOrAbove = isExecutiveOrDirector || userRole === "OFFICER";

  const canEditOrPublish = isExecutiveOrDirector;
  const canDelete = userRole === "EXECUTIVE";

  // Restricted: ONLY Executives and Directors can accept/reject/shortlist candidates
  const canChangeStatus = isExecutiveOrDirector;

  const visibleApplications = useMemo(() => {
    return applications.filter((app) => {
      if (isOfficerOrAbove) return true;
      if (userRole === "MEMBER" && isAIMMentor) {
        return app.programType === "AI_MENTORSHIP_MENTEE";
      }
      return false;
    });
  }, [applications, userRole, isAIMMentor, isOfficerOrAbove]);

  async function loadApplications() {
    setLoading(true);
    const response = await fetch("/api/admin/applications");
    if (!response.ok) throw new Error("Unable to load applications.");
    const payload = (await response.json()) as { applications: Summary[] };

    const allowed = payload.applications.filter((app) => {
      if (isOfficerOrAbove) return true;
      if (userRole === "MEMBER" && isAIMMentor) {
        return app.programType === "AI_MENTORSHIP_MENTEE";
      }
      return false;
    });

    setApplications(allowed);
    setSelectedId((current) => current || allowed[0]?.id || "");
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
    setEditDecisionDate(formatChicagoDateTimeInput(payload.application.decisionDate));
    setEditRolesInput(payload.application.roles ? payload.application.roles.join("\n") : "");
    setEditEligibilityInput(
      payload.application.eligibility ? payload.application.eligibility.join("\n") : ""
    );
    setEditLinkInput(payload.application.link ? payload.application.link.join("\n") : "");
    setSelectedSubmissionId((current) =>
      payload.application.submissions.some((item) => item.id === current)
        ? current
        : payload.application.submissions[0]?.id || ""
    );
    setSelectedSubmissionIds([]);
  }

  useEffect(() => {
    void loadApplications().catch((caught) => {
      setError((caught as Error).message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setIsEditingApp(false);
    if (selectedId) {
      void loadDetail(selectedId).catch((caught) => setError((caught as Error).message));
    }
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

  async function handleBatchStatusUpdate(statusToApply: Status) {
    if (!detail || selectedSubmissionIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        selectedSubmissionIds.map((subId) =>
          fetch(`/api/admin/applications/${detail.id}/submissions/${subId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: statusToApply }),
          })
        )
      );
      setSelectedSubmissionIds([]);
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
      const roles = editRolesInput
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const eligibility = editEligibilityInput
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean);
      
      const link = editLinkInput
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean);

      const payload = {
        ...editForm,
        roles,
        eligibility,
        link,
        openAt: editOpenAt ? chicagoInputToUtc(editOpenAt)?.toISOString() : null,
        closeAt: editCloseAt ? chicagoInputToUtc(editCloseAt)?.toISOString() : null,
        decisionDate: editDecisionDate ? chicagoInputToUtc(editDecisionDate)?.toISOString() : null,
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

  const toggleSelectAllSubmissions = () => {
    if (selectedSubmissionIds.length === submissions.length) {
      setSelectedSubmissionIds([]);
    } else {
      setSelectedSubmissionIds(submissions.map((s) => s.id));
    }
  };

  const toggleSelectSubmission = (id: string) => {
    setSelectedSubmissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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
    <div className={embedded ? "min-w-0 flex-1 p-4 lg:p-6" : "min-h-screen bg-cream p-4 md:p-8"}>
      <div className="flex w-full flex-col gap-5">
        {/* Portal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
          <div>
            <h1 className="style-section-header text-ink text-2xl font-bold tracking-tight">
              Applications Portal
            </h1>
            <p className="style-caption text-ink-faint">
              Manage program cycles, dynamic questions, and evaluate candidate submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Blind Review Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsBlindReviewMode((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                isBlindReviewMode
                  ? "border-amber-400 bg-amber-50 text-amber-900 shadow-xs"
                  : "border-border-soft bg-white text-ink-muted hover:bg-stone-50"
              }`}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a9.957 9.957 0 014.122-.963c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21f-18-18" />
              </svg>
              <span>{isBlindReviewMode ? "Blind Review ON" : "Blind Review OFF"}</span>
            </button>

            {/* View Layout Toggles */}
            <div className="flex items-center rounded-lg border border-border-soft bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setIsAppsListOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  isAppsListOpen
                    ? "bg-stone-100 text-ink shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-stone-50"
                }`}
                title={isAppsListOpen ? "Hide Applications List" : "Show Applications List"}
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
                <span>Listings</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSubmissionsListOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSubmissionsListOpen
                    ? "bg-stone-100 text-ink shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-stone-50"
                }`}
                title={isSubmissionsListOpen ? "Hide Submissions Panel" : "Show Submissions Panel"}
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Applicants</span>
              </button>
            </div>

            {canEditOrPublish ? (
              <Button size="sm" onClick={() => router.push("/admin/applications/new")}>
                + Create Application
              </Button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-danger-border bg-white p-4 text-danger-ink text-sm">
            {error}
          </div>
        ) : null}

        {/* Dynamic Grid Layout */}
        <div
          className={`grid gap-5 transition-all duration-300 ease-in-out ${
            isAppsListOpen && isSubmissionsListOpen
              ? "grid-cols-1 lg:grid-cols-[260px_320px_1fr]"
              : isAppsListOpen && !isSubmissionsListOpen
              ? "grid-cols-1 lg:grid-cols-[280px_1fr]"
              : !isAppsListOpen && isSubmissionsListOpen
              ? "grid-cols-1 lg:grid-cols-[340px_1fr]"
              : "grid-cols-1"
          }`}
        >
          {/* Applications Sidebar */}
          {isAppsListOpen ? (
            <aside className="flex flex-col gap-3 min-w-0 transition-all">
              <div className="flex items-center justify-between px-1">
                <h2 className="style-body-text text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Postings ({visibleApplications.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAppsListOpen(false)}
                  className="text-ink-muted hover:text-ink text-xs p-1 rounded hover:bg-stone-200/50"
                  title="Collapse Applications"
                >
                  ✕
                </button>
              </div>

              {loading ? (
                <p className="text-xs text-ink-muted p-2">Loading postings…</p>
              ) : visibleApplications.length ? (
                <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {visibleApplications.map((app) => (
                    <button
                      type="button"
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                        selectedId === app.id
                          ? "border-brand bg-brand-soft shadow-xs"
                          : "border-border-soft bg-white hover:border-brand/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="style-body-text font-semibold text-ink text-sm leading-snug">
                          {app.title}
                        </p>
                        <span
                          className={`mt-0.5 inline-block size-2 rounded-full shrink-0 ${
                            app.visibleToUsers ? "bg-emerald-500" : "bg-stone-300"
                          }`}
                          title={app.visibleToUsers ? "Visible to users" : "Draft / Hidden"}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs gap-2 text-ink-faint">
                        <span className="font-medium px-1 py-0.5 bg-stone-100 rounded text-[11px]">
                          Sub Count: {app.submissionCount}
                        </span>
                        <span>Closes {formatChicagoDisplayDate(app.closeAt)}</span>
                      </div>
                      <p className="text-xs font-semibold text-ink leading-snug">
                          {formatChicagoDisplayDate(app.decisionDate)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-border-soft bg-white p-4 text-xs text-ink-muted">
                  No active applications found.
                </p>
              )}
            </aside>
          ) : null}

          {/* Submissions/Applicants Sidebar with Checkboxes */}
          {detail && isSubmissionsListOpen ? (
            <div className="flex flex-col gap-3 min-w-0 transition-all">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      submissions.length > 0 &&
                      selectedSubmissionIds.length === submissions.length
                    }
                    onChange={toggleSelectAllSubmissions}
                    className="rounded border-stone-300 text-brand focus:ring-brand"
                    title="Select All Applicants"
                  />
                  <h2 className="style-body-text text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Applicants ({submissions.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmissionsListOpen(false)}
                  className="text-ink-muted hover:text-ink text-xs p-1 rounded hover:bg-stone-200/50"
                  title="Collapse Applicants"
                >
                  ✕
                </button>
              </div>

              {/* Bulk Action Toolbar - Decisions hidden for Officers/Members */}
              {selectedSubmissionIds.length > 0 && canChangeStatus ? (
                <div className="rounded-xl border border-brand/30 bg-brand-soft/60 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand">
                    <span>{selectedSubmissionIds.length} Selected</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubmissionIds([])}
                      className="text-[11px] underline text-ink-muted hover:text-ink"
                    >
                      Deselect
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      className="text-[10px] py-1 h-auto"
                      variant="accent"
                      onClick={() => handleBatchStatusUpdate("IN_CONSIDERATION")}
                    >
                      Shortlist
                    </Button>
                    <Button
                      size="sm"
                      className="text-[10px] py-1 h-auto"
                      variant="primary"
                      onClick={() => handleBatchStatusUpdate("ACCEPTED")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      className="text-[10px] py-1 h-auto"
                      variant="danger"
                      onClick={() => handleBatchStatusUpdate("REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}

              <input
                className="rounded-lg border border-border-soft bg-search-field px-3 py-2 text-xs focus:border-brand outline-none"
                value={rawQuery}
                onChange={(event) => setRawQuery(event.target.value)}
                placeholder={isBlindReviewMode ? "Filter by candidate status..." : "Search candidate or NetID…"}
              />

              <div className="flex flex-wrap gap-1">
                {(["all", "new", "shortlisted", "reviewed"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-md px-2.5 py-1 text-[11px] capitalize font-medium transition-colors ${
                      filter === item
                        ? "bg-brand text-white"
                        : "bg-row-soft text-ink-muted hover:bg-stone-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-2 pr-1">
                {submissions.map((submission, index) => {
                  const profile = submission.user.profile;
                  const candidateName = isBlindReviewMode
                    ? `Applicant #${index + 1}`
                    : profile
                    ? `${profile.firstName} ${profile.lastName}`
                    : submission.user.email;
                  const candidateSubtext = isBlindReviewMode
                    ? `ID: ${submission.id.slice(-6)}`
                    : profile?.utdNetId ?? submission.user.email;

                  const isSelected = submission.id === selectedSubmissionId;
                  const isChecked = selectedSubmissionIds.includes(submission.id);

                  return (
                    <div
                      key={submission.id}
                      className={`group flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-brand bg-brand-soft/40 shadow-xs"
                          : "border-border-soft bg-white hover:border-stone-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectSubmission(submission.id)}
                        className="rounded border-stone-300 text-brand focus:ring-brand shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedSubmissionId(submission.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="style-body-text font-semibold text-ink text-xs truncate">
                            {candidateName}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusBadgeColor(
                              submission.status
                            )}`}
                          >
                            {statusLabel(submission.status)}
                          </span>
                        </div>
                        <p className="style-caption mt-1 text-[11px] text-ink-faint truncate">
                          {candidateSubtext}
                        </p>
                      </button>
                    </div>
                  );
                })}
                {!submissions.length ? (
                  <p className="p-4 text-center text-xs text-ink-muted">
                    No matching applicants found.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Application Detail View Main Panel */}
          <section className="min-w-0 rounded-2xl border border-border-soft bg-white p-5 lg:p-6 shadow-xs">
            {detail ? (
              <>
                <div className="border-b border-border-soft pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {!isAppsListOpen ? (
                        <button
                          type="button"
                          onClick={() => setIsAppsListOpen(true)}
                          className="rounded-lg border border-border-soft bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-stone-100 transition-colors"
                        >
                          ← Show Postings
                        </button>
                      ) : null}
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
                            {detail.visibleToUsers ? "Live" : "Draft"}
                          </span>
                        </div>
                        <p className="style-caption mt-0.5 text-xs text-ink-faint">
                          {detail.submissions.length} total submissions · {detail.acceptedCount ?? 0}{" "}
                          accepted
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowExportModal(true)}
                      >
                        ↓ Export Custom CSVs
                      </Button>

                      {!isSubmissionsListOpen ? (
                        <button
                          type="button"
                          onClick={() => setIsSubmissionsListOpen(true)}
                          className="rounded-lg border border-border-soft bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-stone-100 transition-colors"
                        >
                          Show Applicants List
                        </button>
                      ) : null}

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
                        <h3 className="style-body-text font-semibold text-ink text-sm">
                          Application Configuration & Settings
                        </h3>
                        <span className="style-caption text-xs text-ink-faint">Timezone: America/Chicago</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">Posting Title</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            value={editForm.title ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, title: e.target.value }))
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">Program Category</label>
                          <select
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            value={editForm.programType ?? "AI_ACADEMY"}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, programType: e.target.value as ProgramType }))
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
                          <label className="style-caption text-xs font-medium text-ink-muted">Cohort Description</label>
                          <textarea
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            rows={3}
                            value={editForm.description ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                          />
                        </div>

                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">
                            Available Roles (One per line)
                          </label>
                          <textarea
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            rows={3}
                            value={editRolesInput}
                            onChange={(e) => setEditRolesInput(e.target.value)}
                            placeholder="e.g. Full Stack Developer&#10;UI/UX Designer"
                          />
                        </div>

                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">
                            Eligibility Requirements (One per line)
                          </label>
                          <textarea
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            rows={3}
                            value={editEligibilityInput}
                            onChange={(e) => setEditEligibilityInput(e.target.value)}
                            placeholder="e.g. Open to enrolled UTD students&#10;Must commit 5 hrs/week"
                          />
                        </div>

                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">
                            Reference Links on Application (One per line)
                          </label>
                          <textarea
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            rows={3}
                            value={editLinkInput}
                            onChange={(e) => setEditLinkInput(e.target.value)}
                            placeholder="e.g. https://aim-project-description.com"
                          />
                        </div>

                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">
                            Opening Date & Time (CT)
                          </label>
                          <input
                            type="datetime-local"
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            value={editOpenAt}
                            onChange={(e) => setEditOpenAt(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">
                            Closing Date & Time (CT)
                          </label>
                          <input
                            type="datetime-local"
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            value={editCloseAt}
                            onChange={(e) => setEditCloseAt(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="style-caption text-xs font-medium text-ink-muted">
                            Decision Date & Time (CT)
                          </label>
                          <input
                            type="datetime-local"
                            className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-xs"
                            value={editDecisionDate}
                            onChange={(e) => setEditDecisionDate(e.target.value)}
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

                <div className="mt-5 min-w-0">
                  {selectedSubmission ? (
                    <div className="flex flex-col gap-6">
                      <div className="rounded-xl border border-border-soft bg-row-soft p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            {isBlindReviewMode ? (
                              <h3 className="style-section-header text-lg font-bold text-amber-900">
                                Anonymous Applicant #{submissions.findIndex((s) => s.id === selectedSubmission.id) + 1}
                              </h3>
                            ) : (
                              <Link 
                                href={`/admin/members/${selectedSubmission.userId}`} 
                                className="hover:underline transition-opacity hover:opacity-80 inline-block"
                              >
                                <h3 className="style-section-header text-lg font-bold text-ink">
                                  {selectedSubmission.user.profile
                                    ? `${selectedSubmission.user.profile.firstName} ${selectedSubmission.user.profile.lastName}`
                                    : selectedSubmission.user.email}
                                </h3>
                              </Link>
                            )}
                            <p className="style-caption text-xs text-ink-faint mt-0.5">
                              {isBlindReviewMode
                                ? `Submission ID: ${selectedSubmission.id}`
                                : `${selectedSubmission.user.profile?.utdNetId ?? "No NetID"} · ${selectedSubmission.user.email}`}{" "}
                              · Submitted {formatChicagoDisplayDate(selectedSubmission.submittedAt)}
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

                        {/* Resume / Social Links (Hidden during Blind Review) */}
                        {!isBlindReviewMode ? (
                          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border-soft/60 pt-3">
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
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-4">
                        <h4 className="style-body-text text-sm font-semibold text-ink">
                          Application Responses
                        </h4>

                        <div className="space-y-3">
                          {orderedResponses.map((item) => (
                            <div
                              key={item.index}
                              className="rounded-xl border border-border-soft bg-stone-50/50 p-4 shadow-xs"
                            >
                              <p className="style-caption font-semibold text-xs text-ink-muted">
                                Q{item.index}. {item.question}
                              </p>
                              {item.answer.isFile ? (
                                <a
                                  href={item.answer.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                >
                                  {item.answer.fileName} ↗
                                </a>
                              ) : (
                                <p className="mt-2 whitespace-pre-wrap style-body-text text-xs text-ink leading-relaxed">
                                  {item.answer.raw}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border-soft bg-white p-5 shadow-xs">
                        <h4 className="style-body-text text-sm font-semibold text-ink">
                          Evaluator Notes & Decision
                        </h4>

                        <textarea
                          className="mt-3 min-h-24 w-full rounded-lg border border-border-soft bg-search-field p-3 text-xs focus:border-brand outline-none"
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="ACCEPT: applicant meets all criteria..."
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

                            {/* Status Decision Buttons (Only visible to Executives / Directors) */}
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
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border-soft text-xs text-ink-muted">
                      Select an applicant from the panel to view their responses.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-ink-muted">
                Select an application posting to view details and candidates.
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Confirmation Modals */}
      {pendingStatus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-base font-bold text-ink">
              Confirm Candidate Decision
            </h3>
            <p className="mt-2 text-xs text-ink-muted">
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
                {saving ? "Updating..." : "Confirm Decision"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal && canDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-base font-bold text-ink">
              Delete Application Posting
            </h3>
            <p className="mt-2 text-xs text-ink-muted">
              Are you sure you want to delete <strong className="text-ink">{detail?.title}</strong>? This will permanently delete candidate submissions and reviews linked to this application.
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
            <h3 className="style-section-header text-base font-bold text-ink">
              Save Configuration
            </h3>
            <p className="mt-2 text-xs text-ink-muted">
              Save updates for <strong className="text-ink">{detail?.title}</strong>? Timestamps will be normalized to America/Chicago time.
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
            <h3 className="style-section-header text-base font-bold text-ink">
              {pendingVisibilityState ? "Publish Application Posting" : "Unpublish Application Posting"}
            </h3>
            <p className="mt-2 text-xs text-ink-muted">
              {pendingVisibilityState
                ? `Publishing "${detail?.title}" will make it active and visible to prospective applicants.`
                : `Unpublishing "${detail?.title}" will hide it from active student listings.`}
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

      {/* Render Export Customizer Modal */}
      {showExportModal && detail ? (
        <ExportCustomizerModal
          application={detail}
          onClose={() => setShowExportModal(false)}
        />
      ) : null}
    </div>
  );
}