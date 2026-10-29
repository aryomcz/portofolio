"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  PERSONAL_CORE_HEADER,
  PERSONAL_CORE_RINGS,
  FINISH_PRESETS,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  getNodePositionOnRing,
  getRingById,
  shouldUseStaticFallback,
  type DockCategoryId,
  type FinishPreset,
  type CoreNodeItem,
  type CoreRingConfig,
} from "@/lib/personalCore";
import {
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  GraduationCap,
  Cpu,
  Users,
  Award,
  Sparkles,
  Eye,
} from "lucide-react";

// =====================================================================
// Lightweight Procedural Studio Environment (No External .hdr Fetch)
// =====================================================================
function LightweightStudioEnvironment() {
  const { gl } = useThree();

  const envTexture = useMemo(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    const texture = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();
    return texture;
  }, [gl]);

  useEffect(() => {
    return () => {
      envTexture.dispose();
    };
  }, [envTexture]);

  return <primitive object={envTexture} attach="environment" />;
}

// =====================================================================
// Procedural 3D Extruded Geometries for "ARM" Monogram
// =====================================================================
function createArmGeometries(): {
  letterA: THREE.ExtrudeGeometry;
  letterR: THREE.ExtrudeGeometry;
  letterM: THREE.ExtrudeGeometry;
} {
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 3,
  };

  // Letter A (width 0.44, height 0.60)
  const shapeA = new THREE.Shape();
  shapeA.moveTo(-0.22, -0.3);
  shapeA.lineTo(-0.06, 0.3);
  shapeA.lineTo(0.06, 0.3);
  shapeA.lineTo(0.22, -0.3);
  shapeA.lineTo(0.11, -0.3);
  shapeA.lineTo(0.07, -0.12);
  shapeA.lineTo(-0.07, -0.12);
  shapeA.lineTo(-0.11, -0.3);
  shapeA.closePath();

  const holeA = new THREE.Path();
  holeA.moveTo(-0.045, -0.01);
  holeA.lineTo(0.045, -0.01);
  holeA.lineTo(0.0, 0.18);
  holeA.closePath();
  shapeA.holes.push(holeA);

  // Letter R (width 0.42, height 0.60)
  const shapeR = new THREE.Shape();
  shapeR.moveTo(-0.2, -0.3);
  shapeR.lineTo(-0.2, 0.3);
  shapeR.lineTo(0.07, 0.3);
  shapeR.lineTo(0.19, 0.21);
  shapeR.lineTo(0.19, 0.05);
  shapeR.lineTo(0.08, -0.02);
  shapeR.lineTo(0.21, -0.3);
  shapeR.lineTo(0.09, -0.3);
  shapeR.lineTo(-0.02, -0.04);
  shapeR.lineTo(-0.09, -0.04);
  shapeR.lineTo(-0.09, -0.3);
  shapeR.closePath();

  const holeR = new THREE.Path();
  holeR.moveTo(-0.09, 0.06);
  holeR.lineTo(0.05, 0.06);
  holeR.lineTo(0.09, 0.1);
  holeR.lineTo(0.09, 0.17);
  holeR.lineTo(0.05, 0.21);
  holeR.lineTo(-0.09, 0.21);
  holeR.closePath();
  shapeR.holes.push(holeR);

  // Letter M (width 0.50, height 0.60)
  const shapeM = new THREE.Shape();
  shapeM.moveTo(-0.25, -0.3);
  shapeM.lineTo(-0.25, 0.3);
  shapeM.lineTo(-0.14, 0.3);
  shapeM.lineTo(0.0, 0.02);
  shapeM.lineTo(0.14, 0.3);
  shapeM.lineTo(0.25, 0.3);
  shapeM.lineTo(0.25, -0.3);
  shapeM.lineTo(0.14, -0.3);
  shapeM.lineTo(0.14, 0.1);
  shapeM.lineTo(0.0, -0.17);
  shapeM.lineTo(-0.14, 0.1);
  shapeM.lineTo(-0.14, -0.3);
  shapeM.closePath();

  const letterA = new THREE.ExtrudeGeometry(shapeA, extrudeSettings);
  const letterR = new THREE.ExtrudeGeometry(shapeR, extrudeSettings);
  const letterM = new THREE.ExtrudeGeometry(shapeM, extrudeSettings);

  letterA.center();
  letterR.center();
  letterM.center();

  return { letterA, letterR, letterM };
}

