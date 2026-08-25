"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CoverPhotoCardProps = {
  defaultImageUrl?: string | null;
};

/**
 * Cover-photo panel: accepts a single image upload and previews it before submit.
 */
export function CoverPhotoCard({ defaultImageUrl }: CoverPhotoCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImageUrl ?? null);

  useEffect(() => {
    setPreviewUrl(defaultImageUrl ?? null);
  }, [defaultImageUrl]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(defaultImageUrl ?? null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
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

      <div className="flex w-full items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
          {previewUrl ? "Replace image" : "Upload"}
        </Button>
        {previewUrl && (
          <span className="style-caption text-ink-faint">Image ready</span>
        )}
      </div>
    </div>
  );
}
