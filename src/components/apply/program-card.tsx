"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export type Program = {
  /** Glyph rendered inside the icon chip. */
  icon: string;
  iconBg: string;
  iconColor: string;
  /** Optional logo image asset path. */
  image?: string;
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

function ProgramLogoIcon({ title, iconColor }: { title: string; iconColor: string }) {
  if (title.toLowerCase().includes("academy")) {
    return (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }
  if (title.toLowerCase().includes("mentorship") || title.toLowerCase().includes("aim")) {
    return (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * One of the three "Choose Your AIS Path" program cards.
 */
export function ProgramCard({
  icon,
  iconBg,
  iconColor,
  image,
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

  const iconChip = image ? (
    <div
      className="relative flex size-[60px] shrink-0 items-center justify-center rounded-[14px] p-[2px] overflow-hidden shadow-2xs border border-border-soft/60 transition-transform duration-300 group-hover:scale-105"
      style={{ backgroundColor: iconBg }}
    >
      <Image
        src={image}
        alt={`${title} Logo`}
        width={56}
        height={56}
        className="h-[95%] w-[95%] object-contain mix-blend-multiply"
      />
    </div>
  ) : (
    <div
      className="flex size-[48px] items-center justify-center rounded-[14px] shadow-2xs transition-transform duration-300 group-hover:scale-105"
      style={{ backgroundColor: iconBg, color: iconColor }}
    >
      <ProgramLogoIcon title={title} iconColor={iconColor} />
    </div>
  );

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group flex h-full flex-1 flex-col justify-between gap-3.5 self-stretch rounded-[18px] border bg-white/95 backdrop-blur-xs px-[23px] pb-[25px] pt-[24px] shadow-xs transition-all duration-300 hover:shadow-md"
      style={{ borderColor }}
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex w-full items-center justify-between h-[60px]">
          {iconChip}
          {badge ? (
            <span className="inline-flex items-center rounded-full bg-orange-soft/90 border border-orange-soft/60 px-[14px] py-[5px] style-badge-text leading-[normal] text-orange-ink font-medium shadow-2xs">
              {badge}
            </span>
          ) : <div className="h-[28px]" />}
        </div>

      <h3 className="style-card-title text-xl font-bold leading-snug text-ink [font-variation-settings:'wdth'_100] group-hover:text-brand transition-colors duration-200">
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
        <p className="mt-1 flex-1 style-body-text leading-relaxed text-ink/75 line-clamp-3">
          {description}
        </p>
      )}
      </div>

      {showActionButton ? (
        <Button
          variant={cta}
          size="md"
          pill
          block
          onClick={handleApply}
          type="button"
          className="mt-2 shadow-2xs transition-all duration-200 hover:shadow-xs active:scale-[0.99]"
        >
          Apply Now →
        </Button>
      ) : null}
    </motion.div>
  );
}