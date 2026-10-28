"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

// Register all plugins once centrally
if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollTrigger,
    SplitText,
    Flip,
    Observer,
    ScrambleTextPlugin,
    useGSAP
  );
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
 * with optional debounce for layout shifts (e.g. font loaded, tab switch, bento grid toggle).
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
  }, 100);
}

export {
  gsap,
  ScrollTrigger,
  SplitText,
  Flip,
  Observer,
  ScrambleTextPlugin,
  useGSAP,
};

export default gsap;
