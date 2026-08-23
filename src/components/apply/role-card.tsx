import { Tag } from "@/components/ui/tag";
import type { TagData } from "@/components/dashboard/up-next-card";

export type Role = {
  title: string;
  description: string;
  /** Tag rows, each rendered right-aligned (brand row, then neutral row). */
  tagRows: TagData[][];
};

/**
 * A single open role: title + blurb on the left, tech-stack tag pills grouped
 * into right-aligned rows on the right.
 */
export function RoleCard({ title, description, tagRows }: Role) {
  return (
    <div className="flex w-full flex-col gap-[16px] rounded-[16px] border border-border-soft bg-white p-[29px] sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-px flex-1 flex-col gap-[10px]">
        <h3 className="style-card-title text-[17px] leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
          {title}
        </h3>
        <p className="style-body-text text-[14px] leading-[20.3px] text-ink-muted">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-[8px] sm:items-end">
        {tagRows.map((row, i) => (
          <div key={i} className="flex flex-wrap gap-[8px] sm:justify-end">
            {row.map((t) => (
              <Tag
                key={t.label}
                label={t.label}
                bg={t.bg}
                color={t.color}
                border={t.border}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
