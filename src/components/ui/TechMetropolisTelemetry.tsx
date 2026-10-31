"use client";

import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Cpu,
  Server,
  Workflow,
  Globe,
  Terminal,
  Sparkles,
  Eye,
} from "lucide-react";
import { isUserScrolling } from "@/hooks/useScrollCamera";

// ============================================================================
// TYPES & ARCHITECTURAL DATA MODEL
// ============================================================================

export type DistrictId = "overview" | "frontend" | "integration" | "backend";

export interface TechNodeSpec {
  id: string;
  name: string;
  shortLabel: string;
  roleTitle: string;
  productionDetail: string;
  district: Exclude<DistrictId, "overview">;
  /** World-space position of the building base [x, y, z] */
  position: [number, number, number];
  /** Building footprint & height [width, height, depth] */
  dimensions: [number, number, number];
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  styleVariant:
    | "cyber-spire"
    | "cyber-blade"
    | "cyber-holo"
    | "cyber-stepped"
    | "civic-rotunda"
    | "civic-pylon"
    | "civic-gateway"
    | "monolith-rack"
    | "monolith-vault"
    | "monolith-column";
  projectSlug: string;
  projectLabel: string;
  /** 3D offset from building base for projected HUD callout pin */
  labelOffset: [number, number, number];
}

export interface DistrictPreset {
  id: DistrictId;
  code: string;
  buttonLabel: string;
  shortButtonLabel: string;
  headerTitle: string;
  subtitle: string;
  accentHex: string;
  secondaryHex: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  description: string;
}

export const METROPOLIS_DISTRICTS: Record<DistrictId, DistrictPreset> = {
  overview: {
    id: "overview",
    code: "00",
    buttonLabel: "[ 00 // METROPOLIS OVERVIEW ]",
    shortButtonLabel: "00 // OVERVIEW",
    headerTitle: "ALL SECTORS // ISOMETRIC METROPOLIS OVERVIEW",
    subtitle: "3 Connected Engineering Districts · 18 Production Stack Nodes",
    accentHex: "#00f0ff",
    secondaryHex: "#fbbf24",
    cameraPos: [0, 14.8, 23.2],
    cameraTarget: [0, 1.35, 0],
    description:
      "Full isometric telemetry across the West Frontend Cyberpunk Wing, Central Civic Integration Terminal, and East Backend Monolith Grid.",
  },
  frontend: {
    id: "frontend",
    code: "01",
    buttonLabel: "[ 01 // FRONTEND CYBERPUNK ]",
    shortButtonLabel: "01 // FRONTEND (CYBERPUNK)",
    headerTitle: "DISTRICT 01: FRONTEND // THE NEO-CREATIVE SECTOR",
    subtitle: "West Wing · Neon Cyan (#00f0ff) & Cyber Violet (#a855f7)",
    accentHex: "#00f0ff",
    secondaryHex: "#a855f7",
    cameraPos: [-7.4, 10.6, 15.2],
    cameraTarget: [-6.8, 1.85, 0.1],
    description:
      "Asymmetrical Neo-Tokyo skyscrapers, holographic signboards, and high-frequency UI/UX rendering engines.",
  },
  integration: {
    id: "integration",
    code: "02",
    buttonLabel: "[ 02 // CIVIC INTEGRATION ]",
    shortButtonLabel: "02 // INTEGRATION (CIVIC)",
    headerTitle: "DISTRICT 02: INTEGRATION & ARCHITECTURE // THE CIVIC TERMINAL",
    subtitle: "Central Zone · Architectural Platinum (#f8fafc) & Civic Gold (#fbbf24)",
    accentHex: "#fbbf24",
    secondaryHex: "#f8fafc",
    cameraPos: [0, 10.2, 15.0],
    cameraTarget: [0, 1.4, 0],
    description:
      "Grand suspension skybridges and central transit rotunda routing continuous bi-directional API & webhook packets.",
  },
  backend: {
    id: "backend",
    code: "03",
    buttonLabel: "[ 03 // BACKEND MONOLITH ]",
    shortButtonLabel: "03 // BACKEND (MONOLITH)",
    headerTitle: "DISTRICT 03: BACKEND // THE MONOLITH GRID",
    subtitle: "East Wing · Deep Slate (#1e293b), Server Emerald (#10b981) & Amber (#f59e0b)",
    accentHex: "#10b981",
    secondaryHex: "#f59e0b",
    cameraPos: [7.4, 10.6, 15.2],
    cameraTarget: [6.8, 1.85, 0.2],
    description:
      "Brutalist server monoliths, ACID relational vaults, and fault-tolerant enterprise cluster columns.",
  },
};