// =====================================================================
// Soft Radial Glow / Fading Shadow Disc Shader (Replaces Gray Plane)
// =====================================================================
const RADIAL_GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RADIAL_GLOW_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uAccentColor;
  uniform vec3 uBaseColor;

  void main() {
    float dist = distance(vUv, vec2(0.5)) * 2.0;
    float radialFade = smoothstep(1.0, 0.0, dist);
    float softCore = pow(radialFade, 2.3);
    float subtleAura = pow(radialFade, 1.35) * 0.25;

    vec3 col = mix(uBaseColor, uAccentColor, 0.72);
    float alpha = (softCore * 0.36 + subtleAura) * radialFade;

    gl_FragColor = vec4(col, alpha);
  }
`;

function RadialFloorGlow({ preset }: { preset: FinishPreset }) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const targetAccent = useMemo(() => new THREE.Color(FINISH_PRESETS[preset].accent), [preset]);
  const targetBase = useMemo(() => new THREE.Color(FINISH_PRESETS[preset].base), [preset]);

  const uniforms = useMemo(
    () => ({
      uAccentColor: { value: new THREE.Color(FINISH_PRESETS.neon.accent) },
      uBaseColor: { value: new THREE.Color(FINISH_PRESETS.neon.base) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const alpha = 1 - Math.exp(-6 * delta);
    matRef.current.uniforms.uAccentColor.value.lerp(targetAccent, alpha);
    matRef.current.uniforms.uBaseColor.value.lerp(targetBase, alpha);
  });

  return (
    <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3.1, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={RADIAL_GLOW_VERTEX}
        fragmentShader={RADIAL_GLOW_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// =====================================================================
// Center 3D Monogram "ARM" Component
// =====================================================================
function ArmMonogramCore({
  wireframe,
  preset,
}: {
  wireframe: boolean;
  preset: FinishPreset;
}) {
  const { letterA, letterR, letterM } = useMemo(() => createArmGeometries(), []);
  const matARef = useRef<THREE.MeshStandardMaterial | null>(null);
  const matRRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const matMRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const frameMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const haloRef = useRef<THREE.Mesh | null>(null);

  const style = FINISH_PRESETS[preset];
  const targetAccent = useMemo(() => new THREE.Color(style.accent), [style.accent]);
  const targetEmissive = useMemo(() => new THREE.Color(style.emissive), [style.emissive]);
  const targetBase = useMemo(() => new THREE.Color(style.base), [style.base]);

  useFrame((_, delta) => {
    const lerpFactor = 1 - Math.exp(-7 * delta);
    for (const mat of [matARef.current, matRRef.current, matMRef.current]) {
      if (!mat) continue;
      mat.color.lerp(targetAccent, lerpFactor);
      mat.emissive.lerp(targetEmissive, lerpFactor);
      mat.roughness = THREE.MathUtils.lerp(mat.roughness, style.roughness, lerpFactor);
      mat.metalness = THREE.MathUtils.lerp(mat.metalness, style.metalness, lerpFactor);
    }
    if (frameMatRef.current) {
      frameMatRef.current.color.lerp(targetBase, lerpFactor);
      frameMatRef.current.emissive.lerp(targetEmissive, lerpFactor);
    }
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 0.4;
    }
  });

  return (
    <Float speed={2.2} rotationIntensity={0.18} floatIntensity={0.38}>
      <group scale={1.12}>
        {/* Letter A */}
        <mesh geometry={letterA} position={[-0.52, 0.03, 0]}>
          <meshStandardMaterial
            ref={matARef}
            color={style.accent}
            emissive={style.emissive}
            emissiveIntensity={wireframe ? 0.6 : 0.42}
            roughness={style.roughness}
            metalness={style.metalness}
            wireframe={wireframe}
          />
        </mesh>

        {/* Letter R */}
        <mesh geometry={letterR} position={[0, 0.03, 0]}>
          <meshStandardMaterial
            ref={matRRef}
            color={style.accent}
            emissive={style.emissive}
            emissiveIntensity={wireframe ? 0.6 : 0.42}
            roughness={style.roughness}
            metalness={style.metalness}
            wireframe={wireframe}
          />
        </mesh>

        {/* Letter M */}
        <mesh geometry={letterM} position={[0.54, 0.03, 0]}>
          <meshStandardMaterial
            ref={matMRef}
            color={style.accent}
            emissive={style.emissive}
            emissiveIntensity={wireframe ? 0.6 : 0.42}
            roughness={style.roughness}
            metalness={style.metalness}
            wireframe={wireframe}
          />
        </mesh>

        {/* Secondary & Accent Read: Precision Monogram Plinth Bar & Inner Core Ring */}
        <mesh position={[0, -0.37, 0]}>
          <boxGeometry args={[1.5, 0.065, 0.24]} />
          <meshStandardMaterial
            ref={frameMatRef}
            color={style.base}
            emissive={style.emissive}
            emissiveIntensity={0.25}
            roughness={0.42}
            metalness={0.62}
            wireframe={wireframe}
          />
        </mesh>

        <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.94, 0.016, 12, 64]} />
          <meshStandardMaterial
            color={style.secondary}
            emissive={style.emissive}
            emissiveIntensity={0.48}
            roughness={0.22}
            metalness={0.78}
            wireframe={wireframe}
          />
        </mesh>
      </group>
    </Float>
  );
}

// =====================================================================
// Individual Orbit Node (Sphere / Icosahedron + Hover Label + Click)
// =====================================================================
function OrbitalNodeMesh({
  node,
  ringRadius,
  preset,
  wireframe,
  isDimmed,
  isHovered,
  onHoverChange,
  onNodeActivate,
}: {
  node: CoreNodeItem;
  ringRadius: number;
  preset: FinishPreset;
  wireframe: boolean;
  isDimmed: boolean;
  isHovered: boolean;
  onHoverChange: (node: CoreNodeItem | null) => void;
  onNodeActivate: (node: CoreNodeItem) => void;
}) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const haloMeshRef = useRef<THREE.Mesh | null>(null);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const [x, y, z] = useMemo(
    () => getNodePositionOnRing(ringRadius, node.angle),
    [ringRadius, node.angle]
  );

  const style = FINISH_PRESETS[preset];
  const nodeColorHex = node.isGold ? "#f59e0b" : style.accent;
  const nodeEmissiveHex = node.isGold ? "#d97706" : style.emissive;

  const targetColor = useMemo(() => new THREE.Color(nodeColorHex), [nodeColorHex]);
  const targetEmissive = useMemo(() => new THREE.Color(nodeEmissiveHex), [nodeEmissiveHex]);

  useFrame((_, delta) => {
    const damp = 1 - Math.exp(-10 * delta);
    if (meshRef.current) {
      const targetScale = isHovered ? 1.75 : isDimmed ? 0.78 : 1.05;
      const nextScale = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, damp);
      meshRef.current.scale.setScalar(nextScale);
      meshRef.current.rotation.y += delta * (isHovered ? 2.2 : 0.85);
      meshRef.current.rotation.x += delta * 0.45;
    }
    if (haloMeshRef.current) {
      const haloScale = isHovered ? 2.15 : 1.25;
      haloMeshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(haloMeshRef.current.scale.x, haloScale, damp)
      );
    }
    if (matRef.current) {
      matRef.current.color.lerp(targetColor, damp);
      matRef.current.emissive.lerp(targetEmissive, damp);
      const targetOpacity = isDimmed && !isHovered ? 0.24 : 1.0;
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, damp);
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        isHovered ? 0.95 : node.isGold ? 0.68 : 0.46,
        damp
      );
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Invisible Larger Hit Target for Effortless Cursor Picking */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          onHoverChange(node);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
          onHoverChange(null);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onHoverChange(node);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onNodeActivate(node);
        }}
      >
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Visible Node Geometry (Sphere or Icosahedron) */}
      <mesh ref={meshRef}>
        {node.shape === "icosahedron" ? (
          <icosahedronGeometry args={[node.isGold ? 0.165 : 0.135, 0]} />
        ) : (
          <sphereGeometry args={[0.13, 20, 20]} />
        )}
        <meshStandardMaterial
          ref={matRef}
          color={nodeColorHex}
          emissive={nodeEmissiveHex}
          emissiveIntensity={node.isGold ? 0.68 : 0.46}
          roughness={node.isGold ? 0.18 : 0.22}
          metalness={node.isGold ? 0.88 : 0.72}
          transparent
          opacity={1}
          wireframe={wireframe}
        />
      </mesh>

      {/* High-Contrast Node Gimbal Ring */}
      <mesh ref={haloMeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.17, 0.205, 24]} />
        <meshBasicMaterial
          color={node.isGold ? "#d97706" : style.base}
          side={THREE.DoubleSide}
          transparent
          opacity={isHovered ? 0.9 : isDimmed ? 0.15 : 0.65}
        />
      </mesh>

      {/* Floating 3D Label when Hovered */}
      {isHovered && (
        <Html
          position={[0, 0.32, 0]}
          center
          distanceFactor={6}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap border border-[#0e7c86] bg-[#0b111e]/95 px-2.5 py-1.5 font-mono text-[11px] text-white shadow-lg">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  node.isGold ? "bg-amber-400" : "bg-[#14b8a6]"
                }`}
              />
              <span className="font-semibold">{node.label}</span>
            </div>
            {node.href && (
              <div className="mt-0.5 text-[9px] text-[#14b8a6]">
                [ CLICK NODE TO OPEN PROJECT ]
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// =====================================================================
// Single Tilted Orbital Ring + Staggered Viewport Expansion
// =====================================================================
function OrbitalRingGroup({
  ring,
  ringIndex,
  preset,
  wireframe,
  autoRotate,
  hasEnteredViewport,
  focusedRingId,
  hoveredNodeId,
  onHoverChange,
  onNodeActivate,
}: {
  ring: CoreRingConfig;
  ringIndex: number;
  preset: FinishPreset;
  wireframe: boolean;
  autoRotate: boolean;
  hasEnteredViewport: boolean;
  focusedRingId: DockCategoryId | null;
  hoveredNodeId: string | null;
  onHoverChange: (node: CoreNodeItem | null) => void;
  onNodeActivate: (node: CoreNodeItem) => void;
}) {
  const tiltGroupRef = useRef<THREE.Group | null>(null);
  const spinGroupRef = useRef<THREE.Group | null>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const expandElapsedRef = useRef<number>(0);

  const isDimmed = focusedRingId !== null && focusedRingId !== ring.id;
  const isFocused = focusedRingId === ring.id;

  const style = FINISH_PRESETS[preset];
  const ringHex = ring.id === "achievement" ? "#d97706" : style.accent;
  const targetColor = useMemo(() => new THREE.Color(ringHex), [ringHex]);

  useFrame((_, delta) => {
    // 1. Staggered expansion from center when section enters viewport
    if (hasEnteredViewport) {
      expandElapsedRef.current += delta;
    }
    const staggerDelay = ringIndex * 0.14;
    const activeTime = Math.max(0, expandElapsedRef.current - staggerDelay);
    const targetScale = hasEnteredViewport && activeTime > 0 ? 1.0 : 0.08;

    if (tiltGroupRef.current) {
      const currentScale = tiltGroupRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(
        currentScale,
        targetScale,
        1 - Math.exp(-7 * delta)
      );
      tiltGroupRef.current.scale.setScalar(nextScale);
    }

    // 2. Gentle orbital rotation (pauses when a node on this ring is hovered)
    const isAnyNodeInRingHovered = ring.nodes.some((n) => n.id === hoveredNodeId);
    if (spinGroupRef.current && autoRotate && !isAnyNodeInRingHovered) {
      spinGroupRef.current.rotation.y += delta * ring.orbitSpeed;
    }

    // 3. Smooth color & opacity transition (dims when another ring is focused)
    if (ringMatRef.current) {
      const damp = 1 - Math.exp(-7 * delta);
      ringMatRef.current.color.lerp(targetColor, damp);
      ringMatRef.current.emissive.lerp(targetColor, damp);
      const targetOpacity = isDimmed ? 0.18 : isFocused ? 0.98 : 0.82;
      ringMatRef.current.opacity = THREE.MathUtils.lerp(
        ringMatRef.current.opacity,
        targetOpacity,
        damp
      );
      ringMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        ringMatRef.current.emissiveIntensity,
        isFocused ? 0.65 : isDimmed ? 0.1 : 0.36,
        damp
      );
    }
  });

  return (
    <group ref={tiltGroupRef} rotation={ring.tilt} scale={0.08}>
      <group ref={spinGroupRef}>
        {/* Thin Orbital Torus Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ring.radius, 0.02, 16, 96]} />
          <meshStandardMaterial
            ref={ringMatRef}
            color={ringHex}
            emissive={ringHex}
            emissiveIntensity={0.36}
            roughness={0.28}
            metalness={0.68}
            transparent
            opacity={0.82}
            wireframe={wireframe}
          />
        </mesh>

        {/* Nodes along this Orbital Ring */}
        {ring.nodes.map((node) => (
          <OrbitalNodeMesh
            key={node.id}
            node={node}
            ringRadius={ring.radius}
            preset={preset}
            wireframe={wireframe}
            isDimmed={isDimmed}
            isHovered={hoveredNodeId === node.id}
            onHoverChange={onHoverChange}
            onNodeActivate={onNodeActivate}
          />
        ))}
      </group>
    </group>
  );
}

// =====================================================================
// Scene Orchestrator (Camera Focus Damping + Scroll Reactivity + Lighting)
// =====================================================================
function PersonalCoreScene({
  preset,
  wireframe,
  autoRotate,
  hasEnteredViewport,
  scrollProgressRef,
  focusedRingId,
  hoveredNodeId,
  onHoverChange,
  onNodeActivate,
}: {
  preset: FinishPreset;
  wireframe: boolean;
  autoRotate: boolean;
  hasEnteredViewport: boolean;
  scrollProgressRef: React.RefObject<number>;
  focusedRingId: DockCategoryId | null;
  hoveredNodeId: string | null;
  onHoverChange: (node: CoreNodeItem | null) => void;
  onNodeActivate: (node: CoreNodeItem) => void;
}) {
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const isUserDraggingRef = useRef<boolean>(false);
  const { camera, size } = useThree();

  // Responsive camera framing: adapt distance slightly on mobile so all 4 orbits fit comfortably
  const isMobile = size.width > 0 && size.width < 640;
  const mobileCamDistanceFactor = isMobile
    ? Math.min(1.28, Math.max(1.12, 540 / Math.max(size.width, 320)))
    : 1;

  const desiredCamPos = useMemo(() => new THREE.Vector3(...DEFAULT_CAMERA_POSITION), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(...DEFAULT_CAMERA_TARGET), []);

  useEffect(() => {
    if (focusedRingId) {
      const ring = getRingById(focusedRingId);
      desiredCamPos.set(
        ring.cameraPosition[0],
        ring.cameraPosition[1],
        ring.cameraPosition[2] * (isMobile ? 1.15 : 1)
      );
      desiredTarget.set(...ring.cameraTarget);
    } else {
      desiredCamPos.set(
        DEFAULT_CAMERA_POSITION[0],
        DEFAULT_CAMERA_POSITION[1] * (isMobile ? 1.05 : 1),
        DEFAULT_CAMERA_POSITION[2] * mobileCamDistanceFactor
      );
      desiredTarget.set(...DEFAULT_CAMERA_TARGET);
    }
  }, [focusedRingId, isMobile, mobileCamDistanceFactor, desiredCamPos, desiredTarget]);

  useFrame((_, delta) => {
    const damp = 1 - Math.exp(-4.5 * delta);

    // Smooth camera glide when dock ring focus changes (if user isn't actively dragging)
    if (!isUserDraggingRef.current) {
      camera.position.lerp(desiredCamPos, damp * 0.65);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(desiredTarget, damp);
        controlsRef.current.update();
      }
    }

    // Subtle rotation reaction to scroll progress + gentle sway so ARM stays readable
    if (rootGroupRef.current) {
      const scrollOffset = scrollProgressRef.current - 0.5;
      const targetRotX = scrollOffset * 0.26;
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        targetRotX,
        damp
      );

      if (autoRotate && !hoveredNodeId && !isUserDraggingRef.current) {
        const swayYaw = Math.sin(performance.now() * 0.00065) * 0.24 + scrollOffset * 0.35;
        rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          rootGroupRef.current.rotation.y,
          swayYaw,
          damp
        );
      }
    }
  });

  return (
    <>
      <LightweightStudioEnvironment />
      {/* Balanced Lighting: Key Light + Lightweight Hemisphere Fill */}
      <hemisphereLight args={["#f8fafc", "#334155", 1.25]} />
      <directionalLight position={[5, 7, 6]} intensity={2.2} color="#ffffff" />

      <group ref={rootGroupRef} position={[0, 0.16, 0]}>
        {/* Center 3D Monogram "ARM" */}
        <ArmMonogramCore wireframe={wireframe} preset={preset} />

        {/* 4 Tilted Orbital Rings */}
        {PERSONAL_CORE_RINGS.map((ring, idx) => (
          <OrbitalRingGroup
            key={ring.id}
            ring={ring}
            ringIndex={idx}
            preset={preset}
            wireframe={wireframe}
            autoRotate={autoRotate}
            hasEnteredViewport={hasEnteredViewport}
            focusedRingId={focusedRingId}
            hoveredNodeId={hoveredNodeId}
            onHoverChange={onHoverChange}
            onNodeActivate={onNodeActivate}
          />
        ))}
      </group>

      {/* Soft Radial Glow / Fading Shadow Disc */}
      <RadialFloorGlow preset={preset} />

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={(Math.PI * 3) / 4}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
        }}
        onStart={() => {
          isUserDraggingRef.current = true;
        }}
        onEnd={() => {
          isUserDraggingRef.current = false;
        }}
      />
    </>
  );
}

