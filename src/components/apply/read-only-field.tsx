import { FormField, FormTextarea } from "@/components/ui/form-field";
import { RESUME_FIELD } from "@/lib/application-form";

type ReadOnlyFieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  linkResume?: boolean;
};

export function ReadOnlyField({
  label,
  value,
  multiline = false,
  linkResume = false,
}: ReadOnlyFieldProps) {
  if (label === RESUME_FIELD) {
    return (
      <div className="flex w-full flex-col gap-[7px]">
        <label className="style-body-text leading-[20.3px] text-ink-muted">
          {label}
        </label>
        {linkResume ? (
          <a
            href="/api/profile/resume/download"
            className="flex h-[42px] w-full items-center rounded-[8px] bg-search-field px-[14px] style-caption text-search-ink transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
            title={value}
          >
            <span className="truncate">{value || "Download resume"}</span>
          </a>
        ) : (
          <span
            className="flex h-[42px] w-full items-center rounded-[8px] bg-search-field px-[14px] style-caption text-search-ink"
            title={value}
          >
            <span className="truncate">{value || "No file selected"}</span>
          </span>
        )}
      </div>
    );
  }

  const commonProps = {
    label,
    value,
    readOnly: true,
    tabIndex: -1,
  };

  if (multiline) {
    return <FormTextarea {...commonProps} className="cursor-default h-[140px]" />;
  }

  return <FormField {...commonProps} className="cursor-default" />;
}
