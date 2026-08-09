import { cn } from "@/lib/utils";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Visible label rendered above the input. */
  label: string;
};

/**
 * Labelled text input used by the onboarding / auth cards.
 * Soft filled field (#ece9e2) with a Space Mono value, matching the Figma form.
 */
export function Field({ label, id, className, required, ...props }: FieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col">
      <label
        htmlFor={inputId}
        className="mb-[10px] font-grotesk text-[13px] font-semibold leading-[normal] text-label-ink"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        required={required}
        className={cn(
          "w-full rounded-[7px] border border-transparent bg-field px-[13px] py-[12px]",
          "font-mono-alt text-[13px] leading-[normal] text-ink-card",
          "placeholder:text-field-ink focus:outline-none focus:ring-2 focus:ring-brand/40",
          className
        )}
        {...props}
      />
    </div>
  );
}
