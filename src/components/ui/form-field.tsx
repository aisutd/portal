import { cn } from "@/lib/utils";

type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Input height — the title field is slightly taller (46) than the rest (42). */
  height?: number;
};

/**
 * Bold-label + filled input used throughout the admin event form.
 * Filled stone field with a mono value, matching the Figma create-event form.
 */
export function FormField({
  label,
  height = 42,
  id,
  className,
  ...props
}: FormFieldProps) {
  const inputId = id ?? `f-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex w-full flex-col gap-[7px]">
      <label
        htmlFor={inputId}
        className="style-label-text text-[14px] leading-[20.3px] text-ink-muted"
      >
        {label}
      </label>
      <input
        id={inputId}
        style={{ height }}
        className={cn(
          "w-full rounded-[8px] bg-search-field px-[14px] style-input-text text-[12px] text-search-ink",
          "placeholder:text-search-ink focus:outline-none focus:ring-2 focus:ring-brand/40",
          className
        )}
        {...props}
      />
    </div>
  );
}

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

/**
 * Bold-label + bordered textarea (the event Description field).
 */
export function FormTextarea({
  label,
  id,
  className,
  ...props
}: FormTextareaProps) {
  const inputId = id ?? `f-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex w-full flex-col gap-[7px]">
      <label
        htmlFor={inputId}
        className="style-label-text text-[14px] leading-[20.3px] text-ink-muted"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        className={cn(
          "h-[96px] w-full resize-none rounded-[10px] border border-border-soft bg-white px-[14px] py-[10px]",
          "style-input-text text-[12px] text-ink placeholder:text-search-ink focus:outline-none focus:ring-2 focus:ring-brand/40",
          className
        )}
        {...props}
      />
    </div>
  );
}
