import {
  PORTFOLIO_DATA,
  type ProjectSlug,
  type SkillDomainId,
} from "@/data/portfolio";

export type PersistentStageId = "hero" | "skills" | "achievements" | "contact";

export type Vec3Tuple = readonly [number, number, number];

export interface PersistentNodeMeta {
  readonly index: number;
  readonly kind: "skill" | "project";
  readonly clusterId?: SkillDomainId;
  readonly skillName?: string;
  readonly projectSlug?: ProjectSlug;
  readonly relatedProjectSlugs: readonly ProjectSlug[];
  readonly baseScale: number;
}

export interface SkillProjectBeamEdge {
  readonly id: string;
  readonly skillName: string;
  readonly clusterId: SkillDomainId;
  readonly fromNodeIndex: number;
  readonly toNodeIndex: number;
  readonly projectSlug: ProjectSlug;
}

export interface StageWeights {
  readonly hero: number;
  readonly skills: number;
  readonly achievements: number;
  readonly contact: number;
}

export interface SectionProgressInput {
  readonly globalScrollProgress: number;
  readonly heroRatio?: number;
  readonly skillsRatio?: number;
  readonly achievementsRatio?: number;
  readonly contactRatio?: number;
  readonly achievementsScrollProgress?: number;
}

export interface SkillHighlightState {
  readonly activeSkillName: string | null;
  readonly activeClusterId: SkillDomainId | null;
  readonly activeProjectSlugs: readonly ProjectSlug[];
  readonly nodeScales: readonly number[];
  readonly nodeGlows: readonly number[];
  readonly beamThicknessMultipliers: readonly number[];
  readonly beamGlowMultipliers: readonly number[];
}

export const MAX_PERSISTENT_DPR = 1.75;
export const SKILL_CLUSTER_NODE_COUNT = 60; // 20 per cluster (Architecture, Full-Stack, Tools)
export const PROJECT_ANCHOR_NODE_COUNT = 5;
export const TOTAL_PERSISTENT_NODES =
  SKILL_CLUSTER_NODE_COUNT + PROJECT_ANCHOR_NODE_COUNT;

export const PROJECT_SLUGS_ORDER: readonly ProjectSlug[] = [
  "pos-livingroom",
  "tigo",
  "cms-pt-bks",
  "driver-app-pt-kjhms",
  "lumind",
] as const;

export const CLUSTER_IDS_ORDER: readonly SkillDomainId[] = [
  "architecture-analysis",
  "fullstack-development",
  "tools-devops",
] as const;

export const CLUSTER_CENTERS: Record<SkillDomainId, Vec3Tuple> = {
  "architecture-analysis": [-2.75, 0.42, 0.1],
  "fullstack-development": [0.0, 0.48, 0.25],
  "tools-devops": [2.75, 0.42, 0.1],
};

export const PROJECT_ANCHOR_POSITIONS: Record<ProjectSlug, Vec3Tuple> = {
  "pos-livingroom": [-2.7, -1.35, 0.35],
  tigo: [-1.35, -1.45, 0.45],
  "cms-pt-bks": [0.0, -1.5, 0.5],
  "driver-app-pt-kjhms": [1.35, -1.45, 0.45],
  lumind: [2.7, -1.35, 0.35],
};

/**
 * Clamps devicePixelRatio to [1, 1.75] (or 1 on software WebGL).
 */
export function clampPersistentDpr(
  devicePixelRatio: number,
  isSoftwareGl = false
): number {
  if (isSoftwareGl) return 1;
  const raw = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? devicePixelRatio
    : 1;
  return Math.min(Math.max(1, raw), MAX_PERSISTENT_DPR);
}

/**
 * Determines whether the persistent 3D background should use the static gradient
 * fallback (on mobile viewports or when prefers-reduced-motion is enabled).
 */
