"use client";

import { useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import {
  MAIN_PAGE_SECTIONS,
  formatSectionHudLabel,
} from "@/lib/scrollNavigation";
import { cn } from "@/lib/utils";
import { useScrollCamera } from "@/hooks/useScrollCamera";

/**
 * Fixed Right-Side Progress HUD:
 * Displays live "SEC 03/07 — 43%" readout and a compact vertical rail of
 * 7 clickable section marker dots without overlapping main content cards.
 */
export function SectionProgressHud() {
  const { scrollTo } = useLenis();
  const { activeSectionIndex, overallProgress } = useScrollCamera({
    trackSectionState: true,
  });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hudReadout = formatSectionHudLabel(
    activeSectionIndex + 1,
    MAIN_PAGE_SECTIONS.length,
    overallProgress
  );

  const activeSection =
    MAIN_PAGE_SECTIONS[activeSectionIndex] ?? MAIN_PAGE_SECTIONS[0];

  const handleDotClick = (selector: string) => {
    scrollTo(selector, { offset: -72, duration: 1.15 });
  };

  return (
    <aside
      aria-label="Page section progress navigation"
      data-testid="section-progress-hud"
      className="pointer-events-none fixed top-1/2 right-1.5 z-40 -translate-y-1/2 sm:right-3"
    >
      <div className="pointer-events-auto relative flex flex-col items-end gap-2">
        {/* Live Telemetry Readout Pill: "SEC 03/07 — 43%" */}
        <div className="relative border border-border-subtle bg-bg-primary/95 px-2 py-1 font-mono text-[9px] font-semibold tracking-wider text-text-primary shadow-xs sm:px-2.5 sm:text-[10px]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-px -left-px h-1.5 w-1.5 border-t border-l border-accent-primary"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-px -bottom-px h-1.5 w-1.5 border-r border-b border-accent-primary"
          />
          <span
            data-testid="section-progress-readout"
            className="tabular-nums text-accent-primary"
            suppressHydrationWarning
          >
            {hudReadout}
          </span>
        </div>

        {/* Compact Vertical Rail of 7 Clickable Section Dots */}
        <div
          role="navigation"
          aria-label="Section markers"
          className="relative flex flex-col items-center gap-1.5 border border-border-subtle bg-bg-primary/95 px-1.5 py-2 shadow-xs"
        >
          {/* Active vertical progress fill bar along right edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-2 right-0.5 bottom-2 w-[1.5px] bg-border-subtle/60"
          >
            <div
              className="w-full bg-accent-primary transition-all duration-150"
              style={{
                height: `${Math.round(overallProgress * 100)}%`,
              }}
              suppressHydrationWarning
            />
          </div>

          {MAIN_PAGE_SECTIONS.map((sec, idx) => {
            const isActive = idx === activeSectionIndex;
            const isPassed = idx < activeSectionIndex;
            const isHovered = hoveredIdx === idx;

            return (
              <div key={sec.id} className="relative flex items-center justify-center">
                {/* Floating Tooltip Pill on Hover/Focus (Outside the slim rail) */}
                {isHovered ? (
                  <span className="pointer-events-none absolute right-full mr-2.5 hidden border border-accent-primary/60 bg-bg-primary/95 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest whitespace-nowrap text-accent-primary uppercase shadow-xs sm:inline-block">
                    {`${sec.code} · ${sec.label}`}
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleDotClick(sec.selector)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  aria-label={`Jump to section ${sec.code}: ${sec.label}`}
                  aria-current={isActive ? "location" : undefined}
                  className="press-scale group relative flex h-5 w-5 items-center justify-center focus-visible:outline-offset-2"
                >
                  <span
                    className={cn(
                      "transition-all duration-200",
                      isActive
                        ? "h-2.5 w-2.5 rotate-45 border border-accent-primary bg-accent-primary shadow-[0_0_8px_rgba(14,124,134,0.6)]"
                        : isPassed
                          ? "h-2 w-2 bg-accent-primary/65 group-hover:scale-125 group-hover:bg-accent-primary"
                          : "h-2 w-2 border border-border-strong bg-bg-subtle group-hover:scale-125 group-hover:border-accent-primary"
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Active Section Short Code Badge */}
        <div className="hidden border border-border-subtle/80 bg-bg-primary/95 px-2 py-0.5 font-mono text-[9px] tracking-widest text-text-muted uppercase sm:block">
          <span>{`${activeSection.code} // ${activeSection.shortLabel}`}</span>
        </div>
      </div>
    </aside>
  );
}
