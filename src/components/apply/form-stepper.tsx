import { cn } from "@/lib/utils";

type FormStepperProps = {
  steps: string[];
  /** Index of the current step. */
  active?: number;
};

/**
 * Bordered segmented stepper (e.g. Personal / Long Answers / Review).
 * The active segment fills brand blue; segments are divided by hairlines.
 */
export function FormStepper({ steps, active = 0 }: FormStepperProps) {
  return (
    <div className="flex w-full overflow-hidden rounded-[11px] border border-border-soft bg-white">
      {steps.map((step, i) => {
        const isActive = i === active;
        return (
          <div
            key={step}
            className={cn(
              "flex flex-1 items-center justify-center py-[12px] text-center",
              i < steps.length - 1 && "border-r border-border-soft",
              isActive ? "bg-brand" : "bg-white"
            )}
          >
            <span
              className={cn(
                "font-display  font-semibold leading-[normal] [font-variation-settings:'wdth'_100]",
                isActive ? "text-white" : "text-ink-muted"
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
