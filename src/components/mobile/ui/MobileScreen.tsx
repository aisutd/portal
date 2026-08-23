import type { ReactNode } from "react";

/**
 * Full-width wrapper for mobile page bodies. 
 * Expands to fit the width of the device screen.
 */
export function MobileScreen({
  children,
  withBottomNavPadding = true,
}: {
  children: ReactNode;
  withBottomNavPadding?: boolean;
}) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-cream style-mobile-body text-ink">
      <div
        className={`flex min-h-screen w-full flex-col gap-5 px-5 pt-5 ${
          withBottomNavPadding ? "pb-24" : "pb-5"
        }`}
      >
        {children}
      </div>
    </div>
  );
}