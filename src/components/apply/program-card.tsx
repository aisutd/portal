"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export type Program = {
  /** Glyph rendered inside the icon chip. */
  icon: string;
  iconBg: string;
  iconColor: string;
  /** Card border colour. */
  borderColor: string;
  /** Optional pill shown top-right (e.g. "High demand"). */
  badge?: string;
  title: string;
  description?: string;
  tags: string[];
  /** CTA colour. */
  cta: "primary" | "accent";
  /** Hide the action button when the card is shown as part of a flow. */
  showActionButton?: boolean;
};

/**
 * One of the three "Choose Your AIS Path" program cards.
 */
export function ProgramCard({
  icon,
  iconBg,
  iconColor,
  borderColor,
  badge,
  title,
  tags,
  description,
  cta,
  showActionButton = true,
}: Program) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleApply = () => {
    if (!isSignedIn) {
      router.push("/onboarding?mode=login");
    }
  };

  const iconChip = (
    <span
      className="flex size-[46px] items-center justify-center rounded-[12px] pb-[12px] pt-[9px] text-center text-[20px]"
      style={{ backgroundColor: iconBg, color: iconColor }}
    >
      {icon}
    </span>
  );

  return (
    <div
      className="flex flex-1 flex-col gap-3 self-stretch rounded-[18px] border bg-white px-[23px] pb-[25px] pt-[24px]"
      style={{ borderColor }}
    >
      {badge ? (
        <div className="flex w-full items-center justify-between">
          {iconChip}
          <span className="inline-flex items-center rounded-full bg-orange-soft px-[14px] py-[5px] font-body text-[13px] font-semibold leading-[normal] text-orange-ink">
            {badge}
          </span>
        </div>
      ) : (
        iconChip
      )}

      <h3 className="font-display text-[22px] font-semibold leading-snug text-ink [font-variation-settings:'wdth'_100]">
        {title}
      </h3>

      <div className="flex flex-wrap gap-[6px]">
        {tags.map((label) => (
          <Tag
            key={label}
            label={label}
            bg="#efece3"
            color="#6a685f"
            border="#e2ded2"
          />
        ))}
      </div>

      {description && (
        <p className="mt-1 flex-1 font-body text-[14px] leading-relaxed text-ink/75">
          {description}
        </p>
      )}

      {showActionButton ? (
        <Button
          variant={cta}
          size="md"
          pill
          block
          onClick={handleApply}
          type="button"
          className="mt-2"
        >
          Apply Now →
        </Button>
      ) : null}
    </div>
  );
}