export const TECH_METROPOLIS_NODES: readonly TechNodeSpec[] = [
  // ==========================================================================
  // 01. FRONTEND DISTRICT ("The Neo-Creative Sector") - West Wing
  // ==========================================================================
  {
    id: "nextjs",
    name: "Next.js",
    shortLabel: "NEXT.JS",
    roleTitle: "Next.js // SSR & App Router Engine",
    productionDetail:
      "Hybrid Server Components, dynamic route streaming, and zero-latency page transitions.",
    district: "frontend",
    position: [-7.0, 0.3, -0.85],
    dimensions: [1.3, 4.9, 1.3],
    primaryColor: "#0a1324",
    accentColor: "#00f0ff",
    secondaryColor: "#a855f7",
    styleVariant: "cyber-spire",
    projectSlug: "lumind",
    projectLabel: "Lumind — 1st Winner Prisma Fest",
    labelOffset: [-0.2, 5.65, 0],
  },
  {
    id: "react",
    name: "React",
    shortLabel: "REACT",
    roleTitle: "React // Concurrent UI & State Architecture",
    productionDetail:
      "Declarative component trees, custom hooks, and interactive real-time POS & telemetry views.",
    district: "frontend",
    position: [-5.3, 0.3, -1.55],
    dimensions: [1.18, 4.2, 1.18],
    primaryColor: "#0d1629",
    accentColor: "#00f0ff",
    secondaryColor: "#38bdf8",
    styleVariant: "cyber-blade",
    projectSlug: "pos-livingroom",
    projectLabel: "POS Livingroom Billiard & Cafe",
    labelOffset: [0.25, 4.9, 0],
  },
  {
    id: "typescript",
    name: "TypeScript",
    shortLabel: "TS",
    roleTitle: "TypeScript // Strict Type-Safe Engineering",
    productionDetail:
      "End-to-end compile-time contracts across API payloads, ORM schemas, and 3D scene state.",
    district: "frontend",
    position: [-5.1, 0.3, 1.1],
    dimensions: [1.15, 3.7, 1.15],
    primaryColor: "#12132c",
    accentColor: "#a855f7",
    secondaryColor: "#00f0ff",
    styleVariant: "cyber-holo",
    projectSlug: "tigo",
    projectLabel: "TIGO — Real-Time Ticketing Platform",
    labelOffset: [0.3, 4.35, 0],
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    shortLabel: "TAILWIND",
    roleTitle: "Tailwind CSS // Utility-First Design Tokens",
    productionDetail:
      "Responsive grid choreography, dual-theme contrast architecture, and precision HUD styling.",
    district: "frontend",
    position: [-8.75, 0.3, 0.15],
    dimensions: [1.12, 3.4, 1.12],
    primaryColor: "#0b1628",
    accentColor: "#00f0ff",
    secondaryColor: "#ec4899",
    styleVariant: "cyber-stepped",
    projectSlug: "lumind",
    projectLabel: "Lumind — Mental Wellness Web Platform",
    labelOffset: [-0.35, 4.05, 0],
  },
  {
    id: "flutter",
    name: "Flutter",
    shortLabel: "FLUTTER",
    roleTitle: "Flutter // Cross-Platform Mobile & Fleet Engine",
    productionDetail:
      "60fps native mobile rendering for heavy-equipment driver dispatch and checkpoint telemetry.",
    district: "frontend",
    position: [-6.55, 0.3, 1.85],
    dimensions: [1.1, 3.0, 1.1],
    primaryColor: "#101830",
    accentColor: "#00f0ff",
    secondaryColor: "#a855f7",
    styleVariant: "cyber-holo",
    projectSlug: "driver-app-pt-kjhms",
    projectLabel: "Driver App PT KJHMS — Fleet Mobile",
    labelOffset: [0, 3.65, 0.2],
  },
  {
    id: "gsap",
    name: "GSAP",
    shortLabel: "GSAP",
    roleTitle: "GSAP // ScrollTrigger & Timeline Choreography",
    productionDetail:
      "Frame-accurate kinetic block reveals, velocity marquees, and scroll-driven camera rigs.",
    district: "frontend",
    position: [-8.45, 0.3, -1.75],
    dimensions: [1.0, 2.85, 1.0],
    primaryColor: "#14122e",
    accentColor: "#a855f7",
    secondaryColor: "#00f0ff",
    styleVariant: "cyber-blade",
    projectSlug: "lumind",
    projectLabel: "Lumind — Interactive Motion Architecture",
    labelOffset: [-0.25, 3.55, 0],
  },
  {
    id: "mantine",
    name: "Mantine UI",
    shortLabel: "MANTINE UI",
    roleTitle: "Mantine UI // Enterprise Operator Interface",
    productionDetail:
      "Accessible data tables, modal workflows, and high-density cashier & operator consoles.",
    district: "frontend",
    position: [-8.35, 0.3, 1.9],
    dimensions: [1.0, 2.5, 1.0],
    primaryColor: "#0d1629",
    accentColor: "#00f0ff",
    secondaryColor: "#a855f7",
    styleVariant: "cyber-stepped",
    projectSlug: "pos-livingroom",
    projectLabel: "POS Livingroom — Operator Console",
    labelOffset: [-0.3, 3.15, 0.2],
  },

  // ==========================================================================
  // 02. INTEGRATION & ARCHITECTURE ("Civic Terminal & Skybridge") - Central
  // ==========================================================================
  {
    id: "system-analysis",
    name: "System Analysis / DFD",
    shortLabel: "SYSTEM ANALYSIS",
    roleTitle: "System Analysis & DFD // Central Civic Rotunda",
    productionDetail:
      "Multi-role architecture blueprints, Data Flow Diagrams, and end-to-end business logic orchestration.",
    district: "integration",
    position: [0, 0.25, 0],
    dimensions: [3.4, 2.5, 3.4],
    primaryColor: "#1e293b",
    accentColor: "#fbbf24",
    secondaryColor: "#f8fafc",
    styleVariant: "civic-rotunda",
    projectSlug: "cms-pt-bks",
    projectLabel: "CMS PT BKS — Enterprise Maritime System",
    labelOffset: [0, 2.95, 0],
  },
  {
    id: "restful-apis",
    name: "RESTful APIs",
    shortLabel: "RESTFUL APIs",
    roleTitle: "RESTful APIs // North-West Skybridge Pylon",
    productionDetail:
      "Versioned JSON contracts, JWT bearer security, and sub-50ms request serialization across districts.",
    district: "integration",
    position: [-2.6, 0.2, -2.55],
    dimensions: [0.85, 3.35, 0.85],
    primaryColor: "#cbd5e1",
    accentColor: "#fbbf24",
    secondaryColor: "#00f0ff",
    styleVariant: "civic-pylon",
    projectSlug: "cms-pt-bks",
    projectLabel: "CMS PT BKS — API Gateway Layer",
    labelOffset: [-0.2, 3.95, 0],
  },
  {
    id: "xendit-gateway",
    name: "Xendit Gateway",
    shortLabel: "XENDIT GATEWAY",
    roleTitle: "Xendit Gateway // North-East Payment Viaduct",
    productionDetail:
      "Automated QRIS, Virtual Account, and e-Wallet settlement pipelines with cryptographic verification.",
    district: "integration",
    position: [2.6, 0.2, -2.55],
    dimensions: [0.85, 3.35, 0.85],
    primaryColor: "#cbd5e1",
    accentColor: "#fbbf24",
    secondaryColor: "#10b981",
    styleVariant: "civic-pylon",
    projectSlug: "tigo",
    projectLabel: "TIGO — Xendit Payment Integration",
    labelOffset: [0.2, 3.95, 0],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    shortLabel: "WEBHOOKS",
    roleTitle: "Webhooks // South-East Event Dispatch Pylon",
    productionDetail:
      "Idempotent asynchronous event listeners synchronizing payment states and live inventory ledgers.",
    district: "integration",
    position: [2.6, 0.2, 2.55],
    dimensions: [0.85, 3.35, 0.85],
    primaryColor: "#cbd5e1",
    accentColor: "#fbbf24",
    secondaryColor: "#10b981",
    styleVariant: "civic-pylon",
    projectSlug: "pos-livingroom",
    projectLabel: "POS Livingroom — Real-Time Sync",
    labelOffset: [0.2, 3.95, 0],
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    shortLabel: "CLOUDINARY",
    roleTitle: "Cloudinary // South-West Media Transit Pylon",
    productionDetail:
      "Automated document & image optimization, CDN edge caching, and signed upload pipelines.",
    district: "integration",
    position: [-2.6, 0.2, 2.55],
    dimensions: [0.85, 3.35, 0.85],
    primaryColor: "#cbd5e1",
    accentColor: "#fbbf24",
    secondaryColor: "#00f0ff",
    styleVariant: "civic-pylon",
    projectSlug: "driver-app-pt-kjhms",
    projectLabel: "Driver App PT KJHMS — Proof of Delivery Media",
    labelOffset: [-0.2, 3.95, 0],
  },

  // ==========================================================================
  // 03. BACKEND DISTRICT ("The Monolith Grid") - East Wing
  // ==========================================================================
  {
    id: "nodejs",
    name: "Node.js",
    shortLabel: "NODE.JS",
    roleTitle: "Node.js // High-Concurrency Runtime Monolith",
    productionDetail:
      "Non-blocking event loop architecture handling concurrent POS sessions and live telemetry streams.",
    district: "backend",
    position: [6.8, 0.3, -1.25],
    dimensions: [1.3, 4.6, 1.3],
    primaryColor: "#111a2b",
    accentColor: "#10b981",
    secondaryColor: "#f59e0b",
    styleVariant: "monolith-rack",
    projectSlug: "pos-livingroom",
    projectLabel: "POS Livingroom — Core Backend Runtime",
    labelOffset: [0, 5.25, 0],
  },
  {
    id: "expressjs",
    name: "Express.js",
    shortLabel: "EXPRESS.JS",
    roleTitle: "Express.js // Middleware & Routing Monolith",
    productionDetail:
      "Modular REST controllers, rate-limiting guards, RBAC authentication, and structured error pipelines.",
    district: "backend",
    position: [5.15, 0.3, -0.25],
    dimensions: [1.2, 3.75, 1.2],
    primaryColor: "#131d30",
    accentColor: "#10b981",
    secondaryColor: "#34d399",
    styleVariant: "monolith-column",
    projectSlug: "tigo",
    projectLabel: "TIGO — API & Booking Engine",
    labelOffset: [-0.25, 4.4, 0],
  },
  {
    id: "laravel",
    name: "Laravel",
    shortLabel: "LARAVEL",
    roleTitle: "Laravel // Enterprise Fleet & Cargo ERP Core",
    productionDetail:
      "Robust MVC architecture, queue workers, and multi-branch logistics orchestration for PT BKS & PT KJHMS.",
    district: "backend",
    position: [8.55, 0.3, -1.25],
    dimensions: [1.25, 4.15, 1.25],
    primaryColor: "#141d2f",
    accentColor: "#f59e0b",
    secondaryColor: "#10b981",
    styleVariant: "monolith-rack",
    projectSlug: "cms-pt-bks",
    projectLabel: "CMS PT BKS — Enterprise Logistics Core",
    labelOffset: [0.3, 4.8, 0],
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    shortLabel: "POSTGRES",
    roleTitle: "PostgreSQL // ACID Relational Ledger Vault",
    productionDetail:
      "Strict transactional integrity, indexed relational schemas, and zero-discrepancy financial auditing.",
    district: "backend",
    position: [6.8, 0.3, 0.55],
    dimensions: [1.35, 3.9, 1.35],
    primaryColor: "#0f172a",
    accentColor: "#10b981",
    secondaryColor: "#f59e0b",
    styleVariant: "monolith-vault",
    projectSlug: "pos-livingroom",
    projectLabel: "POS Livingroom — Transactional Ledger",
    labelOffset: [0, 4.55, 0],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    shortLabel: "MONGODB",
    roleTitle: "MongoDB // High-Velocity Document Cluster",
    productionDetail:
      "Flexible schema collections, aggregation pipelines, and high-throughput operational event storage.",
    district: "backend",
    position: [8.55, 0.3, 0.55],
    dimensions: [1.2, 3.35, 1.2],
    primaryColor: "#131c2e",
    accentColor: "#10b981",
    secondaryColor: "#f59e0b",
    styleVariant: "monolith-column",
    projectSlug: "tigo",
    projectLabel: "TIGO — Document & Session Store",
    labelOffset: [0.3, 4.0, 0],
  },
  {
    id: "prisma",
    name: "Prisma ORM",
    shortLabel: "PRISMA ORM",
    roleTitle: "Prisma ORM // Type-Safe Data Access Matrix",
    productionDetail:
      "Declarative migrations, relational query optimization, and end-to-end TypeScript schema safety.",
    district: "backend",
    position: [6.8, 0.3, 2.15],
    dimensions: [1.2, 3.0, 1.2],
    primaryColor: "#111a2c",
    accentColor: "#f59e0b",
    secondaryColor: "#10b981",
    styleVariant: "monolith-vault",
    projectSlug: "pos-livingroom",
    projectLabel: "POS Livingroom — Schema & Query Layer",
    labelOffset: [0, 3.65, 0.2],
  },
];

