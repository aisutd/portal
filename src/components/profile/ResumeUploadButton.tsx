"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ResumeUploadButtonProps = {
  initialFileName?: string | null;
  hasResume?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "desktop" | "mobile";
};

export function ResumeUploadButton({
  initialFileName,
  hasResume,
  size = "md",
  variant = "desktop",
}: ResumeUploadButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const [isUploaded, setIsUploaded] = useState<boolean>(!!hasResume || !!initialFileName);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
      alert("Please upload a .pdf, .doc, or .docx file.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      if (data.success && data.file) {
        setFileName(data.file.fileName);
        setIsUploaded(true);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size={size}
          pill
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className={variant === "desktop" ? "font-bold px-[24px]" : "font-bold"}
        >
          {uploading ? "Uploading..." : isUploaded ? "Replace File" : "Select File"}
        </Button>
      </div>

      {fileName && (
        <div className="mt-1 flex items-center gap-[6px] rounded-full bg-coffee px-[12px] py-[4px] w-fit border border-[#ddd5f0]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b4178" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span className="font-sans text-[11px] text-[#4b4178] font-bold truncate max-w-[200px]">
            {fileName}
          </span>
        </div>
      )}
    </div>
  );
}
