"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadResumeAction, deleteResumeAction } from "@/app/profile/resume";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

type ResumeUploadButtonProps = {
  initialFileName?: string | null;
  initialFileSize?: number | null;
  hasResume: boolean;
};

function formatFileSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeUploadButton({
  initialFileName,
  initialFileSize,
  hasResume,
}: ResumeUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasFile, setHasFile] = useState(hasResume || Boolean(initialFileName));
  const [fileName, setFileName] = useState<string | null>(
    initialFileName ?? null
  );
  const [fileSize, setFileSize] = useState<number | null>(
    initialFileSize ?? null
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
    setFileSize(initialFileSize ?? null);
  }, [hasResume, initialFileName, initialFileSize]);

  const isUploaded = hasFile || Boolean(fileName);
  const formattedSize = formatFileSize(fileSize);

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setFileSizeErrorModal({
        open: true,
        title: "Resume Too Large",
        message:
          "Your resume exceeds the 1MB file size limit. Please upload a file smaller than 1MB.",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        if (result.fileSize) {
          setFileSize(result.fileSize);
        }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isPending) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
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
          setFileSize(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          setError(result.error ?? "Failed to delete resume");
        }
      } catch {
        setError("Failed to delete resume");
      } finally {
        setIsDeleting(false);
      }
    });
  };

  return (
    <>
      <div className="w-full flex flex-col gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onClick={(e) => {
            (e.currentTarget as HTMLInputElement).value = "";
          }}
          onChange={handleFileChange}
          disabled={isPending}
        />

        {/* State 1: Resume Uploaded Card */}
        {isUploaded ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border-soft bg-[#faf9f6] p-4 transition-all">
            <div className="flex items-start gap-3 min-w-0">
              {/* Document Page Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft border border-brand/15 text-brand shadow-2xs">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>

              {/* File Info */}
              <div className="flex flex-1 flex-col min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-checked px-2 py-0.5 text-[10px] font-bold text-checked-text uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-checked-text" />
                    On File
                  </span>
                  {formattedSize ? (
                    <span className="style-meta-text text-ink-faint text-[11px]">
                      {formattedSize}
                    </span>
                  ) : null}
                </div>
                <a
                  href="/api/profile/resume/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Click to view or download resume"
                  className="style-body-text font-bold text-ink truncate text-sm hover:text-brand hover:underline transition-colors flex items-center gap-1.5 group"
                >
                  <span className="truncate">{fileName || "Resume"}</span>
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-ink-faint group-hover:text-brand transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-soft/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 text-xs font-semibold gap-1.5"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span>{isPending && !isDeleting ? "Uploading..." : "Replace"}</span>
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                className="text-xs px-3 font-semibold gap-1.5"
                disabled={isPending}
                onClick={handleDeleteResume}
                title="Delete resume from profile"
              >
                {isDeleting ? (
                  <span className="text-xs">Deleting...</span>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* State 2: No Resume Uploaded Dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none",
              isDragging
                ? "border-brand bg-brand-soft/30 ring-2 ring-brand/20"
                : "border-border-soft bg-row-soft/60 hover:bg-row-soft hover:border-brand/40"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-border-soft text-brand group-hover:scale-105 group-hover:bg-brand group-hover:text-white transition-all shadow-2xs">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="style-card-title text-ink text-sm sm:text-base">
                {isPending && !isDeleting ? "Uploading resume..." : "Upload your resume"}
              </p>
              <p className="style-caption text-ink-muted text-xs">
                Drag & drop your file here, or click to browse
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-stone-soft px-2.5 py-0.5 text-[11px] font-medium text-stone-ink">
              <span>PDF, DOC, DOCX</span>
              <span>•</span>
              <span>Max 1MB</span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-1 font-bold"
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {isPending && !isDeleting ? "Uploading..." : "Choose File"}
            </Button>
          </div>
        )}

        <p className="style-caption text-ink-faint text-xs leading-relaxed">
          Your profile resume will automatically autofill into any new applications you start.
        </p>

        {error && (
          <p className="style-caption font-medium text-[#9a3b36]">
            {error}
          </p>
        )}
      </div>

      {/* Styled File Size Error Modal */}
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