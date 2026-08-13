import { cn } from "@/lib/utils";

type FormStepperProps = {
  steps: string[];
  /** Index of the current step. */
  active?: number;
  /** Use the inverted treatment for placement directly on a brand-blue background. */
  onDark?: boolean;
};

/**
 * Bordered segmented stepper (e.g. Personal / Long Answers / Review).
 * The active segment fills brand blue; segments are divided by hairlines.
 * Pass `onDark` when the stepper sits directly on a blue page background
 * (e.g. the profile setup wizard) rather than on a white/cream one.
 */
export function FormStepper({ steps, active = 0, onDark = false }: FormStepperProps) {
  return (
    <div
      className={cn(
        "flex w-full overflow-hidden rounded-[11px] border",
        onDark ? "border-white/30 bg-white/10" : "border-border-soft bg-white"
      )}
    >
      {steps.map((step, i) => {
        const isActive = i === active;
        return (
          <div
            key={step}
            className={cn(
              "flex flex-1 items-center justify-center py-[12px] text-center",
              i < steps.length - 1 && (onDark ? "border-r border-white/30" : "border-r border-border-soft"),
              isActive ? (onDark ? "bg-white" : "bg-brand") : "bg-transparent"
            )}
          >
            <span
              className={cn(
                "font-display text-[15px] font-semibold leading-[normal] [font-variation-settings:'wdth'_100]",
                isActive
                  ? (onDark ? "text-brand" : "text-white")
                  : (onDark ? "text-white/70" : "text-ink-muted")
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
