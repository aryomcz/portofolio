"use client";

import { useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES } from "@/lib/gsap";
import { MOTION_EASINGS } from "@/lib/motion";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Code2,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { useLenis } from "@/hooks/useLenis";
import { PortraitAuraCanvas } from "@/components/ui/PortraitAuraCanvas";
import { KineticBlockReveal } from "@/components/ui/KineticBlockReveal";
import { SectionNextTeaser } from "@/components/ui/SectionNextTeaser";

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

  // Desktop-only scroll parallax (initial entrance uses zero-reflow GPU CSS keyframes)
  useGSAP(
    () => {
      if (typeof window === "undefined") return;
      const isDesktop = window.matchMedia(GSAP_MEDIA_QUERIES.isDesktop).matches;
      const reduceMotion = window.matchMedia(
        GSAP_MEDIA_QUERIES.reduceMotion
      ).matches;

      if (!isDesktop || reduceMotion || !sectionRef.current) return;

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
        className="relative mx-auto flex w-full flex-1 flex-col justify-between px-5 sm:px-9 lg:px-8 xl:px-12 lg:pb-20 will-change-transform"
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
              aria-label="ARYO MACHFUDZ"
              className="lg:text-shadow-md text-shadow-accent-primary font-display text-[clamp(4.25rem,7vw,6.5rem)] leading-[0.94] tracking-[0.01em] text-text-primary select-none"
            >
              <span className="block overflow-hidden" aria-hidden="true">
                <span className="hero-name-line inline-block">
                  {"ARYO".split("").map((ch, idx) => (
                    <span
                      key={`a-${idx}`}
                      className="hero-name-char inline-block will-change-transform"
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              </span>
              <span className="block overflow-hidden" aria-hidden="true">
                <span className="hero-name-line inline-block">
                  {"MACHFUDZ".split("").map((ch, idx) => (
                    <span
                      key={`m-${idx}`}
                      className="hero-name-char inline-block will-change-transform"
                    >
                      {ch}
                    </span>
                  ))}
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
                <KineticBlockReveal delay={0.15} blockColor="bg-[#0e7c86]">
                  <span>BOGOR, INDONESIA</span>
                </KineticBlockReveal>
              </li>
              <li className="hero-meta-row flex items-center gap-3">
                <GraduationCap
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <KineticBlockReveal delay={0.25} blockColor="bg-[#0e7c86]">
                  <span>SOFTWARE ENGINEERING, YEAR 3 AT IPB</span>
                </KineticBlockReveal>
              </li>
              <li className="hero-meta-row flex items-center gap-3">
                <Code2
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <KineticBlockReveal delay={0.35} blockColor="bg-[#0e7c86]">
                  <span>FULL-STACK DEVELOPER &amp; SYSTEM ANALYST</span>
                </KineticBlockReveal>
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
                baseImageSrc="/images/profile/aryo-base-aligned.webp"
                auraImageSrc="/images/profile/aryo-aura-aligned.webp"
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
                  <KineticBlockReveal delay={0.1} blockColor="bg-[#0e7c86]">
                    <p className="hero-hud-label-currently font-mono text-[11px] font-bold tracking-[0.08em] text-accent-primary uppercase">
                      CURRENTLY
                    </p>
                  </KineticBlockReveal>
                  <div className="mt-1.5">
                    <KineticBlockReveal delay={0.2} blockColor="bg-[#0e7c86]">
                      <p className="text-[14px] font-bold tracking-[0.03em] text-text-primary uppercase">
                        SOFTWARE ENGINEERING STUDENT
                      </p>
                    </KineticBlockReveal>
                  </div>
                  <div className="mt-0.5">
                    <KineticBlockReveal delay={0.3} blockColor="bg-[#14b8a6]">
                      <p className="text-[12px] font-medium tracking-[0.03em] text-text-muted uppercase leading-snug">
                        IPB UNIVERSITY
                      </p>
                    </KineticBlockReveal>
                  </div>
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

      {/* Architectural HUD Section Boundary Divider & Velocity Teaser (Hero -> Skills) */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-5 pb-4 sm:px-9 lg:px-11">
        <SectionNextTeaser
          currentCode="01"
          nextCode="02"
          nextLabel="TECHNICAL ARSENAL"
          targetSelector="#skills"
          className="mt-4"
        />
      </div>
    </section>
  );
}
