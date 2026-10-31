"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type * as THREE from "three";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis } from "@/hooks/useLenis";
import {
  MAIN_PAGE_SECTIONS,
  interpolateCameraRig,
  clamp01,
  detectActiveSectionFromOffsets,
  quantizeScrollPercent,
  type CameraRigPose,
} from "@/lib/scrollNavigation";

export interface ScrollCameraTelemetry {
  progress: number;
  velocity: number;
  direction: 1 | -1;
  activeSectionIndex: number;
  pose: CameraRigPose;
}

// Shared singleton state for zero-overhead synchronization between DOM ScrollTrigger/Lenis and the global Three.js scene
const globalScrollCameraState: ScrollCameraTelemetry = {
  progress: 0,
  velocity: 0,
  direction: 1,
  activeSectionIndex: 0,
  pose: interpolateCameraRig(0),
};

const subscribers = new Set<(state: ScrollCameraTelemetry) => void>();
let lastScrollEventTime = -10000;

export function getGlobalScrollCameraState(): ScrollCameraTelemetry {
  return globalScrollCameraState;
}

export function isUserScrolling(graceMs = 160): boolean {
  if (typeof performance === "undefined") return false;
  return (
    Math.abs(globalScrollCameraState.velocity) > 0.12 ||
    performance.now() - lastScrollEventTime < graceMs
  );
}

export function subscribeScrollCamera(
  listener: (state: ScrollCameraTelemetry) => void
): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function notifySubscribers() {
  subscribers.forEach((fn) => fn(globalScrollCameraState));
}

export interface UseScrollCameraOptions {
  /** Optional reference to the Three.js camera in the global scene */
  readonly cameraRef?: RefObject<THREE.Camera | null>;
  /** Whether to subscribe React state to section index changes (default: false for pure 60fps canvas usage) */
  readonly trackSectionState?: boolean;
}

/**
 * Hook `useScrollCamera`:
 * Uses GSAP ScrollTrigger and Lenis scroll progress/velocity to smoothly interpolate
 * and update the camera position and rotation in the global Three.js scene as the user
 * scrolls through the 7 main page sections.
 */
