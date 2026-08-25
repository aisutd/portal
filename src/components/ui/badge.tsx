import { cn } from "@/lib/utils";

type BadgeProps = {
  label: string;
  variant?: "solid" | "outline";
  /** Background colour for the solid variant. */
  bg?: string;
  /** Text colour. */
  color?: string;
  className?: string;
};

/**
 * Pill-shaped status badge used for application states and the announcements
 * counter. "solid" fills with a tinted background; "outline" is a white pill
 * with the soft border (the "Draft" state).
 */
export function Badge({
  label,
  variant = "solid",
  bg,
  color,
  className,
}: BadgeProps) {
  if (variant === "outline") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-border-soft bg-white px-[15px] py-[6px] style-badge-text  leading-[normal] text-ink-muted",
          className
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[14px] py-[5px] style-badge-text  leading-[normal]",
        className
      )}
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}
