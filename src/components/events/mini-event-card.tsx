export type MiniEvent = {
  icon: string;
  date: string;
  title: string;
  description: string;
};

/**
 * Small horizontal card for a recurring event (icon tile + text).
 */
export function MiniEventCard({ icon, date, title, description }: MiniEvent) {
  return (
    <div className="flex items-center gap-[14px] rounded-[16px] border border-border-soft bg-purple-soft p-[21px]">
      <div className="flex size-[70px] shrink-0 items-center justify-center rounded-[12px] bg-[#cfcbe0] ">
        {icon}
      </div>
      <div className="min-w-px flex-1">
        <p className="style-meta-text  leading-[16.8px] tracking-[0.2px] text-purple-ink">
          {date}
        </p>
        <h3 className="style-card-title  leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
          {title}
        </h3>
        <p className="style-body-text  leading-[20.3px] text-ink-muted">
          {description}
        </p>
      </div>
    </div>
  );
}
