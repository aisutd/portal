import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminAcademyShell } from "@/components/admin/academy-shell";
import { AcademyTabs } from "@/components/admin/academy-tabs";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/admin/confirm-form";
import {
  createResource,
  deleteResource,
  moveResource,
  toggleResourcePublished,
  updateResource,
} from "../resource-actions";

export const metadata: Metadata = {
  title: "AIS Admin — Academy Resources",
  description: "Manage the resources shown on the AI Academy hub.",
};

const inputClass =
  "h-[42px] w-full rounded-[12px] border border-border-soft bg-white px-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand";

export default async function AcademyResourcesPage() {
  const resources = await prisma.academyResource.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      href: true,
      isPublished: true,
    },
  });

  const publishedCount = resources.filter((r) => r.isPublished).length;
  const draftCount = resources.length - publishedCount;
  const categoriesCount = new Set(
    resources.map((r) => r.category).filter(Boolean)
  ).size;

  const stats = [
    { value: String(resources.length), label: "total resources" },
    { value: String(publishedCount), label: "published", highlight: true },
    { value: String(draftCount), label: "drafts" },
    { value: String(categoriesCount), label: "categories" },
  ];

  return (
    <AdminAcademyShell>
      <AcademyTabs active="Resources" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="style-section-header leading-[34.56px] tracking-[-0.4px] text-ink [font-variation-settings:'wdth'_100]">
            Academy Resources
          </h2>
          <p className="style-caption mt-1 text-ink-faint">
            Guides, cheat sheets, and starter kits listed on the Academy hub. Only published resources are visible to members.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid w-full grid-cols-2 gap-[12px] lg:flex lg:gap-[16px]">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="flex flex-col gap-[28px]">
        {/* Add Resource Form */}
        <form
          action={createResource}
          className="flex flex-col gap-5 rounded-[16px] border border-border-soft bg-white p-[24px]"
        >
          <h3 className="style-section-header text-ink">Add a Resource</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="new-title" className="style-caption font-medium text-ink-muted">
                Title *
              </label>
              <input
                id="new-title"
                name="title"
                required
                placeholder="e.g. ML Cheat Sheet"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="new-category" className="style-caption font-medium text-ink-muted">
                Category
              </label>
              <input
                id="new-category"
                name="category"
                placeholder="e.g. Reference"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-[6px] md:col-span-2">
              <label htmlFor="new-href" className="style-caption font-medium text-ink-muted">
                Link *
              </label>
              <input
                id="new-href"
                name="href"
                type="url"
                required
                placeholder="https://drive.google.com/…"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-[6px] md:col-span-2">
              <label htmlFor="new-description" className="style-caption font-medium text-ink-muted">
                Description
              </label>
              <textarea
                id="new-description"
                name="description"
                rows={2}
                placeholder="One or two sentences on what this is and who it's for."
                className="w-full rounded-[12px] border border-border-soft bg-white p-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md">
              + Add Resource
            </Button>
          </div>
        </form>

        {/* Resources List */}
        <div className="flex flex-col gap-[12px]">
          <h3 className="style-section-header text-ink">
            All Resources ({resources.length})
          </h3>

          {resources.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-soft p-4 text-center style-caption text-ink-faint">
              No resources yet. Add one above and it will appear on the Academy hub once published.
            </p>
          ) : (
            resources.map((resource, index) => (
              <div
                key={resource.id}
                className="flex flex-col gap-4 rounded-[16px] border border-border-soft bg-white p-[20px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`style-caption rounded-full px-3 py-0.5 font-semibold ${
                        resource.isPublished
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {resource.isPublished ? "Published" : "Draft"}
                    </span>

                    <div className="flex items-center gap-1 pl-2">
                      <form action={moveResource}>
                        <input type="hidden" name="id" value={resource.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={index === 0}
                          title="Move up"
                          className="h-8 w-8 p-0 text-ink-muted disabled:opacity-30"
                        >
                          ↑
                        </Button>
                      </form>

                      <form action={moveResource}>
                        <input type="hidden" name="id" value={resource.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={index === resources.length - 1}
                          title="Move down"
                          className="h-8 w-8 p-0 text-ink-muted disabled:opacity-30"
                        >
                          ↓
                        </Button>
                      </form>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Publish / Unpublish Confirmation Form */}
                    <ConfirmForm
                      action={toggleResourcePublished}
                      confirmMessage={
                        resource.isPublished
                          ? `Are you sure you want to unpublish "${resource.title}"? Members will no longer be able to view it.`
                          : `Are you sure you want to publish "${resource.title}"?`
                      }
                    >
                      <input type="hidden" name="id" value={resource.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        {resource.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                    </ConfirmForm>

                    {/* Delete Confirmation Form */}
                    <ConfirmForm
                      action={deleteResource}
                      confirmMessage={`Are you sure you want to delete "${resource.title}"? This action cannot be undone.`}
                    >
                      <input type="hidden" name="id" value={resource.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="style-caption font-semibold text-danger-ink hover:bg-danger-border/20"
                      >
                        Delete
                      </Button>
                    </ConfirmForm>
                  </div>
                </div>

                <form action={updateResource} className="flex flex-col gap-4">
                  <input type="hidden" name="id" value={resource.id} />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-[6px]">
                      <label className="style-caption font-medium text-ink-muted">Title</label>
                      <input
                        name="title"
                        required
                        defaultValue={resource.title}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-[6px]">
                      <label className="style-caption font-medium text-ink-muted">Category</label>
                      <input
                        name="category"
                        defaultValue={resource.category ?? ""}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-[6px] md:col-span-2">
                      <label className="style-caption font-medium text-ink-muted">Link</label>
                      <input
                        name="href"
                        type="url"
                        required
                        defaultValue={resource.href ?? ""}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-[6px] md:col-span-2">
                      <label className="style-caption font-medium text-ink-muted">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={resource.description ?? ""}
                        className="w-full rounded-[12px] border border-border-soft bg-white p-3.5 style-body-text text-ink outline-none transition-colors focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button type="submit" size="sm" variant="ghost">
                      Save changes
                    </Button>
                  </div>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminAcademyShell>
  );
}
