import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  /** Optional right-aligned slot (a "View all" link, a badge, etc.). */
  action?: React.ReactNode;
  /** Override the default ink title colour (e.g. orange in Announcements). */
  titleClassName?: string;
  className?: string;
};

/**
 * Card heading row. The display face (Tektur) and 22px size are shared by every
 * panel title in the dashboard; the optional action sits on the trailing edge.
 */
export function SectionHeader({
  title,
  action,
  titleClassName,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between",
        className
      )}
    >
      <h2
        className={cn(
          "style-section-header text-[23px] leading-[25.96px] text-ink [font-variation-settings:'wdth'_100]",
          titleClassName
        )}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}
