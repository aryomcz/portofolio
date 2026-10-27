"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Code2,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
  const { scrollTo } = useSmoothScroll();
  const isReducedMotion = useReducedMotion();
  const [isAuraForced, setIsAuraForced] = useState<boolean>(false);

  useEffect(() => {
    if (isReducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-hud-reveal",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.07,
          ease: "power3.out",
        }
      );
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [isReducedMotion]);

  const handleViewProjects = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollTo("#projects", { offset: -80 });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-display-name"
      className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden border-b-[6px] border-[#0A1120] pt-24 dark:border-border-subtle"
    >
      <div className="relative mx-auto flex w-full  flex-1 flex-col justify-between px-6 sm:px-10 lg:px-14">
        {/* Main 3-Column Hero Stage */}
        <div className="relative grid flex-1 grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* 1. LEFT COLUMN (4 Cols): Giant Condensed Name & 3 Icon Metadata Rows */}
          <div className="z-20 flex flex-col justify-center pt-6 lg:col-span-4 lg:pt-0">
            <h1
              id="hero-display-name"
              className="hero-hud-reveal lg:text-shadow-md text-shadow-accent-primary font-display text-[clamp(4.25rem,7.2vw,6.75rem)] leading-[0.94] tracking-[0.01em] text-text-primary select-none"
            >
              ARYO
              <br />
              MACHFUDZ
            </h1>

            {/* 3 Icon + Uppercase Metadata Lines (Exact rinlayheang.me layout) */}
            <ul className="hero-hud-reveal mt-8 space-y-3 text-xs font-medium tracking-[0.06em] text-text-secondary uppercase sm:text-[13px]">
              <li className="flex items-center gap-3">
                <MapPin
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <span>BOGOR, INDONESIA</span>
              </li>
              <li className="flex items-center gap-3">
                <GraduationCap
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <span>SOFTWARE ENGINEERING, YEAR 3 AT IPB</span>
              </li>
              <li className="flex items-center gap-3">
                <Code2
                  className="h-4 w-4 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <span>FULL-STACK DEVELOPER & SYSTEM ANALYST</span>
              </li>
            </ul>
          </div>

          {/* 2. CENTER COLUMN (4 Cols): Large Bottom-Anchored Three.js Portrait Cutout */}
          <div className="relative z-10 flex h-[480px] w-full items-end justify-center sm:h-[580px] lg:col-span-4 lg:h-[calc(100vh-6.25rem)] lg:max-h-[820px]">
            <div className="relative aspect-[1.24/1] h-full shrink-0">
              <PortraitAuraCanvas
                baseImageSrc="/images/profile/aryo-portrait-2.png"
                auraImageSrc="/images/profile/aryo-aura.jpg"
                isAuraForced={isAuraForced}
              />
            </div>
          </div>

          {/* 3. RIGHT COLUMN (4 Cols): Open Corner-Bracket HUD Telemetry Blocks */}
          <div className="z-20 flex flex-col items-end justify-center pb-8 lg:col-span-4 lg:pb-0">
            <div className="hero-hud-reveal w-full max-w-[300px] space-y-5">
              {/* Block 1: CURRENTLY */}
              <OpenHudCorners>
                <p className="text-[11px] font-bold tracking-[0.08em] text-accent-primary uppercase">
                  CURRENTLY
                </p>
                <p className="mt-1.5 text-[14px] font-bold tracking-[0.03em] text-text-primary uppercase">
                  SOFTWARE ENGINEERING STUDENT
                </p>
                <p className="mt-0.5 text-[12px] font-medium tracking-[0.03em] text-text-muted uppercase leading-snug">
                  IPB UNIVERSITY
                </p>
              </OpenHudCorners>

              {/* Block 2: LATEST PROJECT + Smooth Wave Line */}
              {/* <OpenHudCorners>
                <p className="text-[11px] font-bold tracking-[0.08em] text-accent-primary uppercase">
                  LATEST PROJECT
                </p>
                <p className="mt-1.5 text-[14px] font-bold tracking-[0.03em] text-text-primary uppercase">
                  TIGO &amp; POS LIVINGROOM
                </p>
                <p className="mt-0.5 text-[12px] font-medium tracking-[0.03em] text-text-muted uppercase">
                  NEXT.JS &amp; FLUTTER, 2026
                </p> */}

              {/* Smooth Mountain Wave Curve (matches rinlayheang.me) */}
              {/* <svg
                  viewBox="0 0 240 28"
                  className="mt-3 h-7 w-full overflow-visible text-text-primary"
                  aria-label="Latest project activity curve"
                >
                  <path
                    d="M 2 24 C 35 16, 52 5, 76 5 C 102 5, 122 14, 158 16 C 188 18, 212 21, 238 25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </OpenHudCorners> */}

              {/* Block 3: AT A GLANCE */}
              <OpenHudCorners>
                <p className="text-[11px] font-bold tracking-[0.08em] text-accent-primary uppercase">
                  AT A GLANCE
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                      PROJECTS
                    </p>
                    <p className="tabular-nums mt-1 font-display text-4xl leading-none text-text-primary">
                      4+
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                      GPA
                    </p>
                    <p className="tabular-nums mt-1 font-display text-4xl leading-none text-text-primary">
                      3.83
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                      AWARD
                    </p>
                    <p className="tabular-nums mt-1 font-display text-4xl leading-none text-text-primary">
                      1
                    </p>
                  </div>
                </div>
              </OpenHudCorners>
            </div>
          </div>
        </div>

        {/* Bottom-Left ("SHOW AURA") & Bottom-Right ("VIEW PROJECTS ↗") Anchored Bar */}
        <div className="pointer-events-none z-30 flex items-center justify-between pb-7 lg:absolute lg:right-14 lg:bottom-8 lg:left-14 lg:pb-0">
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
              className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
