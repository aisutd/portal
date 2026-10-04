"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger multiple reveals in a grid/list by passing an increasing delay (ms). */
  delay?: number;
};

// Fades + slides an element in the first time it scrolls into view. Reveals
// once and stays (no re-hiding on scroll back up) — repeatedly hiding
// content a user already read reads as flicker, not "alive".
export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Lazy initializer (not an effect) so reduced-motion users skip the
  // hidden->visible transition entirely instead of flashing hidden first.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      // Browser-only accessibility preference; unavailable during SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-400 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
