import { cn } from "@/lib/utils";

type MobileFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  isMissing?: boolean;
};

/**
 * Labelled filled input matching the mobile design system's form fields
 * (Personal Info, Links sections).
 */
export function MobileField({ label, id, className, isMissing, ...props }: MobileFieldProps) {
  const inputId = id ?? `mf-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-[6px]">
      <label
        htmlFor={inputId}
        className="font-mobile-body text-[13px] font-bold text-ink"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-[10px] border px-[13px] py-[11px]",
          "font-mobile-body text-[14px] text-ink",
          "placeholder:text-field-ink focus:outline-none focus:ring-2",
          isMissing
            ? "border-red-500 bg-red-50 focus:ring-red-400/40"
            : "border-transparent bg-field focus:ring-brand/40",
          className
        )}
        {...props}
      />
    </div>
  );
}