# Technical Specification (`TECH_SPEC.md`)
## Personal Portfolio Website — Aryo Ristiawan Machfudz

| Metadata | Specification |
| :--- | :--- |
| **Source PRD** | [docs/PRD.md](./PRD.md) (`v1.2`) |
| **System Rules** | [SYSTEM_RULES.md](../SYSTEM_RULES.md) |
| **Framework & Runtime** | Next.js `16.4.3` (App Router, Turbopack), React `19.3.0`, TypeScript `5.x` (`strict: true`) |
| **Styling Engine** | Tailwind CSS v4 (`@import "tailwindcss"`, `@theme inline`) + Semantic CSS Custom Properties |
| **Animation & Interaction Stack** | `lenis` (`lenis/react`), `gsap` + `gsap/dist/ScrollTrigger`, `motion` (`framer-motion`), `@radix-ui/react-dialog` |
| **Icons & Typography** | `lucide-react`, `next/font/google` (`Geist`, `Geist_Mono`, `Instrument_Serif`) |

---

## 1. Directory Structure Architecture (`src/`)

To enforce strict separation of concerns between routing, UI primitives, page sections, animation hooks, and static/remote data stores, the codebase is organized under `src/` with `@/*` mapped to `./src/*` in `tsconfig.json`.

> **Note on Workspace Migration (`app/` -> `src/app/`)**: Next.js 16 automatically detects `src/app` when the root `app/` directory is moved into `src/app/`. Updating `tsconfig.json` `"paths": { "@/*": ["./src/*"] }` ensures all imports (`@/data/portfolio`, `@/hooks/useSmoothScroll`, `@/components/...`) resolve cleanly with zero TypeScript errors.

```text
portofolio-aryo/
├── public/
│   ├── cv/
│   │   └── Aryo-Ristiawan-Machfudz-CV.pdf       # Official downloadable Resume/CV PDF
│   └── images/
│       ├── projects/
│       │   ├── pos-livingroom-preview.webp      # Livingroom POS PWA dashboard & login mockups
│       │   ├── tigo-preview.webp                # TIGO web dashboard & Flutter QR scanner mockups
│       │   ├── cms-pt-bks-preview.webp          # PT Bahtera Khatulistiwa Shipping CMS preview
│       │   └── driver-app-kjhms-preview.webp    # PT KJHMS Grafik Ritase & OCR upload preview
│       └── achievements/
│           ├── lumind-ui-preview.webp           # Lumind (lumind.vercel.app) mental wellness UI
│           └── prisma-fest-winner-cert.webp     # 1st Winner Prisma Fest 2025 photo & certificate
├── src/
│   ├── app/
│   │   ├── layout.tsx                           # Root layout: Fonts, Theme script, SmoothScrollProvider
│   │   ├── template.tsx                         # Motion route transition wrapper (/ <-> /projects/[slug])
│   │   ├── page.tsx                             # Main 7-section editorial hub (Server Component shell)
│   │   ├── globals.css                          # Tailwind v4 @theme + Semantic CSS Variables (Dark/Light)
│   │   ├── projects/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                     # Dedicated Case Study & Achievement page (async params)
│   │   │       └── not-found.tsx                # Custom editorial 404 fallback
│   │   └── api/
│   │       └── github/
│   │           └── route.ts                     # ISR-cached (revalidate: 3600) GitHub contributions endpoint
│   ├── components/
│   │   ├── ui/                                  # Reusable atomic & interactive primitives
│   │   │   ├── HeaderMasthead.tsx               # Top bar: Live Bogor WIB clock, status pill, theme toggle
│   │   │   ├── FloatingNavbar.tsx               # Sticky/bottom pill nav with Motion layoutId active spy
│   │   │   ├── CommandMenu.tsx                  # Cmd+K / Ctrl+K keyboard command palette (Radix Dialog)
│   │   │   ├── CaseStudyQuickModal.tsx          # ?preview=[slug] Radix Dialog modal with scroll-lock
│   │   │   ├── CopyEmailButton.tsx              # Emil Kowalski-style spring icon-morph clipboard button
│   │   │   ├── ArchitectureDiagram.tsx          # Data-driven SVG/HTML architectural system blueprint
│   │   │   ├── SectionHeader.tsx                # Standardized monospace index + serif-accented heading
│   │   │   └── ThemeToggle.tsx                  # Zero-FOUC Dark/Light mode switcher with spring morph
│   │   └── sections/                            # High-level page sections (consume data from src/data/)
│   │       ├── HeroSection.tsx                  # 01: Editorial statement, CTAs, 4-col Quick Stats bar
│   │       ├── AboutSection.tsx                 # 02: Dual Complementary Pillars + Coursework & Honors
│   │       ├── CapabilitiesSection.tsx          # 03: 4-Domain Architectural Capability Matrix
│   │       ├── GithubActivitySection.tsx        # 04: 52-week heatmap, year filter, language bar
│   │       ├── SelectedWorksSection.tsx         # 05: Projects (01–04) + Featured Achievement (Lumind)
│   │       ├── TimelineSection.tsx              # 06: GDGoC IPB, IT Fest 2025, IPB RPL, Matra Hillindo
│   │       └── ContactFooter.tsx                # 07: Frictionless conversion actions + technical colophon
│   ├── hooks/
│   │   ├── useSmoothScroll.ts                   # Lenis + GSAP ScrollTrigger RAF lifecycle & scroll-lock hook
│   │   ├── useReducedMotion.ts                  # SSR-safe prefers-reduced-motion media query listener
│   │   └── useBogorClock.ts                     # Tabular-nums UTC+7 (Asia/Jakarta) live clock hook
│   ├── data/
│   │   └── portfolio.ts                         # Single Source of Truth: Strongly-typed CV & Portfolio data
│   └── lib/
│       ├── motion-tokens.ts                     # Shared spring physics & cubic-bezier constants (Zero Linear)
│       └── utils.ts                             # Classname merger (clsx / tailwind-merge) & formatters
├── docs/
│   ├── PRD.md                                   # Product Requirements Document
│   └── TECH_SPEC.md                             # Technical Specification (this file)
└── SYSTEM_RULES.md                              # Mandatory engineering, motion, and clean-code guardrails
```

