import type { ReactNode, CSSProperties } from "react";

/**
 * Full-width wrapper for mobile page bodies. 
 * Expands to fit the width of the device screen.
 */
export function MobileScreen({
  children,
  withBottomNavPadding = true,
  backgroundColor = "bg-cream",
}: {
  children: ReactNode;
  withBottomNavPadding?: boolean;
  /** Accepts a Tailwind background class (e.g., "bg-white", "bg-cream") or a custom hex/CSS color string */
  backgroundColor?: string;
}) {
  // Check if backgroundColor is a CSS color value (hex, rgb, etc.) vs a Tailwind class name
  const isCustomColor = backgroundColor.startsWith("#") || backgroundColor.startsWith("rgb") || backgroundColor.startsWith("hsl");

  const customStyle: CSSProperties | undefined = isCustomColor
    ? { backgroundColor }
    : undefined;

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden style-mobile-body text-ink ${
        !isCustomColor ? backgroundColor : ""
      }`}
      style={customStyle}
    >
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