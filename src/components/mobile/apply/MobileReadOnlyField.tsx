import { isRequiredField, type QuestionConfig } from "@/lib/application-form";

type MobileReadOnlyFieldProps = {
  label: string;
  value: string;
  config?: QuestionConfig;
  multiline?: boolean;
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

export function MobileReadOnlyField({
  label,
  value,
  config,
  multiline = false,
}: MobileReadOnlyFieldProps) {
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

  // Handle fallback resume route when fileUrl isn't embedded directly in JSON/string
  if (cleanLabel === "Resume" && !fileUrl) {
    fileUrl = "/api/profile/resume/download";
  }

  const isLongText =
    multiline ||
    rawType === "LONG_TEXT" ||
    rawType === "LONGTEXT" ||
    rawType === "TEXTAREA" ||
    rawType === "PARAGRAPH" ||
    rawType === "ESSAY" ||
    value.length > 100 ||
    value.includes("\n");

  const formattedValue = !value || value.trim() === "" ? "Not specified" : value;
  const isUnspecified = !value || value.trim() === "";

  // 1. FILE FIELD DISPLAY
  if (isFileField) {
    return (
      <div className="flex flex-col gap-[6px]">
        <label className="style-mobile-body font-bold text-ink">{displayLabel}</label>
        <div className="flex h-[40px] items-center justify-between rounded-[10px] bg-field px-[13px] style-caption text-ink">
          <span className={`truncate ${isUnspecified ? "text-ink-faint italic" : ""}`}>
            {displayFileName || "No file selected"}
          </span>
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 shrink-0 font-bold text-brand underline underline-offset-2"
            >
              View File
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  // 2. MULTI-LINE LONG TEXT FIELD
  if (isLongText) {
    return (
      <div className="flex flex-col gap-[6px]">
        <label className="style-mobile-body font-bold text-ink">{displayLabel}</label>
        <div
          className={`min-h-[100px] w-full rounded-[10px] bg-field p-[13px] style-mobile-body whitespace-pre-wrap leading-relaxed ${
            isUnspecified ? "text-ink-faint italic" : "text-ink"
          }`}
        >
          {formattedValue}
        </div>
      </div>
    );
  }

  // 3. STANDARD SINGLE-LINE FIELD
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="style-mobile-body font-bold text-ink">{displayLabel}</label>
      <div
        className={`flex h-[40px] items-center rounded-[10px] bg-field px-[13px] style-caption ${
          isUnspecified ? "text-ink-faint italic" : "text-ink"
        }`}
      >
        <span className="truncate">{formattedValue}</span>
      </div>
    </div>
  );
}