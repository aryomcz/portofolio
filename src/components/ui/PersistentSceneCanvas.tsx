"use client";

import React, { Component, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { subscribeScrollCamera } from "@/hooks/useScrollCamera";
import {
  clampPersistentDpr,
  shouldUseMobileStaticFallback,
  shouldPausePersistentScene,
} from "@/lib/persistentScene";
import type { SharedSceneRuntimeState } from "./PersistentSceneWebgl";

const PersistentSceneWebgl = dynamic(
  () =>
    import("./PersistentSceneWebgl").then((mod) => mod.PersistentSceneWebgl),
  { ssr: false }
);

class SceneErrorBoundary extends Component<
  { readonly fallback: React.ReactNode; readonly children: React.ReactNode },
  { readonly hasError: boolean }
> {
  constructor(props: {
    readonly fallback: React.ReactNode;
    readonly children: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function StaticMobileGradientFallback() {
  return (
    <div
      aria-hidden="true"
      data-testid="persistent-3d-static-fallback"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(14,124,134,0.12),transparent_52%),radial-gradient(circle_at_82%_75%,rgba(20,184,166,0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_20%_18%,rgba(20,184,166,0.14),transparent_52%),radial-gradient(circle_at_82%_75%,rgba(14,124,134,0.14),transparent_55%)]" />
    </div>
  );
}

export function PersistentSceneCanvas() {
  const isReducedMotion = useReducedMotion();
  // Default to true on SSR / initial paint so Mobile never loads Three.js or R3F chunks
  const [isMobileFallback, setIsMobileFallback] = useState<boolean>(true);
  const [isTabHidden, setIsTabHidden] = useState<boolean>(false);
  const [isAnySectionVisible, setIsAnySectionVisible] = useState<boolean>(true);
  const [isSoftwareGl, setIsSoftwareGl] = useState<boolean>(false);
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);

  const runtimeRef = useRef<SharedSceneRuntimeState>({
    globalScrollProgress: 0,
    heroRatio: 1,
    skillsRatio: 0,
    achievementsRatio: 0,
    contactRatio: 0,
    achievementsScrollProgress: 0.5,
    cursorX: 0,
    cursorY: 0,
    activeSkillName: null,
    isDarkTheme: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const evaluateViewport = () => {
      const isCoarse =
        window.matchMedia?.("(pointer: coarse)").matches ?? false;
      return shouldUseMobileStaticFallback({
        viewportWidth: window.innerWidth,
        prefersReducedMotion: isReducedMotion,
        isCoarsePointer: isCoarse,
      });
    };

    const initialMobileFallback = evaluateViewport();
    queueMicrotask(() => {
      setIsMobileFallback(initialMobileFallback);
    });

    const handleResize = () => {
      setIsMobileFallback(evaluateViewport());
    };
    window.addEventListener("resize", handleResize, { passive: true });

    if (initialMobileFallback) {
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    // Desktop-only: defer WebGL canvas mount until after initial paint & hydration settle
    const readyTimer = window.setTimeout(() => {
      try {
        const gl = document.createElement("canvas").getContext("webgl2");
        if (!gl) {
          setIsSoftwareGl(true);
        } else {
          const ext = gl.getExtension("WEBGL_debug_renderer_info");
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
          const gpu = String(gl.getParameter(param));
          gl.getExtension("WEBGL_lose_context")?.loseContext();
          setIsSoftwareGl(
            /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu)
          );
        }
      } catch {
        setIsSoftwareGl(false);
      }
      setIsCanvasReady(true);
    }, 280);

    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const checkIsDark = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      runtimeRef.current.isDarkTheme =
        attr === "dark" || document.documentElement.classList.contains("dark");
    };
    checkIsDark();
    const themeObserver = new MutationObserver(checkIsDark);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      runtimeRef.current.cursorX = Math.max(-1, Math.min(1, nx));
      runtimeRef.current.cursorY = Math.max(-1, Math.min(1, ny));
    };
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    const handleSkillHover = (e: Event) => {
      const custom = e as CustomEvent<{ skillName: string | null }>;
      runtimeRef.current.activeSkillName = custom.detail?.skillName ?? null;
    };
    window.addEventListener("hud:skill-hover", handleSkillHover);

    const sectionIds = [
      "hero",
      "skills",
      "achievements",
      "contact",
      "artifacts",
    ] as const;
    const visibilityMap = new Map<string, number>();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          visibilityMap.set(
            id,
            entry.isIntersecting ? Math.max(0.15, entry.intersectionRatio) : 0
          );
        }

        const heroR = visibilityMap.get("hero") ?? 0;
        const skillsR = visibilityMap.get("skills") ?? 0;
        const achieveR = visibilityMap.get("achievements") ?? 0;
        const contactR = visibilityMap.get("contact") ?? 0;
        const artifactsR = visibilityMap.get("artifacts") ?? 0;

        runtimeRef.current.heroRatio = heroR;
        runtimeRef.current.skillsRatio = skillsR;
        runtimeRef.current.achievementsRatio = achieveR;
        runtimeRef.current.contactRatio = contactR;

        const anyVisible =
          (heroR > 0 || skillsR > 0 || achieveR > 0 || contactR > 0) &&
          artifactsR < 0.25;
        setIsAnySectionVisible((prev) =>
          prev === anyVisible ? prev : anyVisible
        );
      },
      {
        threshold: [0, 0.25, 0.65],
        rootMargin: "120px 0px",
      }
    );

    const attachSectionObservers = () => {
      let foundAny = false;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          foundAny = true;
          intersectionObserver.observe(el);
        }
      }
      if (!foundAny) {
        setIsAnySectionVisible(false);
      }
    };
    attachSectionObservers();

    const triggers: ScrollTrigger[] = [];
    const unsubscribeScrollCamera = subscribeScrollCamera((state) => {
      runtimeRef.current.globalScrollProgress = state.progress;
    });

    const achieveEl = document.getElementById("achievements");
    if (achieveEl) {
      triggers.push(
        ScrollTrigger.create({
          trigger: achieveEl,
          start: "top 85%",
          end: "bottom 20%",
          onUpdate: (self) => {
            runtimeRef.current.achievementsScrollProgress = self.progress;
          },
        })
      );
    }

    const routeCheckTimer = window.setTimeout(() => {
      attachSectionObservers();
    }, 350);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(routeCheckTimer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      themeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("hud:skill-hover", handleSkillHover);
      unsubscribeScrollCamera();
      intersectionObserver.disconnect();
      for (const t of triggers) {
        t.kill();
      }
    };
  }, [isReducedMotion]);

  if (isMobileFallback || isReducedMotion) {
    return <StaticMobileGradientFallback />;
  }

  const isPaused = shouldPausePersistentScene({
    isTabHidden,
    isAnySectionVisible,
    isReducedMotion,
    isMobileFallback,
  });

  const maxDpr = clampPersistentDpr(1.25, isSoftwareGl);

  return (
    <SceneErrorBoundary fallback={<StaticMobileGradientFallback />}>
      <div
        aria-hidden="true"
        data-testid="persistent-3d-scene-container"
        data-paused={isPaused ? "true" : "false"}
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {isCanvasReady ? (
          <PersistentSceneWebgl
            runtimeRef={runtimeRef}
            maxDpr={maxDpr}
            isPaused={isPaused}
            isSoftwareGl={isSoftwareGl}
          />
        ) : (
          <StaticMobileGradientFallback />
        )}
      </div>
    </SceneErrorBoundary>
  );
}
