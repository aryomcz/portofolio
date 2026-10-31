"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { isUserScrolling } from "@/hooks/useScrollCamera";
import {
  TOTAL_PERSISTENT_NODES,
  dampValue,
  dampTuple3,
  buildPersistentNodeMetadata,
  buildSkillProjectBeams,
  generateHeroNodePositions,
  generateSkillsNodePositions,
  generateAchievementsNodePositions,
  computeAchievementsSpotlightPose,
  generateContactArmNodePositions,
  computeSceneStageWeights,
  blendNodePosition,
  computeCameraPoseForStage,
  computeSkillInteractionState,
  type Vec3Tuple,
} from "@/lib/persistentScene";

export interface SharedSceneRuntimeState {
  globalScrollProgress: number;
  heroRatio: number;
  skillsRatio: number;
  achievementsRatio: number;
  contactRatio: number;
  achievementsScrollProgress: number;
  cursorX: number;
  cursorY: number;
  activeSkillName: string | null;
  isDarkTheme: boolean;
  isPaused?: boolean;
}

// =====================================================================
// Pre-allocated Scratch Math Objects (Zero Per-Frame GC Allocations)
// =====================================================================
const _dummyObj = new THREE.Object3D();
const _beamObj = new THREE.Object3D();
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecMid = new THREE.Vector3();
const _vecDir = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();
const _colorScratch = new THREE.Color();
const _baseColorTeal = new THREE.Color("#0e7c86");
const _activeColorCyan = new THREE.Color("#14b8a6");
const _brightColorMint = new THREE.Color("#2dd4bf");
const _goldColor = new THREE.Color("#f59e0b");
const _dimColor = new THREE.Color("#475569");

