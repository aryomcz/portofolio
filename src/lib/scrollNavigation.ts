export interface MainSectionConfig {
  readonly index: number;
  readonly code: string;
  readonly id: string;
  readonly selector: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly nextLabel?: string;
  readonly nextSelector?: string;
  readonly accentLight: string;
  readonly accentDark: string;
  readonly tintLight: string;
  readonly tintDark: string;
  readonly cameraPosition: readonly [number, number, number];
  readonly cameraRotation: readonly [number, number, number];
}

export const MAIN_PAGE_SECTIONS: readonly MainSectionConfig[] = [
  {
    index: 1,
    code: "01",
    id: "hero",
    selector: "#hero",
    label: "HERO",
    shortLabel: "HERO",
    nextLabel: "TECHNICAL ARSENAL",
    nextSelector: "#skills",
    accentLight: "#0e7c86",
    accentDark: "#14b8a6",
    tintLight: "rgba(14, 124, 134, 0.03)",
    tintDark: "rgba(20, 184, 166, 0.04)",
    cameraPosition: [0, 0, 6.0],
    cameraRotation: [0, 0, 0],
  },
  {
    index: 2,
    code: "02",
    id: "skills",
    selector: "#skills",
    label: "TECHNICAL ARSENAL",
    shortLabel: "SKILLS",
    nextLabel: "ACHIEVEMENTS",
    nextSelector: "#achievements",
    accentLight: "#0369a1",
    accentDark: "#38bdf8",
    tintLight: "rgba(3, 105, 161, 0.045)",
    tintDark: "rgba(56, 189, 248, 0.055)",
    cameraPosition: [1.4, -0.6, 5.2],
    cameraRotation: [0.08, -0.18, 0.03],
  },
  {
    index: 3,
    code: "03",
    id: "achievements",
    selector: "#achievements",
    label: "ACHIEVEMENTS",
    shortLabel: "AWARDS",
    nextLabel: "SELECTED PROJECTS",
    nextSelector: "#projects",
    accentLight: "#b45309",
    accentDark: "#f59e0b",
    tintLight: "rgba(217, 119, 6, 0.045)",
    tintDark: "rgba(245, 158, 11, 0.055)",
    cameraPosition: [-1.2, 0.75, 4.7],
    cameraRotation: [-0.1, 0.22, -0.04],
  },
  {
    index: 4,
    code: "04",
    id: "projects",
    selector: "#projects",
    label: "SELECTED PROJECTS",
    shortLabel: "PROJECTS",
    nextLabel: "EXPERIENCE",
    nextSelector: "#timeline",
    accentLight: "#0e7c86",
    accentDark: "#2dd4bf",
    tintLight: "rgba(14, 124, 134, 0.05)",
    tintDark: "rgba(45, 212, 191, 0.06)",
    cameraPosition: [0.85, -1.1, 4.4],
    cameraRotation: [0.14, -0.12, 0.05],
  },
  {
    index: 5,
    code: "05",
    id: "timeline",
    selector: "#timeline",
    label: "EXPERIENCE",
    shortLabel: "TIMELINE",
    nextLabel: "GITHUB TELEMETRY",
    nextSelector: "#github",
    accentLight: "#047857",
    accentDark: "#10b981",
    tintLight: "rgba(4, 120, 87, 0.045)",
    tintDark: "rgba(16, 185, 129, 0.055)",
    cameraPosition: [-0.95, -0.45, 5.0],
    cameraRotation: [0.06, 0.16, -0.03],
  },
  {
    index: 6,
    code: "06",
    id: "github",
    selector: "#github",
    label: "GITHUB TELEMETRY",
    shortLabel: "GITHUB",
    nextLabel: "TRANSMISSION",
    nextSelector: "#contact",
    accentLight: "#0f766e",
    accentDark: "#14b8a6",
    tintLight: "rgba(15, 118, 110, 0.04)",
    tintDark: "rgba(20, 184, 166, 0.05)",
    cameraPosition: [0.6, 0.85, 5.3],
    cameraRotation: [-0.09, -0.1, 0.02],
  },
  {
    index: 7,
    code: "07",
    id: "contact",
    selector: "#contact",
    label: "TRANSMISSION",
    shortLabel: "CONTACT",
    accentLight: "#0e7c86",
    accentDark: "#14b8a6",
    tintLight: "rgba(8, 13, 26, 0.08)",
    tintDark: "rgba(4, 7, 13, 0.16)",
    cameraPosition: [0, 0.2, 5.8],
    cameraRotation: [-0.03, 0, 0],
  },
] as const;

