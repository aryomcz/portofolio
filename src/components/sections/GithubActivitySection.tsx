"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, GitCommit } from "lucide-react";
import { motion } from "motion/react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES } from "@/lib/gsap";
import { PORTFOLIO_DATA, type GithubContributionDay } from "@/data/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SPRING_LAYOUT, EASE_REDUCED } from "@/lib/motion-tokens";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { cn } from "@/lib/utils";

interface LiveYearTelemetry {
  readonly year: number;
  readonly totalContributions: number;
  readonly source: "github-graphql" | "github-public-api" | "github-html";
  readonly weeks: readonly (readonly GithubContributionDay[])[];
}

function clampLevel(val: number): 0 | 1 | 2 | 3 | 4 {
  if (val <= 0) return 0;
  if (val === 1) return 1;
  if (val === 2) return 2;
  if (val === 3) return 3;
  return 4;
}

function groupDaysIntoWeeks(
  days: readonly GithubContributionDay[],
  year: number
): readonly (readonly GithubContributionDay[])[] {
  if (days.length === 0) return [];
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(`${sorted[0].date}T00:00:00Z`);
  const firstDayOfWeek = Number.isNaN(firstDate.getUTCDay())
    ? 0
    : firstDate.getUTCDay();

  const paddedDays: GithubContributionDay[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    paddedDays.push({ date: `${year}-01-00`, count: 0, level: 0 });
  }
  for (const day of sorted) {
    paddedDays.push(day);
  }
  while (paddedDays.length % 7 !== 0) {
    paddedDays.push({ date: `${year}-12-32`, count: 0, level: 0 });
  }

  const weeks: GithubContributionDay[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }
  return weeks;
}

function buildDeterministicHeatmap(
  year: number
): readonly (readonly GithubContributionDay[])[] {
  const weeks: GithubContributionDay[][] = [];
  let seed = year * 1337;

  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let w = 0; w < 52; w++) {
    const days: GithubContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const r = nextRand();
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (r < 0.28) level = 0;
      else if (r < 0.56) level = 1;
      else if (r < 0.78) level = 2;
      else if (r < 0.92) level = 3;
      else level = 4;

      const count = level === 0 ? 0 : level * 3 + ((w + d) % 3);
      days.push({
        date: `W${w + 1}-D${d + 1}`,
        count,
        level,
      });
    }
    weeks.push(days);
  }
  return weeks;
}

function formatContributionDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (dateStr.endsWith("-00") || dateStr.endsWith("-32")) return "";
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const LEVEL_BG_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-[var(--gh-level-0)]",
  1: "bg-[var(--gh-level-1)]",
  2: "bg-[var(--gh-level-2)]",
  3: "bg-[var(--gh-level-3)]",
  4: "bg-[var(--gh-level-4)]",
};

