import { prisma } from "@/lib/prisma";
import { getAdminViewer } from "@/lib/admin-access";
import { canManageEventArchive } from "@/lib/roles";
import { ArchivedEventActions } from "./event-bulk-selection";

export async function ArchivedEvents() {
  const viewer = await getAdminViewer();
  if (!canManageEventArchive(viewer?.role)) return null;
  const events = await prisma.event.findMany({ where: { isArchived: true }, orderBy: { startTime: "asc" }, include: { items: true, _count: { select: { rsvps: true } } } });
  return <section className="flex flex-col gap-3">
    <h3 className="style-section-header text-ink">Archived Events ({events.length})</h3>
    {!events.length && <p className="rounded-xl border border-dashed border-border-soft p-4 style-caption text-ink-faint">No archived events.</p>}
    {events.map((event) => <div key={event.id} className="rounded-2xl border border-border-soft bg-white p-4">
      <h4 className="font-semibold text-ink">{event.title}</h4>
      <p className="style-caption text-ink-faint">{event.location}</p>
      <details className="my-2">
        <summary className="cursor-pointer text-brand">View</summary>
        <div className="flex flex-col gap-2 py-3 text-ink">
          <p className="whitespace-pre-wrap">{event.description}</p>
          <p>{event.startTime.toLocaleString("en-US", { timeZone: "America/Chicago" })} – {event.endTime.toLocaleString("en-US", { timeZone: "America/Chicago" })} (America/Chicago)</p>
          <p>Capacity: {event.capacity ?? "Not set"} · RSVPs: {event._count.rsvps}</p>
          <p>Tags: {event.tags.join(", ") || "None"}</p>
          <p>Programs: {event.programs.join(", ") || "None"}</p>
          {event.items.length > 0 && <p>Items: {event.items.map((item) => item.name).join(", ")}</p>}
        </div>
      </details>
      <ArchivedEventActions id={event.id} />
    </div>)}
  </section>;
}
