"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type QuestionType = "TEXT" | "LONG_TEXT" | "DROPDOWN" | "CHECKBOX" | "FILE";

export type Question = {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options: string[];
};

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

export default function CreateApplicationPage({ embedded = true }: { embedded?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    { id: `q_${Date.now()}_0`, label: "", type: "TEXT", required: true, options: [""] },
  ]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label: "",
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
      options:
        q.type === "DROPDOWN" || q.type === "CHECKBOX"
          ? q.options.filter((opt) => opt.trim() !== "")
          : [],
    }));

    const openAtRaw = pendingFormData.get("openAt") as string;
    const closeAtRaw = pendingFormData.get("closeAt") as string;
    const decisionDateRaw = pendingFormData.get("decisionDate") as string;

    const payload = {
      ...Object.fromEntries(pendingFormData),
      openAt: parseChicagoInputToUTC(openAtRaw),
      closeAt: parseChicagoInputToUTC(closeAtRaw),
      decisionDate: parseChicagoInputToUTC(decisionDateRaw),
      visibleToUsers: pendingFormData.get("visibleToUsers") === "true",
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
        {/* Header */}
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
          {/* General Info Card */}
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

          {/* Form Questions Card */}
          <div className="flex flex-col gap-6 rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="style-body-text font-semibold text-ink text-lg">Form Questions Schema</h2>
                <p className="style-caption mt-0.5 text-ink-faint">
                  Define questions, adjust sequence order, and specify input rules.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                + Add Question
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id}
                  className="flex flex-col gap-4 rounded-xl border border-border-soft bg-row-soft p-5 transition-colors"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 sm:self-end sm:pb-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={qIndex === 0}
                        onClick={() => moveQuestion(qIndex, "UP")}
                        className="h-[36px] w-[32px] p-0 text-ink-muted disabled:opacity-30"
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
                        className="h-[36px] w-[32px] p-0 text-ink-muted disabled:opacity-30"
                        title="Move Down"
                      >
                        ↓
                      </Button>
                    </div>

                    <div className="flex-1 flex flex-col gap-[6px]">
                      <label className="style-caption font-medium text-ink-muted">
                        Question #{qIndex + 1} Label
                      </label>
                      <input
                        required
                        value={q.label}
                        onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                        placeholder="e.g. What is your academic standing?"
                        className="h-[42px] w-full rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                      />
                    </div>

                    <div className="w-full sm:w-48 flex flex-col gap-[6px]">
                      <label className="style-caption font-medium text-ink-muted">
                        Input Type
                      </label>
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(qIndex, { type: e.target.value as QuestionType })
                        }
                        className="h-[42px] rounded-lg border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                      >
                        <option value="TEXT">Short Text</option>
                        <option value="LONG_TEXT">Paragraph Text</option>
                        <option value="DROPDOWN">Dropdown Menu</option>
                        <option value="CHECKBOX">Checkboxes</option>
                        <option value="FILE">File Upload</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 sm:self-end sm:pb-2">
                      <input
                        id={`req_${q.id}`}
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                        className="h-4 w-4 rounded accent-brand cursor-pointer"
                      />
                      <label htmlFor={`req_${q.id}`} className="style-caption text-ink cursor-pointer select-none font-medium">
                        Required
                      </label>
                    </div>

                    <div className="flex items-end sm:self-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={questions.length === 1}
                        onClick={() => removeQuestion(qIndex)}
                        className="h-[42px] px-3 text-danger-ink hover:bg-danger-border/20 disabled:opacity-40"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Options List for Dropdown / Checkbox */}
                  {(q.type === "DROPDOWN" || q.type === "CHECKBOX") && (
                    <div className="ml-2 border-l-2 border-border-soft pl-4 pt-2 flex flex-col gap-3">
                      <span className="style-caption font-medium text-ink-muted">
                        Configured Options
                      </span>
                      <div className="flex flex-col gap-2">
                        {q.options.map((option, oIndex) => (
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
          </div>

          {/* Form Actions */}
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

      {/* Confirmation Modal */}
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

      {/* Cancel Warning Modal */}
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