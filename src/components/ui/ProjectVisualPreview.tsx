"use client";

import Image from "next/image";
import type { ProjectCaseStudy } from "@/data/portfolio";
import { Award, CheckCircle2 } from "lucide-react";

interface ProjectVisualPreviewProps {
  readonly study: ProjectCaseStudy;
}

/**
 * Sharp, Creative Tech HUD Visual Preview Frame for Achievements & Projects.
 * Showcases the full custom 16:9 banner artwork from /public/images at 100% clarity
 * with per-project colored borders and text telemetry.
 */
export function ProjectVisualPreview({ study }: ProjectVisualPreviewProps) {
  const isAchievement = study.kind === "achievement";

  return (
    <div
      data-project-theme={study.themeColor}
      className="group/preview relative flex w-full flex-col overflow-hidden border border-accent-primary/45 bg-bg-primary transition-colors duration-200 hover:border-accent-primary"
    >
      {/* Top HUD Telemetry Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-accent-primary/35 bg-bg-elevated px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-accent-primary" aria-hidden="true" />
          <span className="font-mono text-[11px] font-medium text-accent-primary">
            {`${study.slug.toUpperCase()} // ${study.year}`}
          </span>
        </div>

        {isAchievement ? (
          <span className="inline-flex items-center gap-1 bg-accent-primary px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white">
            <Award className="h-3 w-3" aria-hidden="true" />
            <span>{study.badgeText ?? "CHAMPION"}</span>
          </span>
        ) : (
          <span className="border border-accent-primary/50 bg-bg-primary px-2 py-0.5 font-mono text-[10px] text-accent-primary">
            ● SHIPPED SYSTEM
          </span>
        )}
      </div>

      {/* Primary 16:9 Showcase Image (100% Clear & Unobscured) */}
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-accent-primary/35 bg-bg-elevated">
        <Image
          src={study.previewImage.src}
          alt={study.previewImage.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 720px"
          className="object-cover transition-transform duration-500 ease-out group-hover/preview:scale-[1.02]"
        />
      </div>

      {/* Secondary Gallery Filmstrip & Quantified Metrics Bar */}
      <div className="grid grid-cols-1 gap-2.5 bg-bg-elevated/90 p-3 sm:grid-cols-12 sm:items-center">
        {/* Left 7 Cols: 3 Mini Gallery Snapshots */}
        <div className="grid grid-cols-3 gap-2 sm:col-span-7">
          {study.dummyGallery.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="relative aspect-[16/10] overflow-hidden border border-accent-primary/35 bg-bg-primary transition-colors duration-150 group-hover/preview:border-accent-primary"
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 33vw, 240px"
                className="object-cover opacity-90 transition-opacity duration-150 group-hover/preview:opacity-100"
              />
              <span className="absolute right-0 bottom-0 left-0 z-10 truncate border-t border-accent-primary/30 bg-bg-primary/90 px-1.5 py-0.5 font-mono text-[8px] text-accent-primary">
                {item.tag.split("//")[0]?.trim() ?? item.tag}
              </span>
            </div>
          ))}
        </div>

        {/* Right 5 Cols: 2 Key Verified Metrics */}
        <div className="grid grid-cols-2 gap-2 sm:col-span-5">
          {study.verifiedMetrics.slice(0, 2).map((metric, idx) => (
            <div
              key={`${study.slug}-metric-${idx}`}
              className="flex flex-col justify-center border border-accent-primary/35 bg-bg-primary px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="tabular-nums font-display text-lg leading-none tracking-wide text-accent-primary">
                  {metric.value}
                </span>
                <CheckCircle2
                  className="h-3 w-3 shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
              </div>
              <span className="mt-1 line-clamp-1 font-mono text-[9px] text-text-secondary">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="relative z-10 flex items-center justify-between border-t border-accent-primary/35 bg-bg-primary px-3.5 py-2 font-mono text-[10px] text-text-secondary">
        <span className="truncate">ROLE // {study.role.toUpperCase()}</span>
        <span className="shrink-0 font-semibold text-accent-primary">
          {study.dummyGallery.length} SNAPSHOTS →
        </span>
      </div>
    </div>
  );
}
