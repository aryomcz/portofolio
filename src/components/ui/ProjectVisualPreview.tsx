"use client";

import type { ProjectCaseStudy } from "@/data/portfolio";
import { Award, CheckCircle2, Layers } from "lucide-react";

interface ProjectVisualPreviewProps {
  readonly study: ProjectCaseStudy;
}

/**
 * Sharp, Creative Tech HUD Visual Preview Frame for Achievements & Projects.
 * Displays rich dummy mockup/activity imagery framed by technical telemetry HUD overlays.
 */
export function ProjectVisualPreview({ study }: ProjectVisualPreviewProps) {
  const isAchievement = study.kind === "achievement";

  return (
    <div className="group/preview relative flex h-full min-h-[260px] w-full flex-col justify-between overflow-hidden border border-border-subtle bg-bg-primary sm:min-h-[300px]">
      {/* Background Dummy Image / Mockup Layer with subtle zoom on hover */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={study.previewImage.src}
          alt={study.previewImage.alt}
          loading="lazy"
          className="h-full w-full object-cover opacity-35 transition-transform duration-500 ease-out group-hover/preview:scale-105 dark:opacity-30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/40"
        />
      </div>

      {/* Top HUD Telemetry Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-border-subtle/80 bg-bg-elevated/85 px-4 py-2.5 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-accent-primary" aria-hidden="true" />
          <span className="font-mono text-[11px] text-text-primary">
            {`${study.slug.toUpperCase()} // ${study.year}`}
          </span>
        </div>

        {isAchievement ? (
          <span className="inline-flex items-center gap-1 bg-accent-primary px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white">
            <Award className="h-3 w-3" aria-hidden="true" />
            <span>{study.badgeText ?? "CHAMPION"}</span>
          </span>
        ) : (
          <span className="border border-border-strong bg-bg-primary/90 px-2 py-0.5 font-mono text-[10px] text-accent-emerald">
            ● SHIPPED SYSTEM
          </span>
        )}
      </div>

      {/* Center Visual Mockup & Activity Overlay */}
      <div className="relative z-10 my-auto grid grid-cols-1 gap-3 p-4 sm:grid-cols-12 sm:p-5">
        {/* Left 7 Cols: Simulated UI / Activity Photo Frame */}
        <div className="flex flex-col justify-between border border-border-strong/70 bg-bg-elevated/90 p-3.5 backdrop-blur-xs sm:col-span-7">
          <div className="flex items-center justify-between font-mono text-[10px] text-accent-primary">
            <span>
              {isAchievement
                ? "COMPETITION DOC & UI MOCKUP"
                : "ARCHITECTURE & UI PREVIEW"}
            </span>
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          </div>

          {/* Mini Dual Thumbnail Preview inside the HUD Frame */}
          <div className="my-2.5 grid grid-cols-2 gap-2">
            {study.dummyGallery.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="relative h-20 overflow-hidden border border-border-subtle bg-bg-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-bg-primary/85 px-1.5 py-0.5 font-mono text-[9px] truncate text-text-primary">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>

          <p className="font-mono text-[11px] text-text-secondary truncate">
            {study.subtitle}
          </p>
        </div>

        {/* Right 5 Cols: Quantified Metrics Stack */}
        <div className="flex flex-col justify-between gap-2 sm:col-span-5">
          {study.verifiedMetrics.slice(0, 2).map((metric, idx) => (
            <div
              key={`${study.slug}-metric-${idx}`}
              className="flex flex-1 flex-col justify-center border border-border-subtle/90 bg-bg-elevated/90 p-3 backdrop-blur-xs"
            >
              <div className="flex items-center justify-between">
                <span className="tabular-nums font-display text-2xl leading-none tracking-wide text-text-primary">
                  {metric.value}
                </span>
                <CheckCircle2
                  className="h-3.5 w-3.5 text-accent-emerald"
                  aria-hidden="true"
                />
              </div>
              <span className="mt-1 font-mono text-[10px] leading-snug text-text-secondary">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="relative z-10 flex items-center justify-between border-t border-border-subtle/80 bg-bg-elevated/85 px-4 py-2 font-mono text-[10px] text-text-secondary backdrop-blur-xs">
        <span>ROLE // {study.role.toUpperCase()}</span>
        <span className="text-accent-primary">
          {study.dummyGallery.length} SNAPSHOTS AVAILABLE →
        </span>
      </div>
    </div>
  );
}
