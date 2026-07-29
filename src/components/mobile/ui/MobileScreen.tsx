import type { ReactNode } from "react";

/**
 * Phone-frame wrapper for mobile page bodies. Caps width to a phone-sized
 * column and centers it, matching the Figma mobile frames (max 430px).
 */
export function MobileScreen({
  children,
  withBottomNavPadding = true,
}: {
  children: ReactNode;
  withBottomNavPadding?: boolean;
}) {
  return (
    <div className="min-h-screen bg-cream font-mobile-body text-ink">
      <div
        className={`mx-auto flex min-h-screen max-w-[430px] flex-col gap-[20px] px-[20px] pt-[20px] ${
          withBottomNavPadding ? "pb-[96px]" : "pb-[20px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