export function useScrollCamera(options?: UseScrollCameraOptions) {
  const { lenis, isReducedMotion } = useLenis();
  const cameraRef = options?.cameraRef;
  const trackSectionState = options?.trackSectionState ?? false;

  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(
    globalScrollCameraState.activeSectionIndex
  );
  const [overallProgress, setOverallProgress] = useState<number>(
    globalScrollCameraState.progress
  );

  const animatedRigRef = useRef({
    px: globalScrollCameraState.pose.position[0],
    py: globalScrollCameraState.pose.position[1],
    pz: globalScrollCameraState.pose.position[2],
    rx: globalScrollCameraState.pose.rotation[0],
    ry: globalScrollCameraState.pose.rotation[1],
    rz: globalScrollCameraState.pose.rotation[2],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rig = animatedRigRef.current;
    const hasCamera = Boolean(cameraRef);

    const applyCameraTransform = () => {
      const cam = cameraRef?.current;
      if (cam) {
        cam.position.set(rig.px, rig.py, rig.pz);
        cam.rotation.set(rig.rx, rig.ry, rig.rz);
      }
    };

    const qPx = hasCamera
      ? gsap.quickTo(rig, "px", {
          duration: isReducedMotion ? 0.05 : 0.55,
          ease: "power3.out",
          onUpdate: applyCameraTransform,
        })
      : null;
    const qPy = hasCamera
      ? gsap.quickTo(rig, "py", {
          duration: isReducedMotion ? 0.05 : 0.55,
          ease: "power3.out",
        })
      : null;
    const qPz = hasCamera
      ? gsap.quickTo(rig, "pz", {
          duration: isReducedMotion ? 0.05 : 0.55,
          ease: "power3.out",
        })
      : null;
    const qRx = hasCamera
      ? gsap.quickTo(rig, "rx", {
          duration: isReducedMotion ? 0.05 : 0.65,
          ease: "power3.out",
        })
      : null;
    const qRy = hasCamera
      ? gsap.quickTo(rig, "ry", {
          duration: isReducedMotion ? 0.05 : 0.65,
          ease: "power3.out",
        })
      : null;
    const qRz = hasCamera
      ? gsap.quickTo(rig, "rz", {
          duration: isReducedMotion ? 0.05 : 0.65,
          ease: "power3.out",
        })
      : null;

    let cachedSectionTops: number[] = [];
    let cachedMaxScroll = 5000;
    let cachedViewportHeight = window.innerHeight || 900;

    const measureSectionOffsets = () => {
      const scrollY = window.scrollY;
      cachedViewportHeight = window.innerHeight;
      cachedMaxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - cachedViewportHeight
      );
      const tops: number[] = [];
      for (let i = 0; i < MAIN_PAGE_SECTIONS.length; i++) {
        const el = document.getElementById(MAIN_PAGE_SECTIONS[i].id);
        if (el) {
          tops.push(el.getBoundingClientRect().top + scrollY);
        }
      }
      cachedSectionTops = tops;
    };

    const updateFromProgress = (
      rawProgress: number,
      velocity = 0,
      direction: 1 | -1 = 1,
      currentScrollY = window.scrollY
    ) => {
      const progress = clamp01(rawProgress);
      const pose = interpolateCameraRig(progress);

      const detectedIdx = detectActiveSectionFromOffsets(
        currentScrollY,
        cachedViewportHeight,
        cachedSectionTops,
        pose.activeSectionIndex
      );

      globalScrollCameraState.progress = progress;
      globalScrollCameraState.velocity = velocity;
      globalScrollCameraState.direction = direction;
      globalScrollCameraState.activeSectionIndex = detectedIdx;
      globalScrollCameraState.pose = {
        ...pose,
        activeSectionIndex: detectedIdx,
      };

      if (cameraRef?.current && qPx && qPy && qPz && qRx && qRy && qRz) {
        qPx(pose.position[0]);
        qPy(pose.position[1]);
        qPz(pose.position[2]);
        qRx(pose.rotation[0]);
        qRy(pose.rotation[1]);
        qRz(pose.rotation[2]);
      }

      notifySubscribers();
    };

    let measureRafId = window.requestAnimationFrame(() => {
      measureSectionOffsets();
      updateFromProgress(
        window.scrollY / cachedMaxScroll,
        0,
        1,
        window.scrollY
      );
    });

    const handleResizeOrRefresh = () => {
      window.cancelAnimationFrame(measureRafId);
      measureRafId = window.requestAnimationFrame(() => {
        measureSectionOffsets();
      });
    };

    window.addEventListener("resize", handleResizeOrRefresh, { passive: true });
    ScrollTrigger.addEventListener("refresh", handleResizeOrRefresh);

    const handleLenisScroll = (e: {
      scroll: number;
      progress: number;
      velocity: number;
      direction: number;
    }) => {
      lastScrollEventTime = performance.now();
      const dir: 1 | -1 = e.direction >= 0 ? 1 : -1;
      updateFromProgress(e.progress, e.velocity, dir, e.scroll);
    };

    let lastNativeScrollY = window.scrollY;
    let lastNativeTime = performance.now();
    const handleNativeScroll = () => {
      const now = performance.now();
      lastScrollEventTime = now;
      const sy = window.scrollY;
      const dt = Math.max(16, now - lastNativeTime);
      const rawVel = ((sy - lastNativeScrollY) / dt) * 16;
      const dir: 1 | -1 = sy >= lastNativeScrollY ? 1 : -1;
      lastNativeScrollY = sy;
      lastNativeTime = now;
      updateFromProgress(sy / cachedMaxScroll, rawVel, dir, sy);
    };

    if (lenis) {
      lenis.on("scroll", handleLenisScroll);
    } else {
      window.addEventListener("scroll", handleNativeScroll, { passive: true });
    }

    return () => {
      window.cancelAnimationFrame(measureRafId);
      window.removeEventListener("resize", handleResizeOrRefresh);
      ScrollTrigger.removeEventListener("refresh", handleResizeOrRefresh);
      if (lenis) {
        lenis.off("scroll", handleLenisScroll);
      } else {
        window.removeEventListener("scroll", handleNativeScroll);
      }
    };
  }, [cameraRef, isReducedMotion, lenis]);

  useEffect(() => {
    if (!trackSectionState) return;
    let lastIdx = globalScrollCameraState.activeSectionIndex;
    let lastPct = quantizeScrollPercent(globalScrollCameraState.progress);

    return subscribeScrollCamera((state) => {
      const nextPct = quantizeScrollPercent(state.progress);
      if (state.activeSectionIndex !== lastIdx) {
        lastIdx = state.activeSectionIndex;
        setActiveSectionIndex(state.activeSectionIndex);
      }
      if (nextPct !== lastPct) {
        lastPct = nextPct;
        setOverallProgress(nextPct / 100);
      }
    });
  }, [trackSectionState]);

  const activeSection =
    MAIN_PAGE_SECTIONS[activeSectionIndex] ?? MAIN_PAGE_SECTIONS[0];

  return {
    activeSectionIndex,
    activeSection,
    overallProgress,
    getTelemetry: getGlobalScrollCameraState,
  };
}
