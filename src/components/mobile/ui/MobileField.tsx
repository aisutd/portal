import { cn } from "@/lib/utils";
import { useId } from "react";

type MobileFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

/**
 * Labelled filled input matching the mobile design system's form fields
 * (Personal Info, Links sections).
 */
export function MobileField({ label, id, className, ...props }: MobileFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `mf-${generatedId}`;

  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={inputId}
        className="style-label-text  text-ink"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-[10px] border px-[13px] py-[11px]",
          "font-mobile-body  text-ink",
          "placeholder:text-field-ink focus:outline-none focus:ring-2",
          "border-transparent bg-field focus:ring-brand/40",
          className
        )}
        {...props}
      />
    </div>
  );
}