import { cn } from "@/lib/utils";
import { useState } from "react";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Visible label rendered above the input. */
  label: string;
  showToggle?: boolean;
};

/**
 * Labelled text input used by the onboarding / auth cards.
 * Soft filled field (#ece9e2) with a Space Mono value, matching the Figma form.
 */
export function Field({
  label,
  id,
  className,
  showToggle = false,
  required,
  type = "text",
  ...props
}: FieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const [visible, setIsVisible] = useState(false);

  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="flex flex-col">
      <div className="mb-[10px] flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="style-label-text leading-[normal] text-label-ink"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {showToggle && (
          <button
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            className="text-xs font-medium text-ink-muted hover:text-ink-card focus:outline-none"
          >
            {visible ? "Hide" : "Show"}
          </button>
        )}
      </div>

      <input
        id={inputId}
        type={inputType}
        required={required}
        className={cn(
          "w-full rounded-[7px] border border-transparent bg-field px-[13px] py-3",
          "style-input-text leading-[normal] text-ink-card",
          "placeholder:text-field-ink focus:outline-none focus:ring-2 focus:ring-brand/40",
          className
        )}
        {...props}
      />
    </div>
  );
}