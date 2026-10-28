"use client";

import { useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES, SplitText } from "@/lib/gsap";
import {
  MOTION_TIMINGS,
  MOTION_EASINGS,
  STAGGER_TOKENS,
  SPATIAL_TOKENS,
} from "@/lib/motion";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Code2,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { useLenis } from "@/hooks/useLenis";
import { PortraitAuraCanvas } from "@/components/ui/PortraitAuraCanvas";

/**
 * Open, transparent corner-bracket frame (`┌ ┐ └ ┘`) matching rinlayheang.me's right HUD column.
 * Zero background fill or box border—only the 4 crisp corner ticks.
 */
function OpenHudCorners({ children }: { readonly children: ReactNode }) {
  return (
    <div className="relative px-4 py-3.5">
      {/* Top-Left ┌ */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t-[1.5px] border-l-[1.5px] border-text-primary/65"
      />
      {/* Top-Right ┐ */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 border-t-[1.5px] border-r-[1.5px] border-text-primary/65"
      />
      {/* Bottom-Left └ */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b-[1.5px] border-l-[1.5px] border-text-primary/65"
      />
      {/* Bottom-Right ┘ */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 h-2.5 w-2.5 border-r-[1.5px] border-b-[1.5px] border-text-primary/65"
      />
      {children}
    </div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const portraitWrapRef = useRef<HTMLDivElement | null>(null);

  // Direct DOM references for At a glance counter tickers (zero React state overhead)
  const statProjectsRef = useRef<HTMLParagraphElement | null>(null);
  const statGpaRef = useRef<HTMLParagraphElement | null>(null);
  const statAwardRef = useRef<HTMLParagraphElement | null>(null);

  const { scrollTo } = useLenis();
  const [isAuraForced, setIsAuraForced] = useState<boolean>(false);

  // Batch [3A] Choreographed Hero Sequence: Masked SplitText, Staggered Metadata,
  // Direct DOM Counter Ticker, Scroll Parallax, and Section Exit Scrub
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
          const { reduceMotion, isDesktop } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
            reduceMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(
              [
                heroStageRef.current,
                leftColRef.current,
                portraitWrapRef.current,
                ".hero-name-line",
                ".hero-meta-row",
                ".hero-hud-block",
                ".hero-action-bar",
              ],
              {
                autoAlpha: 1,
                y: 0,
                yPercent: 0,
                scale: 1,
                clearProps: "all",
              }
            );
            if (statProjectsRef.current) statProjectsRef.current.textContent = "4+";
            if (statGpaRef.current) statGpaRef.current.textContent = "3.83";
            if (statAwardRef.current) statAwardRef.current.textContent = "1";
            return;
          }

          // 1. Initial State Set (Synchronous pre-paint to prevent FOUC)
          gsap.set([".hero-meta-row", ".hero-hud-block", ".hero-action-bar"], {
            autoAlpha: 0,
            y: SPATIAL_TOKENS.standard,
          });

          // Split display name into kinetic characters inside masked line containers
          const split = SplitText.create(".hero-name-line", {
            type: "chars",
            charsClass: "hero-name-char inline-block will-change-transform",
          });

          gsap.set(split.chars, {
            yPercent: 110,
            autoAlpha: 0,
          });

          // Initial counter placeholder
          if (statProjectsRef.current) statProjectsRef.current.textContent = "0+";
          if (statGpaRef.current) statGpaRef.current.textContent = "0.00";
          if (statAwardRef.current) statAwardRef.current.textContent = "0";

          // 2. Master Entrance Timeline
          const tl = gsap.timeline({
            defaults: { ease: MOTION_EASINGS.gsapEaseOut },
          });

          // Step A: Giant display name enters per character with masked kinetic reveal
          tl.to(
            split.chars,
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: MOTION_TIMINGS.deliberate + 0.15, // 0.75s
              stagger: 0.025,
              ease: MOTION_EASINGS.gsapEaseOut,
              clearProps: "transform,opacity,visibility",
            },
            0.05
          );

          // Step B: Three metadata rows appear sequentially
          tl.to(
            ".hero-meta-row",
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION_TIMINGS.standard + 0.05, // 0.4s
              stagger: STAGGER_TOKENS.standard, // 0.06s
              ease: MOTION_EASINGS.gsapEaseOut,
              clearProps: "transform,opacity,visibility",
            },
            0.32
          );

          // Step C: Right column HUD telemetry blocks & bottom action bar
          tl.to(
            [".hero-hud-block", ".hero-action-bar"],
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION_TIMINGS.deliberate,
              stagger: STAGGER_TOKENS.standard,
              ease: MOTION_EASINGS.gsapEaseOut,
              clearProps: "transform,opacity,visibility",
            },
            0.38
          );

          // Step D: HUD label scramble text decoding effect
          tl.to(
            ".hero-hud-label-currently",
            {
              duration: MOTION_TIMINGS.standard,
              scrambleText: {
                text: "CURRENTLY",
                chars: "#$%&_/01XZ><",
                speed: 0.4,
              },
            },
            0.4
          );

          tl.to(
            ".hero-hud-label-glance",
            {
              duration: MOTION_TIMINGS.standard,
              scrambleText: {
                text: "AT A GLANCE",
                chars: "#$%&_/01XZ><",
                speed: 0.4,
              },
            },
            0.44
          );

          // Step E: Direct DOM Spring Number Tickers (zero React state overhead)
          const statCounters = { projects: 0, gpa: 0, award: 0 };
          tl.to(
            statCounters,
            {
              projects: 4,
              gpa: 3.83,
              award: 1,
              duration: 0.65,
              ease: MOTION_EASINGS.gsapEaseExpo,
              onUpdate: () => {
                if (statProjectsRef.current) {
                  statProjectsRef.current.textContent = `${Math.round(statCounters.projects)}+`;
                }
                if (statGpaRef.current) {
                  statGpaRef.current.textContent = statCounters.gpa.toFixed(2);
                }
                if (statAwardRef.current) {
                  statAwardRef.current.textContent = `${Math.round(statCounters.award)}`;
                }
              },
              onComplete: () => {
                if (statProjectsRef.current) statProjectsRef.current.textContent = "4+";
                if (statGpaRef.current) statGpaRef.current.textContent = "3.83";
                if (statAwardRef.current) statAwardRef.current.textContent = "1";
              },
            },
            0.45
          );

          // 3. Scroll Interactions: Desktop Camera Parallax & Section Exit Scrub
          if (isDesktop && sectionRef.current) {
            // Camera Parallax: Portrait rises slightly (-45px), text drifts (+25px)
            if (portraitWrapRef.current) {
              gsap.to(portraitWrapRef.current, {
                y: -45,
                ease: MOTION_EASINGS.gsapScrub,
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.5,
                },
              });
            }

            if (leftColRef.current) {
              gsap.to(leftColRef.current, {
                y: 25,
                ease: MOTION_EASINGS.gsapScrub,
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.5,
                },
              });
            }

            // Hero Stage Continuity: subtly scale down and fade out on scrub
            if (heroStageRef.current) {
              gsap.to(heroStageRef.current, {
                scale: 0.96,
                opacity: 0.35,
                ease: MOTION_EASINGS.gsapScrub,
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: "top top",
                  end: "bottom top",
                  scrub: true,
                },
              });
            }
          }

          return () => {
            split.revert();
          };
        }
      );
    },
    { scope: sectionRef }
  );

  const handleViewProjects = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollTo("#projects", { offset: -88, duration: 1.15 });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-display-name"
      className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden pt-24"
    >
      {/* Scalable Hero Stage (Controlled by ScrollTrigger Scrub) */}
      <div
        ref={heroStageRef}
        className="relative mx-auto flex w-full flex-1 flex-col justify-between px-5 sm:px-9 lg:px-11 will-change-transform"
      >
        {/* Main 3-Column Hero Stage */}
        <div className="relative grid flex-1 grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* 1. LEFT COLUMN (4 Cols): Giant Condensed Name & 3 Icon Metadata Rows */}
          <div
            ref={leftColRef}
            className="z-20 flex flex-col justify-center pt-6 lg:col-span-4 lg:pt-0 will-change-transform"
          >
            <h1
              id="hero-display-name"
              className="lg:text-shadow-md text-shadow-accent-primary font-display text-[clamp(4.25rem,7.2vw,6.75rem)] leading-[0.94] tracking-[0.01em] text-text-primary select-none"
            >
              <span className="block overflow-hidden">
                <span className="hero-name-line inline-block will-change-transform">
                  ARYO
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-name-line inline-block will-change-transform">
                  MACHFUDZ
                </span>
              </span>
            </h1>

            {/* 3 Icon + Uppercase Metadata Lines (Exact rinlayheang.me layout) */}
            <ul className="mt-8 space-y-3 text-xs font-medium tracking-[0.06em] text-text-secondary uppercase sm:text-[13px]">
              <li className="hero-meta-row flex items-center gap-3">
                <MapPin
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <span>BOGOR, INDONESIA</span>
              </li>
              <li className="hero-meta-row flex items-center gap-3">
                <GraduationCap
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <span>SOFTWARE ENGINEERING, YEAR 3 AT IPB</span>
              </li>
              <li className="hero-meta-row flex items-center gap-3">
                <Code2
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <span>FULL-STACK DEVELOPER & SYSTEM ANALYST</span>
              </li>
            </ul>
          </div>

          {/* 2. CENTER COLUMN (4 Cols): Large Bottom-Anchored Three.js Portrait Cutout */}
          <div
            ref={portraitWrapRef}
            className="relative z-10 flex h-[480px] w-full items-end justify-center sm:h-[580px] lg:col-span-4 lg:h-[calc(100vh-6.25rem)] lg:max-h-[820px] will-change-transform"
          >
            <div className="relative aspect-[1.24/1] h-full shrink-0">
              <PortraitAuraCanvas
                baseImageSrc="/images/profile/aryo-base-aligned.png"
                auraImageSrc="/images/profile/aryo-aura-aligned.png"
                isAuraForced={isAuraForced}
              />
            </div>
          </div>

          {/* 3. RIGHT COLUMN (4 Cols): Open Corner-Bracket HUD Telemetry Blocks */}
          <div className="z-20 flex flex-col items-center sm:items-end justify-center pb-8 lg:col-span-4 lg:pb-0">
            <div className="w-full max-w-[300px] space-y-5">
              {/* Block 1: CURRENTLY */}
              <div className="hero-hud-block">
                <OpenHudCorners>
                  <p className="hero-hud-label-currently font-mono text-[11px] font-bold tracking-[0.08em] text-accent-primary uppercase">
                    CURRENTLY
                  </p>
                  <p className="mt-1.5 text-[14px] font-bold tracking-[0.03em] text-text-primary uppercase">
                    SOFTWARE ENGINEERING STUDENT
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium tracking-[0.03em] text-text-muted uppercase leading-snug">
                    IPB UNIVERSITY
                  </p>
                </OpenHudCorners>
              </div>

              {/* Block 2: AT A GLANCE */}
              <div className="hero-hud-block">
                <OpenHudCorners>
                  <p className="hero-hud-label-glance font-mono text-[11px] font-bold tracking-[0.08em] text-accent-primary uppercase">
                    AT A GLANCE
                  </p>
                  <div className="mt-2.5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                        PROJECTS
                      </p>
                      <p
                        ref={statProjectsRef}
                        className="tabular-nums mt-1 font-display text-4xl leading-none text-text-primary"
                      >
                        4+
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                        GPA
                      </p>
                      <p
                        ref={statGpaRef}
                        className="tabular-nums mt-1 font-display text-4xl leading-none text-text-primary"
                      >
                        3.83
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                        AWARD
                      </p>
                      <p
                        ref={statAwardRef}
                        className="tabular-nums mt-1 font-display text-4xl leading-none text-text-primary"
                      >
                        1
                      </p>
                    </div>
                  </div>
                </OpenHudCorners>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Left ("SHOW AURA") & Bottom-Right ("VIEW PROJECTS ↗") Anchored Bar */}
        <div className="hero-action-bar pointer-events-none z-30 flex items-center justify-between pb-7 lg:absolute lg:right-14 lg:bottom-8 lg:left-14 lg:pb-0">
          {/* Bottom-Left: SHOW AURA / Switch portrait */}
          <button
            type="button"
            onClick={() => setIsAuraForced((prev) => !prev)}
            className="press-scale pointer-events-auto group flex items-center gap-3.5 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-text-primary/55 bg-bg-primary/80 text-text-primary backdrop-blur-xs transition-colors duration-200 group-hover:border-accent-primary group-hover:text-accent-primary">
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[11px] font-bold tracking-[0.08em] text-text-primary uppercase">
                {isAuraForced ? "HIDE AURA" : "SHOW AURA"}
              </span>
              <span className="block text-[11px] text-text-muted">
                Switch portrait
              </span>
            </span>
          </button>

          {/* Bottom-Right: Offset-Bracket Outlined "VIEW PROJECTS ↗" Button */}
          <a
            href="#projects"
            onClick={handleViewProjects}
            className="press-scale pointer-events-auto group relative inline-flex items-center gap-3 border border-accent-primary bg-bg-primary/85 px-6 py-3 text-xs font-bold tracking-[0.08em] text-accent-primary uppercase backdrop-blur-xs transition-colors duration-200 hover:bg-accent-primary hover:text-white"
          >
            {/* Offset Top-Right Architectural Frame Line */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-1.5 -right-1.5 bottom-1.5 left-2.5 border-t border-r border-accent-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            <span>VIEW PROJECTS</span>
            <ArrowUpRight
              className="arrow-drift h-4 w-4"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>

      {/* Architectural HUD Section Boundary Divider (Transition from Hero into Skills) */}
      <div
        aria-hidden="true"
        className="relative z-20 flex w-full items-center justify-between border-t border-border-subtle bg-bg-primary/95 px-6 py-2.5 font-mono text-[10px] tracking-widest text-text-muted select-none backdrop-blur-xs"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 bg-accent-primary animate-pulse" />
          <span>SYS.TELEMETRY // SEC.01 ➔ SEC.02</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>LAT 6°35&apos;S LONG 106°47&apos;E</span>
          <span>ENGINEERING CADENCE // NOMINAL</span>
        </div>
        <div className="flex items-center gap-2">
          <span>INDEX // HERO</span>
          <span className="text-accent-primary font-bold">▼</span>
        </div>
      </div>
    </section>
  );
}
