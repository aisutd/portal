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
  const resolvedClassName = className || "h-[170px] w-full";

  if (!imageUrl) {
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
        <span className="style-caption tracking-[1.5px] text-photo-text">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={[
      "relative overflow-hidden rounded-[12px] border border-border-soft bg-[#efece3]",
      resolvedClassName,
    ].join(" ")}>
      <img
        src={imageUrl}
        alt={alt}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
