"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES } from "@/lib/gsap";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { ArrowUpRight, Layers, Cpu, Sparkles } from "lucide-react";
import {
  PORTFOLIO_DATA,
  getCaseStudyBySlug,
  type ProjectSlug,
} from "@/data/portfolio";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { BrandTechIcon } from "@/components/ui/BrandTechIcon";
import { KineticBlockReveal } from "@/components/ui/KineticBlockReveal";
import { VelocityTechMarquee } from "@/components/ui/VelocityTechMarquee";
import { SectionNextTeaser } from "@/components/ui/SectionNextTeaser";
import { cn } from "@/lib/utils";

const BENTO_SPAN_CLASSES: readonly string[] = [
  "md:col-span-6 lg:col-span-7",
  "md:col-span-3 lg:col-span-5",
  "md:col-span-3 lg:col-span-5",
];

export function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [highlightedSlugs, setHighlightedSlugs] = useState<
    readonly ProjectSlug[]
  >([]);
  const [activeSkillName, setActiveSkillName] = useState<string | null>(null);

  const { capabilityDomains, projects, featuredAchievement } = PORTFOLIO_DATA;
  const allDeployments = [featuredAchievement, ...projects];

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
            gsap.set(
              [
                ".skills-kinetic-title",
                ".skill-domain-card",
                ".skill-domain-card .hud-corner-ornament",
              ],
              {
                autoAlpha: 1,
                scale: 1,
                y: 0,
                yPercent: 0,
                clearProps: "transform,opacity,visibility",
              }
            );
            return;
          }

          gsap.fromTo(
            ".skills-kinetic-title",
            { yPercent: 105, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: "power3.out",
              clearProps: "transform",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none none",
              },
            }
          );

          gsap.fromTo(
            ".skill-domain-card",
            { scale: 0.96, y: 24, autoAlpha: 0 },
            {
              scale: 1,
              y: 0,
              autoAlpha: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out",
              clearProps: "transform,opacity,visibility",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none none",
              },
            }
          );

          gsap.fromTo(
            ".skill-domain-card .hud-corner-ornament",
            { scale: 0.8, autoAlpha: 0 },
            {
              scale: 1,
              autoAlpha: 1,
              duration: 0.5,
              stagger: 0.04,
              ease: "power2.out",
              clearProps: "transform,opacity,visibility",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="skills"
      ref={sectionRef}
      aria-labelledby="skills-heading"
      className="relative z-20 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      {/* Section Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end">
        <div>
          <KineticBlockReveal delay={0.05} blockColor="bg-[#0e7c86]">
            <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
              <span className="h-2 w-2 bg-[#0e7c86]" aria-hidden="true" />
              <span>{"SYS.HUD // 02 — TECHNICAL ARSENAL (BENTO MATRIX)"}</span>
            </div>
          </KineticBlockReveal>
          <div className="mt-1 overflow-hidden">
            <KineticBlockReveal delay={0.15} blockColor="bg-[#0e7c86]">
              <h2
                id="skills-heading"
                className="skills-kinetic-title font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
              >
                TECHNICAL ARSENAL
              </h2>
            </KineticBlockReveal>
          </div>
        </div>

        <div className="font-mono text-xs text-text-secondary">
          {activeSkillName ? (
            <span>
              ACTIVE FILTER:{" "}
              <strong className="text-accent-primary">{activeSkillName}</strong>{" "}
              ({highlightedSlugs.length} DEPLOYED SYSTEMS)
            </span>
          ) : (
            <span>
              {
                "[ HOVER OR TAP ANY TECH MODULE TO HIGHLIGHT LINKED PRODUCTION SYSTEMS ]"
              }
            </span>
          )}
        </div>
      </div>

      {/* Velocity-Reactive Tech Stack Marquee */}
      <VelocityTechMarquee />

      {/* Asymmetric 12-Column Architectural Bento Grid */}
      <div
        data-testid="skills-bento-grid"
        className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-6 lg:grid-cols-12"
      >
        {capabilityDomains.map((domain, idx) => {
          const spanClass =
            BENTO_SPAN_CLASSES[idx] ?? "md:col-span-6 lg:col-span-6";
          const isWideTile = idx === 0;

          return (
            <TechBracketCard
              key={domain.id}
              bracketSize="lg"
              className={cn(
                "skill-domain-card flex flex-col justify-between p-6 sm:p-7",
                spanClass
              )}
            >
              <div>
                {/* Bento Tile Header */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Layers
                      className="h-3.5 w-3.5 text-accent-primary"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-accent-primary">
                      {domain.code}
                    </span>
                  </div>
                  <span className="tabular-nums text-text-muted">
                    {domain.skills.length} MODULES
                  </span>
                </div>

                {/* Display Heading & Description */}
                <div
                  className={cn(
                    "mt-4",
                    isWideTile &&
                      "lg:flex lg:items-baseline lg:justify-between lg:gap-6"
                  )}
                >
                  <KineticBlockReveal
                    delay={0.1 + idx * 0.08}
                    blockColor="bg-[#0e7c86]"
                  >
                    <h3 className="font-display text-3xl tracking-wide text-text-primary sm:text-4xl">
                      {domain.title}
                    </h3>
                  </KineticBlockReveal>
                  <p
                    className={cn(
                      "mt-2 text-xs leading-relaxed text-text-secondary",
                      isWideTile && "lg:mt-0 lg:max-w-sm"
                    )}
                  >
                    {domain.description}
                  </p>
                </div>

                {/* Interactive Skill Modules */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {domain.skills.map((skill) => {
                    const isSelected = activeSkillName === skill.name;
                    return (
                      <button
                        key={skill.name}
                        type="button"
                        onMouseEnter={() => {
                          setActiveSkillName(skill.name);
                          setHighlightedSlugs(skill.relatedProjectSlugs);
                        }}
                        onFocus={() => {
                          setActiveSkillName(skill.name);
                          setHighlightedSlugs(skill.relatedProjectSlugs);
                        }}
                        onMouseLeave={() => {
                          setActiveSkillName(null);
                          setHighlightedSlugs([]);
                        }}
                        onBlur={() => {
                          setActiveSkillName(null);
                          setHighlightedSlugs([]);
                        }}
                        onClick={() => {
                          if (activeSkillName === skill.name) {
                            setActiveSkillName(null);
                            setHighlightedSlugs([]);
                          } else {
                            setActiveSkillName(skill.name);
                            setHighlightedSlugs(skill.relatedProjectSlugs);
                          }
                        }}
                        className={cn(
                          "press-scale badge-spring inline-flex items-center gap-2 border px-3.5 py-2 font-mono text-xs transition-colors",
                          isSelected
                            ? "border-accent-primary bg-accent-primary/15 text-text-primary shadow-xs"
                            : "border-border-strong/70 bg-bg-primary/90 text-text-primary hover:border-accent-primary"
                        )}
                      >
                        <BrandTechIcon
                          name={skill.name}
                          className={cn(
                            "transition-colors duration-150",
                            isSelected
                              ? "text-accent-primary"
                              : "text-accent-primary/90"
                          )}
                        />
                        <span>{skill.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Applied Proof & Linked Projects */}
              <div className="mt-7 border-t border-border-subtle pt-4">
                <p className="font-mono text-[10px] tracking-wider text-text-muted uppercase">
                  DEPLOYED IN PRODUCTION:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set(domain.skills.flatMap((s) => s.relatedProjectSlugs))
                  ).map((slug) => {
                    const study = getCaseStudyBySlug(slug);
                    if (!study) return null;
                    const isHighlighted = highlightedSlugs.includes(slug);
                    return (
                      <TransitionLink
                        key={slug}
                        href={`/projects/${slug}`}
                        label={`DOSSIER // ${study.shortTitle.toUpperCase()}`}
                        className={cn(
                          "press-scale group inline-flex items-center gap-1 border px-2.5 py-1 font-mono text-[11px] transition-colors duration-150",
                          isHighlighted
                            ? "border-accent-emerald bg-accent-emerald/15 text-accent-emerald"
                            : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-strong hover:text-text-primary"
                        )}
                      >
                        <span>{study.shortTitle}</span>
                        <ArrowUpRight
                          className="arrow-drift h-3 w-3"
                          aria-hidden="true"
                        />
                      </TransitionLink>
                    );
                  })}
                </div>
              </div>
            </TechBracketCard>
          );
        })}

        {/* 4th Bento Tile: Live Production Cross-Matrix & System Telemetry (lg:col-span-7) */}
        <TechBracketCard
          bracketSize="lg"
          activeAccent={highlightedSlugs.length > 0}
          className="skill-domain-card flex flex-col justify-between p-6 sm:p-7 md:col-span-6 lg:col-span-7"
        >
          <div>
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Cpu
                  className="h-3.5 w-3.5 text-accent-primary"
                  aria-hidden="true"
                />
                <span className="font-semibold text-accent-primary">
                  SYS // 04
                </span>
              </div>
              <span className="text-text-muted">
                LIVE PRODUCTION DEPLOYMENT MATRIX
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-3xl tracking-wide text-text-primary sm:text-4xl">
                APPLIED ARCHITECTURE TELEMETRY
              </h3>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-accent-primary">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>
                  {activeSkillName
                    ? `FILTERED BY: ${activeSkillName}`
                    : "5 VERIFIED PRODUCTION SYSTEMS"}
                </span>
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
              Direct mapping between technical stack modules and real-world
              shipped systems across enterprise logistics, retail POS, and
              award-winning web platforms.
            </p>

            {/* 5 Production System Mini-Cards inside Bento Tile */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {allDeployments.map((study) => {
                const isMatched =
                  highlightedSlugs.length === 0 ||
                  highlightedSlugs.includes(study.slug);

                return (
                  <TransitionLink
                    key={study.slug}
                    href={`/projects/${study.slug}`}
                    label={`SYSTEM // ${study.shortTitle.toUpperCase()}`}
                    className={cn(
                      "press-scale group flex items-center justify-between border p-3 transition-all duration-200",
                      highlightedSlugs.includes(study.slug)
                        ? "border-accent-primary bg-accent-primary/10 shadow-xs"
                        : isMatched
                          ? "border-border-subtle bg-bg-primary/85 hover:border-accent-primary"
                          : "border-border-subtle/40 bg-bg-primary/40 opacity-45"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
                        <span className="text-accent-primary">
                          {study.index}
                        </span>
                        <span>·</span>
                        <span className="truncate">{study.category}</span>
                      </div>
                      <p className="mt-0.5 truncate font-display text-lg tracking-wide text-text-primary group-hover:text-accent-primary">
                        {study.shortTitle}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="arrow-drift h-4 w-4 shrink-0 text-text-muted group-hover:text-accent-primary"
                      aria-hidden="true"
                    />
                  </TransitionLink>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 font-mono text-[11px] text-text-muted">
            <span>TOTAL ARSENAL: 16 PRODUCTION TECHNOLOGIES</span>
            <span className="text-accent-primary">
              [ CLICK ANY SYSTEM TO OPEN FULL DOSSIER ]
            </span>
          </div>
        </TechBracketCard>
      </div>

      {/* End-of-Section HUD Velocity Teaser: Skills -> Achievements */}
      <SectionNextTeaser
        currentCode="02"
        nextCode="03"
        nextLabel="ACHIEVEMENTS"
        targetSelector="#achievements"
      />
    </section>
  );
}
