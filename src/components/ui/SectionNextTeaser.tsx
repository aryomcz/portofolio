"use client";

import { useEffect, useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/hooks/useLenis";
import { subscribeScrollCamera } from "@/hooks/useScrollCamera";
import { computeMarqueeKinematics } from "@/lib/scrollNavigation";
import { cn } from "@/lib/utils";

interface SectionNextTeaserProps {
  readonly currentCode: string;
  readonly nextCode: string;
  readonly nextLabel: string;
  readonly targetSelector: string;
  readonly className?: string;
}

/**
 * End-of-section HUD Teaser: "NEXT → [NAMA SECTION]"
 * Smoothly shifts and tilts in response to Lenis scroll velocity;
 * clicking smoothly scrolls to the target section.
 */
export function SectionNextTeaser({
  currentCode,
  nextCode,
  nextLabel,
  targetSelector,
  className,
}: SectionNextTeaserProps) {
  const { scrollTo, isReducedMotion } = useLenis();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (isReducedMotion || !trackRef.current) return;

    const el = trackRef.current;
    const badgeEl = badgeRef.current;

    const xTo = gsap.quickTo(el, "x", {
      duration: 0.45,
      ease: "power3.out",
    });
    const skewTo = gsap.quickTo(el, "skewX", {
      duration: 0.45,
      ease: "power3.out",
    });
    const badgeXTo = badgeEl
      ? gsap.quickTo(badgeEl, "x", {
          duration: 0.35,
          ease: "power2.out",
        })
      : null;

    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeScrollCamera((state) => {
      const { teaserShiftPx, skewDeg } = computeMarqueeKinematics(
        state.velocity
      );
      xTo(teaserShiftPx);
      skewTo(skewDeg * 0.65);
      if (badgeXTo) {
        badgeXTo(teaserShiftPx * 0.45);
      }

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        xTo(0);
        skewTo(0);
        if (badgeXTo) badgeXTo(0);
      }, 140);
    });

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      unsubscribe();
    };
  }, [isReducedMotion]);

  const handleClick = () => {
    scrollTo(targetSelector, { offset: -72, duration: 1.15 });
  };

  return (
    <div
      className={cn(
        "mt-12 flex w-full items-center justify-between border-t border-border-subtle pt-5",
        className
      )}
    >
      <div className="hidden items-center gap-2 font-mono text-[10px] tracking-widest text-text-muted uppercase sm:flex">
        <span className="h-1.5 w-1.5 bg-accent-primary" aria-hidden="true" />
        <span>{`SEC.${currentCode} ➔ SEC.${nextCode} // TRANSITION READY`}</span>
      </div>

      <div ref={trackRef} className="will-change-transform ml-auto">
        <button
          type="button"
          onClick={handleClick}
          data-testid={`next-section-teaser-${nextCode}`}
          className="press-scale group relative inline-flex items-center gap-3 border border-border-strong/80 bg-bg-elevated/90 px-4 py-2.5 font-mono text-xs tracking-wider text-text-primary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-primary/10"
        >
          {/* Corner HUD Brackets */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-px -left-px h-2 w-2 border-t-2 border-l-2 border-accent-primary"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-px -right-px h-2 w-2 border-t-2 border-r-2 border-accent-primary"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-px -left-px h-2 w-2 border-b-2 border-l-2 border-accent-primary"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-px -bottom-px h-2 w-2 border-r-2 border-b-2 border-accent-primary"
          />

          <span className="text-[10px] text-text-muted">[{nextCode}]</span>
          <span
            ref={badgeRef}
            className="inline-flex items-center gap-1.5 font-semibold text-accent-primary will-change-transform"
          >
            <span>NEXT → {nextLabel}</span>
          </span>
          <ArrowDownRight
            className="h-3.5 w-3.5 text-accent-primary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
