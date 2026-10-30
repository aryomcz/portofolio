"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES, refreshScrollTrigger } from "@/lib/gsap";
import { TransitionLink } from "@/components/ui/TransitionLink";
import {
  ArrowUpRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  GalleryHorizontal,
  Layers,
  LayoutGrid,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PORTFOLIO_DATA, type ProjectCaseStudy } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import dynamic from "next/dynamic";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { ProjectVisualPreview } from "@/components/ui/ProjectVisualPreview";
import { BrandTechIcon } from "@/components/ui/BrandTechIcon";
import { SPRING_LAYOUT, EASE_REDUCED } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { KineticBlockReveal } from "@/components/ui/KineticBlockReveal";
import { SectionNextTeaser } from "@/components/ui/SectionNextTeaser";

const TechMetropolisTelemetry = dynamic(
  () =>
    import("@/components/ui/TechMetropolisTelemetry").then(
      (mod) => mod.TechMetropolisTelemetry
    ),
  {
    ssr: false,
    loading: () => (
      <div className="relative mx-auto my-8 flex min-h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-border-subtle bg-bg-elevated/40 p-8 backdrop-blur-md">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
          SYS.TELEMETRY // MOUNTING 3D METROPOLIS RUNTIME...
        </span>
      </div>
    ),
  }
);

const CaseStudyQuickModal = dynamic(
  () =>
    import("@/components/ui/CaseStudyQuickModal").then(
      (mod) => mod.CaseStudyQuickModal
    ),
  { ssr: false }
);

type CategoryFilter =
  | "ALL"
  | "FULL-STACK"
  | "MOBILE & PWA"
  | "ENTERPRISE & LOGISTICS";

const CATEGORIES: readonly CategoryFilter[] = [
  "ALL",
  "FULL-STACK",
  "MOBILE & PWA",
  "ENTERPRISE & LOGISTICS",
];

const CATEGORY_MAP: Record<CategoryFilter, readonly string[]> = {
  ALL: ["pos-livingroom", "tigo", "cms-pt-bks", "driver-app-pt-kjhms"],
  "FULL-STACK": ["pos-livingroom", "tigo", "cms-pt-bks"],
  "MOBILE & PWA": ["pos-livingroom", "tigo", "driver-app-pt-kjhms"],
  "ENTERPRISE & LOGISTICS": ["cms-pt-bks", "driver-app-pt-kjhms"],
};

