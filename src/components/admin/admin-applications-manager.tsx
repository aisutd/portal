"use client";
/* eslint-disable react-hooks/set-state-in-effect -- these effects load route data and synchronize the selected review. */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "SUBMITTED" | "IN_REVIEW" | "IN_CONSIDERATION" | "ACCEPTED" | "REJECTED" | "WAITLISTED";
type Summary = { id: string; title: string; description: string; programType: string; openAt: string; closeAt: string; decisionDate: string | null; visibleToUsers: boolean; submissionCount: number; acceptedCount: number; inReviewCount: number };
type Submission = { id: string; status: Status; submittedAt: string; formPayloadJson: unknown; user: { email: string; profile: { firstName: string; lastName: string; utdNetId: string | null; linkedinUrl: string | null; githubUrl: string | null; portfolioUrl: string | null; resumeFile: { fileName: string } | null } | null }; reviews: Array<{ notesInternal: string | null; reviewer: { email: string; profile: { firstName: string; lastName: string } | null } }> };
type Detail = Summary & { submissions: Submission[] };

const statusLabel = (status: string) => status.toLowerCase().split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
const localValue = (value: string | null) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "TBD";
const fieldValues = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? Object.entries(value as Record<string, unknown>).filter(([, answer]) => typeof answer === "string" && answer.trim()) as Array<[string, string]> : [];