// ============================================================================
// PURE HELPER FUNCTIONS (Exported for Deterministic Unit Testing)
// ============================================================================

export function getDistrictPreset(districtId: DistrictId): DistrictPreset {
  return METROPOLIS_DISTRICTS[districtId] ?? METROPOLIS_DISTRICTS.overview;
}

export function getNodesByDistrict(
  districtId: DistrictId
): readonly TechNodeSpec[] {
  if (districtId === "overview") return TECH_METROPOLIS_NODES;
  return TECH_METROPOLIS_NODES.filter((node) => node.district === districtId);
}

export function getNodeById(nodeId: string): TechNodeSpec | undefined {
  return TECH_METROPOLIS_NODES.find((n) => n.id === nodeId);
}

export function evaluateSkybridgePoint(
  t: number,
  branch: "north" | "south"
): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  // Span smoothly from West Frontend (-4.8) to East Backend (+4.8)
  const x = THREE.MathUtils.lerp(-4.8, 4.8, clamped);
  const zSign = branch === "north" ? -1 : 1;
  // Elliptical arc bowing outward around the Central Civic Rotunda
  const z = zSign * (1.85 + Math.sin(clamped * Math.PI) * 1.35);
  // Suspension deck arch elevation peaking gently in the middle
  const y = 0.95 + Math.sin(clamped * Math.PI) * 0.55;
  return [Number(x.toFixed(4)), Number(y.toFixed(4)), Number(z.toFixed(4))];
}

// ============================================================================
// SOFTWARE WEBGL DETECTION & STUDIO ENVIRONMENT
// ============================================================================

let _cachedMetropolisSoftwareGl: boolean | null = null;
function detectSoftwareWebGL(): boolean {
  if (_cachedMetropolisSoftwareGl !== null) return _cachedMetropolisSoftwareGl;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      _cachedMetropolisSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const rendererName = String(gl.getParameter(param) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    _cachedMetropolisSoftwareGl =
      /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererName);
    return _cachedMetropolisSoftwareGl;
  } catch {
    _cachedMetropolisSoftwareGl = false;
    return false;
  }
}

// ============================================================================
// ISOMETRIC GROUND GRID, RADIAL AURA & DISTRICT PLINTH BASES
// ============================================================================

const FLOOR_GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLOOR_GLOW_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uWestColor;
  uniform vec3 uCenterColor;
  uniform vec3 uEastColor;

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float radial = smoothstep(1.0, 0.0, length(centered));

    float westWeight = smoothstep(0.45, -0.65, centered.x);
    float eastWeight = smoothstep(-0.45, 0.65, centered.x);
    float centerWeight = 1.0 - min(1.0, abs(centered.x) * 1.6);

    vec3 zoneColor = uWestColor * westWeight + uCenterColor * centerWeight + uEastColor * eastWeight;
    float alpha = pow(radial, 1.75) * 0.24;
    gl_FragColor = vec4(zoneColor, alpha);
  }
