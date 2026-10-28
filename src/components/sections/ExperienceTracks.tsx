"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES, refreshScrollTrigger } from "@/lib/gsap";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EASE_REDUCED, SPRING_SNAPPY } from "@/lib/motion";
import { KineticBlockReveal } from "@/components/ui/KineticBlockReveal";
import { cn } from "@/lib/utils";

export type ExperienceTrackId = "work" | "organization";

export interface ExperienceTrack {
  readonly id: ExperienceTrackId;
  /** Full tab label, shown from the `sm` breakpoint up. */
  readonly label: string;
  /** Compact tab label for narrow phones. */
  readonly shortLabel: string;
  readonly count: number;
  /** Server-rendered panel content. */
  readonly panel: ReactNode;
}

interface ExperienceTracksProps {
  readonly tracks: readonly ExperienceTrack[];
}

const PANEL_TRANSITION = { duration: 0.28, ease: [0.23, 1, 0.32, 1] } as const;

function padCount(count: number): string {
  return String(count).padStart(2, "0");
}

/**
 * Dual-track HUD switcher: Work Experience vs Organizational Leadership.
 * Both panels stay in the HTML (inactive one is `hidden`) so every entry is
 * crawlable and the switch never waits on the network.
 */
export function ExperienceTracks({ tracks }: ExperienceTracksProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<ExperienceTrackId>(
    tracks[0]?.id ?? "work"
  );

  const handleSelectTrack = (id: ExperienceTrackId) => {
    setActiveId(id);
    refreshScrollTrigger();
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: GSAP_MEDIA_QUERIES.isDesktop,
          isMobile: GSAP_MEDIA_QUERIES.isMobile,
          reduceMotion: GSAP_MEDIA_QUERIES.reduceMotion,
        },
        (context) => {
          const { reduceMotion } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
            reduceMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(".experience-kinetic-title", {
              autoAlpha: 1,
              yPercent: 0,
              clearProps: "transform,opacity,visibility",
            });
            return;
          }

          gsap.fromTo(
            ".experience-kinetic-title",
            { yPercent: 105, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: "power3.out",
              clearProps: "transform",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 78%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      );
    },
    { scope: sectionRef }
  );

  // WAI-ARIA tabs pattern: arrows / Home / End move focus and activate.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tracks.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    setActiveId(tracks[next].id);
    tabRefs.current[next]?.focus();
  };

  const indicatorTransition = isReducedMotion ? EASE_REDUCED : SPRING_SNAPPY;
  const panelTransition = isReducedMotion ? EASE_REDUCED : PANEL_TRANSITION;

  return (
    <section
      id="timeline"
      ref={sectionRef}
      aria-labelledby="experience-heading"
      className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
    >
      {/* Section header + track switcher */}
      <div className="mb-10 flex flex-col gap-6 border-b border-border-subtle pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <KineticBlockReveal delay={0.05} blockColor="bg-[#0e7c86]">
            <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
              <span className="h-2 w-2 bg-[#0e7c86]" aria-hidden="true" />
              <span>{"SYS.HUD // 05 — CAREER & LEADERSHIP TIMELINE"}</span>
            </div>
          </KineticBlockReveal>
          <div className="overflow-hidden mt-1">
            <KineticBlockReveal delay={0.15} blockColor="bg-[#0e7c86]">
              <h2
                id="experience-heading"
                className="font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
              >
                EXPERIENCE
              </h2>
            </KineticBlockReveal>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Experience tracks"
          className="grid w-full grid-cols-2 border border-border-strong bg-bg-elevated/80 p-1 md:inline-grid md:w-auto"
        >
          {tracks.map((track, index) => {
            const isActive = track.id === activeId;
            const count = padCount(track.count);
            return (
              <button
                key={track.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`experience-tab-${track.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`experience-panel-${track.id}`}
                aria-label={`${track.label} (${track.count} ${track.count === 1 ? "entry" : "entries"})`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelectTrack(track.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={cn(
                  "press-scale relative flex min-h-11 items-center justify-center gap-1.5 px-3 font-mono text-[11px] whitespace-nowrap sm:px-4 sm:text-xs",
                  isActive
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="activeExperienceTab"
                    transition={indicatorTransition}
                    className="absolute inset-0 border-b-2 border-accent-primary bg-accent-primary/10"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative",
                    isActive ? "text-accent-primary" : "text-border-strong"
                  )}
                  aria-hidden="true"
                >
                  [
                </span>
                <span className="relative font-semibold sm:hidden">
                  {track.shortLabel}
                </span>
                <span className="relative hidden font-semibold sm:inline">
                  {track.label}
                </span>
                <span
                  className={cn(
                    "relative tabular-nums",
                    isActive ? "text-accent-primary" : undefined
                  )}
                >
                  ({count})
                </span>
                <span
                  className={cn(
                    "relative",
                    isActive ? "text-accent-primary" : "text-border-strong"
                  )}
                  aria-hidden="true"
                >
                  ]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Track panels — both rendered, inactive one hidden */}
      {tracks.map((track) => {
        const isActive = track.id === activeId;
        return (
          <div
            key={track.id}
            id={`experience-panel-${track.id}`}
            role="tabpanel"
            aria-labelledby={`experience-tab-${track.id}`}
            hidden={!isActive}
            tabIndex={0}
            className="focus-visible:outline-offset-4"
          >
            <motion.div
              initial={false}
              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={panelTransition}
            >
              {track.panel}
            </motion.div>
          </div>
        );
      })}
    </section>
  );
}