export function AdminApplicationsManager({ initialApplicationId, embedded = false }: { initialApplicationId?: string; embedded?: boolean }) {
  const [applications, setApplications] = useState<Summary[]>([]);
  const [selectedId, setSelectedId] = useState(initialApplicationId ?? "");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "new" | "shortlisted" | "reviewed">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);

  async function loadApplications() {
    setLoading(true);
    const response = await fetch("/api/admin/applications");
    if (!response.ok) throw new Error("Unable to load applications.");
    const payload = await response.json() as { applications: Summary[] };
    setApplications(payload.applications);
    setSelectedId((current) => current || payload.applications[0]?.id || "");
    setLoading(false);
  }
  async function loadDetail(applicationId: string) {
    if (!applicationId) { setDetail(null); return; }
    const response = await fetch(`/api/admin/applications/${applicationId}`);
    if (!response.ok) throw new Error("Unable to load applicants.");
    const payload = await response.json() as { application: Detail };
    setDetail(payload.application);
    setSelectedSubmissionId((current) => payload.application.submissions.some((item) => item.id === current) ? current : payload.application.submissions[0]?.id || "");
  }
  useEffect(() => { void loadApplications().catch((caught) => { setError((caught as Error).message); setLoading(false); }); }, []);
  useEffect(() => { void loadDetail(selectedId).catch((caught) => setError((caught as Error).message)); }, [selectedId]);

  const submissions = useMemo(() => (detail?.submissions ?? []).filter((submission) => {
    const name = `${submission.user.profile?.firstName ?? ""} ${submission.user.profile?.lastName ?? ""} ${submission.user.profile?.utdNetId ?? ""} ${submission.user.email}`.toLowerCase();
    if (query && !name.includes(query.toLowerCase())) return false;
    if (filter === "new") return submission.status === "SUBMITTED";
    if (filter === "shortlisted") return submission.status === "IN_CONSIDERATION";
    if (filter === "reviewed") return submission.reviews.length > 0;
    return true;
  }), [detail, filter, query]);
  const selectedSubmission = detail?.submissions.find((submission) => submission.id === selectedSubmissionId) ?? null;
  useEffect(() => { const review = selectedSubmission?.reviews[0]; setNotes(review?.notesInternal ?? ""); }, [selectedSubmissionId, selectedSubmission]);

  async function updateSubmission(status?: Status) {
    if (!detail || !selectedSubmission) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/admin/applications/${detail.id}/submissions/${selectedSubmission.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes, ...(status ? { status } : {}) }) });
      if (!response.ok) throw new Error("Unable to save this review.");
      await Promise.all([loadDetail(detail.id), loadApplications()]);
    } catch (caught) { setError((caught as Error).message); } finally { setSaving(false); }
  }
  async function createApplication(form: HTMLFormElement) {
    setSaving(true); setError(null);
    try {
      const values = new FormData(form);
      const response = await fetch("/api/admin/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(values), questions: questions.filter((question) => question.trim()) }) });
      if (!response.ok) { const body = await response.json().catch(() => null) as { error?: { message?: string } } | null; throw new Error(body?.error?.message ?? "Unable to create application."); }
      const { application } = await response.json() as { application: Summary };
      await loadApplications(); setSelectedId(application.id); setShowCreate(false); setQuestions([""]); form.reset();
    } catch (caught) { setError((caught as Error).message); } finally { setSaving(false); }
  }

  return <div className={embedded ? "min-w-0 flex-1 p-[46px]" : "min-h-screen bg-cream p-5 md:p-[46px]"}>
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="style-section-header text-ink">Applications</h1><p className="style-caption text-ink-faint">Create applications and review every submitted response.</p></div><Button onClick={() => setShowCreate(true)}>+ Create application</Button></div>
      {error ? <p className="rounded-lg border border-danger-border bg-white p-3 text-danger-ink">{error}</p> : null}
      {showCreate ? <div className="flex flex-col gap-2 rounded-2xl border border-border-soft bg-white p-5"><div className="flex justify-between"><span className="style-body-text">Application questions</span><Button type="button" size="sm" variant="outline" onClick={() => setQuestions((current) => [...current, ""])}>+ Add question</Button></div>{questions.map((question, index) => <div className="flex gap-2" key={index}><input className="flex-1 rounded-lg bg-search-field p-3" value={question} onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="Question for applicants"/><Button type="button" size="sm" variant="ghost" disabled={questions.length === 1} onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button></div>)}</div> : null}
      {showCreate ? <form onSubmit={(event) => { event.preventDefault(); void createApplication(event.currentTarget); }} className="grid grid-cols-1 gap-3 rounded-2xl border border-border-soft bg-white p-5 md:grid-cols-2"><input className="rounded-lg bg-search-field p-3" required name="title" placeholder="Application title"/><select className="rounded-lg bg-search-field p-3" name="programType" defaultValue="AI_ACADEMY"><option value="AI_ACADEMY">AI Academy</option><option value="AI_INNOVATION">AI Innovation</option><option value="AI_MENTORSHIP_MENTOR">AIM Mentor</option><option value="AI_MENTORSHIP_MENTEE">AIM Mentee</option><option value="OFFICER">Officer</option></select><textarea className="min-h-24 rounded-lg bg-search-field p-3 md:col-span-2" required name="description" placeholder="Description shown to applicants"/><label className="style-caption text-ink-muted">Open at<input className="mt-1 block rounded-lg bg-search-field p-3" required name="openAt" type="datetime-local"/></label><label className="style-caption text-ink-muted">Close at<input className="mt-1 block rounded-lg bg-search-field p-3" required name="closeAt" type="datetime-local"/></label><label className="style-caption text-ink-muted">Decision date<input className="mt-1 block rounded-lg bg-search-field p-3" name="decisionDate" type="datetime-local"/></label><label className="flex items-center gap-2 style-caption text-ink-muted"><input name="visibleToUsers" type="checkbox" defaultChecked value="true"/> Visible to users</label><div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create application"}</Button><Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button></div></form> : null}
      <div className="grid gap-4 lg:grid-cols-[330px_1fr]"><aside className="flex flex-col gap-2"><h2 className="style-body-text text-ink">All applications</h2>{loading ? <p className="text-ink-muted">Loading…</p> : applications.length ? applications.map((application) => <button type="button" key={application.id} onClick={() => setSelectedId(application.id)} className={`rounded-xl border p-4 text-left ${selectedId === application.id ? "border-brand bg-brand-soft" : "border-border-soft bg-white"}`}><p className="style-body-text text-ink">{application.title}</p><p className="style-caption text-ink-faint">{application.submissionCount} submitted · {localValue(application.closeAt)}</p></button>) : <p className="rounded-xl border border-border-soft bg-white p-4 text-ink-muted">No applications yet.</p>}</aside>
      <section className="min-w-0 rounded-2xl border border-border-soft bg-white p-4 md:p-6">{detail ? <><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="style-section-header text-ink">{detail.title}</h2><p className="style-caption text-ink-faint">{detail.submissions.length} received · {detail.acceptedCount ?? 0} accepted · closes {localValue(detail.closeAt)}</p></div><a className="style-caption text-brand" href={`/applications/detail?id=${detail.id}`} target="_blank">View user page ↗</a></div><div className="mt-5 grid gap-4 xl:grid-cols-[280px_1fr]"><div className="flex min-h-0 flex-col gap-2"><input className="rounded-lg bg-search-field p-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or NetID"/><div className="flex flex-wrap gap-1">{(["all", "new", "shortlisted", "reviewed"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1 style-caption ${filter === item ? "bg-brand text-white" : "bg-row-soft text-ink-muted"}`}>{item}</button>)}</div><div className="max-h-[530px] overflow-auto">{submissions.map((submission) => { const profile = submission.user.profile; const name = profile ? `${profile.firstName} ${profile.lastName}` : submission.user.email; return <button type="button" onClick={() => setSelectedSubmissionId(submission.id)} key={submission.id} className={`mt-2 w-full rounded-xl border p-3 text-left ${submission.id === selectedSubmissionId ? "border-brand" : "border-border-soft"}`}><p className="style-body-text">{name}</p><p className="style-caption text-ink-faint">{profile?.utdNetId ?? submission.user.email} · {statusLabel(submission.status)}</p></button>; })}{!submissions.length ? <p className="p-4 text-ink-muted">No matching applicants.</p> : null}</div></div>
      <div>{selectedSubmission ? <div className="flex flex-col gap-5"><div><h3 className="style-section-header text-ink">{selectedSubmission.user.profile ? `${selectedSubmission.user.profile.firstName} ${selectedSubmission.user.profile.lastName}` : selectedSubmission.user.email}</h3><p className="style-caption text-ink-faint">{selectedSubmission.user.profile?.utdNetId ?? "No NetID"} · {selectedSubmission.user.email} · submitted {localValue(selectedSubmission.submittedAt)}</p><div className="mt-2 flex flex-wrap gap-2">{selectedSubmission.user.profile?.resumeFile ? <a className="style-caption text-brand" href={`/api/admin/applications/${detail.id}/submissions/${selectedSubmission.id}/resume`}>Resume ↗</a> : null}{selectedSubmission.user.profile?.linkedinUrl ? <a className="style-caption text-brand" href={selectedSubmission.user.profile.linkedinUrl} target="_blank">LinkedIn ↗</a> : null}{selectedSubmission.user.profile?.githubUrl ? <a className="style-caption text-brand" href={selectedSubmission.user.profile.githubUrl} target="_blank">GitHub ↗</a> : null}{selectedSubmission.user.profile?.portfolioUrl ? <a className="style-caption text-brand" href={selectedSubmission.user.profile.portfolioUrl} target="_blank">Portfolio ↗</a> : null}</div></div><div className="rounded-xl bg-row-soft p-4">{fieldValues(selectedSubmission.formPayloadJson).map(([label, answer]) => <div key={label} className="mb-4 last:mb-0"><p className="style-caption text-ink-faint">{label}</p><p className="whitespace-pre-wrap style-body-text text-ink">{answer}</p></div>)}</div><div className="rounded-xl border border-border-soft p-4"><p className="style-body-text text-ink font-semibold">Review & Decision</p><textarea className="mt-3 min-h-24 w-full rounded-lg bg-search-field p-3 text-sm text-ink placeholder:text-ink-faint" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Internal notes for reviewers"/><div className="mt-3 flex flex-col gap-2.5"><div><Button size="sm" variant="ghost" disabled={saving} onClick={() => void updateSubmission()}>Save notes</Button></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="accent" disabled={saving} onClick={() => void updateSubmission("IN_CONSIDERATION")}>Shortlist</Button><Button size="sm" variant="primary" disabled={saving} onClick={() => void updateSubmission("ACCEPTED")}>Accept</Button><Button size="sm" variant="danger" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 font-semibold" disabled={saving} onClick={() => void updateSubmission("REJECTED")}>Reject</Button></div></div></div></div> : <p className="text-ink-muted">Select an applicant to view their application.</p>}</div></div></> : <p className="text-ink-muted">Select an application to view applicants.</p>}</section></div>
    </div></div>;
}
