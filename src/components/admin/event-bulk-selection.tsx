"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { manageEvents } from "@/app/admin/events/bulk-actions";

const Selection = createContext<{ selected: string[]; toggle: (id: string) => void; pending: boolean } | null>(null);

export function EventBulkSelection({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  if (!enabled) return children;
  function run(action: string) {
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${selected.length} selected events?${action === "delete" ? " All associated RSVPs and data will be permanently removed." : ""}`)) return;
    startTransition(async () => {
      setError("");
      try { await manageEvents(selected, action); setSelected([]); }
      catch { setError("Unable to update events. Refresh and try again."); }
    });
  }
  return <Selection.Provider value={{ selected, pending, toggle: (id) => setSelected((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]) }}>
    <div className="flex flex-wrap items-center gap-2" aria-label="Bulk event actions">
      <span className="style-caption">{selected.length} selected</span>
      {["archive", "delete", "publish", "unpublish"].map((action) => <Button key={action} type="button" variant="ghost" size="sm" disabled={pending || !selected.length} onClick={() => run(action)}>{action.charAt(0).toUpperCase() + action.slice(1)}</Button>)}
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>
    {children}
  </Selection.Provider>;
}

export function EventSelectionCheckbox({ id, title }: { id: string; title: string }) {
  const selection = useContext(Selection);
  if (!selection) return null;
  return <input type="checkbox" aria-label={`Select ${title}`} checked={selection.selected.includes(id)} disabled={selection.pending} onChange={() => selection.toggle(id)} className="h-4 w-4 shrink-0" />;
}

export function ArchivedEventActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function run(action: string) {
    if (action === "delete" && !window.confirm("Delete this archived event? All associated RSVPs and data will be permanently removed.")) return;
    startTransition(async () => {
      setError("");
      try { await manageEvents([id], action, true); }
      catch { setError("Unable to update event. Refresh and try again."); }
    });
  }
  return <div className="flex gap-2">
    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run("restore")}>Restore</Button>
    <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run("delete")}>Delete</Button>
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </div>;
}
