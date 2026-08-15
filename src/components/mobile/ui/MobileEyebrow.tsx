import type { ReactNode } from "react";

/** Small tracked uppercase label — the "Eyebrow Label" style from the mobile type system. */
export function MobileEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mobile-display text-[13px] font-bold uppercase tracking-[1.5px] text-brand">
      {children}
    </p>
  );
}