export interface CameraRigPose {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly activeSectionIndex: number;
  readonly sectionProgress: number;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Formats the fixed right-side HUD indicator: e.g. "SEC 03/07 — 43%"
 */
export function formatSectionHudLabel(
  sectionNumber: number,
  totalSections: number,
  overallProgress: number
): string {
  const safeTotal = Math.max(1, Math.round(totalSections));
  const safeSec = Math.max(1, Math.min(safeTotal, Math.round(sectionNumber)));
  const pct = Math.round(clamp01(overallProgress) * 100);
  const secPadded = String(safeSec).padStart(2, "0");
  const totalPadded = String(safeTotal).padStart(2, "0");
  return `SEC ${secPadded}/${totalPadded} — ${pct}%`;
}

/**
 * Computes interpolated 3D camera position and rotation across the 7 main page sections
 * based on normalized scroll progress (0..1).
 */
export function interpolateCameraRig(progress: number): CameraRigPose {
  const clamped = clamp01(progress);
  const totalIntervals = MAIN_PAGE_SECTIONS.length - 1;
  const scaled = clamped * totalIntervals;
  const lowerIdx = Math.min(
    totalIntervals - 1,
    Math.max(0, Math.floor(scaled))
  );
  const upperIdx = Math.min(totalIntervals, lowerIdx + 1);
  const localT = clamp01(scaled - lowerIdx);

  // Smoothstep easing for organic camera transitions between section waypoints
  const smoothT = localT * localT * (3 - 2 * localT);

  const fromSec = MAIN_PAGE_SECTIONS[lowerIdx];
  const toSec = MAIN_PAGE_SECTIONS[upperIdx];

  const position: [number, number, number] = [
    Number(lerpNumber(fromSec.cameraPosition[0], toSec.cameraPosition[0], smoothT).toFixed(4)),
    Number(lerpNumber(fromSec.cameraPosition[1], toSec.cameraPosition[1], smoothT).toFixed(4)),
    Number(lerpNumber(fromSec.cameraPosition[2], toSec.cameraPosition[2], smoothT).toFixed(4)),
  ];

  const rotation: [number, number, number] = [
    Number(lerpNumber(fromSec.cameraRotation[0], toSec.cameraRotation[0], smoothT).toFixed(4)),
    Number(lerpNumber(fromSec.cameraRotation[1], toSec.cameraRotation[1], smoothT).toFixed(4)),
    Number(lerpNumber(fromSec.cameraRotation[2], toSec.cameraRotation[2], smoothT).toFixed(4)),
  ];

  const activeSectionIndex = Math.min(
    MAIN_PAGE_SECTIONS.length - 1,
    Math.round(scaled)
  );

  return {
    position,
    rotation,
    activeSectionIndex,
    sectionProgress: localT,
  };
}

export interface MarqueeKinematics {
  readonly speedMultiplier: number;
  readonly skewDeg: number;
  readonly teaserShiftPx: number;
}

/**
 * Computes marquee speed multiplier, tilt skew angle, and HUD teaser drift
 * from Lenis scroll velocity.
 */
export function computeMarqueeKinematics(velocity: number): MarqueeKinematics {
  const safeVel = Number.isFinite(velocity) ? velocity : 0;
  const absVel = Math.abs(safeVel);

  // Speed multiplier ranges from 1x at rest up to 4.5x during rapid scroll
  const speedMultiplier = Number(
    Math.min(4.5, 1 + absVel * 0.085).toFixed(3)
  );

  // Skew angle clamped to [-10deg, 10deg]
  const rawSkew = safeVel * -0.28;
  const skewDeg = Number(
    Math.max(-10, Math.min(10, rawSkew)).toFixed(2)
  );

  // Subtle horizontal HUD teaser drift clamped to [-18px, 18px]
  const rawShift = safeVel * 0.45;
  const teaserShiftPx = Number(
    Math.max(-18, Math.min(18, rawShift)).toFixed(2)
  );

  return {
    speedMultiplier,
    skewDeg,
    teaserShiftPx,
  };
}

export function getSectionThemeByIndex(index: number): MainSectionConfig {
  const safeIdx = Math.max(
    0,
    Math.min(MAIN_PAGE_SECTIONS.length - 1, Math.round(index))
  );
  return MAIN_PAGE_SECTIONS[safeIdx];
}

/**
 * Determines the active section index using pre-cached document Y offsets
 * (measured on load/resize/refresh instead of calling getBoundingClientRect on every scroll tick).
 */
export function detectActiveSectionFromOffsets(
  scrollY: number,
  viewportHeight: number,
  sectionTops: readonly number[],
  fallbackIndex = 0
): number {
  if (sectionTops.length === 0) return fallbackIndex;
  const triggerLine = scrollY + viewportHeight * 0.42;
  for (let i = sectionTops.length - 1; i >= 0; i--) {
    const top = sectionTops[i];
    if (typeof top === "number" && Number.isFinite(top) && top <= triggerLine) {
      return i;
    }
  }
  return 0;
}

/**
 * Quantizes normalized scroll progress [0..1] to an integer percentage [0..100]
 * so HUD state consumers never re-render on sub-percent floating point changes.
 */
export function quantizeScrollPercent(progress: number): number {
  return Math.round(clamp01(progress) * 100);
}

