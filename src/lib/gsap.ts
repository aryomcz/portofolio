"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register only used plugins (eliminates 48.4 KiB of unused SplitText/Flip/Observer/ScrambleTextPlugin code)
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Standard Breakpoints and Media Conditions for `gsap.matchMedia()`
 */
export const GSAP_MEDIA_QUERIES = {
  isDesktop: "(min-width: 768px)",
  isMobile: "(max-width: 767px)",
  reduceMotion: "(prefers-reduced-motion: reduce)",
} as const;

/**
 * Helper to safely refresh ScrollTrigger calculations across the document
 * with debounce so multiple layout events coalesce into a single layout read.
 */
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
export function refreshScrollTrigger(immediate = false): void {
  if (typeof window === "undefined") return;

  if (immediate) {
    ScrollTrigger.refresh();
    return;
  }

  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  refreshTimeout = setTimeout(() => {
    ScrollTrigger.refresh();
    refreshTimeout = null;
  }, 150);
}

export { gsap, ScrollTrigger, useGSAP };

export default gsap;
