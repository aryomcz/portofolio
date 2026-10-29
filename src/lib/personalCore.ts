export type DockCategoryId = "education" | "builds" | "community" | "achievement";

export type FinishPreset = "neon" | "cyber" | "gold" | "stealth";

export type NodeShape = "sphere" | "icosahedron";

export interface CoreNodeItem {
  readonly id: string;
  readonly ringId: DockCategoryId;
  readonly label: string;
  readonly shortLabel: string;
  readonly shape: NodeShape;
  readonly angle: number;
  readonly href?: string;
  readonly isGold?: boolean;
}

export interface CoreRingConfig {
  readonly id: DockCategoryId;
  readonly code: string;
  readonly dockLabel: string;
  readonly title: string;
  readonly radius: number;
  readonly tilt: readonly [number, number, number];
  readonly orbitSpeed: number;
  readonly cameraPosition: readonly [number, number, number];
  readonly cameraTarget: readonly [number, number, number];
  readonly nodes: readonly CoreNodeItem[];
}

export interface PresetMaterialStyle {
  readonly base: string;
  readonly accent: string;
  readonly secondary: string;
  readonly emissive: string;
  readonly roughness: number;
  readonly metalness: number;
}

export const PERSONAL_CORE_HEADER = {
  badge: "3D TELEMETRY SHOWCASE // PERSONAL ORBITAL CORE",
  title: "PERSONAL CORE // ARYO",
  subtitle: "Interactive Orbital Telemetry — Education, Builds, Community & Achievement",
} as const;

export const FINISH_PRESETS: Record<FinishPreset, PresetMaterialStyle> = {
  neon: {
    base: "#1e293b",
    accent: "#0e7c86",
    secondary: "#14b8a6",
    emissive: "#0e7c86",
    roughness: 0.24,
    metalness: 0.72,
  },
  cyber: {
    base: "#1e3a5f",
    accent: "#14b8a6",
    secondary: "#2dd4bf",
    emissive: "#0d9488",
    roughness: 0.2,
    metalness: 0.8,
  },
  gold: {
    base: "#3b2f1e",
    accent: "#f59e0b",
    secondary: "#fbbf24",
    emissive: "#d97706",
    roughness: 0.22,
    metalness: 0.88,
  },
  stealth: {
    base: "#273449",
    accent: "#38bdf8",
    secondary: "#7dd3fc",
    emissive: "#0284c7",
    roughness: 0.32,
    metalness: 0.65,
  },
};

