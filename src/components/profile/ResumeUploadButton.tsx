"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadResumeAction } from "@/app/profile/resume";

type ResumeUploadButtonProps = {
  initialFileName?: string | null;
  hasResume: boolean;
};

export function ResumeUploadButton({
  initialFileName,
  hasResume,
}: ResumeUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(
    initialFileName ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const isUploaded = hasResume || Boolean(fileName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadResumeAction(formData);
      if (result.success && result.fileName) {
        setFileName(result.fileName);
      } else {
        setError(result.error ?? "Upload failed");
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileChange}
        disabled={isPending}
      />

      {/* State 1: Resume Uploaded Card */}
      {isUploaded ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 shadow-sm transition-all dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Success Check Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="flex flex-col truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Resume On File
                </span>
              </div>
              <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                {fileName || "Resume uploaded"}
              </span>
            </div>
          </div>

          {/* Replace Button */}
          <Button
            type="button"
            variant="outline"
            size="md"
            className="shrink-0 border-slate-300 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending ? "Uploading..." : "Replace"}
          </Button>
        </div>
      ) : (
        /* State 2: No Resume Uploaded Callout */
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V9.75l-4.5-4.5Z"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No resume uploaded
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                PDF, DOC, or DOCX up to 0.5MB
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="shrink-0 font-bold"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending ? "Uploading..." : "Upload Resume"}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}