// =====================================================================
// Static Visual Fallback (Low-End Devices, Small Mobile, Reduced Motion)
// =====================================================================
function PersonalCoreStaticFallback({
  preset,
  focusedRingId,
  hoveredNode,
  onSelectNode,
}: {
  preset: FinishPreset;
  focusedRingId: DockCategoryId | null;
  hoveredNode: CoreNodeItem | null;
  onSelectNode: (node: CoreNodeItem) => void;
}) {
  const style = FINISH_PRESETS[preset];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-bg-primary/60 p-6">
      {/* Radial Background Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${style.accent} 0%, transparent 68%)`,
        }}
        aria-hidden="true"
      />

      {/* Static SVG Orbital Diagram */}
      <svg
        viewBox="0 0 420 260"
        className="h-56 w-full max-w-md"
        role="img"
        aria-label="PERSONAL CORE // ARYO static orbital diagram"
      >
        <defs>
          <radialGradient id="coreGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={style.accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor={style.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="210" cy="130" r="110" fill="url(#coreGlowGrad)" />

        {/* 4 Orbital Rings */}
        {PERSONAL_CORE_RINGS.map((ring, idx) => {
          const rx = 68 + idx * 32;
          const ry = 28 + idx * 13;
          const rot = idx % 2 === 0 ? -14 + idx * 6 : 16 - idx * 5;
          const isDimmed = focusedRingId !== null && focusedRingId !== ring.id;
          const strokeCol = ring.id === "achievement" ? "#f59e0b" : style.accent;

          return (
            <g
              key={ring.id}
              transform={`translate(210, 130) rotate(${rot})`}
              opacity={isDimmed ? 0.22 : 0.88}
            >
              <ellipse
                cx="0"
                cy="0"
                rx={rx}
                ry={ry}
                fill="none"
                stroke={strokeCol}
                strokeWidth="1.5"
                strokeDasharray={idx % 2 === 1 ? "5 3" : undefined}
              />
              {ring.nodes.map((node) => {
                const nx = Math.cos(node.angle) * rx;
                const ny = Math.sin(node.angle) * ry;
                const isSelected = hoveredNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${nx}, ${ny})`}
                    className="cursor-pointer"
                    onClick={() => onSelectNode(node)}
                  >
                    <circle
                      r={isSelected ? 7 : 5}
                      fill={node.isGold ? "#f59e0b" : style.secondary}
                      stroke="#ffffff"
                      strokeWidth="1.2"
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Center Monogram "ARM" */}
        <g transform="translate(210, 130)">
          <rect
            x="-44"
            y="-22"
            width="88"
            height="44"
            rx="4"
            fill={style.base}
            stroke={style.accent}
            strokeWidth="2"
          />
          <text
            x="0"
            y="7"
            textAnchor="middle"
            fill={style.secondary}
            fontFamily="monospace"
            fontWeight="bold"
            fontSize="22"
            letterSpacing="4"
          >
            ARM
          </text>
        </g>
      </svg>

      <p className="mt-2 font-mono text-[11px] text-text-secondary text-center">
        STATIC ORBITAL VIEW · SELECT ANY DOCK RING OR NODE BELOW
      </p>
    </div>
  );
}

// =====================================================================
// Exported Main Showcase Component: PERSONAL CORE // ARYO
// =====================================================================
export function InteractiveArtifactShowcase() {
  const router = useRouter();
  const isReducedMotion = useReducedMotion();
  const sectionContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressRef = useRef<number>(0.5);

  const [focusedRingId, setFocusedRingId] = useState<DockCategoryId | null>(null);
  const [activeDockTab, setActiveDockTab] = useState<DockCategoryId>("education");
  const [hoveredNode, setHoveredNode] = useState<CoreNodeItem | null>(null);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [preset, setPreset] = useState<FinishPreset>("neon");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isInViewport, setIsInViewport] = useState<boolean>(true);
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(false);
  const [useStaticMode, setUseStaticMode] = useState<boolean>(false);

  // Evaluate static fallback conditions (reduced motion, small mobile, low-end CPU/RAM)
  useEffect(() => {
    const checkFallback = () => {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      const hw = nav?.hardwareConcurrency;
      const mem = (nav as unknown as { deviceMemory?: number })?.deviceMemory;
      const width = typeof window !== "undefined" ? window.innerWidth : 1024;

      setUseStaticMode(
        shouldUseStaticFallback({
          prefersReducedMotion: isReducedMotion,
          viewportWidth: width,
          hardwareConcurrency: hw,
          deviceMemory: mem,
        })
      );
    };

    checkFallback();
    window.addEventListener("resize", checkFallback);
    return () => window.removeEventListener("resize", checkFallback);
  }, [isReducedMotion]);

  // Pause WebGL render when offscreen & trigger staggered ring expansion on first viewport entry
  useEffect(() => {
    const el = sectionContainerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInViewport(true);
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInViewport(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasEnteredViewport(true);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track subtle scroll progress across the section
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - rect.top) / (vh + rect.height);
      scrollProgressRef.current = Math.max(0, Math.min(1, raw));
      if (rect.top < vh && rect.bottom > 0) {
        setHasEnteredViewport(true);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentRing = useMemo(
    () => getRingById(focusedRingId ?? activeDockTab),
    [focusedRingId, activeDockTab]
  );

  const handleDockClick = (ringId: DockCategoryId) => {
    setActiveDockTab(ringId);
    setHoveredNode(null);
    setFocusedRingId((prev) => (prev === ringId ? null : ringId));
  };

  const handleNodeActivate = (node: CoreNodeItem) => {
    setHoveredNode(node);
    setActiveDockTab(node.ringId);
    if (node.href) {
      router.push(node.href);
    }
  };

  const displayedNode = hoveredNode ?? currentRing.nodes[0];

  return (
    <div
      ref={sectionContainerRef}
      className="relative my-12 overflow-hidden border border-border-subtle bg-bg-elevated p-4 sm:p-6 lg:p-8 rounded-none"
    >
      {/* Top Telemetry Header (Preserved UI Frame) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#0e7c86]">
            <span className="h-2 w-2 animate-ping bg-[#0e7c86]" />
            <span className="font-bold tracking-widest">
              {PERSONAL_CORE_HEADER.badge}
            </span>
          </div>
          <h3 className="font-display text-2xl tracking-wide text-text-primary sm:text-3xl">
            {PERSONAL_CORE_HEADER.title}
          </h3>
          <p className="font-mono text-xs text-text-secondary">
            {PERSONAL_CORE_HEADER.subtitle}
          </p>
        </div>

        {/* Viewport Action Badges: ORBIT ON & WIREFRAME */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`press-scale flex items-center gap-1.5 border px-3 py-1.5 transition-colors ${
              autoRotate
                ? "border-[#0e7c86] bg-[#0e7c86]/10 text-text-primary"
                : "border-border-subtle bg-bg-primary text-text-muted hover:border-border-strong"
            }`}
          >
            <RotateCcw className={`h-3.5 w-3.5 ${autoRotate ? "animate-spin" : ""}`} />
            <span>ORBIT {autoRotate ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            className={`press-scale flex items-center gap-1.5 border px-3 py-1.5 transition-colors ${
              wireframe
                ? "border-[#14b8a6] bg-[#14b8a6]/10 text-text-primary"
                : "border-border-subtle bg-bg-primary text-text-muted hover:border-border-strong"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>WIREFRAME</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Stage (or Static Fallback) */}
      <div className="relative h-[400px] w-full sm:h-[460px] lg:h-[500px] cursor-grab active:cursor-grabbing touch-none select-none">
        {useStaticMode ? (
          <PersonalCoreStaticFallback
            preset={preset}
            focusedRingId={focusedRingId}
            hoveredNode={hoveredNode}
            onSelectNode={handleNodeActivate}
          />
        ) : (
          <Canvas
            camera={{ position: [...DEFAULT_CAMERA_POSITION], fov: 44 }}
            dpr={[1, 1.75]}
            frameloop={isInViewport ? "always" : "never"}
            gl={{
              powerPreference: "high-performance",
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
            }}
          >
            <PersonalCoreScene
              preset={preset}
              wireframe={wireframe}
              autoRotate={autoRotate}
              hasEnteredViewport={hasEnteredViewport}
              scrollProgressRef={scrollProgressRef}
              focusedRingId={focusedRingId}
              hoveredNodeId={hoveredNode?.id ?? null}
              onHoverChange={setHoveredNode}
              onNodeActivate={handleNodeActivate}
            />
          </Canvas>
        )}

        {/* Technical Corner Crosshairs (Preserved HUD Labels) */}
        <div className="pointer-events-none absolute top-4 left-4 font-mono text-[10px] text-text-muted">
          [ ROT: 360° DRAG / TOUCH ]
        </div>
        <div className="pointer-events-none absolute top-4 right-4 font-mono text-[10px] text-[#14b8a6]">
          [ FPS: 60 SYNC ]
        </div>

        {/* Live HUD Node Inspection Panel */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
          <div className="pointer-events-auto max-w-xl border border-border-subtle bg-bg-primary/90 px-3.5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#0e7c86]">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span>
                {hoveredNode
                  ? `HOVERED NODE // ${getRingById(hoveredNode.ringId).dockLabel}`
                  : `${currentRing.title} // ACTIVE TELEMETRY`}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs font-semibold text-text-primary">
              {displayedNode.label}
            </p>
            {displayedNode.href && (
              <button
                type="button"
                onClick={() => router.push(displayedNode.href!)}
                className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#14b8a6] hover:text-[#0e7c86]"
              >
                <span>OPEN PROJECT PAGE</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="pointer-events-none font-mono text-[10px] text-accent-primary">
            [ MONOGRAM: ARM // 4 ORBITS ]
          </div>
        </div>
      </div>

      {/* Screen-Reader Accessible HTML List of All Rings & Nodes */}
      <div className="sr-only" aria-label="Personal Core Aryo Orbital Data">
        <h4>{PERSONAL_CORE_HEADER.title}</h4>
        {PERSONAL_CORE_RINGS.map((ring) => (
          <div key={`sr-${ring.id}`}>
            <h5>{ring.title}</h5>
            <ul>
              {ring.nodes.map((node) => (
                <li key={`sr-node-${node.id}`}>
                  {node.href ? (
                    <a href={node.href}>{node.label}</a>
                  ) : (
                    <span>{node.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="relative mt-4 border-t border-border-subtle pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-text-muted uppercase">
              [ SELECT ORBITAL RING &amp; FINISH ]
            </span>
            {focusedRingId !== null && (
              <button
                type="button"
                onClick={() => setFocusedRingId(null)}
                className="inline-flex items-center gap-1 border border-[#0e7c86]/50 bg-[#0e7c86]/10 px-2 py-0.5 font-mono text-[10px] text-[#14b8a6] hover:bg-[#0e7c86]/20"
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
                <span>SHOW ALL ORBITS</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1 font-mono text-xs text-text-muted hover:text-text-primary"
          >
            <span>{isDockCollapsed ? "EXPAND DOCK" : "COLLAPSE DOCK"}</span>
            {isDockCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {!isDockCollapsed && (
          <div className="space-y-4">
            {/* 4 Dock Ring Buttons: 01 EDUCATION, 02 BUILDS, 03 COMMUNITY, 04 ACHIEVEMENT */}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {PERSONAL_CORE_RINGS.map((ring) => {
                const isFocused = focusedRingId === ring.id;
                const isSelected = activeDockTab === ring.id;
                return (
                  <button
                    key={ring.id}
                    type="button"
                    onClick={() => handleDockClick(ring.id)}
                    aria-pressed={isFocused}
                    className={`press-scale flex flex-col p-3 text-left border transition-all ${
                      isFocused
                        ? "border-[#0e7c86] bg-[#0e7c86]/15 shadow-[0_0_16px_rgba(14,124,134,0.18)]"
                        : isSelected
                          ? "border-[#0e7c86]/60 bg-[#0e7c86]/5 text-text-primary"
                          : "border-border-subtle bg-bg-primary hover:border-border-strong text-text-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-text-muted">
                        {ring.code}
                      </span>
                      {ring.id === "education" && (
                        <GraduationCap className="h-3.5 w-3.5 text-[#14b8a6]" />
                      )}
                      {ring.id === "builds" && (
                        <Cpu className="h-3.5 w-3.5 text-sky-500" />
                      )}
                      {ring.id === "community" && (
                        <Users className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      {ring.id === "achievement" && (
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <span className="mt-1 font-display text-base tracking-wide text-text-primary">
                      {ring.dockLabel}
                    </span>
                    <span className="mt-0.5 truncate font-mono text-[10px] text-text-muted">
                      {ring.nodes.map((n) => n.shortLabel).join(" · ")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Nodes Strip for Active Ring (Hover to highlight in 3D, Click Builds to navigate) */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
              <span className="font-mono text-[10px] tracking-wider text-text-muted uppercase">
                {currentRing.code} {currentRing.dockLabel} NODES:
              </span>
              {currentRing.nodes.map((node) => {
                const isNodeActive = hoveredNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onFocus={() => setHoveredNode(node)}
                    onBlur={() => setHoveredNode(null)}
                    onClick={() => handleNodeActivate(node)}
                    className={`press-scale inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs transition-colors ${
                      node.isGold
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-400 hover:border-amber-400"
                        : isNodeActive
                          ? "border-[#0e7c86] bg-[#0e7c86]/15 text-text-primary"
                          : "border-border-subtle bg-bg-primary text-text-secondary hover:border-[#0e7c86]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        node.isGold ? "bg-amber-400" : "bg-[#14b8a6]"
                      }`}
                    />
                    <span>{node.label}</span>
                    {node.href && (
                      <ArrowUpRight className="h-3 w-3 text-[#14b8a6]" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Material Finish Swatches: neon / cyber / gold / stealth */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
                <span>FINISH PRESET:</span>
                <div className="flex items-center gap-1.5">
                  {(["neon", "cyber", "gold", "stealth"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreset(p)}
                      className={`press-scale px-2.5 py-1 uppercase font-mono text-[10px] border transition-colors ${
                        preset === p
                          ? "border-[#0e7c86] bg-[#0e7c86] text-white font-bold"
                          : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <span className="font-mono text-[11px] text-text-muted">
                CLICK ANY <strong className="text-[#14b8a6]">BUILDS</strong> NODE TO OPEN PROJECT
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
