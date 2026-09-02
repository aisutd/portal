"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type QuestionType = "TEXT" | "LONG_TEXT" | "DROPDOWN" | "CHECKBOX" | "FILE";

export type Question = {
  id: string;
  label: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options: string[];
  placeholder?: string;
};

export type ProfileFieldRequirements = {
  requirePhoneNumber: boolean;
  requirePersonalEmail: boolean;
  requireResume: boolean;
  requireLinkedin: boolean;
  requireGithub: boolean;
  requirePortfolio: boolean;
};

/**
 * Converts a standard local datetime string (YYYY-MM-DDTHH:mm) 
 * assuming standard Central Time ISO representation.
 */
function parseChicagoInputToUTC(dateTimeString: string): string | null {
  if (!dateTimeString) return null;
  const date = new Date(dateTimeString);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

export default function CreateApplicationPage({ embedded = true }: { embedded?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const [profileRequirements, setProfileRequirements] = useState<ProfileFieldRequirements>({
    requireResume: true,
    requireLinkedin: false,
    requireGithub: false,
    requirePortfolio: false,
    requirePhoneNumber: false,
    requirePersonalEmail: true,
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: `q_${Date.now()}_0`,
      label: "",
      description: "",
      type: "TEXT",
      required: true,
      options: [""],
    },
  ]);

  const [rolesInput, setRolesInput] = useState("");
  const [eligibilityInput, setEligibilityInput] = useState("");

  const createQuestionId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const handleDuplicateQuestion = (idToDuplicate: string) => {
    setQuestions((prevQuestions) => {
      const index = prevQuestions.findIndex((q) => q.id === idToDuplicate);
      if (index === -1) return prevQuestions;

      const original = prevQuestions[index];

      const duplicatedQuestion: Question = {
        ...original,
        id: createQuestionId(),
        label: `${original.label} (Copy)`,
        options: original.options ? [...original.options] : [],
      };

      const updated = [...prevQuestions];
      updated.splice(index + 1, 0, duplicatedQuestion);
      return updated;
    });
  };

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: createQuestionId(),
        label: "",
        description: "",
        type: "TEXT",
        required: true,
        options: [""],
      },
    ]);
  }

  function removeQuestion(qIndex: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  }

  function moveQuestion(qIndex: number, direction: "UP" | "DOWN") {
    const targetIndex = direction === "UP" ? qIndex - 1 : qIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions((prev) => {
      const updated = [...prev];
      const temp = updated[qIndex];
      updated[qIndex] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  }

  function updateQuestion(qIndex: number, fields: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, ...fields } : q))
    );
  }

  function addOption(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qIndex ? { ...q, options: [...q.options, ""] } : q
      )
    );
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[oIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        return { ...q, options: q.options.filter((_, i) => i !== oIndex) };
      })
    );
  }

  function handleFormSubmitIntent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPendingFormData(formData);
    setShowConfirmModal(true);
  }

  async function executePublish() {
    if (!pendingFormData) return;
    setSaving(true);
    setError(null);

    const cleanedQuestions = questions.map((q) => ({
      ...q,
      description: q.description?.trim() || undefined,
      options:
        q.type === "DROPDOWN" || q.type === "CHECKBOX"
          ? q.options.filter((opt) => opt.trim() !== "")
          : [],
    }));

    const openAtRaw = pendingFormData.get("openAt") as string;
    const closeAtRaw = pendingFormData.get("closeAt") as string;
    const decisionDateRaw = pendingFormData.get("decisionDate") as string;
    const rawVisible = pendingFormData.get("visibleToUsers");
    const visibleToUsers = rawVisible === "true" || rawVisible === "on";

    // Split newline inputs into String Arrays to align with backend schema
    const roles = rolesInput
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const eligibility = eligibilityInput
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean);

    const payload = {
      title: pendingFormData.get("title") as string,
      programType: pendingFormData.get("programType") as string,
      description: pendingFormData.get("description") as string,
      roles,
      eligibility,
      openAt: parseChicagoInputToUTC(openAtRaw),
      closeAt: parseChicagoInputToUTC(closeAtRaw),
      decisionDate: parseChicagoInputToUTC(decisionDateRaw),
      visibleToUsers,
      requiredProfileFields: {
        requirePhoneNumber: profileRequirements.requirePhoneNumber,
        requirePersonalEmail: profileRequirements.requirePersonalEmail,
        requireResume: profileRequirements.requireResume,
        requireLinkedin: profileRequirements.requireLinkedin,
        requireGithub: profileRequirements.requireGithub,
        requirePortfolio: profileRequirements.requirePortfolio,
      },
      questions: cleanedQuestions,
    };

    try {
      const response = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Failed to create application.");
      }

      setShowConfirmModal(false);
      router.push("/admin/applications");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={embedded ? "min-w-0 flex-1 p-6 lg:p-10" : "min-h-screen bg-cream p-5 md:p-10"}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4">
          <div>
            <h1 className="style-section-header text-2xl font-bold text-ink">
              Create New Application Posting
            </h1>
            <p className="style-caption mt-1 text-ink-faint">
              Configure parameters, setup execution dates, and specify custom field responses.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setShowCancelModal(true)}>
            Cancel
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-danger-border bg-white p-4 text-danger-ink">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleFormSubmitIntent} className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
            <h2 className="style-body-text font-semibold text-ink text-lg">General Info</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="title" className="style-caption font-medium text-ink-muted">
                  Application Title *
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Fall 2026 AI Cohort"
                  className="h-[42px] rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="programType" className="style-caption font-medium text-ink-muted">
                  Program Type *
                </label>
                <select
                  id="programType"
                  name="programType"
                  defaultValue="AI_ACADEMY"
                  className="h-[42px] rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                >
                  <option value="AI_ACADEMY">AI Academy</option>
                  <option value="AI_INNOVATION">AI Innovation</option>
                  <option value="AI_MENTORSHIP_MENTOR">AIM Mentor</option>
                  <option value="AI_MENTORSHIP_MENTEE">AIM Mentee</option>
                  <option value="OFFICER">Officer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-[6px] md:col-span-2">
                <label htmlFor="description" className="style-caption font-medium text-ink-muted">
                  Description & Instructions *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  placeholder="Provide instructions and co-op details for prospective applicants..."
                  className="rounded-lg border border-border-soft bg-white p-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                />
              </div>

              {/* Roles Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="roles" className="text-sm font-medium">Available Roles (One per line)</label>
                <textarea
                  id="roles"
                  name="roles"
                  value={rolesInput}
                  onChange={(e) => setRolesInput(e.target.value)}
                  placeholder="e.g. Full Stack Developer&#10;UI/UX Designer&#10;ML Engineer"
                  rows={3}
                  className="border rounded-md p-2"
                />
              </div>

              {/* Eligibility Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="eligibility" className="text-sm font-medium">Eligibility Requirements (One per line)</label>
                <textarea
                  id="eligibility"
                  name="eligibility"
                  value={eligibilityInput}
                  onChange={(e) => setEligibilityInput(e.target.value)}
                  placeholder="e.g. Open to enrolled UTD students&#10;Must be able to commit 5 hrs/week"
                  rows={3}
                  className="border rounded-md p-2"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="openAt" className="style-caption font-medium text-ink-muted">
                  Open Date (CT) *
                </label>
                <input
                  id="openAt"
                  name="openAt"
                  type="datetime-local"
                  required
                  className="h-[42px] rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="closeAt" className="style-caption font-medium text-ink-muted">
                  Close Date (CT) *
                </label>
                <input
                  id="closeAt"
                  name="closeAt"
                  type="datetime-local"
                  required
                  className="h-[42px] rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="decisionDate" className="style-caption font-medium text-ink-muted">
                  Decision Date (CT)
                </label>
                <input
                  id="decisionDate"
                  name="decisionDate"
                  type="datetime-local"
                  className="h-[42px] rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-2 pt-4 md:col-span-2">
                <input
                  id="visibleToUsers"
                  name="visibleToUsers"
                  type="checkbox"
                  defaultChecked
                  value="true"
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <label htmlFor="visibleToUsers" className="style-body-text text-ink cursor-pointer select-none">
                  Make visible to applicants immediately upon publication
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
            <div>
              <h2 className="style-body-text font-semibold text-ink text-lg">
                Personal & Profile Field Requirements
              </h2>
              <p className="style-caption mt-0.5 text-ink-faint">
                Select which standard profile credentials applicants must submit for this specific application.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 pt-2">
              <label className="flex items-center gap-2.5 rounded-xl border border-border-soft p-3.5 cursor-pointer hover:bg-row-soft transition-colors">
                <input
                  type="checkbox"
                  checked={profileRequirements.requirePhoneNumber}
                  onChange={(e) =>
                    setProfileRequirements((prev) => ({ ...prev, requirePhoneNumber: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <span className="style-body-text text-ink font-medium">Phone Number</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border-soft p-3.5 cursor-pointer hover:bg-row-soft transition-colors">
                <input
                  type="checkbox"
                  checked={profileRequirements.requirePersonalEmail}
                  onChange={(e) =>
                    setProfileRequirements((prev) => ({ ...prev, requirePersonalEmail: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <span className="style-body-text text-ink font-medium">Personal Email</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border-soft p-3.5 cursor-pointer hover:bg-row-soft transition-colors">
                <input
                  type="checkbox"
                  checked={profileRequirements.requireResume}
                  onChange={(e) =>
                    setProfileRequirements((prev) => ({ ...prev, requireResume: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <span className="style-body-text text-ink font-medium">Resume PDF</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border-soft p-3.5 cursor-pointer hover:bg-row-soft transition-colors">
                <input
                  type="checkbox"
                  checked={profileRequirements.requireLinkedin}
                  onChange={(e) =>
                    setProfileRequirements((prev) => ({ ...prev, requireLinkedin: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <span className="style-body-text text-ink font-medium">LinkedIn URL</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border-soft p-3.5 cursor-pointer hover:bg-row-soft transition-colors">
                <input
                  type="checkbox"
                  checked={profileRequirements.requireGithub}
                  onChange={(e) =>
                    setProfileRequirements((prev) => ({ ...prev, requireGithub: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <span className="style-body-text text-ink font-medium">GitHub Profile</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border-soft p-3.5 cursor-pointer hover:bg-row-soft transition-colors">
                <input
                  type="checkbox"
                  checked={profileRequirements.requirePortfolio}
                  onChange={(e) =>
                    setProfileRequirements((prev) => ({ ...prev, requirePortfolio: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-brand cursor-pointer"
                />
                <span className="style-body-text text-ink font-medium">Portfolio / Website</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="style-body-text font-semibold text-ink text-lg">Form Questions Schema</h2>
                <p className="style-caption mt-0.5 text-ink-faint">
                  Define questions, add supporting descriptions, adjust sequence order, and specify input rules.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id}
                  className="flex flex-col gap-4 rounded-xl border border-border-soft bg-row-soft p-5 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft/60 pb-3">
                    <div className="flex items-center gap-1">
                      <span className="style-caption font-semibold text-ink-muted mr-2">
                        #{qIndex + 1}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={qIndex === 0}
                        onClick={() => moveQuestion(qIndex, "UP")}
                        className="h-8 w-8 p-0 text-ink-muted disabled:opacity-30"
                        title="Move Up"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={qIndex === questions.length - 1}
                        onClick={() => moveQuestion(qIndex, "DOWN")}
                        className="h-8 w-8 p-0 text-ink-muted disabled:opacity-30"
                        title="Move Down"
                      >
                        ↓
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <label
                        htmlFor={`req_${q.id}`}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <input
                          id={`req_${q.id}`}
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                          className="h-4 w-4 rounded accent-brand cursor-pointer"
                        />
                        <span className="style-caption font-medium text-ink">Required</span>
                      </label>

                      <div className="h-4 w-[1px] bg-border-soft" />

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicateQuestion(q.id)}
                        className="h-8 px-2.5 style-caption font-semibold text-ink hover:bg-white"
                        title="Duplicate Question"
                      >
                        Duplicate
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={questions.length === 1}
                        onClick={() => removeQuestion(qIndex)}
                        className="h-8 px-2.5 style-caption font-semibold text-danger-ink hover:bg-danger-border/20 disabled:opacity-40"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2 flex flex-col gap-3">
                      <div className="flex flex-col gap-[6px]">
                        <label className="style-caption font-medium text-ink-muted">
                          Question Label
                        </label>
                        <input
                          required
                          value={q.label}
                          onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                          placeholder="e.g. What is your academic standing?"
                          className="h-[42px] w-full rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                        />
                      </div>

                      <div className="flex flex-col gap-[6px]">
                        <label className="style-caption font-medium text-ink-muted">
                          Subtext / Helper Description (Optional)
                        </label>
                        <input
                          value={q.description ?? ""}
                          onChange={(e) => updateQuestion(qIndex, { description: e.target.value })}
                          placeholder="Provide context or guidelines for answering this question..."
                          className="h-[38px] w-full rounded-lg border border-border-soft bg-white px-3 style-caption text-ink outline-none transition-colors focus:border-brand"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-[6px]">
                      <label className="style-caption font-medium text-ink-muted">
                        Input Type
                      </label>
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(qIndex, { type: e.target.value as QuestionType })
                        }
                        className="h-[42px] w-full rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                      >
                        <option value="TEXT">Short Text</option>
                        <option value="LONG_TEXT">Paragraph Text</option>
                        <option value="DROPDOWN">Dropdown Menu</option>
                        <option value="CHECKBOX">Checkboxes</option>
                        <option value="FILE">File Upload</option>
                      </select>
                    </div>
                  </div>

                  {(q.type === "DROPDOWN" || q.type === "CHECKBOX") && (
                    <div className="ml-1 border-l-2 border-border-soft pl-4 pt-2 flex flex-col gap-3">
                      <span className="style-caption font-medium text-ink-muted">
                        Configured Options
                      </span>
                      <div className="flex flex-col gap-2">
                        {(q.options ?? []).map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              required
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="h-[38px] flex-1 rounded-lg border border-border-soft bg-white px-3 style-body-text text-ink outline-none transition-colors focus:border-brand"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={q.options.length === 1}
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="h-[38px] w-[38px] p-0 text-ink-muted hover:text-danger-ink disabled:opacity-30"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(qIndex)}
                        className="w-fit h-[34px] rounded-lg border-border-soft style-caption text-ink"
                      >
                        + Add Option
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                + Add Question
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCancelModal(true)}
              className="h-[42px] px-5 style-body-text"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="h-[42px] px-6 style-body-text font-medium">
              Publish Application
            </Button>
          </div>
        </form>
      </div>

      {showConfirmModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-lg font-bold text-ink">
              Publish Application?
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              You are about to submit and register this application configuration. If set to visible, candidates will immediately be able to inspect and submit entries.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowConfirmModal(false)}>
                Back to Edit
              </Button>
              <Button variant="primary" size="sm" disabled={saving} onClick={executePublish}>
                {saving ? "Creating..." : "Confirm & Publish"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showCancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl">
            <h3 className="style-section-header text-lg font-bold text-ink">
              Discard Changes?
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Are you sure you want to cancel? Any unsaved fields or form questions will be permanently cleared.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(false)}>
                Keep Editing
              </Button>
              <Button variant="danger" size="sm" onClick={() => router.back()}>
                Discard Posting
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}