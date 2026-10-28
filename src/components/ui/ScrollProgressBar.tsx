"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Ultra-thin (2px) scroll progress telemetry bar anchored at the top of the viewport.
 * Scrubbed smoothly across page scroll via ScrollTrigger without re-rendering React.
 */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();

  useGSAP(() => {
    if (isReducedMotion || !barRef.current) return;

    gsap.to(barRef.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.2,
      },
    });
  }, [isReducedMotion]);

  if (isReducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-[2px] overflow-hidden bg-transparent"
    >
      <div
        ref={barRef}
        style={{ transform: "scaleX(0)", transformOrigin: "left center" }}
        className="h-full w-full bg-gradient-to-r from-accent-primary via-accent-emerald to-accent-primary will-change-transform"
      />
    </div>
  );
}