---

## 2. Data Schema & Single Source of Truth (`src/data/portfolio.ts`)

All textual copy, metrics, links, system architecture nodes, skills, achievements, and timeline milestones **must** reside in `src/data/portfolio.ts`. JSX components in `src/components/sections/` and `src/app/projects/[slug]/page.tsx` are strictly forbidden from hardcoding domain strings.

### 2.1 TypeScript Interfaces (`src/data/portfolio.ts`)

```ts
// src/data/portfolio.ts

export type ProjectSlug =
  | "pos-livingroom"
  | "tigo"
  | "cms-pt-bks"
  | "driver-app-pt-kjhms"
  | "lumind";

export type SkillDomainId =
  | "frontend-ui"
  | "backend-api"
  | "database-cloud"
  | "mobile-integrations";

export type TimelineCategory =
  | "TECHNICAL LEADERSHIP"
  | "COMPETITION GOVERNANCE"
  | "ACADEMIC & HONORS"
  | "INDUSTRY INTERNSHIP";

export interface QuickStatItem {
  readonly id: string;
  readonly indexLabel: string; // e.g. "STAT // 01"
  readonly value: string;      // e.g. "3.83"
  readonly unit?: string;      // e.g. "/ 4.00"
  readonly label: string;      // e.g. "Academic GPA at IPB University"
  readonly description: string;
}

export interface ComplementaryPillar {
  readonly index: "01" | "02";
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly highlights: readonly string[];
}

export interface ArchitectureNode {
  readonly id: string;
  readonly layer: "CLIENT" | "GATEWAY / API" | "DATA STORE" | "INTEGRATION";
  readonly title: string;
  readonly tech: string;
  readonly description: string;
}

export interface ArchitectureConnection {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly protocol?: string;
}

export interface ArchitectureBlueprint {
  readonly summary: string;
  readonly nodes: readonly ArchitectureNode[];
  readonly connections: readonly ArchitectureConnection[];
}

export interface CaseStudyMetric {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
}

export interface ProjectCaseStudy {
  readonly slug: ProjectSlug;
  readonly index: string;              // "01", "02", "03", "04", or "AWARD // 01"
  readonly kind: "project" | "achievement";
  readonly title: string;
  readonly shortTitle: string;
  readonly subtitle: string;           // Rendered in Instrument Serif Italic
  readonly year: string;
  readonly category: string;
  readonly clientOrContext: string;
  readonly role: string;
  readonly liveUrl?: string;
  readonly repoUrl?: string;
  readonly heroMetricPill: string;     // High-signal badge shown on main page card
  readonly cardSummary: string;        // 2-sentence summary for main page card
  readonly previewImage: {
    readonly src: string;
    readonly alt: string;
    readonly secondaryCertificateSrc?: string; // Used for Lumind Prisma Fest 1st Winner
    readonly aspectRatio: "16/10" | "16/9";
  };
  readonly techStack: readonly {
    readonly name: string;
    readonly layer: "Frontend" | "Backend" | "Database" | "Mobile" | "Integration" | "Design & Cloud";
  }[];
  readonly verifiedMetrics: readonly CaseStudyMetric[];
  readonly problemStatement: {
    readonly headline: string;
    readonly contextParagraphs: readonly string[];
    readonly painPoints: readonly string[];
  };
  readonly systemAnalysis: {
    readonly headline: string;
    readonly methodologyParagraphs: readonly string[];
    readonly keySchemaOrWorkflowBullets: readonly string[];
  };
  readonly architectureBlueprint: ArchitectureBlueprint;
  readonly engineeringExecution: {
    readonly headline: string;
    readonly decisions: readonly {
      readonly title: string;
      readonly description: string;
      readonly techTags: readonly string[];
    }[];
  };
  readonly impactAndOutcomes: {
    readonly summary: string;
    readonly beforeAfterComparison: readonly {
      readonly dimension: string;
      readonly before: string;
      readonly after: string;
    }[];
  };
}

export interface SkillItem {
  readonly name: string;
  readonly relatedProjectSlugs: readonly ProjectSlug[];
  readonly relatedExperienceIds?: readonly string[];
}

export interface CapabilityDomain {
  readonly id: SkillDomainId;
  readonly code: string; // e.g. "DOM // 01"
  readonly title: string;
  readonly description: string;
  readonly skills: readonly SkillItem[];
  readonly productionProofSummary: string;
}

export interface TimelineEntry {
  readonly id: string;
  readonly period: string;
  readonly category: TimelineCategory;
  readonly role: string;
  readonly organization: string;
  readonly location: string;
  readonly metricBadge?: string;
  readonly bullets: readonly string[];
  readonly tags: readonly string[];
}

export interface GithubContributionDay {
  readonly date: string; // YYYY-MM-DD
  readonly count: number;
  readonly level: 0 | 1 | 2 | 3 | 4;
}

export interface GithubTelemetryConfig {
  readonly username: string;
  readonly profileUrl: string;
  readonly availableYears: readonly number[];
  readonly languageDistribution: readonly {
    readonly language: string;
    readonly percentage: number;
    readonly colorToken: string;
  }[];
  readonly summaryStats: {
    readonly totalContributionsLabel: string;
    readonly activeReposLabel: string;
    readonly primaryFocusLabel: string;
  };
}

export interface PortfolioData {
  readonly owner: {
    readonly fullName: string;
    readonly shortName: string;
    readonly mastheadIdentity: string;
    readonly headlinePlainPrefix: string;
    readonly headlineSerifWord1: string;
    readonly headlinePlainMiddle: string;
    readonly headlineSerifWord2: string;
    readonly roleTagline: string;
    readonly bioSummary: string;
    readonly location: {
      readonly city: string;
      readonly country: string;
      readonly coordinates: string;
      readonly timezone: "Asia/Jakarta";
    };
    readonly education: {
      readonly university: string;
      readonly degree: string;
      readonly period: string;
      readonly gpa: string;
      readonly coursework: readonly string[];
    };
    readonly availability: {
      readonly isAvailable: boolean;
      readonly statusText: string;
      readonly detailBanner: string;
    };
    readonly contacts: {
      readonly email: string;
      readonly phoneDisplay: string;
      readonly whatsappUrl: string;
      readonly linkedinUrl: string;
      readonly linkedinHandle: string;
      readonly githubUrl: string;
      readonly githubHandle: string;
      readonly resumePdfPath: string;
    };
  };
  readonly quickStats: readonly QuickStatItem[];
  readonly complementaryPillars: readonly ComplementaryPillar[];
  readonly capabilityDomains: readonly CapabilityDomain[];
  readonly githubTelemetry: GithubTelemetryConfig;
  readonly projects: readonly ProjectCaseStudy[];       // 01-04 Flagship Engineering Projects
  readonly featuredAchievement: ProjectCaseStudy;       // 1st Winner Prisma Fest 2025 (Lumind)
  readonly timeline: readonly TimelineEntry[];          // Strictly excludes Karang Taruna
}
```