`;

function IsometricCityPlinths({
  activeDistrict,
  wireframe,
}: {
  activeDistrict: DistrictId;
  wireframe: boolean;
}) {
  const glowUniforms = useMemo(
    () => ({
      uWestColor: { value: new THREE.Color("#00f0ff") },
      uCenterColor: { value: new THREE.Color("#fbbf24") },
      uEastColor: { value: new THREE.Color("#10b981") },
    }),
    []
  );

  const westEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(5.6, 0.34, 5.4)),
    []
  );
  const eastEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(5.6, 0.34, 5.4)),
    []
  );
  const centerEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.CylinderGeometry(2.65, 2.95, 0.3, 8)),
    []
  );

  const westDimmed =
    activeDistrict !== "overview" && activeDistrict !== "frontend";
  const centerDimmed =
    activeDistrict !== "overview" && activeDistrict !== "integration";
  const eastDimmed =
    activeDistrict !== "overview" && activeDistrict !== "backend";

  return (
    <group>
      {/* Subtle Radial Multi-District Floor Glow Disc */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 18]} />
        <shaderMaterial
          vertexShader={FLOOR_GLOW_VERTEX}
          fragmentShader={FLOOR_GLOW_FRAGMENT}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Precision Isometric Engineering Grid */}
      <gridHelper
        args={[28, 28, "#1e3a5f", "#0f2238"]}
        position={[0, -0.02, 0]}
      />

      {/* WEST PLINTH: Frontend Cyberpunk Island */}
      <group position={[-6.85, 0.15, 0.1]}>
        <mesh>
          <boxGeometry args={[5.6, 0.34, 5.4]} />
          <meshStandardMaterial
            color="#0b1528"
            roughness={0.55}
            metalness={0.45}
            transparent
            opacity={westDimmed ? 0.35 : 0.96}
            wireframe={wireframe}
          />
        </mesh>
        <lineSegments geometry={westEdges}>
          <lineBasicMaterial
            color="#00f0ff"
            transparent
            opacity={westDimmed ? 0.18 : 0.78}
          />
        </lineSegments>
        {/* Neon Boulevard Strips on West Plinth */}
        <mesh position={[0, 0.18, 0.1]}>
          <boxGeometry args={[5.1, 0.02, 0.14]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={westDimmed ? 0.15 : 0.75}
          />
        </mesh>
        <mesh position={[0.8, 0.18, 0]}>
          <boxGeometry args={[0.14, 0.02, 4.9]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={westDimmed ? 0.15 : 0.7}
          />
        </mesh>
      </group>

      {/* CENTRAL PLINTH: Octagonal Civic Terminal Plaza */}
      <group position={[0, 0.12, 0]}>
        <mesh>
          <cylinderGeometry args={[2.65, 2.95, 0.3, 8]} />
          <meshStandardMaterial
            color="#111a2e"
            roughness={0.45}
            metalness={0.5}
            transparent
            opacity={centerDimmed ? 0.35 : 0.96}
            wireframe={wireframe}
          />
        </mesh>
        <lineSegments geometry={centerEdges}>
          <lineBasicMaterial
            color="#fbbf24"
            transparent
            opacity={centerDimmed ? 0.2 : 0.85}
          />
        </lineSegments>
        {/* Golden Civic Plaza Ring */}
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.1, 2.24, 32]} />
          <meshBasicMaterial
            color="#fbbf24"
            side={THREE.DoubleSide}
            transparent
            opacity={centerDimmed ? 0.18 : 0.8}
          />
        </mesh>
      </group>

      {/* EAST PLINTH: Backend Monolith Grid Island */}
      <group position={[6.85, 0.15, 0.2]}>
        <mesh>
          <boxGeometry args={[5.6, 0.34, 5.4]} />
          <meshStandardMaterial
            color="#0d1526"
            roughness={0.65}
            metalness={0.4}
            transparent
            opacity={eastDimmed ? 0.35 : 0.96}
            wireframe={wireframe}
          />
        </mesh>
        <lineSegments geometry={eastEdges}>
          <lineBasicMaterial
            color="#10b981"
            transparent
            opacity={eastDimmed ? 0.18 : 0.75}
          />
        </lineSegments>
        {/* Orderly Server Grid Conduit Channels on East Plinth */}
        {[-0.9, 0.7].map((zOffset, idx) => (
          <mesh key={`east-lane-${idx}`} position={[0, 0.18, zOffset]}>
            <boxGeometry args={[5.1, 0.02, 0.1]} />
            <meshBasicMaterial
              color={idx === 0 ? "#10b981" : "#f59e0b"}
              transparent
              opacity={eastDimmed ? 0.15 : 0.7}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ============================================================================
// GRAND SUSPENSION SKYBRIDGES & INSTANCED DATA PACKET STREAMS
// ============================================================================

function SkybridgeGatewaySystem({
  activeDistrict,
  wireframe,
}: {
  activeDistrict: DistrictId;
  wireframe: boolean;
}) {
  const packetsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const packetCount = 88;
  const dummyObj = useMemo(() => new THREE.Object3D(), []);

  // Build smooth curves for North and South suspension bridges + pre-sampled Float32Array LUTs
  const {
    northDeckGeo,
    southDeckGeo,
    northCableLeftGeo,
    northCableRightGeo,
    southCableLeftGeo,
    southCableRightGeo,
    suspenderLinesGeo,
    northSamples,
    southSamples,
  } = useMemo(() => {
    const createDeckCurve = (branch: "north" | "south") => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const [x, y, z] = evaluateSkybridgePoint(i / 24, branch);
        pts.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(pts);
    };

    const nCurve = createDeckCurve("north");
    const sCurve = createDeckCurve("south");

    const createCableCurve = (
      branch: "north" | "south",
      zOffset: number
    ): THREE.CatmullRomCurve3 => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        const [x, deckY, z] = evaluateSkybridgePoint(u, branch);
        let cableHeight = deckY + 0.35;
        if (u >= 0.23 && u <= 0.77) {
          const spanU = (u - 0.23) / 0.54;
          const sag = Math.sin(spanU * Math.PI);
          cableHeight = deckY + 2.35 - sag * 1.45;
        } else if (u < 0.23) {
          const ramp = u / 0.23;
          cableHeight = deckY + 0.25 + Math.pow(ramp, 1.35) * 2.1;
        } else {
          const ramp = (1 - u) / 0.23;
          cableHeight = deckY + 0.25 + Math.pow(ramp, 1.35) * 2.1;
        }
        pts.push(new THREE.Vector3(x, cableHeight, z + zOffset));
      }
      return new THREE.CatmullRomCurve3(pts);
    };

    const nCableL = createCableCurve("north", -0.24);
    const nCableR = createCableCurve("north", 0.24);
    const sCableL = createCableCurve("south", -0.24);
    const sCableR = createCableCurve("south", 0.24);

    // Vertical suspender cables
    const suspenderVerts: number[] = [];
    const addSuspenders = (
      deckC: THREE.CatmullRomCurve3,
      cableL: THREE.CatmullRomCurve3,
      cableR: THREE.CatmullRomCurve3
    ) => {
      for (let i = 2; i <= 22; i++) {
        const u = i / 24;
        const dPt = deckC.getPointAt(u);
        const cLPt = cableL.getPointAt(u);
        const cRPt = cableR.getPointAt(u);
        suspenderVerts.push(
          dPt.x,
          dPt.y,
          dPt.z - 0.22,
          cLPt.x,
          cLPt.y,
          cLPt.z,
          dPt.x,
          dPt.y,
          dPt.z + 0.22,
          cRPt.x,
          cRPt.y,
          cRPt.z
        );
      }
    };
    addSuspenders(nCurve, nCableL, nCableR);
    addSuspenders(sCurve, sCableL, sCableR);

    const suspGeo = new THREE.BufferGeometry();
    suspGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(suspenderVerts, 3)
    );

    // Pre-sample 256 points along both curves once so useFrame has zero Vector3 allocations
    const SAMPLE_STEPS = 256;
    const nSamples = new Float32Array(SAMPLE_STEPS * 3);
    const sSamples = new Float32Array(SAMPLE_STEPS * 3);
    for (let s = 0; s < SAMPLE_STEPS; s++) {
      const u = s / (SAMPLE_STEPS - 1);
      const np = nCurve.getPointAt(u);
      const sp = sCurve.getPointAt(u);
      const base = s * 3;
      nSamples[base] = np.x;
      nSamples[base + 1] = np.y;
      nSamples[base + 2] = np.z;
      sSamples[base] = sp.x;
      sSamples[base + 1] = sp.y;
      sSamples[base + 2] = sp.z;
    }

    return {
      northDeckGeo: new THREE.TubeGeometry(nCurve, 36, 0.18, 6, false),
      southDeckGeo: new THREE.TubeGeometry(sCurve, 36, 0.18, 6, false),
      northCableLeftGeo: new THREE.TubeGeometry(nCableL, 32, 0.028, 5, false),
      northCableRightGeo: new THREE.TubeGeometry(nCableR, 32, 0.028, 5, false),
      southCableLeftGeo: new THREE.TubeGeometry(sCableL, 32, 0.028, 5, false),
      southCableRightGeo: new THREE.TubeGeometry(sCableR, 32, 0.028, 5, false),
      suspenderLinesGeo: suspGeo,
      northSamples: nSamples,
      southSamples: sSamples,
    };
  }, []);

  // Initialize per-instance colors for glowing data packets (Gold, Cyan, Emerald)
  useEffect(() => {
    const mesh = packetsMeshRef.current;
    if (!mesh) return;
    const palette = [
      new THREE.Color("#fbbf24"),
      new THREE.Color("#fde047"),
      new THREE.Color("#00f0ff"),
      new THREE.Color("#10b981"),
    ];
    for (let i = 0; i < packetCount; i++) {
      mesh.setColorAt(i, palette[i % palette.length]);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [packetCount]);

  // Animate continuous bi-directional packet streams along both skybridges using O(1) LUT
  useFrame((state) => {
    const mesh = packetsMeshRef.current;
    if (!mesh) return;
    const elapsed = state.clock.getElapsedTime();

    for (let i = 0; i < packetCount; i++) {
      const isNorth = i % 2 === 0;
      const samples = isNorth ? northSamples : southSamples;
      const speed = 0.14 + (i % 5) * 0.025;
      const offset = (i / packetCount) * 2.0;
      const rawT = (elapsed * speed + offset) % 1;
      const u = isNorth ? rawT : 1 - rawT;

      const lutIdx = Math.min(255, Math.max(0, (u * 255) | 0)) * 3;
      const px = samples[lutIdx];
      const py = samples[lutIdx + 1];
      const pz = samples[lutIdx + 2];

      const laneOffset = ((i % 3) - 1) * 0.12;
      const bobOffset = Math.sin(elapsed * 4 + i) * 0.035;

      dummyObj.position.set(px, py + 0.14 + bobOffset, pz + laneOffset);
      const pulseScale = 0.78 + Math.sin(elapsed * 5 + i * 0.7) * 0.24;
      dummyObj.scale.setScalar(pulseScale);
      dummyObj.updateMatrix();
      mesh.setMatrixAt(i, dummyObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  const isDimmed =
    activeDistrict !== "overview" && activeDistrict !== "integration";

  return (
    <group>
      {/* North & South Bridge Roadway Decks */}
      <mesh geometry={northDeckGeo}>
        <meshStandardMaterial
          color="#1e293b"
          emissive="#fbbf24"
          emissiveIntensity={isDimmed ? 0.12 : 0.38}
          roughness={0.4}
          metalness={0.68}
          transparent
          opacity={isDimmed ? 0.35 : 0.94}
          wireframe={wireframe}
        />
      </mesh>
      <mesh geometry={southDeckGeo}>
        <meshStandardMaterial
          color="#1e293b"
          emissive="#fbbf24"
          emissiveIntensity={isDimmed ? 0.12 : 0.38}
          roughness={0.4}
          metalness={0.68}
          transparent
          opacity={isDimmed ? 0.35 : 0.94}
          wireframe={wireframe}
        />
      </mesh>

      {/* Main Golden Catenary Suspension Cables */}
      {[
        northCableLeftGeo,
        northCableRightGeo,
        southCableLeftGeo,
        southCableRightGeo,
      ].map((geo, idx) => (
        <mesh key={`cable-${idx}`} geometry={geo}>
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={isDimmed ? 0.2 : 0.75}
            roughness={0.25}
            metalness={0.85}
            transparent
            opacity={isDimmed ? 0.3 : 0.95}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* Vertical Suspender Cables */}
      <lineSegments geometry={suspenderLinesGeo}>
        <lineBasicMaterial
          color="#fde68a"
          transparent
          opacity={isDimmed ? 0.14 : 0.5}
        />
      </lineSegments>

      {/* Subtle Ground-Level Data Fiber Links */}
      <mesh position={[-3.3, 0.18, 0]}>
        <boxGeometry args={[2.1, 0.04, 0.24]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={isDimmed ? 0.15 : 0.55}
        />
      </mesh>
      <mesh position={[3.3, 0.18, 0]}>
        <boxGeometry args={[2.1, 0.04, 0.24]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={isDimmed ? 0.15 : 0.55}
        />
      </mesh>

      {/* Continuous Instanced Data Packets Traveling Across Both Skybridges */}
      <instancedMesh
        ref={packetsMeshRef}
        args={[undefined, undefined, packetCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.072, 10, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// ============================================================================
// COMPOSITE PROCEDURAL 3D ARCHITECTURAL BUILDING NODE
// ============================================================================

function MetropolisBuildingNode({
  node,
  activeDistrict,
  hoveredNodeId,
  selectedNodeId,
  wireframe,
  onHover,
  onSelect,
}: {
  node: TechNodeSpec;
  activeDistrict: DistrictId;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  wireframe: boolean;
  onHover: (node: TechNodeSpec | null) => void;
  onSelect: (node: TechNodeSpec) => void;
}) {
  const [w, h, d] = node.dimensions;

  const isHovered = hoveredNodeId === node.id;
  const isSelected = selectedNodeId === node.id;
  const isHighlighted = isHovered || isSelected;
  const isDimmed =
    activeDistrict !== "overview" && activeDistrict !== node.district;

  const { mainEdgesGeo, crownEdgesGeo } = useMemo(() => {
    const boxA = new THREE.BoxGeometry(w, h, d);
    const boxB = new THREE.BoxGeometry(w * 0.72, h * 0.24, d * 0.72);
    const edgesA = new THREE.EdgesGeometry(boxA);
    const edgesB = new THREE.EdgesGeometry(boxB);
    boxA.dispose();
    boxB.dispose();
    return { mainEdgesGeo: edgesA, crownEdgesGeo: edgesB };
  }, [w, h, d]);

  const edgeOpacity = isHighlighted ? 1.0 : isDimmed ? 0.16 : 0.78;
  const bodyOpacity = isDimmed ? 0.3 : 0.96;

  return (
    <group
      position={node.position}
      scale={[1, isHighlighted ? 1.05 : 1, 1]}
    >
      {/* Invisible Ergonomic Raycast Hit Box */}
      <mesh
        position={[0, h * 0.55, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          onHover(node);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <boxGeometry args={[w * 1.25, h * 1.15, d * 1.25]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* =====================================================================
          VARIANT A: CENTRAL CIVIC ROTUNDA & DOMED TERMINAL HUB
      ====================================================================== */}
      {node.styleVariant === "civic-rotunda" ? (
        <group>
          {/* Base Octagonal Civic Podium */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[1.85, 2.05, 0.9, 8]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.38}
              metalness={0.58}
              transparent
              opacity={bodyOpacity}
              wireframe={wireframe}
            />
          </mesh>

          {/* 4 Symmetrical Vaulted Transit Wings (North, South, East, West) */}
          {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((rot, idx) => (
            <group key={`wing-${idx}`} rotation={[0, rot, 0]}>
              <mesh position={[0, 0.5, 1.52]}>
                <boxGeometry args={[1.12, 0.74, 1.15]} />
                <meshStandardMaterial
                  color="#475569"
                  roughness={0.35}
                  metalness={0.62}
                  transparent
                  opacity={bodyOpacity}
                  wireframe={wireframe}
                />
              </mesh>
              {/* Warm Golden Archway Portal */}
              <mesh position={[0, 0.36, 2.11]}>
                <boxGeometry args={[0.64, 0.44, 0.04]} />
                <meshBasicMaterial
                  color="#fbbf24"
                  transparent
                  opacity={isDimmed ? 0.25 : 0.92}
                />
              </mesh>
            </group>
          ))}

          {/* Geodesic Platinum & Glass Rotunda Dome */}
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry
              args={[1.36, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshStandardMaterial
              color="#1e3a5f"
              emissive="#fbbf24"
              emissiveIntensity={isHighlighted ? 0.55 : 0.22}
              roughness={0.2}
              metalness={0.82}
              transparent
              opacity={isDimmed ? 0.3 : 0.9}
              wireframe={wireframe}
            />
          </mesh>

          {/* Wireframe Architectural Ribs over the Dome */}
          <mesh position={[0, 0.91, 0]}>
            <sphereGeometry
              args={[1.38, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshBasicMaterial
              color={isHighlighted ? "#ffffff" : "#fbbf24"}
              wireframe
              transparent
              opacity={isHighlighted ? 0.95 : 0.55}
            />
          </mesh>

          {/* Golden Civic Spire & Beacon */}
          <mesh position={[0, 2.42, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      ) : node.styleVariant === "civic-pylon" ? (
        /* =====================================================================
            VARIANT B: SUSPENSION SKYBRIDGE H-PYLON GATEWAY TOWERS
        ====================================================================== */
        <group>
          {[-0.24, 0.24].map((zOff, idx) => (
            <mesh key={`leg-${idx}`} position={[0, h * 0.5, zOff]}>
              <boxGeometry args={[0.2, h, 0.2]} />
              <meshStandardMaterial
                color="#94a3b8"
                emissive={node.accentColor}
                emissiveIntensity={isHighlighted ? 0.55 : 0.18}
                roughness={0.32}
                metalness={0.75}
                transparent
                opacity={bodyOpacity}
                wireframe={wireframe}
              />
            </mesh>
          ))}
          {[h * 0.38, h * 0.72, h * 0.95].map((yPos, idx) => (
            <mesh key={`beam-${idx}`} position={[0, yPos, 0]}>
              <boxGeometry args={[0.22, 0.12, 0.68]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={isHighlighted ? 0.75 : 0.38}
                roughness={0.25}
                metalness={0.85}
                wireframe={wireframe}
              />
            </mesh>
          ))}
          <mesh position={[0, h + 0.16, 0]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshBasicMaterial color={node.accentColor} />
          </mesh>
        </group>
      ) : node.district === "frontend" ? (
        /* =====================================================================
            VARIANT C: WEST WING — FRONTEND CYBERPUNK NEO-TOKYO SKYSCRAPERS
        ====================================================================== */
        <group>
          {/* 1. Primary Obsidian Skyscraper Shaft */}
          <mesh position={[0, h * 0.5, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
              color={node.primaryColor}
              emissive={node.accentColor}
              emissiveIntensity={isHighlighted ? 0.32 : 0.08}
              roughness={0.32}
              metalness={0.68}
              transparent
              opacity={bodyOpacity}
              wireframe={wireframe}
            />
          </mesh>

          {/* Neon Edge Wireframe Outline */}
          <lineSegments geometry={mainEdgesGeo} position={[0, h * 0.5, 0]}>
            <lineBasicMaterial
              color={isHighlighted ? "#ffffff" : node.accentColor}
              transparent
              opacity={edgeOpacity}
            />
          </lineSegments>

          {/* 2. Secondary Read: Asymmetrical Stepped Upper Crown */}
          <mesh position={[w * 0.08, h + h * 0.12, -d * 0.06]}>
            <boxGeometry args={[w * 0.72, h * 0.24, d * 0.72]} />
            <meshStandardMaterial
              color={node.primaryColor}
              emissive={node.secondaryColor}
              emissiveIntensity={isHighlighted ? 0.45 : 0.15}
              roughness={0.24}
              metalness={0.78}
              transparent
              opacity={bodyOpacity}
              wireframe={wireframe}
            />
          </mesh>
          <lineSegments
            geometry={crownEdgesGeo}
            position={[w * 0.08, h + h * 0.12, -d * 0.06]}
          >
            <lineBasicMaterial
              color={node.secondaryColor}
              transparent
              opacity={edgeOpacity}
            />
          </lineSegments>

          {/* 3. Accent Details: Framed Holographic Signboards & Neon Window Strips */}
          {[0.25, 0.48, 0.72].map((ratio, idx) => (
            <mesh
              key={`fe-strip-${idx}`}
              position={[0, h * ratio, d * 0.506]}
            >
              <boxGeometry
                args={[w * 0.72, idx === 1 ? h * 0.18 : 0.07, 0.02]}
              />
              <meshBasicMaterial
                color={idx === 1 ? node.secondaryColor : node.accentColor}
                transparent
                opacity={isDimmed ? 0.18 : isHighlighted ? 0.95 : 0.78}
              />
            </mesh>
          ))}
          {[0.34, 0.64].map((ratio, idx) => (
            <mesh
              key={`fe-side-${idx}`}
              position={[w * 0.506, h * ratio, 0]}
            >
              <boxGeometry args={[0.02, h * 0.14, d * 0.64]} />
              <meshBasicMaterial
                color={idx === 0 ? node.accentColor : node.secondaryColor}
                transparent
                opacity={isDimmed ? 0.18 : isHighlighted ? 0.92 : 0.72}
              />
            </mesh>
          ))}

          {/* Rooftop Cyber Antenna Spire */}
          <mesh position={[w * 0.12, h + h * 0.34, 0]}>
            <cylinderGeometry args={[0.02, 0.035, h * 0.28, 8]} />
            <meshBasicMaterial color={node.accentColor} />
          </mesh>
          <mesh position={[w * 0.12, h + h * 0.5, 0]}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshBasicMaterial color={node.accentColor} />
          </mesh>
        </group>
      ) : (
        /* =====================================================================
            VARIANT D: EAST WING — BACKEND BRUTALIST SERVER MONOLITHS
        ====================================================================== */
        <group>
          {/* 1. Primary Brutalist Slate Monolith */}
          <mesh position={[0, h * 0.5, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
              color={node.primaryColor}
              emissive={node.accentColor}
              emissiveIntensity={isHighlighted ? 0.32 : 0.07}
              roughness={0.62}
              metalness={0.48}
              transparent
              opacity={bodyOpacity}
              wireframe={wireframe}
            />
          </mesh>

          {/* Precision Brutalist Edge Wireframe */}
          <lineSegments geometry={mainEdgesGeo} position={[0, h * 0.5, 0]}>
            <lineBasicMaterial
              color={isHighlighted ? "#ffffff" : node.accentColor}
              transparent
              opacity={edgeOpacity}
            />
          </lineSegments>

          {/* 2. Secondary Read: Armored Data Vault Crown */}
          <mesh position={[0, h + 0.14, 0]}>
            <boxGeometry args={[w * 0.84, 0.28, d * 0.84]} />
            <meshStandardMaterial
              color="#0b1120"
              roughness={0.4}
              metalness={0.7}
              transparent
              opacity={bodyOpacity}
              wireframe={wireframe}
            />
          </mesh>

          {/* 3. Accent Details: Server Status LED Matrix Strips */}
          {[0.2, 0.36, 0.52, 0.68, 0.84].map((heightRatio, rowIdx) => {
            const ledColor =
              rowIdx % 3 === 0 ? node.secondaryColor : node.accentColor;
            return (
              <group key={`led-row-${rowIdx}`} position={[0, h * heightRatio, 0]}>
                <mesh position={[0, 0, d * 0.506]}>
                  <boxGeometry args={[w * 0.72, 0.06, 0.02]} />
                  <meshBasicMaterial
                    color={ledColor}
                    transparent
                    opacity={isDimmed ? 0.2 : isHighlighted ? 1.0 : 0.82}
                  />
                </mesh>
                <mesh position={[-w * 0.506, 0, 0]}>
                  <boxGeometry args={[0.02, 0.06, d * 0.72]} />
                  <meshBasicMaterial
                    color={ledColor}
                    transparent
                    opacity={isDimmed ? 0.2 : isHighlighted ? 1.0 : 0.78}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Rooftop Server Status Beacon */}
          <mesh position={[0, h + 0.34, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.16]} />
            <meshBasicMaterial color={node.accentColor} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ============================================================================
// SCENE ORCHESTRATOR + ZERO-ALLOCATION 2D CALLOUT PROJECTOR
// ============================================================================

const _scratchWorldPos = new THREE.Vector3();

function MetropolisFramePacer({
  isInViewportRef,
  isSoftwareGl,
}: {
  readonly isInViewportRef: React.RefObject<boolean>;
  readonly isSoftwareGl: boolean;
}) {
  const { invalidate } = useThree();

  useEffect(() => {
    // Render one initial frame immediately on mount to pre-compile shaders & upload geometry buffers while idle
    invalidate();

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const intervalMs = isSoftwareGl ? 65 : 33;

    const tick = () => {
      if (cancelled) return;
      // Pause heavy 18-building WebGL rendering when out of viewport OR while the user is actively scrolling
      if (isInViewportRef.current && !isUserScrolling(180)) {
        invalidate();
      }
      timerId = setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [isInViewportRef, isSoftwareGl, invalidate]);

  return null;
}

function TechMetropolisScene({
  activeDistrict,
  hoveredNodeId,
  selectedNodeId,
  wireframe,
  autoRotate,
  isSoftwareGl,
  onSyncOverlay,
  onHoverNode,
  onSelectNode,
}: {
  activeDistrict: DistrictId;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  wireframe: boolean;
  autoRotate: boolean;
  isSoftwareGl: boolean;
  onSyncOverlay: (
    camera: THREE.Camera,
    width: number,
    height: number,
    rotY: number
  ) => void;
  onHoverNode: (node: TechNodeSpec | null) => void;
  onSelectNode: (node: TechNodeSpec) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cityGroupRef = useRef<THREE.Group | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const { camera, size, invalidate } = useThree();

  const isMobile = size.width > 0 && size.width < 680;
  const mobileZoomScale = isMobile ? 1.24 : 1.0;

  const targetCameraPos = useMemo(() => new THREE.Vector3(), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const preset = getDistrictPreset(activeDistrict);
    targetCameraPos.set(
      preset.cameraPos[0] * mobileZoomScale,
      preset.cameraPos[1] * mobileZoomScale,
      preset.cameraPos[2] * mobileZoomScale
    );
    targetLookAt.set(...preset.cameraTarget);
    invalidate();
  }, [activeDistrict, mobileZoomScale, targetCameraPos, targetLookAt, invalidate]);

  useFrame((_, delta) => {
    const damp = 1 - Math.exp(-4.5 * delta);

    if (!isUserInteractingRef.current) {
      camera.position.lerp(targetCameraPos, damp);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt, damp);
        controlsRef.current.update();
      }
    }

    if (
      cityGroupRef.current &&
      autoRotate &&
      !isSoftwareGl &&
      !hoveredNodeId &&
      !isUserInteractingRef.current
    ) {
      const targetYaw =
        activeDistrict === "overview"
          ? Math.sin(performance.now() * 0.00035) * 0.12
          : 0;
      cityGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        cityGroupRef.current.rotation.y,
        targetYaw,
        damp
      );
    }

    const rotY = cityGroupRef.current ? cityGroupRef.current.rotation.y : 0;
    onSyncOverlay(camera, size.width, size.height, rotY);
  });

  return (
    <>
      {/* Atmospheric Depth & Balanced Multi-Zone Lighting (Zero PMREM Cubemap Bake Overhead) */}
      <fog attach="fog" args={["#070c18", 22, 46]} />
      <ambientLight intensity={0.65} color="#cbd5e1" />
      <hemisphereLight args={["#f1f5f9", "#0f172a", 1.45]} />
      <directionalLight
        position={[10, 18, 12]}
        intensity={2.45}
        color="#fff7ed"
      />
      <directionalLight
        position={[-10, 12, -8]}
        intensity={1.15}
        color="#38bdf8"
      />
      {/* District Accent Point Lights */}
      <pointLight
        position={[-7.2, 5.5, 1.5]}
        intensity={4.8}
        distance={14}
        color="#00f0ff"
      />
      <pointLight
        position={[0, 5.0, 0]}
        intensity={4.2}
        distance={14}
        color="#fbbf24"
      />
      <pointLight
        position={[7.2, 5.5, 1.5]}
        intensity={4.8}
        distance={14}
        color="#10b981"
      />

      <group ref={cityGroupRef}>
        <IsometricCityPlinths
          activeDistrict={activeDistrict}
          wireframe={wireframe}
        />

        <SkybridgeGatewaySystem
          activeDistrict={activeDistrict}
          wireframe={wireframe}
        />

        {TECH_METROPOLIS_NODES.map((node) => (
          <MetropolisBuildingNode
            key={node.id}
            node={node}
            activeDistrict={activeDistrict}
            hoveredNodeId={hoveredNodeId}
            selectedNodeId={selectedNodeId}
            wireframe={wireframe}
            onHover={onHoverNode}
            onSelect={onSelectNode}
          />
        ))}
      </group>

      {/* Bounded Isometric OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping={!isSoftwareGl}
        dampingFactor={0.07}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.35}
        minAzimuthAngle={-Math.PI / 2.5}
        maxAzimuthAngle={Math.PI / 2.5}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
        }}
        onStart={() => {
          isUserInteractingRef.current = true;
        }}
        onEnd={() => {
          isUserInteractingRef.current = false;
        }}
      />
    </>
  );
}

// ============================================================================
// MAIN EXPORTED CLIENT COMPONENT: TechMetropolisTelemetry
// ============================================================================

export function TechMetropolisTelemetry() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastPinCoordsRef = useRef<Record<string, string>>({});
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const isInViewportRef = useRef<boolean>(false);

  const [activeDistrict, setActiveDistrict] = useState<DistrictId>("overview");
  const [hoveredNode, setHoveredNode] = useState<TechNodeSpec | null>(null);
  const [selectedNode, setSelectedNode] = useState<TechNodeSpec>(
    TECH_METROPOLIS_NODES[0]
  );
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(false);
  const [isSoftwareGl, setIsSoftwareGl] = useState<boolean>(false);

  // 1. Pre-warm & mount Canvas during initial idle window so shader compilation never happens mid-scroll!
  // 2. Track active viewport visibility via ref (zero React state re-renders on scroll crossing)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const activateCanvas = () => {
      setHasEnteredViewport((prev) => {
        if (!prev) {
          setIsSoftwareGl(detectSoftwareWebGL());
        }
        return true;
      });
    };

    const idleTimer = window.setTimeout(activateCanvas, 480);

    let isIntersectingNow = false;
    const activeViewportObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              if (entry) {
                isIntersectingNow = entry.isIntersecting;
                isInViewportRef.current = isIntersectingNow && !document.hidden;
                if (isIntersectingNow) {
                  activateCanvas();
                }
              }
            },
            { threshold: 0, rootMargin: "100px 0px" }
          )
        : null;

    const handleVisibilityChange = () => {
      isInViewportRef.current = isIntersectingNow && !document.hidden;
    };

    activeViewportObserver?.observe(el);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(idleTimer);
      activeViewportObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleDistrictChange = useCallback((districtId: DistrictId) => {
    setActiveDistrict(districtId);
    setHoveredNode(null);
    const matchingNodes = getNodesByDistrict(districtId);
    if (matchingNodes.length > 0) {
      setSelectedNode(matchingNodes[0]);
    }
  }, []);

  const handleNodeSelect = useCallback(
    (node: TechNodeSpec) => {
      setSelectedNode(node);
      setHoveredNode(node);
      if (node.projectSlug) {
        router.push(`/projects/${node.projectSlug}`);
      }
    },
    [router]
  );

  const handleSyncOverlay = useCallback(
    (camera: THREE.Camera, width: number, height: number, rotY: number) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      for (let i = 0; i < TECH_METROPOLIS_NODES.length; i++) {
        const node = TECH_METROPOLIS_NODES[i];
        const el = labelRefs.current[node.id];
        if (!el) continue;

        const localX = node.position[0] + node.labelOffset[0];
        const localY = node.position[1] + node.labelOffset[1];
        const localZ = node.position[2] + node.labelOffset[2];

        const worldX = localX * cosY + localZ * sinY;
        const worldZ = -localX * sinY + localZ * cosY;

        _scratchWorldPos.set(worldX, localY, worldZ);
        _scratchWorldPos.project(camera);

        const px = (_scratchWorldPos.x * 0.5 + 0.5) * width;
        const py = (-_scratchWorldPos.y * 0.5 + 0.5) * height;

        const clampedX = Math.max(48, Math.min(width - 48, px));
        const clampedY = Math.max(24, Math.min(height - 96, py));

        const nextTransform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) translate(-50%, -100%)`;
        if (lastPinCoordsRef.current[node.id] !== nextTransform) {
          lastPinCoordsRef.current[node.id] = nextTransform;
          el.style.transform = nextTransform;
        }

        if (hoveredNode?.id === node.id && hoverCardRef.current) {
          const cardX = Math.max(145, Math.min(width - 145, clampedX));
          const cardY = Math.max(115, Math.min(height - 125, clampedY - 22));
          const nextCardTransform = `translate3d(${cardX.toFixed(1)}px, ${cardY.toFixed(1)}px, 0) translate(-50%, -100%)`;
          if (lastPinCoordsRef.current.__hoverCard !== nextCardTransform) {
            lastPinCoordsRef.current.__hoverCard = nextCardTransform;
            hoverCardRef.current.style.transform = nextCardTransform;
          }
        }
      }
    },
    [hoveredNode?.id]
  );

  const inspectedNode = hoveredNode ?? selectedNode;
  const activePreset = getDistrictPreset(activeDistrict);
  const visibleNodes = useMemo(
    () => getNodesByDistrict(activeDistrict),
    [activeDistrict]
  );

  return (
    <div
      ref={containerRef}
      data-testid="tech-metropolis-telemetry"
      className="relative my-10 overflow-hidden border border-slate-800 bg-[#070c18] text-slate-100 shadow-2xl"
    >
      {/* =====================================================================
          TOP HUD TELEMETRY BAR (Preserved Frame + Orbit / Wireframe Controls)
      ====================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/90 bg-[#091020] px-4 py-3.5 sm:px-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#00f0ff]">
            <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold tracking-wider uppercase">
              PERSONAL CORE // ARYO - System Architecture &amp; Tech Metropolis
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="font-display text-2xl tracking-wider text-white sm:text-3xl">
              TECH METROPOLIS TELEMETRY
            </h3>
            <span className="font-mono text-[11px] text-slate-400">
              {activePreset.subtitle}
            </span>
          </div>
        </div>

        {/* Interactive Viewport Mode Controls & FPS Readout */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            aria-pressed={autoRotate}
            className={`flex items-center gap-1.5 border px-3 py-1.5 transition-colors ${
              autoRotate
                ? "border-[#00f0ff] bg-[#00f0ff]/15 text-white"
                : "border-slate-700 bg-slate-900/90 text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ORBIT {autoRotate ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setWireframe((prev) => !prev)}
            aria-pressed={wireframe}
            className={`flex items-center gap-1.5 border px-3 py-1.5 transition-colors ${
              wireframe
                ? "border-[#fbbf24] bg-[#fbbf24]/15 text-[#fbbf24]"
                : "border-slate-700 bg-slate-900/90 text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>WIREFRAME</span>
          </button>

          <div className="hidden border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-300 md:block">
            ROT: 360° DRAG / TOUCH
          </div>

          <div className="border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1.5 text-[11px] text-emerald-400 tabular-nums">
            FPS: 60 [STABLE]
          </div>
        </div>
      </div>

      {/* =====================================================================
          3-ZONE ARCHITECTURAL SECTOR CALLOUT STRIP (Matches Reference Layout)
      ====================================================================== */}
      <div className="grid grid-cols-1 border-b border-slate-800/80 bg-[#080e1c] text-center font-mono sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleDistrictChange("frontend")}
          className={`group border-b border-slate-800/70 px-4 py-2.5 transition-colors sm:border-b-0 sm:border-r ${
            activeDistrict === "frontend"
              ? "bg-[#00f0ff]/10"
              : "hover:bg-white/[0.03]"
          }`}
        >
          <div className="text-[11px] font-bold tracking-widest text-[#00f0ff]">
            DISTRICT 01: FRONTEND
          </div>
          <div className="text-xs text-slate-300 group-hover:text-white">
            The Neo-Creative Sector
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleDistrictChange("integration")}
          className={`group border-b border-slate-800/70 px-4 py-2.5 transition-colors sm:border-b-0 sm:border-r ${
            activeDistrict === "integration"
              ? "bg-[#fbbf24]/10"
              : "hover:bg-white/[0.03]"
          }`}
        >
          <div className="text-[11px] font-bold tracking-widest text-[#fbbf24]">
            DISTRICT 02: INTEGRATION &amp; ARCHITECTURE
          </div>
          <div className="text-xs text-slate-300 group-hover:text-white">
            The Civic Gateway &amp; Transit Hub
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleDistrictChange("backend")}
          className={`group px-4 py-2.5 transition-colors ${
            activeDistrict === "backend"
              ? "bg-[#10b981]/10"
              : "hover:bg-white/[0.03]"
          }`}
        >
          <div className="text-[11px] font-bold tracking-widest text-[#10b981]">
            DISTRICT 03: BACKEND
          </div>
          <div className="text-xs text-slate-300 group-hover:text-white">
            The Monolith Grid
          </div>
        </button>
      </div>

      {/* =====================================================================
          INTERACTIVE 3D ISOMETRIC WEBGL VIEWPORT + PROJECTED 2D HUD PINS
      ====================================================================== */}
      <div className="relative h-[440px] w-full sm:h-[520px] lg:h-[580px] cursor-grab active:cursor-grabbing select-none overflow-hidden touch-pan-y">
        {hasEnteredViewport ? (
          <Canvas
            camera={{ position: [0, 14.8, 23.2], fov: 36 }}
            dpr={isSoftwareGl ? 1 : [1, 1.25]}
            frameloop="demand"
            gl={{
              powerPreference: "high-performance",
              antialias: !isSoftwareGl,
              alpha: false,
            }}
            onCreated={({ gl, scene }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.12;
              scene.background = new THREE.Color("#070c18");
            }}
          >
            <MetropolisFramePacer
              isInViewportRef={isInViewportRef}
              isSoftwareGl={isSoftwareGl}
            />
            <TechMetropolisScene
              activeDistrict={activeDistrict}
              hoveredNodeId={hoveredNode?.id ?? null}
              selectedNodeId={selectedNode.id}
              wireframe={wireframe}
              autoRotate={autoRotate}
              isSoftwareGl={isSoftwareGl}
              onSyncOverlay={handleSyncOverlay}
              onHoverNode={setHoveredNode}
              onSelectNode={handleNodeSelect}
            />
          </Canvas>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#070c18] font-mono text-xs tracking-widest text-slate-500">
            INITIALIZING 3D METROPOLIS VIEWPORT...
          </div>
        )}

        {/* Zero-Overhead Projected 2D Callout Badges (Synced in useFrame) */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          {TECH_METROPOLIS_NODES.map((node) => {
            const isDimmed =
              activeDistrict !== "overview" && activeDistrict !== node.district;
            const isActive =
              hoveredNode?.id === node.id || selectedNode.id === node.id;

            return (
              <div
                key={`pin-${node.id}`}
                ref={(el) => {
                  labelRefs.current[node.id] = el;
                }}
                style={{
                  transform: "translate3d(-9999px, -9999px, 0)",
                }}
                className={`absolute top-0 left-0 flex flex-col items-center transition-opacity duration-200 will-change-transform ${
                  isDimmed ? "opacity-20" : "opacity-95"
                }`}
              >
                <div
                  className={`whitespace-nowrap border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase shadow-md ${
                    isActive ? "font-bold ring-1 ring-white/60" : ""
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? "rgba(12, 22, 42, 0.96)"
                      : "rgba(8, 14, 28, 0.88)",
                    borderColor: isActive ? "#ffffff" : node.accentColor,
                    color: "#f8fafc",
                  }}
                >
                  {node.shortLabel}
                </div>
                <div
                  className="h-2.5 w-px"
                  style={{ backgroundColor: node.accentColor }}
                />
              </div>
            );
          })}

          {/* Floating Interactive Hover Tooltip Card (Visible on Building Hover) */}
          <div
            ref={hoverCardRef}
            style={{
              transform: "translate3d(-9999px, -9999px, 0)",
            }}
            className={`absolute top-0 left-0 z-30 w-64 border border-[#00f0ff] bg-[#070d19]/95 px-3 py-2 font-mono text-white shadow-2xl transition-opacity duration-150 will-change-transform ${
              hoveredNode ? "opacity-100" : "opacity-0"
            }`}
          >
            {hoveredNode && (
              <>
                <div
                  className="text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: hoveredNode.accentColor }}
                >
                  {hoveredNode.roleTitle}
                </div>
                <p className="mt-1 text-[10px] leading-snug text-slate-300">
                  {hoveredNode.productionDetail}
                </p>
                <div className="mt-1.5 flex items-center justify-between border-t border-white/15 pt-1 text-[9px] text-[#00f0ff]">
                  <span className="truncate font-semibold">
                    {hoveredNode.projectLabel}
                  </span>
                  <span className="shrink-0">[CLICK NODE]</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* HUD Corner Framing Brackets */}
        <div
          className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-slate-500/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-slate-500/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-slate-500/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-slate-500/70"
          aria-hidden="true"
        />

        {/* Active Node Inspection HUD Overlay (Bottom Left/Right inside Viewport) */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-end justify-between gap-3">
          <div className="pointer-events-auto max-w-xl border border-slate-700/90 bg-[#080f1e]/95 px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
              <Sparkles
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: inspectedNode.accentColor }}
                aria-hidden="true"
              />
              <span
                className="font-bold"
                style={{ color: inspectedNode.accentColor }}
              >
                {hoveredNode
                  ? "HOVERED ARCHITECTURE NODE"
                  : "ACTIVE TELEMETRY NODE"}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">
                {inspectedNode.district.toUpperCase()} SECTOR
              </span>
            </div>

            <div className="mt-1 font-mono text-xs font-bold text-white sm:text-sm">
              {inspectedNode.roleTitle}
            </div>
            <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-slate-300">
              {inspectedNode.productionDetail}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-2 font-mono text-[11px]">
              <span className="text-slate-400">
                DEPLOYED IN:{" "}
                <strong className="text-white">
                  {inspectedNode.projectLabel}
                </strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  router.push(`/projects/${inspectedNode.projectSlug}`)
                }
                className="inline-flex items-center gap-1 font-semibold text-[#00f0ff] hover:underline"
              >
                <span>[ OPEN PROJECT DOSSIER ]</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right District Legend Callout */}
          <div className="pointer-events-none hidden flex-col items-end font-mono text-xs lg:flex">
            <span className="font-semibold text-slate-200">
              {activePreset.headerTitle}
            </span>
            <span className="text-[11px] text-slate-400">
              100% Procedural Geometry · Zero External .GLB
            </span>
          </div>
        </div>
      </div>

      {/* Screen-Reader Accessible Architecture Index */}
      <div
        className="sr-only"
        aria-label="Tech Metropolis Architecture Directory"
      >
        <h4>
          PERSONAL CORE // ARYO - System Architecture &amp; Tech Metropolis
        </h4>
        <ul>
          {TECH_METROPOLIS_NODES.map((node) => (
            <li key={`sr-${node.id}`}>
              <strong>{node.roleTitle}</strong> — {node.productionDetail} (
              <a href={`/projects/${node.projectSlug}`}>{node.projectLabel}</a>)
            </li>
          ))}
        </ul>
      </div>

      {/* =====================================================================
          UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK
      ====================================================================== */}
      <div className="border-t border-slate-800 bg-[#091020] px-4 py-3.5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="font-semibold tracking-wider text-slate-300 uppercase">
              [ DISTRICT CAMERA FILTER CONTROLS ]
            </span>
            {activeDistrict !== "overview" && (
              <button
                type="button"
                onClick={() => handleDistrictChange("overview")}
                className="inline-flex items-center gap-1 border border-[#00f0ff]/50 bg-[#00f0ff]/10 px-2 py-0.5 text-[10px] text-[#00f0ff] hover:bg-[#00f0ff]/20"
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
                <span>RESET OVERVIEW</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-slate-400">
                STATUS <strong className="text-emerald-400">AKTIF</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                STATUS PANEL <strong className="text-emerald-400">AKTIF</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsDockCollapsed((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
            >
              <span>{isDockCollapsed ? "EXPAND DOCK" : "COLLAPSE DOCK"}</span>
              {isDockCollapsed ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {!isDockCollapsed && (
          <div className="mt-3 space-y-3">
            {/* 4 Primary District Camera Filter Buttons */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(
                ["overview", "frontend", "integration", "backend"] as const
              ).map((districtKey) => {
                const preset = METROPOLIS_DISTRICTS[districtKey];
                const isActive = activeDistrict === districtKey;

                return (
                  <button
                    key={districtKey}
                    type="button"
                    onClick={() => handleDistrictChange(districtKey)}
                    aria-pressed={isActive}
                    className={`flex items-center justify-between border px-3.5 py-2.5 text-left font-mono text-xs transition-all ${
                      isActive
                        ? "border-white bg-slate-800/95 text-white shadow-[0_0_20px_rgba(0,240,255,0.18)]"
                        : "border-slate-800 bg-[#060b16] text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    <span className="truncate font-semibold">
                      {preset.buttonLabel}
                    </span>
                    {districtKey === "overview" && (
                      <Globe
                        className="h-3.5 w-3.5 shrink-0 text-[#00f0ff]"
                        aria-hidden="true"
                      />
                    )}
                    {districtKey === "frontend" && (
                      <Cpu
                        className="h-3.5 w-3.5 shrink-0 text-[#00f0ff]"
                        aria-hidden="true"
                      />
                    )}
                    {districtKey === "integration" && (
                      <Workflow
                        className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]"
                        aria-hidden="true"
                      />
                    )}
                    {districtKey === "backend" && (
                      <Server
                        className="h-3.5 w-3.5 shrink-0 text-[#10b981]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive Tech Node Selector Strip for Active View */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-2.5">
              <span className="mr-1 font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                BUILDING NODES ({visibleNodes.length}):
              </span>
              {visibleNodes.map((node) => {
                const isSelected = inspectedNode.id === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => {
                      setSelectedNode(node);
                      setActiveDistrict(node.district);
                    }}
                    className={`border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      isSelected
                        ? "border-[#00f0ff] bg-[#00f0ff]/15 font-semibold text-white"
                        : "border-slate-800 bg-[#060b16] text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    {node.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TechMetropolisTelemetry;
