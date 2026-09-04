import { Tag } from "@/components/ui/tag";

export type RoleTagData = {
  label: string;
  bg?: string;
  color?: string;
  border?: string;
};

export type Role = {
  title: string;
  description?: string;
  /** Tag rows, each rendered right-aligned (brand row, then neutral row). */
  tagRows?: RoleTagData[][];
};

/**
 * A single open role: title + blurb on the left, tech-stack tag pills grouped
 * into right-aligned rows on the right.
 */
export function RoleCard({ title, description, tagRows = [] }: Role) {
  const hasTagRows = Array.isArray(tagRows) && tagRows.length > 0;

  return (
    <div className="flex w-full flex-col gap-[16px] rounded-[16px] border border-border-soft bg-white p-[29px] sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-px flex-1 flex-col gap-[10px]">
        <h3 className="style-page-subtitle leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
          {title}
        </h3>
        {description ? (
          <p className="style-body-text leading-[20.3px] text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>

      {hasTagRows ? (
        <div className="flex shrink-0 flex-col items-start gap-[8px] sm:items-end">
          {tagRows.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-[8px] sm:justify-end">
              {Array.isArray(row)
                ? row.map((t) => (
                    <Tag
                      key={t.label}
                      label={t.label}
                      bg={t.bg ?? "transparent"}
                      color={t.color ?? "inherit"}
                      border={t.border ?? "transparent"}
                    />
                  ))
                : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}