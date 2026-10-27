"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { MapPin } from "lucide-react";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TechBracketCard } from "@/components/ui/TechBracketCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Experience, Leadership & Education Timeline in Creative Tech HUD Editorial style.
 * Strictly excludes Karang Taruna per user instructions.
 */
export function TimelineSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const spineTrackRef = useRef<HTMLDivElement | null>(null);
  const spineProgressRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();

  const { timeline } = PORTFOLIO_DATA;

  useEffect(() => {
    if (isReducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Experience Section Kinetic Title Reveal
      gsap.fromTo(
        ".timeline-kinetic-title",
        { yPercent: 105, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      if (spineTrackRef.current && spineProgressRef.current) {
        gsap.fromTo(
          spineProgressRef.current,
          { scaleY: 0, transformOrigin: "top center" },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: spineTrackRef.current,
              start: "top 70%",
              end: "bottom 65%",
              scrub: 0.5,
            },
          }
        );
      }

      // 2. Timeline Entry Cards with graceful spring scale & upward glide
      const items = gsap.utils.toArray<HTMLElement>(".timeline-entry-card");
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { scale: 0.94, y: 36, opacity: 0 },
          {
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 1.0,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );

        const ornaments = item.querySelectorAll(".hud-corner-ornament");
        if (ornaments.length > 0) {
          gsap.fromTo(
            ornaments,
            { scale: 0.6, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.75,
              stagger: 0.05,
              ease: "power2.out",
              clearProps: "transform,opacity",
              scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [isReducedMotion]);

  return (
    <section
      id="timeline"
      ref={sectionRef}
      aria-labelledby="timeline-heading"
      className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
    >
      {/* Section Header */}
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
            <span className="h-2 w-2 bg-accent-primary" aria-hidden="true" />
            <span>{"SYS.HUD // 05 — TRACK RECORD & LEADERSHIP"}</span>
          </div>
          <div className="overflow-hidden">
            <h2
              id="timeline-heading"
              className="timeline-kinetic-title mt-2 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
            >
              EXPERIENCE
            </h2>
          </div>
        </div>

        <p className="font-mono text-xs text-text-secondary">
          {"[ GDGOC IPB · IT FESTIVAL 2025 · IPB UNIVERSITY · MATRA HILLINDO ]"}
        </p>
      </div>

      {/* Timeline Spine & Tech-Bracketed Cards */}
      <div ref={spineTrackRef} className="relative py-4">
        {/* Vertical Spine Track */}
        <div
          className="absolute top-6 bottom-6 left-3 w-px bg-border-subtle sm:left-4 lg:left-[28%]"
          aria-hidden="true"
        >
          <div
            ref={spineProgressRef}
            className="h-full w-full bg-accent-primary"
          />
        </div>

        <div className="space-y-8">
          {timeline.map((entry, idx) => (
            <div
              key={entry.id}
              className="timeline-entry-card relative grid grid-cols-1 gap-4 pl-9 sm:pl-12 lg:grid-cols-12 lg:gap-8 lg:pl-0"
            >
              {/* Left 3.5 Cols on Desktop: Period, Category & Location */}
              <div className="lg:col-span-3 lg:pr-6 lg:text-right">
                <div className="inline-flex items-center gap-2 border border-border-strong bg-bg-elevated px-2.5 py-1 font-mono text-[11px] text-accent-primary">
                  <span>{`0${idx + 1} //`}</span>
                  <span className="tabular-nums">{entry.period}</span>
                </div>

                <p className="mt-2 font-mono text-xs font-semibold text-text-primary">
                  {entry.category}
                </p>

                <div className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-text-muted lg:justify-end">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  <span>{entry.location}</span>
                </div>
              </div>

              {/* Spine Node Indicator */}
              <div
                className="absolute top-2 left-[5px] flex h-4 w-4 items-center justify-center border border-accent-primary bg-bg-primary sm:left-[9px] lg:left-[calc(28%-8px)]"
                aria-hidden="true"
              >
                <span className="h-2 w-2 bg-accent-primary" />
              </div>

              {/* Right 9 Cols on Desktop: TechBracketCard Content */}
              <div className="lg:col-span-9 lg: pl-8">
                <TechBracketCard bracketSize="md" className="p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
                    <div>
                      <h3 className="font-display text-2xl tracking-wide text-text-primary sm:text-3xl">
                        {entry.role}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-accent-primary">
                        {entry.organization}
                      </p>
                    </div>

                    {entry.metricBadge ? (
                      <span className="border border-border-subtle bg-bg-primary px-3 py-1 font-mono text-xs text-accent-emerald">
                        ● {entry.metricBadge}
                      </span>
                    ) : null}
                  </div>

                  <ul className="mt-4 space-y-2">
                    {entry.bullets.map((bullet, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-3 text-xs leading-relaxed text-text-secondary sm:text-sm"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent-primary"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border-subtle pt-4">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="badge-spring border border-border-subtle bg-bg-primary px-2.5 py-0.5 font-mono text-[11px] text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </TechBracketCard>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