export const PERSONAL_CORE_RINGS: readonly CoreRingConfig[] = [
  {
    id: "education",
    code: "// 01",
    dockLabel: "EDUCATION",
    title: "Dock // 01 EDUCATION",
    radius: 1.18,
    tilt: [0.36, 0.14, -0.22],
    orbitSpeed: 0.32,
    cameraPosition: [0.3, 1.05, 3.2],
    cameraTarget: [0, 0.12, 0],
    nodes: [
      {
        id: "node-education-ipb",
        ringId: "education",
        label: "IPB University — Software Engineering 2024–2028, GPA 3.83/4.00",
        shortLabel: "IPB University — Software Engineering",
        shape: "icosahedron",
        angle: 0.75,
      },
    ],
  },
  {
    id: "builds",
    code: "// 02",
    dockLabel: "BUILDS",
    title: "Dock // 02 BUILDS",
    radius: 1.56,
    tilt: [-0.3, 0.22, 0.32],
    orbitSpeed: -0.24,
    cameraPosition: [-0.35, 1.2, 3.85],
    cameraTarget: [0, 0.1, 0],
    nodes: [
      {
        id: "node-build-pos",
        ringId: "builds",
        label: "POS Livingroom",
        shortLabel: "POS Livingroom",
        shape: "icosahedron",
        angle: 0,
        href: "/projects/pos-livingroom",
      },
      {
        id: "node-build-tigo",
        ringId: "builds",
        label: "TIGO",
        shortLabel: "TIGO",
        shape: "sphere",
        angle: (2 * Math.PI) / 5,
        href: "/projects/tigo",
      },
      {
        id: "node-build-bks",
        ringId: "builds",
        label: "CMS PT BKS",
        shortLabel: "CMS PT BKS",
        shape: "icosahedron",
        angle: (4 * Math.PI) / 5,
        href: "/projects/cms-pt-bks",
      },
      {
        id: "node-build-kjhms",
        ringId: "builds",
        label: "Driver App PT KJHMS",
        shortLabel: "Driver App PT KJHMS",
        shape: "sphere",
        angle: (6 * Math.PI) / 5,
        href: "/projects/driver-app-pt-kjhms",
      },
      {
        id: "node-build-lumind",
        ringId: "builds",
        label: "Lumind",
        shortLabel: "Lumind",
        shape: "icosahedron",
        angle: (8 * Math.PI) / 5,
        href: "/projects/lumind",
      },
    ],
  },
  {
    id: "community",
    code: "// 03",
    dockLabel: "COMMUNITY",
    title: "Dock // 03 COMMUNITY",
    radius: 1.92,
    tilt: [0.44, -0.26, 0.16],
    orbitSpeed: 0.19,
    cameraPosition: [0.4, 1.35, 4.35],
    cameraTarget: [0, 0.08, 0],
    nodes: [
      {
        id: "node-community-gdgoc",
        ringId: "community",
        label: "GDGoC on Campus — Technical Core Team",
        shortLabel: "GDGoC on Campus",
        shape: "sphere",
        angle: 0.45,
      },
      {
        id: "node-community-itfest",
        ringId: "community",
        label: "IT Festival 2025 Micro IT IPB — Vice Head of Competition (150+ tim)",
        shortLabel: "IT Festival 2025 Micro IT IPB",
        shape: "icosahedron",
        angle: 0.45 + Math.PI,
      },
    ],
  },
  {
    id: "achievement",
    code: "// 04",
    dockLabel: "ACHIEVEMENT",
    title: "Dock // 04 ACHIEVEMENT",
    radius: 2.26,
    tilt: [-0.24, -0.34, -0.38],
    orbitSpeed: -0.15,
    cameraPosition: [-0.25, 1.45, 4.8],
    cameraTarget: [0, 0.08, 0],
    nodes: [
      {
        id: "node-achievement-prisma",
        ringId: "achievement",
        label: "1st Winner — Prisma Fest Web Design Competition 2025",
        shortLabel: "1st Winner — Prisma Fest 2025",
        shape: "icosahedron",
        angle: 0.85,
        isGold: true,
      },
    ],
  },
] as const;

export const DEFAULT_CAMERA_POSITION: readonly [number, number, number] = [0, 1.35, 5.15];
export const DEFAULT_CAMERA_TARGET: readonly [number, number, number] = [0, 0.08, 0];

export function getAllCoreNodes(): readonly CoreNodeItem[] {
  return PERSONAL_CORE_RINGS.flatMap((ring) => ring.nodes);
}

export function getRingById(id: DockCategoryId): CoreRingConfig {
  return PERSONAL_CORE_RINGS.find((ring) => ring.id === id) ?? PERSONAL_CORE_RINGS[0];
}

export function getNodePositionOnRing(
  radius: number,
  angle: number
): readonly [number, number, number] {
  return [
    Number((Math.cos(angle) * radius).toFixed(4)),
    0,
    Number((Math.sin(angle) * radius).toFixed(4)),
  ];
}

export function shouldUseStaticFallback(params: {
  prefersReducedMotion: boolean;
  viewportWidth?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
}): boolean {
  // Only fall back if user explicitly prefers reduced motion for accessibility
  if (params.prefersReducedMotion) return true;
  // 3D is active on all screens (desktop, tablet, mobile)
  return false;
}
