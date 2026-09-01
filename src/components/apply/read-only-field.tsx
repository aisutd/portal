import { isRequiredField, type QuestionConfig } from "@/lib/application-form";

type ReadOnlyFieldProps = {
  label: string;
  value: string;
  config?: QuestionConfig;
};

/** Extracts and cleans filename from Cloudflare / Storage URLs */
function extractCleanFileName(urlOrPath: string): string {
  try {
    const parsed = new URL(urlOrPath);
    const rawName = parsed.pathname.split("/").pop() || "Uploaded File";
    const decoded = decodeURIComponent(rawName);
    return decoded.replace(/^[a-f0-9-]{36}_?/i, "").replace(/^\d+_\s*/, "");
  } catch {
    return decodeURIComponent(urlOrPath.split("/").pop() || "Uploaded File")
      .replace(/^[a-f0-9-]{36}_?/i, "")
      .replace(/^\d+_\s*/, "");
  }
}

export function ReadOnlyField({ label, value, config }: ReadOnlyFieldProps) {
  const required = isRequiredField(label, config ? { [label]: config } : undefined);
  const displayLabel = required && !label.includes("*") ? `${label} *` : label;
  const rawType = String(config?.type || "").toUpperCase().trim();
  const cleanLabel = label.replace(/\s*\*$/, "");

  const isUrl =
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"));

  const isCloudflareStorage =
    isUrl &&
    (value.includes("cloudflare") ||
      value.includes("r2.dev") ||
      value.includes("storage"));

  let displayFileName = "";
  let fileUrl = "";
  const isFileField = rawType === "FILE" || cleanLabel === "Resume" || isCloudflareStorage;

  if (isFileField && value) {
    try {
      const parsed = JSON.parse(value);
      fileUrl = parsed.url || (isUrl ? value : "");
      displayFileName =
        parsed.fileName ||
        parsed.name ||
        (fileUrl ? extractCleanFileName(fileUrl) : extractCleanFileName(value));
    } catch {
      if (isUrl) {
        fileUrl = value;
        displayFileName = extractCleanFileName(value);
      } else {
        displayFileName = extractCleanFileName(value);
      }
    }
  }

  // Fallback resume download link if non-JSON profile resume value
  if (cleanLabel === "Resume" && !fileUrl) {
    fileUrl = "/api/profile/resume/download";
  }

  const isLongText =
    rawType === "LONG_TEXT" ||
    rawType === "LONGTEXT" ||
    rawType === "TEXTAREA" ||
    rawType === "PARAGRAPH" ||
    rawType === "ESSAY" ||
    value.length > 100 ||
    value.includes("\n");

  const formattedValue = !value || value.trim() === "" ? "Not specified" : value;
  const isUnspecified = !value || value.trim() === "";

  // 1. FILE ATTACHMENT DISPLAY CARD
  if (isFileField) {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <label className="style-label-text font-medium text-ink-muted">{displayLabel}</label>
        <div className="flex h-11 w-full items-center justify-between rounded-xl border border-border-soft/60 bg-[#f5f4f0] px-3.5 text-sm">
          <div className="flex items-center gap-2 truncate">
            <svg className="h-4 w-4 shrink-0 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className={`truncate ${isUnspecified ? "italic text-ink-faint" : "font-medium text-ink"}`}>
              {displayFileName || "No file uploaded"}
            </span>
          </div>
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 shrink-0 text-xs font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              View File
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  // 2. MULTI-LINE LONG TEXT REVIEW FIELD
  if (isLongText) {
    return (
      <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
        <label className="style-label-text font-medium text-ink-muted">{displayLabel}</label>
        <div className={`style-body-text min-h-[140px] w-full whitespace-pre-wrap rounded-xl border border-border-soft/60 bg-[#f5f4f0] p-4 leading-relaxed ${isUnspecified ? "italic text-ink-faint" : "text-ink"}`}>
          {formattedValue}
        </div>
      </div>
    );
  }

  // 3. STANDARD SINGLE-LINE REVIEW FIELD
  return (
    <div className="flex flex-col gap-1.5">
      <label className="style-label-text font-medium text-ink-muted">{displayLabel}</label>
      <div className={`style-body-text flex h-11 w-full items-center rounded-xl border border-border-soft/60 bg-[#f5f4f0] px-3.5 ${isUnspecified ? "italic text-ink-faint" : "text-ink"}`}>
        <span className="truncate">{formattedValue}</span>
      </div>
    </div>
  );
}