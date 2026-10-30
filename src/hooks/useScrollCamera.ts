"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type * as THREE from "three";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useLenis } from "@/hooks/useLenis";
import {
  MAIN_PAGE_SECTIONS,
  interpolateCameraRig,
  clamp01,
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

export function getGlobalScrollCameraState(): ScrollCameraTelemetry {
  return globalScrollCameraState;
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

  // Smoothly animated proxy target driven by GSAP quickTo for silky camera damping
  const animatedRigRef = useRef({
    px: globalScrollCameraState.pose.position[0],
    py: globalScrollCameraState.pose.position[1],
    pz: globalScrollCameraState.pose.position[2],
    rx: globalScrollCameraState.pose.rotation[0],
    ry: globalScrollCameraState.pose.rotation[1],
    rz: globalScrollCameraState.pose.rotation[2],
  });

  useGSAP(() => {
    if (typeof window === "undefined") return;

    const rig = animatedRigRef.current;

    const applyCameraTransform = () => {
      const cam = cameraRef?.current;
      if (cam) {
        cam.position.set(rig.px, rig.py, rig.pz);
        cam.rotation.set(rig.rx, rig.ry, rig.rz);
      }
    };

    const qPx = gsap.quickTo(rig, "px", {
      duration: isReducedMotion ? 0.05 : 0.55,
      ease: "power3.out",
      onUpdate: applyCameraTransform,
    });
    const qPy = gsap.quickTo(rig, "py", {
      duration: isReducedMotion ? 0.05 : 0.55,
      ease: "power3.out",
    });
    const qPz = gsap.quickTo(rig, "pz", {
      duration: isReducedMotion ? 0.05 : 0.55,
      ease: "power3.out",
    });
    const qRx = gsap.quickTo(rig, "rx", {
      duration: isReducedMotion ? 0.05 : 0.65,
      ease: "power3.out",
    });
    const qRy = gsap.quickTo(rig, "ry", {
      duration: isReducedMotion ? 0.05 : 0.65,
      ease: "power3.out",
    });
    const qRz = gsap.quickTo(rig, "rz", {
      duration: isReducedMotion ? 0.05 : 0.65,
      ease: "power3.out",
    });

    const updateFromProgress = (rawProgress: number, velocity = 0, direction: 1 | -1 = 1) => {
      const progress = clamp01(rawProgress);
      const pose = interpolateCameraRig(progress);

      // Measure actual DOM section positions when present on page for exact section detection
      let detectedIdx = pose.activeSectionIndex;
      const viewportCenter = window.innerHeight * 0.42;
      for (let i = MAIN_PAGE_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(MAIN_PAGE_SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportCenter) {
            detectedIdx = i;
            break;
          }
        }
      }

      globalScrollCameraState.progress = progress;
      globalScrollCameraState.velocity = velocity;
      globalScrollCameraState.direction = direction;
      globalScrollCameraState.activeSectionIndex = detectedIdx;
      globalScrollCameraState.pose = {
        ...pose,
        activeSectionIndex: detectedIdx,
      };

      // Update GSAP quickTo camera targets
      qPx(pose.position[0]);
      qPy(pose.position[1]);
      qPz(pose.position[2]);
      qRx(pose.rotation[0]);
      qRy(pose.rotation[1]);
      qRz(pose.rotation[2]);

      // Apply ambient section theme variables onto documentElement for smooth cross-section atmosphere
      const activeSec = MAIN_PAGE_SECTIONS[detectedIdx] ?? MAIN_PAGE_SECTIONS[0];
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.documentElement.classList.contains("dark");
      document.documentElement.style.setProperty(
        "--section-ambient-tint",
        isDark ? activeSec.tintDark : activeSec.tintLight
      );
      document.documentElement.style.setProperty(
        "--section-accent-active",
        isDark ? activeSec.accentDark : activeSec.accentLight
      );
      document.documentElement.setAttribute(
        "data-active-section",
        activeSec.id
      );

      notifySubscribers();
    };

    // 1. Bind to GSAP ScrollTrigger across the document
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const vel = lenis ? lenis.velocity : self.getVelocity() / 300;
        const dir: 1 | -1 = self.direction >= 0 ? 1 : -1;
        updateFromProgress(self.progress, vel, dir);
      },
    });

    // 2. Also bind directly to Lenis scroll events for sub-frame velocity accuracy
    const handleLenisScroll = (e: {
      progress: number;
      velocity: number;
      direction: number;
    }) => {
      const dir: 1 | -1 = e.direction >= 0 ? 1 : -1;
      updateFromProgress(e.progress, e.velocity, dir);
    };

    if (lenis) {
      lenis.on("scroll", handleLenisScroll);
    }

    // Initial evaluation
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    updateFromProgress(window.scrollY / maxScroll, 0, 1);

    return () => {
      trigger.kill();
      if (lenis) {
        lenis.off("scroll", handleLenisScroll);
      }
    };
  }, [lenis, isReducedMotion, cameraRef]);

  useEffect(() => {
    if (!trackSectionState) return;
    return subscribeScrollCamera((state) => {
      setActiveSectionIndex(state.activeSectionIndex);
      setOverallProgress(state.progress);
    });
  }, [trackSectionState]);

  return {
    activeSectionIndex,
    overallProgress,
    sections: MAIN_PAGE_SECTIONS,
    getState: getGlobalScrollCameraState,
    subscribe: subscribeScrollCamera,
  };
}
