import { FormField, FormTextarea } from "@/components/ui/form-field";
import { RESUME_FIELD } from "@/lib/application-form";

type MobileReadOnlyFieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  linkResume?: boolean;
};

export function MobileReadOnlyField({
  label,
  value,
  multiline = false,
  linkResume = false,
}: MobileReadOnlyFieldProps) {
  if (label === RESUME_FIELD) {
    return (
      <div className="flex flex-col gap-[6px]">
        <label className="style-mobile-body font-bold text-ink">{label}</label>
        {linkResume ? (
          <a
            href="/api/profile/resume/download"
            className="flex h-[40px] items-center rounded-[10px] bg-field px-[13px] style-caption text-ink transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
            title={value}
          >
            <span className="truncate">{value || "Download resume"}</span>
          </a>
        ) : (
          <span
            className="flex h-[40px] items-center rounded-[10px] bg-field px-[13px] style-caption text-ink"
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
    return <FormTextarea {...commonProps} className="cursor-default h-[120px]" />;
  }

  return <FormField {...commonProps} className="cursor-default" />;
}