export function shouldUseMobileStaticFallback(params: {
  readonly viewportWidth: number;
  readonly prefersReducedMotion: boolean;
  readonly isCoarsePointer?: boolean;
}): boolean {
  if (params.prefersReducedMotion) return true;
  if (params.viewportWidth < 768) return true;
  if (params.isCoarsePointer && params.viewportWidth < 1024) return true;
  return false;
}

/**
 * Determines whether the persistent 3D canvas render loop should pause.
 */
export function shouldPausePersistentScene(params: {
  readonly isTabHidden: boolean;
  readonly isAnySectionVisible: boolean;
  readonly isReducedMotion: boolean;
  readonly isMobileFallback: boolean;
}): boolean {
  return (
    params.isTabHidden ||
    !params.isAnySectionVisible ||
    params.isReducedMotion ||
    params.isMobileFallback
  );
}

/**
 * Frame-rate independent exponential damping.
 */
export function dampValue(
  current: number,
  target: number,
  lambda: number,
  dt: number
): number {
  if (dt <= 0) return current;
  const factor = 1 - Math.exp(-lambda * Math.min(dt, 0.1));
  return current + (target - current) * factor;
}

export function dampTuple3(
  current: Vec3Tuple,
  target: Vec3Tuple,
  lambda: number,
  dt: number
): Vec3Tuple {
  return [
    dampValue(current[0], target[0], lambda, dt),
    dampValue(current[1], target[1], lambda, dt),
    dampValue(current[2], target[2], lambda, dt),
  ];
}

/**
 * Builds deterministic metadata for all 65 instanced nodes (60 skill cluster nodes + 5 project anchors).
 */
export function buildPersistentNodeMetadata(): readonly PersistentNodeMeta[] {
  const domains = PORTFOLIO_DATA.capabilityDomains;
  const nodes: PersistentNodeMeta[] = [];

  for (let cIdx = 0; cIdx < CLUSTER_IDS_ORDER.length; cIdx++) {
    const clusterId = CLUSTER_IDS_ORDER[cIdx];
    const domain = domains.find((d) => d.id === clusterId) ?? domains[cIdx];
    const skills = domain?.skills ?? [];

    for (let localIdx = 0; localIdx < 20; localIdx++) {
      const globalIdx = cIdx * 20 + localIdx;
      const matchedSkill = skills[localIdx % Math.max(1, skills.length)];
      const isPrimarySkillNode = localIdx < skills.length;

      nodes.push({
        index: globalIdx,
        kind: "skill",
        clusterId,
        skillName: matchedSkill?.name,
        relatedProjectSlugs: matchedSkill?.relatedProjectSlugs ?? [],
        baseScale: isPrimarySkillNode ? 0.125 : 0.082,
      });
    }
  }

  for (let pIdx = 0; pIdx < PROJECT_SLUGS_ORDER.length; pIdx++) {
    const slug = PROJECT_SLUGS_ORDER[pIdx];
    nodes.push({
      index: SKILL_CLUSTER_NODE_COUNT + pIdx,
      kind: "project",
      projectSlug: slug,
      relatedProjectSlugs: [slug],
      baseScale: 0.155,
    });
  }

  return nodes;
}

/**
 * Builds the skill-to-project beam edges for the Skills stage.
 * Each primary skill node connects to its related project anchor nodes.
 */
export function buildSkillProjectBeams(
  nodes: readonly PersistentNodeMeta[]
): readonly SkillProjectBeamEdge[] {
  const edges: SkillProjectBeamEdge[] = [];
  const projectIndexBySlug = new Map<ProjectSlug, number>();

  for (const node of nodes) {
    if (node.kind === "project" && node.projectSlug) {
      projectIndexBySlug.set(node.projectSlug, node.index);
    }
  }

  // Connect the primary skill nodes (first N in each 20-node cluster) to their related projects
  for (let cIdx = 0; cIdx < CLUSTER_IDS_ORDER.length; cIdx++) {
    const clusterId = CLUSTER_IDS_ORDER[cIdx];
    const domain = PORTFOLIO_DATA.capabilityDomains.find(
      (d) => d.id === clusterId
    );
    const skillCount = domain?.skills.length ?? 6;

    for (let sIdx = 0; sIdx < skillCount; sIdx++) {
      const nodeIdx = cIdx * 20 + sIdx;
      const node = nodes[nodeIdx];
      if (!node || !node.skillName) continue;

      for (const slug of node.relatedProjectSlugs) {
        const targetIdx = projectIndexBySlug.get(slug);
        if (targetIdx !== undefined) {
          edges.push({
            id: `${clusterId}:${node.skillName}->${slug}`,
            skillName: node.skillName,
            clusterId,
            fromNodeIndex: nodeIdx,
            toNodeIndex: targetIdx,
            projectSlug: slug,
          });
        }
      }
    }
  }

  return edges;
}