function BackgroundFramePacer({
  runtimeRef,
  isSoftwareGl,
}: {
  readonly runtimeRef: React.RefObject<SharedSceneRuntimeState>;
  readonly isSoftwareGl: boolean;
}) {
  const { invalidate } = useThree();

  useEffect(() => {
    invalidate();
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    // 30 FPS (33ms) on hardware Desktop GPU, ~15 FPS (65ms) on software fallback
    const intervalMs = isSoftwareGl ? 65 : 33;

    const tick = () => {
      if (cancelled) return;
      const shouldYieldToScroll = isSoftwareGl && isUserScrolling(160);
      if (!runtimeRef.current?.isPaused && !shouldYieldToScroll) {
        invalidate();
      }
      timerId = setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [runtimeRef, isSoftwareGl, invalidate]);

  return null;
}

function PersistentSceneContent({
  runtimeRef,
}: {
  readonly runtimeRef: React.RefObject<SharedSceneRuntimeState>;
}) {
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const nodesMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const beamsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const constellationLinesRef = useRef<THREE.LineSegments | null>(null);
  const constellationMatRef = useRef<THREE.LineBasicMaterial | null>(null);
  const armLinesRef = useRef<THREE.LineSegments | null>(null);
  const armLinesMatRef = useRef<THREE.LineBasicMaterial | null>(null);

  const spotLightRef = useRef<THREE.SpotLight | null>(null);
  const spotBeamConeRef = useRef<THREE.Mesh | null>(null);
  const spotBeamMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const spotTargetRingRef = useRef<THREE.Mesh | null>(null);
  const spotTargetMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const sceneData = useMemo(() => {
    const nodes = buildPersistentNodeMetadata();
    const beams = buildSkillProjectBeams(nodes);
    const heroPos = generateHeroNodePositions(TOTAL_PERSISTENT_NODES);
    const skillsPos = generateSkillsNodePositions(nodes);
    const achievePos = generateAchievementsNodePositions(TOTAL_PERSISTENT_NODES);
    const contactPos = generateContactArmNodePositions(TOTAL_PERSISTENT_NODES);

    const heroEdgePairs: [number, number][] = [];
    for (let i = 0; i < TOTAL_PERSISTENT_NODES; i++) {
      let connected = 0;
      for (let j = i + 1; j < TOTAL_PERSISTENT_NODES; j++) {
        const dx = heroPos[i][0] - heroPos[j][0];
        const dy = heroPos[i][1] - heroPos[j][1];
        const dz = heroPos[i][2] - heroPos[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.85 && connected < 3) {
          heroEdgePairs.push([i, j]);
          connected++;
        }
      }
    }

    const armEdgePairs: [number, number][] = [];
    const strokeRanges: [number, number][] = [
      [0, 7],
      [8, 14],
      [15, 19],
      [20, 26],
      [27, 30],
      [31, 33],
      [34, 37],
      [38, 41],
      [42, 48],
      [49, 53],
      [54, 57],
      [58, 64],
    ];
    for (const [start, end] of strokeRanges) {
      for (let idx = start; idx < end; idx++) {
        armEdgePairs.push([idx, idx + 1]);
      }
    }

    const constellationPositions = new Float32Array(heroEdgePairs.length * 6);
    const constellationGeo = new THREE.BufferGeometry();
    constellationGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(constellationPositions, 3)
    );

    const armLinePositions = new Float32Array(armEdgePairs.length * 6);
    const armLineGeo = new THREE.BufferGeometry();
    armLineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(armLinePositions, 3)
    );

    return {
      nodes,
      beams,
      heroPos,
      skillsPos,
      achievePos,
      contactPos,
      heroEdgePairs,
      armEdgePairs,
      constellationGeo,
      armLineGeo,
    };
  }, []);

  const simRef = useRef<{
    currentNodePositions: Vec3Tuple[];
    currentNodeScales: number[];
    currentNodeGlows: number[];
    currentBeamThickness: number[];
    currentBeamGlow: number[];
    camPos: Vec3Tuple;
    camLook: Vec3Tuple;
    groupRotX: number;
    groupRotY: number;
    heroSpinY: number;
    lastSkillKey: string | null;
    cachedSkillState: ReturnType<typeof computeSkillInteractionState>;
  } | null>(null);

  if (simRef.current === null) {
    simRef.current = {
      currentNodePositions: sceneData.heroPos.map((p) => [p[0], p[1], p[2]]),
      currentNodeScales: sceneData.nodes.map(() => 1.0),
      currentNodeGlows: sceneData.nodes.map(() => 0.25),
      currentBeamThickness: sceneData.beams.map(() => 1.0),
      currentBeamGlow: sceneData.beams.map(() => 0.2),
      camPos: [0, 0.18, 6.2],
      camLook: [0, 0.08, 0],
      groupRotX: 0,
      groupRotY: 0,
      heroSpinY: 0,
      lastSkillKey: "__init__",
      cachedSkillState: computeSkillInteractionState({
        activeSkillName: null,
        nodes: sceneData.nodes,
        beams: sceneData.beams,
      }),
    };
  }

  useEffect(() => {
    return () => {
      sceneData.constellationGeo.dispose();
      sceneData.armLineGeo.dispose();
    };
  }, [sceneData]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const elapsed = state.clock.elapsedTime;
    const runtime = runtimeRef.current;
    const sim = simRef.current;
    if (!runtime || !sim) return;

    const weights = computeSceneStageWeights({
      globalScrollProgress: runtime.globalScrollProgress,
      heroRatio: runtime.heroRatio,
      skillsRatio: runtime.skillsRatio,
      achievementsRatio: runtime.achievementsRatio,
      contactRatio: runtime.contactRatio,
      achievementsScrollProgress: runtime.achievementsScrollProgress,
    });

    if (sim.lastSkillKey !== runtime.activeSkillName) {
      sim.lastSkillKey = runtime.activeSkillName;
      sim.cachedSkillState = computeSkillInteractionState({
        activeSkillName: runtime.activeSkillName,
        nodes: sceneData.nodes,
        beams: sceneData.beams,
      });
    }
    const skillState = sim.cachedSkillState;

    const targetCam = computeCameraPoseForStage({
      weights,
      cursorX: runtime.cursorX,
      cursorY: runtime.cursorY,
    });
    sim.camPos = dampTuple3(sim.camPos, targetCam.position, 5.5, dt);
    sim.camLook = dampTuple3(sim.camLook, targetCam.target, 5.5, dt);

    state.camera.position.set(sim.camPos[0], sim.camPos[1], sim.camPos[2]);
    state.camera.lookAt(sim.camLook[0], sim.camLook[1], sim.camLook[2]);

    sim.heroSpinY += dt * 0.16 * weights.hero;
    const targetRotX =
      -runtime.cursorY * (0.22 * weights.hero + 0.06 * (1 - weights.hero));
    const targetRotY =
      sim.heroSpinY * weights.hero +
      runtime.cursorX * (0.28 * weights.hero + 0.08 * (1 - weights.hero));

    sim.groupRotX = dampValue(sim.groupRotX, targetRotX, 6.0, dt);
    sim.groupRotY = dampValue(sim.groupRotY, targetRotY, 6.0, dt);

    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.x = sim.groupRotX;
      rootGroupRef.current.rotation.y = sim.groupRotY;
    }

    const nodesMesh = nodesMeshRef.current;
    if (nodesMesh) {
      for (let i = 0; i < TOTAL_PERSISTENT_NODES; i++) {
        const meta = sceneData.nodes[i];
        const targetPos = blendNodePosition(
          sceneData.heroPos[i],
          sceneData.skillsPos[i],
          sceneData.achievePos[i],
          sceneData.contactPos[i],
          weights
        );

        const floatY = Math.sin(elapsed * 1.5 + i * 0.45) * 0.045;
        const floatX = Math.cos(elapsed * 1.1 + i * 0.35) * 0.025;

        const nextPos = dampTuple3(
          sim.currentNodePositions[i],
          [targetPos[0] + floatX, targetPos[1] + floatY, targetPos[2]],
          7.5,
          dt
        );
        sim.currentNodePositions[i] = nextPos;

        const contactPulse =
          weights.contact * (1.28 + Math.sin(elapsed * 3.4 - i * 0.14) * 0.25);
        const targetScaleMult =
          weights.skills > 0.2
            ? skillState.nodeScales[i]
            : weights.contact > 0.2
              ? contactPulse
              : 1.0;

        sim.currentNodeScales[i] = dampValue(
          sim.currentNodeScales[i],
          targetScaleMult,
          9.0,
          dt
        );

        const finalScale = meta.baseScale * sim.currentNodeScales[i];
        _dummyObj.position.set(nextPos[0], nextPos[1], nextPos[2]);
        _dummyObj.rotation.set(
          elapsed * 0.4 + i * 0.2,
          elapsed * 0.5 + i * 0.3,
          0
        );
        _dummyObj.scale.setScalar(finalScale);
        _dummyObj.updateMatrix();
        nodesMesh.setMatrixAt(i, _dummyObj.matrix);

        const skillGlowTarget =
          weights.skills > 0.2 ? skillState.nodeGlows[i] : 0.3;
        const armGlowTarget =
          weights.contact > 0.2
            ? 0.72 + Math.sin(elapsed * 3.4 - i * 0.14) * 0.28
            : 0.0;
        const targetGlow = Math.max(
          skillGlowTarget * weights.skills,
          armGlowTarget * weights.contact,
          0.35 * weights.hero,
          0.35 * weights.achievements
        );

        sim.currentNodeGlows[i] = dampValue(
          sim.currentNodeGlows[i],
          targetGlow,
          8.5,
          dt
        );

        const g = sim.currentNodeGlows[i];
        if (weights.contact > 0.35) {
          const armPulse = 0.55 + 0.45 * Math.sin(elapsed * 3.6 - i * 0.14);
          _colorScratch.copy(_activeColorCyan).lerp(_brightColorMint, armPulse);
        } else if (weights.achievements > 0.45 && i % 4 === 0) {
          _colorScratch
            .copy(_baseColorTeal)
            .lerp(_goldColor, weights.achievements * 0.75);
        } else if (g > 0.65) {
          _colorScratch
            .copy(_activeColorCyan)
            .lerp(_brightColorMint, (g - 0.65) / 0.35);
        } else if (g < 0.2) {
          _colorScratch.copy(_dimColor).lerp(_baseColorTeal, g / 0.2);
        } else {
          _colorScratch
            .copy(_baseColorTeal)
            .lerp(_activeColorCyan, (g - 0.2) / 0.45);
        }
        nodesMesh.setColorAt(i, _colorScratch);
      }

      nodesMesh.instanceMatrix.needsUpdate = true;
      if (nodesMesh.instanceColor) {
        nodesMesh.instanceColor.needsUpdate = true;
      }
    }

    if (constellationLinesRef.current && constellationMatRef.current) {
      const heroLineOpacity =
        (weights.hero * 0.28 + weights.achievements * 0.1) *
        (runtime.isDarkTheme ? 1.15 : 0.85);
      constellationMatRef.current.opacity =
        heroLineOpacity > 0.01 ? heroLineOpacity : 0;

      if (heroLineOpacity > 0.01) {
        const posAttr = sceneData.constellationGeo.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const pairs = sceneData.heroEdgePairs;

        for (let e = 0; e < pairs.length; e++) {
          const [aIdx, bIdx] = pairs[e];
          const pA = sim.currentNodePositions[aIdx];
          const pB = sim.currentNodePositions[bIdx];
          const offset = e * 6;
          arr[offset] = pA[0];
          arr[offset + 1] = pA[1];
          arr[offset + 2] = pA[2];
          arr[offset + 3] = pB[0];
          arr[offset + 4] = pB[1];
          arr[offset + 5] = pB[2];
        }
        posAttr.needsUpdate = true;
      }
    }

    if (armLinesRef.current && armLinesMatRef.current) {
      const pulse = 0.72 + Math.sin(elapsed * 3.4) * 0.28;
      const armOpacity = weights.contact * 0.92 * pulse;
      armLinesMatRef.current.opacity = armOpacity > 0.015 ? armOpacity : 0;

      if (armOpacity > 0.015) {
        const posAttr = sceneData.armLineGeo.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const pairs = sceneData.armEdgePairs;

        for (let e = 0; e < pairs.length; e++) {
          const [aIdx, bIdx] = pairs[e];
          const pA = sim.currentNodePositions[aIdx];
          const pB = sim.currentNodePositions[bIdx];
          const offset = e * 6;
          arr[offset] = pA[0];
          arr[offset + 1] = pA[1];
          arr[offset + 2] = pA[2];
          arr[offset + 3] = pB[0];
          arr[offset + 4] = pB[1];
          arr[offset + 5] = pB[2];
        }
        posAttr.needsUpdate = true;
      }
    }

    const beamsMesh = beamsMeshRef.current;
    if (beamsMesh) {
      const skillsVisibility = weights.skills;
      const isBeamsActive = skillsVisibility > 0.04;
      const mat = beamsMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = isBeamsActive ? 0.52 * Math.min(1, skillsVisibility * 1.5) : 0;

      if (isBeamsActive) {
        const beams = sceneData.beams;
        for (let b = 0; b < beams.length; b++) {
          const edge = beams[b];
          const fromPos = sim.currentNodePositions[edge.fromNodeIndex];
          const toPos = sim.currentNodePositions[edge.toNodeIndex];

          const targetThick =
            skillState.beamThicknessMultipliers[b] * skillsVisibility;
          const targetGlow =
            skillState.beamGlowMultipliers[b] * skillsVisibility;

          sim.currentBeamThickness[b] = dampValue(
            sim.currentBeamThickness[b],
            targetThick,
            10.0,
            dt
          );
          sim.currentBeamGlow[b] = dampValue(
            sim.currentBeamGlow[b],
            targetGlow,
            10.0,
            dt
          );

          _vecA.set(fromPos[0], fromPos[1], fromPos[2]);
          _vecB.set(toPos[0], toPos[1], toPos[2]);
          _vecMid.addVectors(_vecA, _vecB).multiplyScalar(0.5);
          _vecDir.subVectors(_vecB, _vecA);
          const length = Math.max(0.001, _vecDir.length());
          _vecDir.normalize();

          _quat.setFromUnitVectors(_upAxis, _vecDir);
          const thickness = sim.currentBeamThickness[b];

          _beamObj.position.copy(_vecMid);
          _beamObj.quaternion.copy(_quat);
          _beamObj.scale.set(thickness, length, thickness);
          _beamObj.updateMatrix();
          beamsMesh.setMatrixAt(b, _beamObj.matrix);

          const bg = sim.currentBeamGlow[b];
          if (bg > 0.6) {
            _colorScratch
              .copy(_activeColorCyan)
              .lerp(_brightColorMint, (bg - 0.6) / 0.4);
          } else {
            _colorScratch.copy(_dimColor).lerp(_baseColorTeal, bg / 0.6);
          }
          beamsMesh.setColorAt(b, _colorScratch);
        }

        beamsMesh.instanceMatrix.needsUpdate = true;
        if (beamsMesh.instanceColor) {
          beamsMesh.instanceColor.needsUpdate = true;
        }
      }
    }

    const achieveWeight = weights.achievements;
    const spotPose = computeAchievementsSpotlightPose(
      runtime.achievementsScrollProgress
    );

    if (
      spotLightRef.current &&
      spotBeamConeRef.current &&
      spotBeamMatRef.current &&
      spotTargetRingRef.current &&
      spotTargetMatRef.current
    ) {
      // Keep spotLight and meshes visible=true at all times so Three.js NEVER recompiles
      // MeshStandardMaterial shaders when crossing section boundaries!
      const isSpotActive = achieveWeight > 0.04;

      if (isSpotActive) {
        _vecA.set(spotPose.source[0], spotPose.source[1], spotPose.source[2]);
        _vecB.set(spotPose.target[0], spotPose.target[1], spotPose.target[2]);

        spotLightRef.current.position.copy(_vecA);
        spotLightRef.current.target.position.copy(_vecB);
        spotLightRef.current.target.updateMatrixWorld();
        spotLightRef.current.intensity =
          achieveWeight * spotPose.intensity * 4.5;

        _vecMid.addVectors(_vecA, _vecB).multiplyScalar(0.5);
        _vecDir.subVectors(_vecB, _vecA);
        const coneLen = _vecDir.length();
        _vecDir.normalize();
        _vecDir.negate();
        _quat.setFromUnitVectors(_upAxis, _vecDir);

        spotBeamConeRef.current.position.copy(_vecMid);
        spotBeamConeRef.current.quaternion.copy(_quat);
        spotBeamConeRef.current.scale.set(1, coneLen / 3.8, 1);
        spotBeamMatRef.current.opacity =
          achieveWeight *
          spotPose.intensity *
          (runtime.isDarkTheme ? 0.16 : 0.11);

        spotTargetRingRef.current.position.set(
          spotPose.target[0],
          spotPose.target[1],
          spotPose.target[2]
        );
        const ringPulse = 1 + Math.sin(elapsed * 3.0) * 0.08;
        spotTargetRingRef.current.scale.setScalar(ringPulse);
        spotTargetMatRef.current.opacity =
          achieveWeight * spotPose.intensity * 0.42;
      } else {
        spotLightRef.current.intensity = 0;
        spotBeamMatRef.current.opacity = 0;
        spotTargetMatRef.current.opacity = 0;
      }
    }
  });

  return (
    <group ref={rootGroupRef}>
      <hemisphereLight args={["#2dd4bf", "#0f172a", 1.15]} />
      <directionalLight
        position={[3.5, 4.5, 4.0]}
        intensity={1.65}
        color="#f8fafc"
      />
      <pointLight
        position={[-3.0, -1.5, 2.5]}
        intensity={1.1}
        color="#0e7c86"
      />

      <instancedMesh
        ref={nodesMeshRef}
        args={[undefined, undefined, TOTAL_PERSISTENT_NODES]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#14b8a6"
          emissive="#0e7c86"
          emissiveIntensity={0.55}
          roughness={0.28}
          metalness={0.68}
          flatShading
        />
      </instancedMesh>

      <lineSegments
        ref={constellationLinesRef}
        geometry={sceneData.constellationGeo}
        frustumCulled={false}
      >
        <lineBasicMaterial
          ref={constellationMatRef}
          color="#0e7c86"
          transparent
          opacity={0.24}
          depthWrite={false}
        />
      </lineSegments>

      <instancedMesh
        ref={beamsMeshRef}
        args={[undefined, undefined, sceneData.beams.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.0065, 0.0065, 1, 6, 1]} />
        <meshBasicMaterial
          color="#14b8a6"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </instancedMesh>

      <spotLight
        ref={spotLightRef}
        color="#fbbf24"
        intensity={0}
        angle={0.48}
        penumbra={0.85}
        distance={10}
      />
      <mesh ref={spotBeamConeRef} frustumCulled={false}>
        <coneGeometry args={[1.45, 3.8, 24, 1, true]} />
        <meshBasicMaterial
          ref={spotBeamMatRef}
          color="#fbbf24"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={spotTargetRingRef} frustumCulled={false}>
        <ringGeometry args={[0.68, 0.74, 32]} />
        <meshBasicMaterial
          ref={spotTargetMatRef}
          color="#f59e0b"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <lineSegments
        ref={armLinesRef}
        geometry={sceneData.armLineGeo}
        frustumCulled={false}
      >
        <lineBasicMaterial
          ref={armLinesMatRef}
          color="#2dd4bf"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

export function PersistentSceneWebgl({
  runtimeRef,
  maxDpr,
  isSoftwareGl,
}: {
  readonly runtimeRef: React.RefObject<SharedSceneRuntimeState>;
  readonly maxDpr: number;
  readonly isSoftwareGl: boolean;
}) {
  return (
    <Canvas
      dpr={[1, maxDpr]}
      frameloop="demand"
      camera={{ position: [0, 0.18, 6.2], fov: 42, near: 0.1, far: 30 }}
      gl={{
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: "high-performance",
      }}
      style={{ pointerEvents: "none" }}
    >
      <BackgroundFramePacer
        runtimeRef={runtimeRef}
        isSoftwareGl={isSoftwareGl}
      />
      <PersistentSceneContent runtimeRef={runtimeRef} />
    </Canvas>
  );
}
