import { cn } from "@/lib/utils";

type TagProps = {
  label: string;
  /** Background colour (hex or tailwind arbitrary value). */
  bg: string;
  /** Text colour (hex or tailwind arbitrary value). */
  color: string;
  /** Optional border colour (the program tags carry a hairline border). */
  border?: string;
  className?: string;
};

/**
 * Small monospace category pill (e.g. "social", "workshop", "Beginner").
 * Colours are passed explicitly because each tag has its own pairing in design.
 */
export function Tag({ label, bg, color, border, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-[13px] py-[6px] style-caption leading-[normal] tracking-[0.3px]",
        className
      )}
      style={{
        backgroundColor: bg,
        color,
        borderColor: border ?? "transparent",
      }}
    >
      {label}
    </span>
  );
}
