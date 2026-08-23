import { Button } from "@/components/ui/button";

/**
 * Cover-photo panel: a dashed drag-and-drop zone with a striped placeholder
 * fill and an Upload button.
 */
export function CoverPhotoCard() {
  return (
    <div className="flex w-full flex-col items-center gap-[12px] rounded-[16px] border border-border-soft bg-white px-[25px] pb-[25px] pt-[24px]">
      <h3 className="w-full style-section-header leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
        Cover photo
      </h3>

      <div
        className="flex h-[170px] w-full items-center justify-center rounded-[12px] border-2 border-dashed border-[#b9b6ad]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #e6e3da 0 6px, #efece3 6px 12px)",
        }}
      >
        <span className="style-caption tracking-[1.5px] text-photo-text">
          DRAG IMAGE OR BROWSE
        </span>
      </div>

      <div className="w-full">
        <Button variant="ghost" size="sm">
          Upload
        </Button>
      </div>
    </div>
  );
}
