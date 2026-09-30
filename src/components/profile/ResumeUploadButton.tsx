"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadResumeAction, deleteResumeAction } from "@/app/profile/resume";

const MAX_FILE_SIZE = 1024 * 1024;

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasFile, setHasFile] = useState(hasResume || Boolean(initialFileName));
  const [fileName, setFileName] = useState<string | null>(
    initialFileName ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [fileSizeErrorModal, setFileSizeErrorModal] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    setHasFile(hasResume || Boolean(initialFileName));
    setFileName(initialFileName ?? null);
  }, [hasResume, initialFileName]);

  const isUploaded = hasFile || Boolean(fileName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileSizeErrorModal({
        open: true,
        title: "Resume Too Large",
        message:
          "Your resume exceeds the 1MB file size limit. Please upload a file smaller than 1MB.",
      });
      e.target.value = ""; // Clear selected file
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadResumeAction(formData);
      if (result.success && result.fileName) {
        setHasFile(true);
        setFileName(result.fileName);
      } else {
        if (
          result.error?.toLowerCase().includes("exceeds") ||
          result.error?.toLowerCase().includes("limit") ||
          result.error?.toLowerCase().includes("large") ||
          result.error?.toLowerCase().includes("1mb")
        ) {
          setFileSizeErrorModal({
            open: true,
            title: "Resume Too Large",
            message:
              result.error ||
              "Your resume exceeds the 1MB file size limit. Please upload a file smaller than 1MB.",
          });
        }
        setError(result.error ?? "Upload failed");
      }
    });
  };

  const handleDeleteResume = () => {
    setError(null);
    setIsDeleting(true);
    startTransition(async () => {
      try {
        const result = await deleteResumeAction();
        if (result.success) {
          setHasFile(false);
          setFileName(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          setError(result.error ?? "Failed to delete resume");
        }
      } catch (err) {
        setError("Failed to delete resume");
      } finally {
        setIsDeleting(false);
      }
    });
  };

  return (
    <>
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
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
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

              <div className="flex flex-col truncate min-w-0">
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

            <div className="flex items-center gap-2 shrink-0">
              {/* Replace Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-300 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {isPending && !isDeleting ? "Uploading..." : "Replace"}
              </Button>

              {/* Delete Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                disabled={isPending}
                onClick={handleDeleteResume}
                title="Delete resume"
              >
                {isDeleting ? (
                  <span className="text-xs">Deleting...</span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                )}
              </Button>
            </div>
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
                  PDF, DOC, or DOCX up to 1MB
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
              {isPending && !isDeleting ? "Uploading..." : "Upload Resume"}
            </Button>
          </div>
        )}

        {error && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Styled File Size Error Modal matching Apply Form */}
      {fileSizeErrorModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border-soft bg-white p-6 shadow-xl flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <h3 className="style-section-header text-xl font-bold text-ink">
              {fileSizeErrorModal.title}
            </h3>

            <p className="mt-2 text-sm text-ink-muted">
              {fileSizeErrorModal.message}
            </p>

            <div className="mt-6 flex w-full justify-center">
              <button
                type="button"
                className="flex h-10 w-full sm:w-auto min-w-[120px] items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition-opacity hover:opacity-95 cursor-pointer"
                onClick={() =>
                  setFileSizeErrorModal({ open: false, title: "", message: "" })
                }
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}