/**
 * Stage 1 (HERO): Low-poly geodesic network distributed around a 3D constellation sphere.
 */
export function generateHeroNodePositions(
  count = TOTAL_PERSISTENT_NODES
): readonly Vec3Tuple[] {
  const positions: Vec3Tuple[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const y = 1 - t * 2; // [1, -1]
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;

    // Two concentric low-poly shells for architectural depth
    const shellRadius = i % 3 === 0 ? 1.75 : i % 2 === 0 ? 2.45 : 3.05;
    const px = Number((Math.cos(theta) * radiusAtY * shellRadius * 1.28).toFixed(4));
    const py = Number((y * shellRadius * 0.86 + 0.12).toFixed(4));
    const pz = Number((Math.sin(theta) * radiusAtY * shellRadius * 0.78).toFixed(4));

    positions.push([px, py, pz]);
  }

  return positions;
}

/**
 * Stage 2 (SKILLS): 3 distinct spatial clusters (Architecture, Full-Stack, Tools)
 * plus 5 project anchor nodes along the lower dock arc.
 */
export function generateSkillsNodePositions(
  nodes: readonly PersistentNodeMeta[]
): readonly Vec3Tuple[] {
  const positions: Vec3Tuple[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (const node of nodes) {
    if (node.kind === "project" && node.projectSlug) {
      positions.push(PROJECT_ANCHOR_POSITIONS[node.projectSlug]);
      continue;
    }

    const clusterId = node.clusterId ?? "architecture-analysis";
    const center = CLUSTER_CENTERS[clusterId];
    const localIdx = node.index % 20;
    const t = (localIdx + 0.5) / 20;
    const angle = localIdx * goldenAngle * 1.5;
    const ringRadius = localIdx < 8 ? 0.42 + t * 0.38 : 0.72 + (t - 0.4) * 0.45;
    const verticalSpread = Math.cos(localIdx * 1.3) * 0.58;
    const depthSpread = Math.sin(localIdx * 1.9) * 0.42;

    const px = Number((center[0] + Math.cos(angle) * ringRadius).toFixed(4));
    const py = Number((center[1] + verticalSpread).toFixed(4));
    const pz = Number((center[2] + depthSpread).toFixed(4));
    positions.push([px, py, pz]);
  }

  return positions;
}

/**
 * Stage 3 (ACHIEVEMENTS): Ceremonial framing arc around the champion card
 * while a focused spotlight beam sweeps toward the champion card.
 */
export function generateAchievementsNodePositions(
  count = TOTAL_PERSISTENT_NODES
): readonly Vec3Tuple[] {
  const positions: Vec3Tuple[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    // Frame the champion card in an elevated semi-elliptical halo
    const arcAngle = -Math.PI * 0.15 + t * Math.PI * 1.3;
    const row = i % 3;
    const radiusX = 3.15 + row * 0.42;
    const radiusY = 1.65 + row * 0.28;

    const px = Number((Math.cos(arcAngle) * radiusX).toFixed(4));
    const py = Number((Math.sin(arcAngle) * radiusY - 0.15).toFixed(4));
    const pz = Number(((-0.6 + (i % 5) * 0.22)).toFixed(4));
    positions.push([px, py, pz]);
  }

  return positions;
}

/**
 * Computes the 3D spotlight source and target coordinates aimed at the champion card
 * in the Achievements section as scroll progresses.
 */
export function computeAchievementsSpotlightPose(
  achievementsProgress: number
): {
  readonly source: Vec3Tuple;
  readonly target: Vec3Tuple;
  readonly intensity: number;
} {
  const p = Math.min(Math.max(achievementsProgress, 0), 1);
  // Smoothly sweep the spotlight from upper-right entry toward the champion card on the left/center
  const targetX = Number((1.4 - p * 1.95).toFixed(4)); // sweeps from +1.4 to -0.55 (Champion narrative & card core)
  const targetY = Number((0.45 - p * 0.55).toFixed(4)); // sweeps from +0.45 to -0.10
  const targetZ = 0.2;

  const source: Vec3Tuple = [0.65, 3.25, 2.8];
  const target: Vec3Tuple = [targetX, targetY, targetZ];
  // Peak intensity when section is active
  const intensity = Number((0.35 + Math.sin(p * Math.PI) * 0.65).toFixed(4));

  return { source, target, intensity };
}

/**
 * Helper to sample points evenly along a 3D line segment.
 */
function sampleSegment(
  start: Vec3Tuple,
  end: Vec3Tuple,
  samples: number
): Vec3Tuple[] {
  const pts: Vec3Tuple[] = [];
  for (let i = 0; i < samples; i++) {
    const t = samples === 1 ? 0.5 : i / (samples - 1);
    pts.push([
      Number((start[0] + (end[0] - start[0]) * t).toFixed(4)),
      Number((start[1] + (end[1] - start[1]) * t).toFixed(4)),
      Number((start[2] + (end[2] - start[2]) * t).toFixed(4)),
    ]);
  }
  return pts;
}

/**
 * Stage 4 (CONTACT): Nodes converge to form the 3D initials "ARM" and pulse with emissive light.
 */
export function generateContactArmNodePositions(
  count = TOTAL_PERSISTENT_NODES
): readonly Vec3Tuple[] {
  // Letter A centered around x = -2.15 (20 points)
  const ptsA: Vec3Tuple[] = [
    ...sampleSegment([-2.75, -0.95, 0.2], [-2.15, 0.95, 0.35], 8), // Left diagonal up to apex
    ...sampleSegment([-2.05, 0.72, 0.32], [-1.55, -0.95, 0.2], 7), // Right diagonal down
    ...sampleSegment([-2.52, -0.12, 0.28], [-1.78, -0.12, 0.28], 5), // Crossbar
  ];

  // Letter R centered around x = 0.0 (22 points)
  const ptsR: Vec3Tuple[] = [
    ...sampleSegment([-0.55, -0.95, 0.25], [-0.55, 0.95, 0.35], 7), // Left vertical stem
    ...sampleSegment([-0.38, 0.95, 0.35], [0.35, 0.95, 0.32], 4), // Top bar
    ...sampleSegment([0.52, 0.72, 0.3], [0.52, 0.22, 0.3], 3), // Right bowl vertical
    ...sampleSegment([0.35, 0.04, 0.28], [-0.38, 0.04, 0.28], 4), // Middle bar
    ...sampleSegment([0.02, -0.15, 0.26], [0.58, -0.95, 0.2], 4), // Diagonal leg
  ];

  // Letter M centered around x = 2.15 (23 points)
  const ptsM: Vec3Tuple[] = [
    ...sampleSegment([1.45, -0.95, 0.2], [1.45, 0.95, 0.35], 7), // Left vertical stem
    ...sampleSegment([1.62, 0.68, 0.32], [2.15, -0.22, 0.38], 5), // Left inner V diagonal
    ...sampleSegment([2.32, 0.08, 0.35], [2.68, 0.68, 0.32], 4), // Right inner V diagonal
    ...sampleSegment([2.85, 0.95, 0.35], [2.85, -0.95, 0.2], 7), // Right vertical stem
  ];

  const combined = [...ptsA, ...ptsR, ...ptsM];
  const result: Vec3Tuple[] = [];

  for (let i = 0; i < count; i++) {
    result.push(combined[i % combined.length]);
  }

  return result;
}

/**
 * Computes normalized stage weights (summing to 1.0) from scroll progress and section visibility ratios.
 */
export function computeSceneStageWeights(
  input: SectionProgressInput
): StageWeights {
  const scroll = Math.min(Math.max(input.globalScrollProgress, 0), 1);

  const heroHint = input.heroRatio ?? 0;
  const skillsHint = input.skillsRatio ?? 0;
  const achieveHint = input.achievementsRatio ?? 0;
  const contactHint = input.contactRatio ?? 0;

  const hintSum = heroHint + skillsHint + achieveHint + contactHint;

  // Baseline smooth scroll-curve weights across the document [0 -> 1]
  const rawHero = Math.max(0, 1 - scroll * 3.4) + heroHint * 1.6;
  const rawSkills =
    Math.max(0, 1 - Math.abs(scroll - 0.26) * 4.2) + skillsHint * 1.8;
  const rawAchieve =
    Math.max(0, 1 - Math.abs(scroll - 0.52) * 3.8) + achieveHint * 1.8;
  const rawContact =
    Math.max(0, (scroll - 0.74) * 3.9) + contactHint * 2.2;

  const total = rawHero + rawSkills + rawAchieve + rawContact;

  if (total <= 0.0001 && hintSum <= 0.0001) {
    return { hero: 1, skills: 0, achievements: 0, contact: 0 };
  }

  return {
    hero: Number((rawHero / total).toFixed(4)),
    skills: Number((rawSkills / total).toFixed(4)),
    achievements: Number((rawAchieve / total).toFixed(4)),
    contact: Number((rawContact / total).toFixed(4)),
  };
}

/**
 * Blends 4 stage position arrays for a single node using the current stage weights.
 */
export function blendNodePosition(
  heroPos: Vec3Tuple,
  skillsPos: Vec3Tuple,
  achievePos: Vec3Tuple,
  contactPos: Vec3Tuple,
  weights: StageWeights
): Vec3Tuple {
  const x =
    heroPos[0] * weights.hero +
    skillsPos[0] * weights.skills +
    achievePos[0] * weights.achievements +
    contactPos[0] * weights.contact;
  const y =
    heroPos[1] * weights.hero +
    skillsPos[1] * weights.skills +
    achievePos[1] * weights.achievements +
    contactPos[1] * weights.contact;
  const z =
    heroPos[2] * weights.hero +
    skillsPos[2] * weights.skills +
    achievePos[2] * weights.achievements +
    contactPos[2] * weights.contact;

  return [x, y, z];
}

/**
 * Computes target camera position and lookAt target along the scroll-driven spline path,
 * incorporating Hero cursor tilt.
 */
export function computeCameraPoseForStage(params: {
  readonly weights: StageWeights;
  readonly cursorX: number; // [-1, 1]
  readonly cursorY: number; // [-1, 1]
}): {
  readonly position: Vec3Tuple;
  readonly target: Vec3Tuple;
} {
  const { weights, cursorX, cursorY } = params;

  // Stage camera keyframes
  const heroCam: Vec3Tuple = [0, 0.18, 6.2];
  const skillsCam: Vec3Tuple = [0, -0.15, 6.65];
  const achieveCam: Vec3Tuple = [-0.25, 0.35, 6.35];
  const contactCam: Vec3Tuple = [0, 0.0, 5.75];

  const heroLook: Vec3Tuple = [0, 0.08, 0];
  const skillsLook: Vec3Tuple = [0, -0.25, 0];
  const achieveLook: Vec3Tuple = [-0.35, -0.05, 0];
  const contactLook: Vec3Tuple = [0, 0.0, 0];

  const basePos = blendNodePosition(
    heroCam,
    skillsCam,
    achieveCam,
    contactCam,
    weights
  );
  const baseLook = blendNodePosition(
    heroLook,
    skillsLook,
    achieveLook,
    contactLook,
    weights
  );

  // Subtle parallax camera sway (strongest in Hero, gentler in lower sections)
  const tiltFactor = 0.35 * weights.hero + 0.12 * (1 - weights.hero);
  const pos: Vec3Tuple = [
    Number((basePos[0] + cursorX * tiltFactor).toFixed(4)),
    Number((basePos[1] + cursorY * tiltFactor * 0.75).toFixed(4)),
    Number(basePos[2].toFixed(4)),
  ];

  return {
    position: pos,
    target: [
      Number(baseLook[0].toFixed(4)),
      Number(baseLook[1].toFixed(4)),
      Number(baseLook[2].toFixed(4)),
    ],
  };
}

/**
 * Computes per-node scale/glow and per-beam thickness/glow multipliers when a technology pill
 * in the Skills section is hovered or focused.
 */
export function computeSkillInteractionState(params: {
  readonly activeSkillName: string | null;
  readonly nodes: readonly PersistentNodeMeta[];
  readonly beams: readonly SkillProjectBeamEdge[];
}): SkillHighlightState {
  const { activeSkillName, nodes, beams } = params;

  if (!activeSkillName) {
    return {
      activeSkillName: null,
      activeClusterId: null,
      activeProjectSlugs: [],
      nodeScales: nodes.map(() => 1.0),
      nodeGlows: nodes.map(() => 0.25),
      beamThicknessMultipliers: beams.map(() => 1.0),
      beamGlowMultipliers: beams.map(() => 0.22),
    };
  }

  let matchedClusterId: SkillDomainId | null = null;
  let matchedProjects: readonly ProjectSlug[] = [];

  for (const domain of PORTFOLIO_DATA.capabilityDomains) {
    const found = domain.skills.find(
      (s) => s.name.toLowerCase() === activeSkillName.toLowerCase()
    );
    if (found) {
      matchedClusterId = domain.id;
      matchedProjects = found.relatedProjectSlugs;
      break;
    }
  }

  const nodeScales: number[] = [];
  const nodeGlows: number[] = [];

  for (const node of nodes) {
    if (node.kind === "skill") {
      const isExactSkill =
        node.skillName?.toLowerCase() === activeSkillName.toLowerCase();
      const isSameCluster = node.clusterId === matchedClusterId;

      if (isExactSkill) {
        nodeScales.push(1.95);
        nodeGlows.push(1.0);
      } else if (isSameCluster) {
        nodeScales.push(1.25);
        nodeGlows.push(0.55);
      } else {
        nodeScales.push(0.78);
        nodeGlows.push(0.1);
      }
    } else {
      // Project anchor node
      const isLinkedProject =
        node.projectSlug !== undefined &&
        matchedProjects.includes(node.projectSlug);
      if (isLinkedProject) {
        nodeScales.push(1.85);
        nodeGlows.push(1.0);
      } else {
        nodeScales.push(0.8);
        nodeGlows.push(0.12);
      }
    }
  }

  const beamThicknessMultipliers: number[] = [];
  const beamGlowMultipliers: number[] = [];

  for (const beam of beams) {
    const isExactSkillBeam =
      beam.skillName.toLowerCase() === activeSkillName.toLowerCase();
    const isRelatedClusterProject =
      beam.clusterId === matchedClusterId &&
      matchedProjects.includes(beam.projectSlug);

    if (isExactSkillBeam) {
      // Thickens dramatically when hovered/focused
      beamThicknessMultipliers.push(4.2);
      beamGlowMultipliers.push(1.0);
    } else if (isRelatedClusterProject) {
      beamThicknessMultipliers.push(2.1);
      beamGlowMultipliers.push(0.55);
    } else {
      beamThicknessMultipliers.push(0.55);
      beamGlowMultipliers.push(0.08);
    }
  }

  return {
    activeSkillName,
    activeClusterId: matchedClusterId,
    activeProjectSlugs: matchedProjects,
    nodeScales,
    nodeGlows,
    beamThicknessMultipliers,
    beamGlowMultipliers,
  };
}
