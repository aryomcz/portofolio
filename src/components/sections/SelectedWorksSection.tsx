"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  GalleryHorizontal,
  LayoutGrid,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PORTFOLIO_DATA, type ProjectCaseStudy } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { ProjectVisualPreview } from "@/components/ui/ProjectVisualPreview";
import { BrandTechIcon } from "@/components/ui/BrandTechIcon";
import { CaseStudyQuickModal } from "@/components/ui/CaseStudyQuickModal";
import { SPRING_LAYOUT, EASE_REDUCED } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const { projects, featuredAchievement } = PORTFOLIO_DATA;

  const filteredProjects = useMemo(() => {
    const allowedSlugs = CATEGORY_MAP[selectedCategory];
    return projects.filter((p) => allowedSlugs.includes(p.slug));
  }, [projects, selectedCategory]);

  // Reset active index when category changes
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCategory]);

  useEffect(() => {
    if (isReducedMotion || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Achievements Section Kinetic Title Reveal
      gsap.fromTo(
        ".achieve-kinetic-title",
        { yPercent: 105, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power4.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: "#achievements",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // 2. Featured Achievement Card: spring scale dynamics
      gsap.fromTo(
        ".hud-achievement-card",
        { scale: 0.97, y: 22, opacity: 0 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: "#achievements",
            start: "top 82%",
            toggleActions: "play none none none",
          },
        }
      );

      // 3. Featured Achievement HUD Corner Ornaments
      gsap.fromTo(
        ".hud-achievement-card .hud-corner-ornament",
        { scale: 0.7, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: "#achievements",
            start: "top 82%",
            toggleActions: "play none none none",
          },
        }
      );

      // 4. Projects Section Kinetic Title Reveal
      gsap.fromTo(
        ".projects-kinetic-title",
        { yPercent: 105, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power4.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: "#projects",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [isReducedMotion]);

  // Navigate carousel
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(filteredProjects.length - 1, prev + 1));
  }, [filteredProjects.length]);

  // Calculate carousel slide offset
  // Card width is ~560px on desktop + 24px gap = 584px
  const getCardOffset = () => {
    if (typeof window === "undefined") return 0;
    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? window.innerWidth * 0.85 : 560;
    const gap = 24;
    return -(activeIndex * (cardWidth + gap));
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
            <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{"SYS.HUD // 03 — HONORS & NATIONAL RECOGNITION"}</span>
            </div>
            <div className="overflow-hidden">
              <h2
                id="achievements-heading"
                className="achieve-kinetic-title mt-2 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
              >
                ACHIEVEMENTS
              </h2>
            </div>
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
                <Link
                  href={`/projects/${featuredAchievement.slug}`}
                  className="press-scale group inline-flex min-h-11 items-center gap-2 bg-accent-primary px-5 py-2.5 font-mono text-xs font-semibold tracking-wider text-white shadow-xs hover:opacity-90"
                >
                  <span>VIEW FULL CASE STUDY</span>
                  <ArrowUpRight
                    className="arrow-drift h-4 w-4"
                    aria-hidden="true"
                  />
                </Link>

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
              <Link
                href={`/projects/${featuredAchievement.slug}`}
                aria-label={`Open full case study for ${featuredAchievement.title}`}
                className="block"
              >
                <ProjectVisualPreview study={featuredAchievement} />
              </Link>
            </div>
          </div>
        </TechBracketCard>
      </section>

      {/* =====================================================================
          SECTION: PROJECTS (Interactive Carousel / Bento Showcase)
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
            <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
              <span className="h-2 w-2 bg-accent-primary" aria-hidden="true" />
              <span>{"SYS.HUD // 04 — PRODUCTION ENGINEERING PORTFOLIO"}</span>
            </div>
            <div className="overflow-hidden">
              <h2
                id="projects-heading"
                className="projects-kinetic-title mt-2 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
              >
                PROJECTS
              </h2>
            </div>
          </div>

          {/* Right Toolbar: View Switcher (Carousel vs Grid) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border-subtle bg-bg-elevated p-1">
              <button
                type="button"
                onClick={() => setViewMode("carousel")}
                className={cn(
                  "press-scale relative flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                  viewMode === "carousel"
                    ? "font-semibold text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="Carousel view"
              >
                {viewMode === "carousel" ? (
                  <motion.span
                    layoutId="project-view-mode-pill"
                    transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                    className="absolute inset-0 rounded-full bg-bg-subtle shadow-xs"
                    aria-hidden="true"
                  />
                ) : null}
                <GalleryHorizontal className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">CAROUSEL</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "press-scale relative flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                  viewMode === "grid"
                    ? "font-semibold text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="Grid view"
              >
                {viewMode === "grid" ? (
                  <motion.span
                    layoutId="project-view-mode-pill"
                    transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                    className="absolute inset-0 rounded-full bg-bg-subtle shadow-xs"
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
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "press-scale relative rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors",
                    isSelected
                      ? "border-accent-primary bg-accent-primary/10 font-semibold text-accent-primary"
                      : "border-border-subtle bg-bg-elevated/80 text-text-secondary hover:border-accent-primary/50 hover:text-text-primary"
                  )}
                >
                  {isSelected ? (
                    <motion.span
                      layoutId="project-cat-pill"
                      transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                      className="absolute inset-0 rounded-full bg-accent-primary/15"
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
                  className="press-scale flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary transition-opacity hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous project"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={activeIndex >= filteredProjects.length - 1}
                  className="press-scale flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary transition-opacity hover:border-accent-primary hover:text-accent-primary disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next project"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* =================================================================
            VIEW A: INTERACTIVE CAROUSEL VIEW (Swipe / Drag Momentum)
        ================================================================== */}
        {viewMode === "carousel" ? (
          <div
            ref={carouselContainerRef}
            className="relative w-full overflow-hidden py-2"
          >
            <motion.div
              drag="x"
              dragConstraints={{
                right: 0,
                left: -(Math.max(0, filteredProjects.length - 1) * 584),
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
                  : { type: "spring", stiffness: 360, damping: 32 }
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
                          <Link
                            href={`/projects/${project.slug}`}
                            className="press-scale group inline-flex min-h-10 items-center gap-1.5 bg-accent-primary px-4 py-2 font-mono text-xs font-semibold text-white hover:opacity-90"
                          >
                            <span>CASE STUDY</span>
                            <ArrowUpRight
                              className="arrow-drift h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Link>

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
                        <Link
                          href={`/projects/${project.slug}`}
                          className="press-scale group inline-flex min-h-10 items-center gap-1.5 bg-accent-primary px-4 py-2 font-mono text-xs font-semibold text-white hover:opacity-90"
                        >
                          <span>CASE STUDY</span>
                          <ArrowUpRight
                            className="arrow-drift h-3.5 w-3.5"
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
