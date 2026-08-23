"use client";

import { useCallback, useState, type RefObject } from "react";

/** Breathing room kept between the panel and the window edge. */
const MARGIN = 12;

/** Never squeeze a panel below this, even in a short window. */
const MIN_HEIGHT = 180;

type Placement = {
  /** Anchor above the trigger instead of below it. */
  dropUp: boolean;
  /** Cap so the panel always fits on screen; it scrolls past this. */
  maxHeight: number;
};

/**
 * Decides which side a popover opens on and how tall it may be.
 *
 * Flipping upward is not enough on its own: a row near the bottom of a long
 * page can have too little room on *either* side, so the panel also needs a
 * height cap or it gets clipped by the window edge.
 */
export function usePopoverPlacement(
  triggerRef: RefObject<HTMLElement | null>,
  preferredHeight: number
) {
  const [placement, setPlacement] = useState<Placement>({
    dropUp: false,
    maxHeight: preferredHeight,
  });

  const measure = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const below = window.innerHeight - rect.bottom - MARGIN;
    const above = rect.top - MARGIN;

    // Only flip up when below is too tight *and* above is genuinely roomier.
    const dropUp = below < preferredHeight && above > below;

    setPlacement({
      dropUp,
      maxHeight: Math.max(MIN_HEIGHT, Math.floor(dropUp ? above : below)),
    });
  }, [triggerRef, preferredHeight]);

  return { ...placement, measure };
}