export function SelectedWorksSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();
  const [previewStudy, setPreviewStudy] = useState<ProjectCaseStudy | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [viewMode, setViewMode] = useState<"stack" | "carousel" | "grid">("stack");
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const { projects, featuredAchievement } = PORTFOLIO_DATA;

  const filteredProjects = useMemo(() => {
    const allowedSlugs = CATEGORY_MAP[selectedCategory];
    return projects.filter((p) => allowedSlugs.includes(p.slug));
  }, [projects, selectedCategory]);

  const handleCategorySelect = (category: CategoryFilter) => {
    setSelectedCategory(category);
    setActiveIndex(0);
    refreshScrollTrigger();
  };

  const handleToggleViewMode = (mode: "stack" | "carousel" | "grid") => {
    setViewMode(mode);
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
            gsap.set(
              [
                ".hud-achievement-card",
                ".hud-achievement-card .hud-corner-ornament",
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

          // 1. Featured Achievement Card: graceful spring scale & glide
          gsap.fromTo(
            ".hud-achievement-card",
            { scale: 0.96, y: 28, autoAlpha: 0 },
            {
              scale: 1,
              y: 0,
              autoAlpha: 1,
              duration: 0.85,
              ease: "power3.out",
              clearProps: "transform,opacity,visibility",
              scrollTrigger: {
                trigger: "#achievements",
                start: "top 75%",
                toggleActions: "play none none none",
              },
            }
          );

          // 2. Featured Achievement HUD Corner Ornaments
          gsap.fromTo(
            ".hud-achievement-card .hud-corner-ornament",
            { scale: 0.8, autoAlpha: 0 },
            {
              scale: 1,
              autoAlpha: 1,
              duration: 0.5,
              stagger: 0.04,
              ease: "power2.out",
              clearProps: "transform,opacity,visibility",
              scrollTrigger: {
                trigger: "#achievements",
                start: "top 75%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      );
    },
    { scope: containerRef }
  );

  // Scroll-driven Stacking Cards scale & depth scrub
  useGSAP(
    () => {
      if (isReducedMotion || viewMode !== "stack") return;

      const cards = gsap.utils.toArray<HTMLElement>(".project-stack-card");
      cards.forEach((card, idx) => {
        if (idx === cards.length - 1) return;
        const targetScale = Math.max(0.9, 1 - (cards.length - 1 - idx) * 0.028);

        gsap.fromTo(
          card,
          { scale: 1 },
          {
            scale: targetScale,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 16%",
              end: "bottom 12%",
              scrub: 0.35,
            },
          }
        );
      });
    },
    { scope: containerRef, dependencies: [viewMode, selectedCategory, isReducedMotion] }
  );

  // Navigate carousel
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(filteredProjects.length - 1, prev + 1));
  }, [filteredProjects.length]);

  // Calculate carousel slide offset dynamically with resize awareness
  const getCardStep = useCallback(() => {
    if (typeof window === "undefined") return 584;
    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? window.innerWidth * 0.85 : 560;
    const gap = 24;
    return cardWidth + gap;
  }, []);

  const getCardOffset = () => {
    return -(activeIndex * getCardStep());
  };

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
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-end">
          <div>
            <KineticBlockReveal delay={0.05} blockColor="bg-[#0e7c86]">
              <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
                <Award className="h-3.5 w-3.5 text-[#0e7c86]" aria-hidden="true" />
                <span>{"SYS.HUD // 03 — HONORS & NATIONAL RECOGNITION"}</span>
              </div>
            </KineticBlockReveal>
            <div className="overflow-hidden mt-1">
              <KineticBlockReveal delay={0.15} blockColor="bg-[#0e7c86]">
                <h2
                  id="achievements-heading"
                  className="font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
                >
                  ACHIEVEMENTS
                </h2>
              </KineticBlockReveal>
            </div>
          </div>

          <KineticBlockReveal delay={0.25} blockColor="bg-[#14b8a6]">
            <p className="font-mono text-xs text-text-secondary">
              {"[ NATIONAL COMPETITION CHAMPIONSHIP · REPRESENTING IPB UNIVERSITY ]"}
            </p>
          </KineticBlockReveal>
        </div>

        {/* Featured Achievement HUD Card */}
        <TechBracketCard
          bracketSize="lg"
          activeAccent
          themeColor={featuredAchievement.themeColor}
          className="hud-achievement-card p-6 sm:p-8 lg:p-10"
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
                <KineticBlockReveal delay={0.15} themeColor={featuredAchievement.themeColor}>
                  <h3 className="font-display text-[clamp(2.1rem,3.6vw,3.25rem)] leading-[0.95] tracking-wide text-accent-primary">
                    {featuredAchievement.title}
                  </h3>
                </KineticBlockReveal>
                <div className="mt-2">
                  <KineticBlockReveal delay={0.25} themeColor={featuredAchievement.themeColor}>
                    <p className="font-mono text-sm font-medium text-text-primary">
                      {featuredAchievement.subtitle}
                    </p>
                  </KineticBlockReveal>
                </div>
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
                    className="badge-spring inline-flex items-center gap-1.5 rounded-full border border-accent-primary/45 bg-bg-primary px-3 py-1 font-mono text-xs text-accent-primary"
                  >
                    <BrandTechIcon
                      name={tech.name}
                      className="text-accent-primary"
                    />
                    <span>{tech.name}</span>
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <TransitionLink
                  href={`/projects/${featuredAchievement.slug}`}
                  label={`ACHIEVEMENT // ${featuredAchievement.shortTitle.toUpperCase()}`}
                  className="press-scale group inline-flex min-h-11 items-center gap-2 bg-accent-primary px-5 py-2.5 font-mono text-xs font-semibold tracking-wider text-white shadow-xs hover:opacity-90"
                >
                  <span>VIEW FULL CASE STUDY</span>
                  <ArrowUpRight
                    className="arrow-drift h-4 w-4"
                    aria-hidden="true"
                  />
                </TransitionLink>

                <button
                  type="button"
                  onClick={() => setPreviewStudy(featuredAchievement)}
                  className="press-scale inline-flex min-h-11 items-center gap-2 border border-accent-primary/60 bg-bg-primary px-4 py-2.5 font-mono text-xs text-accent-primary hover:border-accent-primary"
                >
                  <Eye className="h-4 w-4 text-accent-primary" aria-hidden="true" />
                  <span>PREVIEW</span>
                </button>

                {featuredAchievement.liveUrl ? (
                  <a
                    href={featuredAchievement.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-scale inline-flex min-h-11 items-center gap-2 border border-accent-primary/45 bg-bg-primary px-4 py-2.5 font-mono text-xs text-accent-primary hover:border-accent-primary"
                  >
                    <span>LIVE SITE</span>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>

            {/* Right 6 Cols: Visual Preview Frame */}
            <div className="lg:col-span-6">
              <TransitionLink
                href={`/projects/${featuredAchievement.slug}`}
                label={`ACHIEVEMENT // ${featuredAchievement.shortTitle.toUpperCase()}`}
                aria-label={`Open full case study for ${featuredAchievement.title}`}
                className="block"
              >
                <ProjectVisualPreview study={featuredAchievement} />
              </TransitionLink>
            </div>
          </div>
        </TechBracketCard>
      </section>

     {/* =====================================================================
          SECTION: 3D TECH METROPOLIS TELEMETRY
      ====================================================================== */}
      <section
        id="artifacts"
        aria-label="Interactive 3D Tech Metropolis Telemetry"
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <TechMetropolisTelemetry />

        <SectionNextTeaser
          currentCode="03"
          nextCode="04"
          nextLabel="SELECTED PROJECTS"
          targetSelector="#projects"
        />
      </section>

      {/* =====================================================================
          SECTION: PROJECTS (Stacking Cards / Interactive Carousel / Bento Grid)
      ====================================================================== */}
      <section
        id="projects"
        aria-labelledby="projects-heading"
        className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      >
        {/* Anchor alias for #works compatibility */}
        <div id="works" className=" -top-24" aria-hidden="true" />

        {/* Section Heading & Controls Toolbar */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-end">
          <div>
            <KineticBlockReveal delay={0.05} blockColor="bg-[#0e7c86]">
              <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
                <span className="h-2 w-2 bg-[#0e7c86]" aria-hidden="true" />
                <span>{"SYS.HUD // 04 — PRODUCTION ENGINEERING PORTFOLIO (STACKING DECK)"}</span>
              </div>
            </KineticBlockReveal>
            <div className="overflow-hidden py-1 mt-1">
              <KineticBlockReveal delay={0.15} blockColor="bg-[#0e7c86]">
                <h2
                  id="projects-heading"
                  className="font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
                >
                  SELECTED PROJECTS
                </h2>
              </KineticBlockReveal>
            </div>
          </div>

          {/* Right Toolbar: View Switcher (Stack vs Carousel vs Grid) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-border-subtle bg-bg-elevated p-1">
              <button
                type="button"
                onClick={() => handleToggleViewMode("stack")}
                className={cn(
                  "press-scale relative flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors",
                  viewMode === "stack"
                    ? "font-semibold text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="STACK view — Stacking cards"
              >
                {viewMode === "stack" ? (
                  <motion.span
                    layoutId="project-view-mode-pill"
                    transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                    className="absolute inset-0 bg-bg-subtle shadow-xs"
                    aria-hidden="true"
                  />
                ) : null}
                <Layers className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">STACK</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleViewMode("carousel")}
                className={cn(
                  "press-scale relative flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors",
                  viewMode === "carousel"
                    ? "font-semibold text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="CAROUSEL view — Interactive carousel"
              >
                {viewMode === "carousel" ? (
                  <motion.span
                    layoutId="project-view-mode-pill"
                    transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                    className="absolute inset-0 bg-bg-subtle shadow-xs"
                    aria-hidden="true"
                  />
                ) : null}
                <GalleryHorizontal className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">CAROUSEL</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleViewMode("grid")}
                className={cn(
                  "press-scale relative flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors",
                  viewMode === "grid"
                    ? "font-semibold text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="GRID view — Bento grid"
              >
                {viewMode === "grid" ? (
                  <motion.span
                    layoutId="project-view-mode-pill"
                    transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                    className="absolute inset-0 bg-bg-subtle shadow-xs"
                    aria-hidden="true"
                  />
                ) : null}
                <LayoutGrid className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">GRID</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills & Carousel Controls Row */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = CATEGORY_MAP[cat].length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={cn(
                    "press-scale relative border px-3.5 py-1.5 font-mono text-xs transition-colors",
                    isSelected
                      ? "border-accent-primary bg-accent-primary/10 font-semibold text-accent-primary"
                      : "border-border-subtle bg-bg-elevated/80 text-text-secondary hover:border-accent-primary/50 hover:text-text-primary"
                  )}
                >
                  {isSelected ? (
                    <motion.span
                      layoutId="project-cat-pill"
                      transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                      className="absolute inset-0 bg-accent-primary/15"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>{cat}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Carousel Step & Navigation Buttons (Only shown in Carousel View) */}
          {viewMode === "carousel" ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-text-muted">
                {`${String(activeIndex + 1).padStart(2, "0")} / ${String(
                  filteredProjects.length
                ).padStart(2, "0")}`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeIndex === 0}
                  className="press-scale flex h-8 w-8 items-center justify-center border border-border-subtle bg-bg-elevated text-text-primary transition-opacity hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous project"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={activeIndex >= filteredProjects.length - 1}
                  className="press-scale flex h-8 w-8 items-center justify-center border border-border-subtle bg-bg-elevated text-text-primary transition-opacity hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next project"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* =================================================================
            VIEW 0 (DEFAULT): SCROLL-DRIVEN STACKING CARDS
        ================================================================== */}
        {viewMode === "stack" ? (
          <div
            data-testid="projects-stacking-cards"
            className="relative flex flex-col gap-10 pb-6"
          >
            {filteredProjects.map((project, idx) => (
              <div
                key={`stack-${project.slug}`}
                style={{
                  top: `calc(5.25rem + ${idx * 1.4}rem)`,
                  zIndex: 10 + idx,
                }}
                className="project-stack-card sticky origin-top will-change-transform"
              >
                <TechBracketCard
                  as="article"
                  bracketSize="lg"
                  activeAccent
                  themeColor={project.themeColor}
                  className="hud-project-card bg-bg-elevated p-5 shadow-[0_-10px_36px_rgba(10,17,32,0.16)] sm:p-8"
                >
                  {/* Top Bar: Stack Order, Index & Category */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-accent-primary/35 pb-3 font-mono text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="border border-accent-primary bg-accent-primary/15 px-2 py-0.5 font-bold text-accent-primary tabular-nums">
                        {`STACK ${String(idx + 1).padStart(2, "0")}/${String(
                          filteredProjects.length
                        ).padStart(2, "0")}`}
                      </span>
                      <span className="font-semibold text-accent-primary">
                        {`PROJECT // ${project.index} · ${project.year}`}
                      </span>
                    </div>
                    <span className="border border-accent-primary/45 bg-bg-primary px-2.5 py-0.5 text-[11px] text-accent-primary">
                      {project.category}
                    </span>
                  </div>

                  {/* 2-Column Horizontal Split Inside Stacked Card */}
                  <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-center">
                    {/* Left 6 Cols: Visual Preview Frame */}
                    <div className="lg:col-span-6">
                      <TransitionLink
                        href={`/projects/${project.slug}`}
                        label={`PROJECT // ${project.shortTitle.toUpperCase()}`}
                        aria-label={`Open full case study for ${project.title}`}
                        className="block"
                      >
                        <ProjectVisualPreview study={project} />
                      </TransitionLink>
                    </div>

                    {/* Right 6 Cols: Narrative, Impact, Tech Stack & Actions */}
                    <div className="flex flex-col justify-between space-y-5 lg:col-span-6">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-display text-3xl tracking-wide text-accent-primary sm:text-4xl">
                            {project.title}
                          </h3>
                          <span className="font-mono text-[11px] text-accent-primary">
                            {project.clientOrContext}
                          </span>
                        </div>

                        <p className="mt-2.5 text-sm leading-relaxed text-text-secondary sm:text-base">
                          {project.cardSummary}
                        </p>
                      </div>

                      {/* Impact Strip */}
                      <div className="border border-accent-primary/35 bg-bg-primary/90 px-4 py-2.5 font-mono text-xs text-text-primary">
                        <span className="font-semibold text-accent-primary">
                          IMPACT //{" "}
                        </span>
                        <span>{project.heroMetricPill}</span>
                      </div>

                      {/* Tech Stack Modules */}
                      <div className="flex flex-wrap gap-1.5">
                        {project.techStack.map((tech) => (
                          <span
                            key={tech.name}
                            className="badge-spring inline-flex items-center gap-1.5 border border-accent-primary/45 bg-bg-primary px-3 py-1 font-mono text-[11px] text-accent-primary"
                          >
                            <BrandTechIcon
                              name={tech.name}
                              className="text-accent-primary"
                            />
                            <span>{tech.name}</span>
                          </span>
                        ))}
                      </div>

                      {/* Footer Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-accent-primary/35 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <TransitionLink
                            href={`/projects/${project.slug}`}
                            label={`PROJECT // ${project.shortTitle.toUpperCase()}`}
                            className="press-scale group inline-flex min-h-10 items-center gap-1.5 bg-accent-primary px-4 py-2 font-mono text-xs font-semibold text-white hover:opacity-90"
                          >
                            <span>CASE STUDY</span>
                            <ArrowUpRight
                              className="arrow-drift h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </TransitionLink>

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
                            <ExternalLink
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </TechBracketCard>
              </div>
            ))}
          </div>
        ) : viewMode === "carousel" ? (
          <div
            ref={carouselContainerRef}
            className="relative w-full overflow-hidden py-2"
          >
            <motion.div
              drag="x"
              dragConstraints={{
                right: 0,
                left: -(Math.max(0, filteredProjects.length - 1) * getCardStep()),
              }}
              dragElastic={0.12}
              onDragEnd={(_e, info) => {
                const threshold = 50;
                if (info.offset.x < -threshold && activeIndex < filteredProjects.length - 1) {
                  setActiveIndex((prev) => prev + 1);
                } else if (info.offset.x > threshold && activeIndex > 0) {
                  setActiveIndex((prev) => prev - 1);
                }
              }}
              animate={{ x: getCardOffset() }}
              transition={
                isReducedMotion
                  ? EASE_REDUCED
                  : { type: "spring", stiffness: 150, damping: 22, mass: 0.9 }
              }
              className="flex gap-6 cursor-grab active:cursor-grabbing select-none"
            >
              {filteredProjects.map((project, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <motion.div
                    key={project.slug}
                    layout
                    className="w-[85vw] max-w-[560px] shrink-0"
                    onClick={() => setActiveIndex(idx)}
                  >
                    <TechBracketCard
                      as="article"
                      bracketSize="lg"
                      activeAccent
                      themeColor={project.themeColor}
                      className={cn(
                        "hud-project-card flex flex-col justify-between p-5 sm:p-7 transition-all duration-300",
                        isCurrent
                          ? "ring-1 ring-accent-primary/60 shadow-[0_12px_40px_rgba(10,17,32,0.18)]"
                          : "opacity-85 hover:opacity-100"
                      )}
                    >
                      <div className="space-y-5">
                        {/* Top Category & Index Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent-primary/35 pb-3 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full bg-accent-primary"
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-accent-primary">
                              {`PROJECT // ${project.index} · ${project.year}`}
                            </span>
                          </div>
                          <span className="border border-accent-primary/45 bg-bg-primary px-2.5 py-0.5 text-[11px] text-accent-primary">
                            {project.category}
                          </span>
                        </div>

                        {/* Sharp Visual Preview Frame */}
                        <TransitionLink
                          href={`/projects/${project.slug}`}
                          label={`PROJECT // ${project.shortTitle.toUpperCase()}`}
                          aria-label={`Open full case study for ${project.title}`}
                          className="block"
                        >
                          <ProjectVisualPreview study={project} />
                        </TransitionLink>

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
                              className="badge-spring inline-flex items-center gap-1.5 rounded-full border border-accent-primary/45 bg-bg-primary px-3 py-1 font-mono text-[11px] text-accent-primary"
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
                          <TransitionLink
                            href={`/projects/${project.slug}`}
                            label={`PROJECT // ${project.shortTitle.toUpperCase()}`}
                            className="press-scale group inline-flex min-h-10 items-center gap-1.5 bg-accent-primary px-4 py-2 font-mono text-xs font-semibold text-white hover:opacity-90"
                          >
                            <span>CASE STUDY</span>
                            <ArrowUpRight
                              className="arrow-drift h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </TransitionLink>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewStudy(project);
                            }}
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
                            onClick={(e) => e.stopPropagation()}
                            className="press-scale inline-flex min-h-10 items-center gap-1.5 border border-accent-primary/45 bg-bg-primary px-3.5 py-2 font-mono text-xs text-accent-primary hover:border-accent-primary"
                          >
                            <span>LIVE SITE</span>
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </TechBracketCard>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Carousel Interactive Segment Indicators */}
            <div className="mt-6 flex justify-center items-center gap-2">
              {filteredProjects.map((project, idx) => (
                <button
                  key={`dot-${project.slug}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "h-1.5 transition-all duration-300 rounded-full",
                    idx === activeIndex
                      ? "w-8 bg-accent-primary"
                      : "w-2 bg-border-subtle hover:bg-accent-primary/50"
                  )}
                  aria-label={`Jump to ${project.title}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* =================================================================
              VIEW B: MODULAR 2-COLUMN BENTO GRID VIEW
          ================================================================== */
          <motion.div
            layout
            className="grid grid-cols-1 gap-7 lg:grid-cols-2"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                >
                  <TechBracketCard
                    as="article"
                    bracketSize="lg"
                    activeAccent
                    themeColor={project.themeColor}
                    className="hud-project-card flex flex-col justify-between p-5 sm:p-7 h-full"
                  >
                    <div className="space-y-5">
                      {/* Top Category & Index Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent-primary/35 pb-3 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full bg-accent-primary"
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-accent-primary">
                            {`PROJECT // ${project.index} · ${project.year}`}
                          </span>
                        </div>
                        <span className="border border-accent-primary/45 bg-bg-primary px-2.5 py-0.5 text-[11px] text-accent-primary">
                          {project.category}
                        </span>
                      </div>

                      {/* Sharp Visual Preview Frame */}
                      <TransitionLink
                        href={`/projects/${project.slug}`}
                        label={`PROJECT // ${project.shortTitle.toUpperCase()}`}
                        aria-label={`Open full case study for ${project.title}`}
                        className="block"
                      >
                        <ProjectVisualPreview study={project} />
                      </TransitionLink>

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
                            className="badge-spring inline-flex items-center gap-1.5 rounded-full border border-accent-primary/45 bg-bg-primary px-3 py-1 font-mono text-[11px] text-accent-primary"
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
                        <TransitionLink
                          href={`/projects/${project.slug}`}
                          label={`PROJECT // ${project.shortTitle.toUpperCase()}`}
                          className="press-scale group inline-flex min-h-10 items-center gap-1.5 bg-accent-primary px-4 py-2 font-mono text-xs font-semibold text-white hover:opacity-90"
                        >
                          <span>CASE STUDY</span>
                          <ArrowUpRight
                            className="arrow-drift h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </TransitionLink>

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
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Quick Preview Modal */}
      <CaseStudyQuickModal
        study={previewStudy}
        onClose={() => setPreviewStudy(null)}
      />
    </div>
  );
}
