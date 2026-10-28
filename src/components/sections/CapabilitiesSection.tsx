"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES } from "@/lib/gsap";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  PORTFOLIO_DATA,
  getCaseStudyBySlug,
  type ProjectSlug,
} from "@/data/portfolio";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { BrandTechIcon } from "@/components/ui/BrandTechIcon";
import { cn } from "@/lib/utils";

export function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [highlightedSlugs, setHighlightedSlugs] = useState<
    readonly ProjectSlug[]
  >([]);
  const [activeSkillName, setActiveSkillName] = useState<string | null>(null);

  const { capabilityDomains } = PORTFOLIO_DATA;

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

          // 1. Text Header Reveal: masked kinetic slide-up for SKILLS
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

          // 2. Bento Skill Cards: graceful spring scale and upward glide
          gsap.fromTo(
            ".skill-domain-card",
            { scale: 0.96, y: 24, autoAlpha: 0 },
            {
              scale: 1,
              y: 0,
              autoAlpha: 1,
              duration: 0.8,
              stagger: 0.12,
              ease: "power3.out",
              clearProps: "transform,opacity,visibility",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none none",
              },
            }
          );

          // 3. Reveal corner bracket ornaments (┌ ┐ └ ┘)
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
      className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      {/* Section Header */}
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
            <span className="h-2 w-2 bg-accent-primary" aria-hidden="true" />
            <span>{"SYS.HUD // 02 — TECHNICAL ARSENAL"}</span>
          </div>
          <div className="overflow-hidden">
            <h2
              id="skills-heading"
              className="skills-kinetic-title mt-2 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
            >
              SKILLS
            </h2>
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
              {"[ HOVER OR FOCUS ANY TECH PILL TO INSPECT LINKED PRODUCTION SYSTEMS ]"}
            </span>
          )}
        </div>
      </div>

      {/* 3 Bracketed Skill Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {capabilityDomains.map((domain) => (
          <TechBracketCard
            key={domain.id}
            bracketSize="lg"
            className="skill-domain-card flex flex-col justify-between p-6 sm:p-7"
          >
            <div>
              {/* Column Top Tag */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-3 font-mono text-xs">
                <span className="text-accent-primary">{domain.code}</span>
                <span className="text-text-muted">
                  {domain.skills.length} MODULES
                </span>
              </div>

              {/* Column Display Heading */}
              <h3 className="mt-4 font-display text-3xl tracking-wide text-text-primary">
                {domain.title}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                {domain.description}
              </p>

              {/* Individual Pill Badges with Brand SVG Icons & Spring Hover */}
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
                      className={cn(
                        "press-scale badge-spring inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-xs",
                        isSelected
                          ? "border-accent-primary bg-accent-primary/15 text-text-primary"
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
            <div className="mt-8 border-t border-border-subtle pt-4">
              <p className="font-mono text-[10px] tracking-wider text-text-muted">
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
                    <Link
                      key={slug}
                      href={`/projects/${slug}`}
                      className={cn(
                        "press-scale group inline-flex items-center gap-1 border px-2.5 py-1 font-mono text-[11px] transition-colors duration-150",
                        isHighlighted
                          ? "border-accent-emerald bg-accent-emerald/15 text-accent-emerald"
                          : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-strong hover:text-text-primary"
                      )}
                    >
                      <span>{study.shortTitle}</span>
                      <ArrowUpRight className="arrow-drift h-3 w-3" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </TechBracketCard>
        ))}
      </div>
    </section>
  );
}
