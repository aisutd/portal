"use client";

import { useState } from "react";

type EventCoverImageProps = {
  imageUrl?: string | null;
  className?: string;
  alt?: string;
  fallbackText?: string;
};

export function EventCoverImage({
  imageUrl,
  className = "",
  alt = "Event cover image",
  fallbackText = "PHOTO",
}: EventCoverImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedClassName = className || "h-[170px] w-full";

  // If no URL or image failed to load, render fallback
  if (!imageUrl || hasError) {
    return (
      <div
        className={[
          "flex items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-[#b9b6ad] bg-[#efece3]",
          resolvedClassName,
        ].join(" ")}
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #e6e3da 0 6px, #efece3 6px 12px)",
        }}
      >
        <span className="style-caption tracking-[1.5px] text-photo-text">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-border-soft bg-stone-soft",
        resolvedClassName,
      ].join(" ")}
    >
      <img
        src={imageUrl}
        alt={alt}
        onError={() => {
          console.log("Image failed to load:", imageUrl);
          setHasError(true);
        }}
        className="h-full w-full object-cover"
      />
    </div>
  );
}