### 2.2 Helper Accessors (`src/data/portfolio.ts`)

To support O(1) lookup in dynamic routes (`/projects/[slug]/page.tsx`) and modal controllers (`/?preview=[slug]`):

```ts
export function getAllCaseStudies(): readonly ProjectCaseStudy[] {
  return [...PORTFOLIO_DATA.projects, PORTFOLIO_DATA.featuredAchievement];
}

export function getCaseStudyBySlug(slug: string): ProjectCaseStudy | undefined {
  return getAllCaseStudies().find((item) => item.slug === slug);
}

export function getAdjacentCaseStudies(slug: ProjectSlug): {
  prev: ProjectCaseStudy;
  next: ProjectCaseStudy;
} {
  const all = getAllCaseStudies();
  const idx = all.findIndex((item) => item.slug === slug);
  const safeIdx = idx === -1 ? 0 : idx;
  const prev = all[(safeIdx - 1 + all.length) % all.length];
  const next = all[(safeIdx + 1) % all.length];
  return { prev, next };
}
```

---

## 3. Lenis + GSAP ScrollTrigger Integration Strategy

### 3.1 Architectural Goals
1. **Single RequestAnimationFrame (RAF) Loop**: Prevent dual RAF contention by disabling Lenis's internal `autoRaf` and driving Lenis directly from `gsap.ticker`.
2. **Deterministic Cleanup**: Wrap all GSAP animations and `ScrollTrigger` instances inside `gsap.context()` (or `@gsap/react`'s `useGSAP`) and invoke `ctx.revert()` on component unmount or route transition.
3. **Accessibility First (`prefers-reduced-motion`)**: Detect `(prefers-reduced-motion: reduce)` prior to initializing Lenis or scrubbing triggers. If reduced motion is enabled, skip Lenis instantiation and leave native browser scroll intact.
4. **Modal & Route Scroll Control**: Expose imperative `stopScroll()`, `startScroll()`, and `scrollToTarget()` methods via React Context so opening a `CaseStudyQuickModal` or `CommandMenu` immediately locks background scroll without losing scroll position.

### 3.2 Custom Hook & Context Specification (`src/hooks/useSmoothScroll.ts`)

```tsx
// src/hooks/useSmoothScroll.ts
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollToOptions {
  readonly offset?: number;
  readonly duration?: number;
  readonly immediate?: boolean;
}

export interface SmoothScrollContextValue {
  readonly lenis: Lenis | null;
  readonly isLocked: boolean;
  readonly isReducedMotion: boolean;
  readonly stopScroll: () => void;
  readonly startScroll: () => void;
  readonly scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

// Precision exponential out easing (Emil Kowalski / Swiss editorial feel — NEVER linear)
const editorialScrollEasing = (t: number): number =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function SmoothScrollProvider({ children }: { readonly children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    // 1. Respect prefers-reduced-motion: bypass Lenis hijacking completely
    if (isReducedMotion) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenisInstance(null);
      }
      ScrollTrigger.refresh();
      return;
    }

    // 2. Instantiate Lenis with autoRaf: false so GSAP ticker is the single clock source
    const lenis = new Lenis({
      duration: 1.15,
      easing: editorialScrollEasing,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      autoRaf: false,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // 3. Synchronize Lenis scroll events with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 4. Bind Lenis RAF to GSAP's ticker (converts seconds -> milliseconds)
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // 5. Refresh ScrollTrigger measurements after initialization
    ScrollTrigger.refresh();

    // 6. Strict Lifecycle Cleanup on unmount
    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [isReducedMotion]);

  const stopScroll = useCallback(() => {
    lenisRef.current?.stop();
    setIsLocked(true);
  }, []);

  const startScroll = useCallback(() => {
    lenisRef.current?.start();
    setIsLocked(false);
  }, []);

  const scrollTo = useCallback(
    (target: string | number | HTMLElement, options?: ScrollToOptions) => {
      if (isReducedMotion || !lenisRef.current) {
        if (typeof target === "number") {
          window.scrollTo({ top: target, behavior: "auto" });
        } else if (typeof target === "string") {
          const el = document.querySelector(target);
          el?.scrollIntoView({ behavior: "auto" });
        } else {
          target.scrollIntoView({ behavior: "auto" });
        }
        return;
      }

      lenisRef.current.scrollTo(target, {
        offset: options?.offset ?? 0,
        duration: options?.immediate ? 0 : (options?.duration ?? 1.1),
        immediate: options?.immediate ?? false,
        easing: editorialScrollEasing,
      });
    },
    [isReducedMotion]
  );

  const value = useMemo<SmoothScrollContextValue>(
    () => ({
      lenis: lenisInstance,
      isLocked,
      isReducedMotion,
      stopScroll,
      startScroll,
      scrollTo,
    }),
    [lenisInstance, isLocked, isReducedMotion, stopScroll, startScroll, scrollTo]
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll(): SmoothScrollContextValue {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    throw new Error("useSmoothScroll must be used within a <SmoothScrollProvider>");
  }
  return context;
}
```

### 3.3 Pattern for Section-Level GSAP Animations (`gsap.context()`)

Every component that registers `ScrollTrigger` (such as `TimelineSection.tsx` for the vertical spine scrub or `SectionWrapper.tsx` for the `1px` hairline draw) **must** follow this exact lifecycle pattern:

```tsx
useEffect(() => {
  if (isReducedMotion || !containerRef.current) return;

  const ctx = gsap.context(() => {
    // 1. Hairline structural border reveal
    gsap.fromTo(
      ".section-hairline",
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        duration: 0.85,
        ease: "expo.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 84%",
          toggleActions: "play none none none",
        },
      }
    );

    // 2. Staggered editorial content reveal
    gsap.fromTo(
      ".editorial-reveal-item",
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, containerRef);

  return () => {
    ctx.revert(); // Mandatory cleanup to prevent orphaned ScrollTriggers & memory leaks
  };
}, [isReducedMotion]);
```

---

## 4. Styling, CSS Variables & Motion Tokens Specification

### 4.1 Semantic CSS Variables (`src/app/globals.css`)

```css
@import "tailwindcss";

:root,
[data-theme="dark"] {
  --bg-primary: #0c0c0c;
  --bg-elevated: #141413;
  --bg-subtle: #1c1c1a;
  --bg-glass: rgba(20, 20, 19, 0.82);

  --text-primary: #f4f3ef;
  --text-secondary: #a3a19a;
  --text-muted: #6e6d68;

  --border-subtle: #222220;
  --border-strong: #3a3a36;

  --accent-primary: #ff4f00;
  --accent-emerald: #10b981;

  /* GitHub Heatmap Intensity Tokens (Dark) */
  --gh-level-0: #161615;
  --gh-level-1: rgba(255, 79, 0, 0.25);
  --gh-level-2: rgba(255, 79, 0, 0.50);
  --gh-level-3: rgba(255, 79, 0, 0.75);
  --gh-level-4: #ff4f00;
}

[data-theme="light"] {
  --bg-primary: #f7f6f2;
  --bg-elevated: #efece6;
  --bg-subtle: #e5e1d8;
  --bg-glass: rgba(247, 246, 242, 0.85);

  --text-primary: #111110;
  --text-secondary: #4a4944;
  --text-muted: #73716a;

  --border-subtle: #dcd8ce;
  --border-strong: #b8b3a6;

  --accent-primary: #d93800;
  --accent-emerald: #059669;

  /* GitHub Heatmap Intensity Tokens (Light) */
  --gh-level-0: #e5e1d8;
  --gh-level-1: rgba(217, 56, 0, 0.22);
  --gh-level-2: rgba(217, 56, 0, 0.45);
  --gh-level-3: rgba(217, 56, 0, 0.72);
  --gh-level-4: #d93800;
}

@theme inline {
  --color-bg-primary: var(--bg-primary);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-subtle: var(--bg-subtle);
  --color-bg-glass: var(--bg-glass);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);
  --color-accent-primary: var(--accent-primary);
  --color-accent-emerald: var(--accent-emerald);

  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace;
  --font-serif: var(--font-instrument-serif), Georgia, serif;
}
```

### 4.2 Standardized Motion Physics (`src/lib/motion-tokens.ts`)

```ts
// src/lib/motion-tokens.ts
import type { Transition } from "motion/react";

/**
 * Emil Kowalski-inspired tactile spring configurations.
 * Linear easing ("linear") is strictly prohibited across all UI transitions.
 */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const SPRING_LAYOUT: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 1,
};

export const SPRING_MODAL: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 30,
  mass: 0.9,
};

export const EASE_OUT_EXPO: Transition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1], // Precision cubic-bezier (Expo Out)
};

export const EASE_REDUCED: Transition = {
  duration: 0.01,
  ease: [0.16, 1, 0.3, 1],
};
```

---

## 5. Next.js 16 App Router Specifics & Static Generation

1. **Dynamic Route `params` Promise Signature (`src/app/projects/[slug]/page.tsx`)**:
   - In Next.js 16, `params` and `searchParams` are asynchronous Promises. Dynamic pages must await `params`:
   ```tsx
   export function generateStaticParams() {
     return getAllCaseStudies().map((item) => ({ slug: item.slug }));
   }

   export default async function ProjectCaseStudyPage({
     params,
   }: {
     params: Promise<{ slug: string }>;
   }) {
     const { slug } = await params;
     const study = getCaseStudyBySlug(slug);
     if (!study) notFound();
     // ...
   }
   ```
2. **GitHub Telemetry Route Handler (`src/app/api/github/route.ts`)**:
   - Uses Next.js caching (`export const revalidate = 3600;`) to fetch public contribution calendar data for the configured GitHub username, falling back deterministically to the typed static snapshot in `src/data/portfolio.ts` if offline or rate-limited.
