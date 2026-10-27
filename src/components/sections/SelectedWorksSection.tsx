"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import { ArrowUpRight, Award, Eye, ExternalLink, UserCheck } from "lucide-react";
import { PORTFOLIO_DATA, type ProjectCaseStudy } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { ProjectVisualPreview } from "@/components/ui/ProjectVisualPreview";
import { BrandTechIcon } from "@/components/ui/BrandTechIcon";
import { CaseStudyQuickModal } from "@/components/ui/CaseStudyQuickModal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function SelectedWorksSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();
  const [previewStudy, setPreviewStudy] = useState<ProjectCaseStudy | null>(
    null
  );

  const { projects, featuredAchievement } = PORTFOLIO_DATA;

  useEffect(() => {
    if (isReducedMotion || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const blocks = gsap.utils.toArray<HTMLElement>(".hud-work-reveal");
      blocks.forEach((block) => {
        gsap.fromTo(
          block,
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: block,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [isReducedMotion]);

  return (
    <div ref={containerRef} className="space-y-8">
      {/* =====================================================================
          SECTION: ACHIEVEMENTS (1st Winner Prisma Fest 2025 — Lumind)
      ====================================================================== */}
      <section
        id="achievements"
        aria-labelledby="achievements-heading"
        className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      >
        {/* Section Heading */}
        <div className="hud-work-reveal mb-8 flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{"SYS.HUD // 03 — HONORS & NATIONAL RECOGNITION"}</span>
            </div>
            <h2
              id="achievements-heading"
              className="mt-2 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary"
            >
              ACHIEVEMENTS
            </h2>
          </div>

          <p className="font-mono text-xs text-text-secondary">
            {"[ NATIONAL COMPETITION CHAMPIONSHIP · REPRESENTING IPB UNIVERSITY ]"}
          </p>
        </div>

        {/* Featured Achievement HUD Card */}
        <TechBracketCard
          bracketSize="lg"
          activeAccent
          themeColor={featuredAchievement.themeColor}
          className="hud-work-reveal p-6 sm:p-8 lg:p-10"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left 6 Cols: CHAMPION Badge, Narrative, Role Breakdown & CTA */}
            <div className="flex flex-col justify-between space-y-5 lg:col-span-6">
              {/* Top Badges Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 bg-accent-primary px-3 py-1 font-mono text-xs font-bold tracking-wider text-white">
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{featuredAchievement.badgeText ?? "CHAMPION"}</span>
                </span>

                <span className="border border-accent-primary/50 bg-bg-primary px-3 py-1 font-mono text-xs text-accent-primary">
                  JUARA 1 NASIONAL · {featuredAchievement.year}
                </span>

                <span className="border border-accent-primary/35 bg-bg-primary px-3 py-1 font-mono text-xs text-accent-primary">
                  UIN Sunan Ampel Surabaya
                </span>
              </div>

              {/* Display Title & Product Name */}
              <div>
                <h3 className="font-display text-[clamp(2.1rem,3.6vw,3.25rem)] leading-[0.95] tracking-wide text-accent-primary">
                  {featuredAchievement.title}
                </h3>
                <p className="mt-2 font-mono text-sm font-medium text-text-primary">
                  {featuredAchievement.subtitle}
                </p>
              </div>

              {/* Story Summary */}
              <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
                {featuredAchievement.cardSummary}
              </p>

              {/* Role & Contributions Box */}
              <div className="border border-accent-primary/45 bg-bg-primary/80 p-4">
                <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
                  <UserCheck
                    className="h-4 w-4 text-accent-primary"
                    aria-hidden="true"
                  />
                  <span>ROLE: {featuredAchievement.role.toUpperCase()}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  Designed and engineered the interactive mental wellness modules:{" "}
                  <strong className="text-accent-primary">Lacak Emosi</strong>{" "}
                  (Daily Mood Check-In),{" "}
                  <strong className="text-accent-primary">Atur Napas</strong>{" "}
                  (Guided Breathing Cadence), and{" "}
                  <strong className="text-accent-primary">
                    Temukan Ketenangan
                  </strong>{" "}
                  deployed at{" "}
                  <span className="font-mono text-accent-primary">
                    lumind.vercel.app
                  </span>
                  .
                </p>
              </div>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-2">
                {featuredAchievement.techStack.map((tech) => (
                  <span
                    key={tech.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent-primary/45 bg-bg-primary px-3 py-1 font-mono text-xs text-accent-primary"
                  >
                    <BrandTechIcon
                      name={tech.name}
                      className="text-accent-primary"
                    />
                    <span>{tech.name}</span>
                  </span>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/projects/${featuredAchievement.slug}`}
                  className="press-scale group inline-flex min-h-11 items-center gap-2 bg-accent-primary px-5 py-2.5 font-mono text-xs font-semibold tracking-wider text-white hover:opacity-95"
                >
                  <span>READ THE STORY</span>
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setPreviewStudy(featuredAchievement)}
                  className="press-scale inline-flex min-h-11 items-center gap-1.5 border border-accent-primary/60 bg-bg-primary px-4 py-2.5 font-mono text-xs text-accent-primary hover:border-accent-primary"
                >
                  <Eye
                    className="h-3.5 w-3.5 text-accent-primary"
                    aria-hidden="true"
                  />
                  <span>QUICK PREVIEW</span>
                </button>

                {featuredAchievement.liveUrl ? (
                  <a
                    href={featuredAchievement.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-scale inline-flex min-h-11 items-center gap-1.5 border border-accent-primary/45 bg-bg-primary px-4 py-2.5 font-mono text-xs text-accent-primary hover:border-accent-primary"
                  >
                    <span>LUMIND.VERCEL.APP</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>

            {/* Right 6 Cols: Activity Photo & Mockup Visual Showcase */}
            <div className="lg:col-span-6">
              <Link
                href={`/projects/${featuredAchievement.slug}`}
                aria-label="Read the full story of 1st Winner Prisma Fest 2025 Lumind"
                className="block"
              >
                <ProjectVisualPreview study={featuredAchievement} />
              </Link>
            </div>
          </div>
        </TechBracketCard>
      </section>

      {/* =====================================================================
          SECTION: PROJECTS (Modular Portfolio Cards 01–04)
      ====================================================================== */}
      <section
        id="projects"
        aria-labelledby="projects-heading"
        className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      >
        {/* Anchor alias for #works compatibility */}
        <div id="works" className=" -top-24" aria-hidden="true" />

        {/* Section Heading */}
        <div className="hud-work-reveal mb-10 flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
              <span className="h-2 w-2 bg-accent-primary" aria-hidden="true" />
              <span>{"SYS.HUD // 04 — PRODUCTION ENGINEERING PORTFOLIO"}</span>
            </div>
            <h2
              id="projects-heading"
              className="mt-2 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary"
            >
              PROJECTS
            </h2>
          </div>

          <p className="font-mono text-xs text-text-secondary">
            {"[ CLICK ANY CARD TO INSPECT ARCHITECTURAL BLUEPRINT & GALLERY ]"}
          </p>
        </div>

        {/* Modular 2-Column Project Cards Grid */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          {projects.map((project) => (
            <TechBracketCard
              key={project.slug}
              as="article"
              bracketSize="lg"
              activeAccent
              themeColor={project.themeColor}
              className="hud-work-reveal flex flex-col justify-between p-5 sm:p-7"
            >
              <div className="space-y-5">
                {/* Top Category & Index Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent-primary/35 pb-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden="true" />
                    <span className="font-semibold text-accent-primary">
                      {`PROJECT // ${project.index} · ${project.year}`}
                    </span>
                  </div>
                  <span className="border border-accent-primary/45 bg-bg-primary px-2.5 py-0.5 text-[11px] text-accent-primary">
                    {project.category}
                  </span>
                </div>

                {/* Sharp Visual Preview Frame */}
                <Link
                  href={`/projects/${project.slug}`}
                  aria-label={`Open full case study for ${project.title}`}
                  className="block"
                >
                  <ProjectVisualPreview study={project} />
                </Link>

                {/* Project Title & Solution Summary */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-3xl tracking-wide text-accent-primary sm:text-4xl">
                      {project.title}
                    </h3>
                    <span className="font-mono text-[11px] text-accent-primary">
                      ● {project.clientOrContext}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {project.cardSummary}
                  </p>
                </div>

                {/* Impact Highlight Strip */}
                <div className="border border-accent-primary/35 border-l-2 border-l-accent-primary bg-bg-primary/90 px-3.5 py-2 font-mono text-xs text-text-primary">
                  <span className="font-semibold text-accent-primary">IMPACT // </span>
                  <span>{project.heroMetricPill}</span>
                </div>

                {/* Tech Stack Pill Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent-primary/45 bg-bg-primary px-3 py-1 font-mono text-[11px] text-accent-primary"
                    >
                      <BrandTechIcon
                        name={tech.name}
                        className="text-accent-primary"
                      />
                      <span>{tech.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Links */}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-2.5 border-t border-accent-primary/35 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="press-scale group inline-flex min-h-10 items-center gap-1.5 bg-accent-primary px-4 py-2 font-mono text-xs font-semibold text-white hover:opacity-90"
                  >
                    <span>CASE STUDY</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setPreviewStudy(project)}
                    className="press-scale inline-flex min-h-10 items-center gap-1.5 border border-accent-primary/60 bg-bg-primary px-3.5 py-2 font-mono text-xs text-accent-primary hover:border-accent-primary"
                  >
                    <Eye
                      className="h-3.5 w-3.5 text-accent-primary"
                      aria-hidden="true"
                    />
                    <span>PREVIEW</span>
                  </button>
                </div>

                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-scale inline-flex min-h-10 items-center gap-1.5 border border-accent-primary/45 bg-bg-primary px-3.5 py-2 font-mono text-xs text-accent-primary hover:border-accent-primary"
                  >
                    <span>LIVE SITE</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </TechBracketCard>
          ))}
        </div>
      </section>

      {/* Quick Preview Modal */}
      <CaseStudyQuickModal
        study={previewStudy}
        onClose={() => setPreviewStudy(null)}
      />
    </div>
  );
}