export function GithubActivitySection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const statusTextRef = useRef<HTMLSpanElement | null>(null);
  const { githubTelemetry } = PORTFOLIO_DATA;
  const isReducedMotion = useReducedMotion();
  const [selectedYear, setSelectedYear] = useState<number>(
    githubTelemetry.availableYears[0] ?? 2026
  );
  const [liveCache, setLiveCache] = useState<Record<number, LiveYearTelemetry>>(
    {}
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
            gsap.set([".github-kinetic-title", ".github-telemetry-card"], {
              autoAlpha: 1,
              y: 0,
              yPercent: 0,
              clearProps: "all",
            });
            return;
          }

          // 1. Heading Kinetic Reveal: masked upward slide with power3.out
          gsap.fromTo(
            ".github-kinetic-title",
            { yPercent: 105, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: "power3.out",
              clearProps: "all",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );

          // 2. Contribution Card: smooth entrance
          gsap.fromTo(
            ".github-telemetry-card",
            { y: 28, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.85,
              ease: "power3.out",
              clearProps: "all",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      );
    },
    { scope: sectionRef }
  );

  useEffect(() => {
    if (liveCache[selectedYear]) return;

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        setIsLoading(true);
      }
    });

    async function loadYearTelemetry() {
      const username = githubTelemetry.username;

      // 1. Try internal Next.js Route Handler (/api/github-contributions)
      try {
        const res = await fetch(
          `/api/github-contributions?username=${encodeURIComponent(username)}&year=${selectedYear}`
        );
        if (res.ok) {
          const data = (await res.json()) as LiveYearTelemetry;
          if (!isCancelled && Array.isArray(data.weeks) && data.weeks.length > 0) {
            setLiveCache((prev) => ({ ...prev, [selectedYear]: data }));
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to direct public API below
      }

      // 2. Fallback: Direct client fetch from public GitHub contributions API
      try {
        const directRes = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=${selectedYear}`
        );
        if (directRes.ok) {
          const raw = (await directRes.json()) as {
            total?: Record<string, number>;
            contributions?: { date: string; count: number; level: number }[];
          };
          if (Array.isArray(raw.contributions) && raw.contributions.length > 0) {
            const days: GithubContributionDay[] = raw.contributions.map((item) => ({
              date: item.date,
              count: item.count,
              level: clampLevel(item.level),
            }));
            const sumTotal = days.reduce((acc, d) => acc + d.count, 0);
            const totalContributions =
              typeof raw.total?.[String(selectedYear)] === "number"
                ? raw.total[String(selectedYear)]
                : sumTotal;

            if (!isCancelled) {
              setLiveCache((prev) => ({
                ...prev,
                [selectedYear]: {
                  year: selectedYear,
                  totalContributions,
                  source: "github-public-api",
                  weeks: groupDaysIntoWeeks(days, selectedYear),
                },
              }));
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {
        // Keep deterministic snapshot fallback if offline
      }

      if (!isCancelled) {
        setIsLoading(false);
      }
    }

    void loadYearTelemetry();

    return () => {
      isCancelled = true;
    };
  }, [githubTelemetry.username, liveCache, selectedYear]);

  const currentLiveYear = liveCache[selectedYear];

  const heatmapWeeks = useMemo(
    () =>
      currentLiveYear?.weeks && currentLiveYear.weeks.length > 0
        ? currentLiveYear.weeks
        : buildDeterministicHeatmap(selectedYear),
    [currentLiveYear, selectedYear]
  );

  const defaultSummaryText = useMemo(() => {
    if (currentLiveYear) {
      return `${currentLiveYear.totalContributions.toLocaleString("en-US")} Contributions in ${selectedYear}`;
    }
    return githubTelemetry.summaryStats.totalContributionsLabel;
  }, [currentLiveYear, githubTelemetry.summaryStats.totalContributionsLabel, selectedYear]);

  // Synchronize static status text whenever year changes or data arrives
  useEffect(() => {
    if (statusTextRef.current) {
      statusTextRef.current.textContent = defaultSummaryText;
    }
  }, [defaultSummaryText]);

  return (
    <section
      id="github"
      ref={sectionRef}
      aria-labelledby="github-heading"
      className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
            <GitCommit className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{"SYS.HUD // 06 — OPEN SOURCE & COMMIT TELEMETRY"}</span>
          </div>
          <div className="overflow-hidden">
            <h2
              id="github-heading"
              className="github-kinetic-title mt-2 font-display text-[clamp(2.75rem,5.5vw,4.5rem)] leading-[0.9] tracking-wide text-text-primary will-change-transform"
            >
              GITHUB TELEMETRY
            </h2>
          </div>
        </div>

        {/* Year Filter Pills */}
        <div
          role="group"
          aria-label="Filter GitHub contributions by year"
          className="ml-auto flex w-fit justify-end items-center gap-1 border border-border-subtle bg-bg-elevated p-1"
        >
          {githubTelemetry.availableYears.map((year) => {
            const isActive = selectedYear === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "press-scale tabular-nums relative px-3 py-1 font-mono text-xs transition-colors duration-150",
                  isActive
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="github-year-pill"
                    transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                    className="absolute inset-0 border border-border-strong bg-bg-subtle"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-10">{year}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="github-telemetry-card">
        <TechBracketCard bracketSize="lg" className="p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-accent-emerald">
              @{githubTelemetry.username} · {selectedYear} CONTRIBUTION MATRIX
            </span>
            <span className="inline-flex items-center gap-1.5 border border-border-subtle bg-bg-primary px-2 py-0.5 text-[10px] text-text-muted">
              {isLoading ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" aria-hidden="true" />
                  <span>SYNCING GITHUB...</span>
                </>
              ) : currentLiveYear ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" aria-hidden="true" />
                  <span>
                    {currentLiveYear.source === "github-graphql"
                      ? "LIVE GRAPHQL SYNC"
                      : "LIVE GITHUB SYNC"}
                  </span>
                </>
              ) : (
                <span>LOCAL SNAPSHOT</span>
              )}
            </span>
          </div>
          <span ref={statusTextRef} className="tabular-nums text-text-secondary">
            {defaultSummaryText}
          </span>
        </div>

        {/* 52-Week Contribution Heatmap Grid */}
        <div
          className="overflow-x-auto border border-border-subtle bg-bg-primary/90 p-4 sm:p-5"
        >
          <div className="flex min-w-[680px] justify-between gap-1">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => {
                  const isPaddingCell =
                    day.date.endsWith("-00") || day.date.endsWith("-32");
                  if (isPaddingCell) {
                    return (
                      <span
                        key={`${wIdx}-${dIdx}`}
                        aria-hidden="true"
                        className="h-3 w-3 border border-transparent bg-transparent opacity-25"
                      />
                    );
                  }

                  const formattedDate = formatContributionDate(day.date);
                  const countWord =
                    day.count === 1 ? "contribution" : "contributions";
                  const label = formattedDate
                    ? `${day.count} ${countWord} on ${formattedDate}`
                    : `${day.count} ${countWord} — Week ${wIdx + 1}, Day ${dIdx + 1} (${selectedYear})`;

                  return (
                    <button
                      key={`${wIdx}-${dIdx}`}
                      type="button"
                      aria-label={label}
                      onMouseEnter={() => {
                        if (statusTextRef.current) {
                          statusTextRef.current.textContent = label;
                        }
                      }}
                      onFocus={() => {
                        if (statusTextRef.current) {
                          statusTextRef.current.textContent = label;
                        }
                      }}
                      onMouseLeave={() => {
                        if (statusTextRef.current) {
                          statusTextRef.current.textContent = defaultSummaryText;
                        }
                      }}
                      onBlur={() => {
                        if (statusTextRef.current) {
                          statusTextRef.current.textContent = defaultSummaryText;
                        }
                      }}
                      className={cn(
                        "h-3 w-3 border border-border-subtle/40 transition-transform duration-150 ease-out hover:scale-125",
                        LEVEL_BG_CLASSES[day.level]
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 font-mono text-[11px] text-text-muted">
            <span className="tabular-nums">
              {heatmapWeeks.length} WEEKS · {selectedYear}{" "}
              {currentLiveYear ? "LIVE TELEMETRY" : "SNAPSHOT"}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {([0, 1, 2, 3, 4] as const).map((lvl) => (
                <span
                  key={lvl}
                  className={cn(
                    "inline-block h-2.5 w-2.5 border border-border-subtle/40",
                    LEVEL_BG_CLASSES[lvl]
                  )}
                  aria-hidden="true"
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Language Distribution & Profile Link */}
        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-border-subtle pt-5 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <p className="font-mono text-[11px] text-text-muted">
              LANGUAGE TELEMETRY DISTRIBUTION
            </p>
            <div
              aria-hidden="true"
              className="my-2.5 flex h-2.5 w-full overflow-hidden border border-border-subtle bg-bg-primary"
            >
              {githubTelemetry.languageDistribution.map((lang) => (
                <div
                  key={lang.language}
                  style={{
                    width: `${lang.percentage}%`,
                    backgroundColor: lang.colorToken,
                  }}
                  className="h-full border-r border-bg-primary last:border-r-0"
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 font-mono text-xs">
              {githubTelemetry.languageDistribution.map((lang) => (
                <div key={lang.language} className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: lang.colorToken }}
                    className="h-2 w-2"
                    aria-hidden="true"
                  />
                  <span className="text-text-primary">{lang.language}</span>
                  <span className="tabular-nums text-text-muted">
                    {lang.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex lg:col-span-4 lg:justify-end">
            <a
              href={githubTelemetry.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press-scale inline-flex items-center gap-2 border border-border-strong bg-bg-primary px-4 py-2.5 font-mono text-xs text-text-primary hover:border-accent-primary"
            >
              <span>GITHUB PROFILE (@{githubTelemetry.username})</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </TechBracketCard>
      </div>
    </section>
  );
}
