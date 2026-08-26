"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CoverPhotoCardProps = {
  defaultImageUrl?: string | null;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Cover-photo panel: accepts a single image upload and previews it before submit.
 */
export function CoverPhotoCard({ defaultImageUrl }: CoverPhotoCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImageUrl ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(defaultImageUrl ?? null);
  }, [defaultImageUrl]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Reset error message on new selection
    setErrorMessage(null);

    if (!file) {
      setPreviewUrl(defaultImageUrl ?? null);
      return;
    }

    // 1. Validate File Type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      event.target.value = ""; // Clear file input
      setPreviewUrl(defaultImageUrl ?? null);
      return;
    }

    // 2. Validate File Size (HARD BLOCK FOR > 2MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(`File is too large (${sizeMB} MB). Maximum size is 2 MB.`);
      event.target.value = ""; // Clear file input so it is NOT submitted
      setPreviewUrl(defaultImageUrl ?? null);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="flex w-full flex-col items-center gap-[12px] rounded-[16px] border border-border-soft bg-white px-[25px] pb-[25px] pt-[24px]">
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/*"
        className="hidden"
        onChange={handleFiles}
      />

      <h3 className="w-full style-section-header leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
        Cover photo
      </h3>

      <div className="h-[170px] w-full overflow-hidden rounded-[12px] border border-border-soft bg-[#efece3]">
        {previewUrl ? (
          <img src={previewUrl} alt="Event cover preview" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center border-2 border-dashed border-[#b9b6ad]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #e6e3da 0 6px, #efece3 6px 12px)",
            }}
          >
            <span className="style-caption tracking-[1.5px] text-photo-text">
              DRAG IMAGE OR BROWSE
            </span>
          </div>
        )}
      </div>

      {/* Error Message Display */}
      {errorMessage && (
        <p className="w-full text-xs text-red-600 font-medium">{errorMessage}</p>
      )}

      <div className="flex w-full items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
          {previewUrl ? "Replace image" : "Upload"}
        </Button>
        {previewUrl && !errorMessage && (
          <span className="style-caption text-ink-faint">Image ready</span>
        )}
      </div>
    </div>
  );
}