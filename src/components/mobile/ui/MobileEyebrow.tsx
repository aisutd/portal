import type { ReactNode } from "react";

/** Small tracked uppercase label — the "Eyebrow Label" style from the mobile type system. */
export function MobileEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="style-section-header text-[13px] uppercase tracking-[1.5px] text-brand">
      {children}
    </p>
  );
}
