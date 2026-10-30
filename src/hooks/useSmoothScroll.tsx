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
import { gsap, ScrollTrigger, refreshScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { editorialScrollEasing } from "@/lib/motion";

export interface ScrollToOptions {
  readonly offset?: number;
  readonly duration?: number;
  readonly immediate?: boolean;
  readonly force?: boolean;
}

export interface LenisContextValue {
  readonly lenis: Lenis | null;
  readonly isLocked: boolean;
  readonly isReducedMotion: boolean;
  readonly stop: () => void;
  readonly start: () => void;
  readonly stopScroll: () => void;
  readonly startScroll: () => void;
  readonly scrollTo: (
    target: string | number | HTMLElement,
    options?: ScrollToOptions
  ) => void;
}

export type SmoothScrollContextValue = LenisContextValue;

const SmoothScrollContext = createContext<LenisContextValue | null>(null);

export function SmoothScrollProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    const isTouchDevice =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches ?? false);

    // 1. Respect prefers-reduced-motion or native touch scrolling: bypass Lenis wheel hijacking
    if (isReducedMotion || isTouchDevice) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenisInstance(null);
      }
      return;
    }

    ScrollTrigger.config({ ignoreMobileResize: true });

    // 2. Instantiate Lenis with autoRaf: false so gsap.ticker is the single clock source
    const lenis = new Lenis({
      lerp: 0.11,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      autoRaf: false,
    });

    lenisRef.current = lenis;
    queueMicrotask(() => {
      setLenisInstance(lenis);
    });

    // 3. Synchronize Lenis scroll events with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 4. Bind Lenis RAF to GSAP's ticker (converts seconds -> milliseconds)
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
     gsap.ticker.lagSmoothing(500, 33);

    // Prevent Lenis wheel inertia from fighting native browser middle-click auto-scroll
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 && lenisRef.current) {
        lenisRef.current.scrollTo(window.scrollY, { immediate: true });
      }
    };
    window.addEventListener("mousedown", handleMouseDown, { passive: true });

    // 5. Coalesce ScrollTrigger refresh once after window load (only when not mid-scroll)
    const safeRefresh = () => {
      if (lenisRef.current && Math.abs(lenisRef.current.velocity) > 0.1) return;
      refreshScrollTrigger();
    };

    const handleWindowLoad = () => {
      safeRefresh();
    };

    if (document.readyState !== "complete") {
      window.addEventListener("load", handleWindowLoad, { once: true });
    }

    // Custom event listener for components undergoing layout changes
    const handleCustomRefresh = () => {
      refreshScrollTrigger();
    };
    window.addEventListener("hud:refresh-scroll", handleCustomRefresh);

    // 7. Strict Lifecycle Cleanup on unmount
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("load", handleWindowLoad);
      window.removeEventListener("hud:refresh-scroll", handleCustomRefresh);
      gsap.ticker.remove(updateLenis);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [isReducedMotion]);

  const stop = useCallback(() => {
    lenisRef.current?.stop();
    setIsLocked(true);
  }, []);

  const start = useCallback(() => {
    lenisRef.current?.start();
    setIsLocked(false);
  }, []);

  const scrollTo = useCallback(
    (target: string | number | HTMLElement, options?: ScrollToOptions) => {
      if (isReducedMotion || !lenisRef.current) {
        if (typeof target === "number") {
          window.scrollTo({
            top: target,
            behavior: options?.immediate ? "auto" : "smooth",
          });
        } else if (typeof target === "string") {
          const el = document.querySelector(target);
          el?.scrollIntoView({
            behavior: options?.immediate ? "auto" : "smooth",
          });
        } else {
          target.scrollIntoView({
            behavior: options?.immediate ? "auto" : "smooth",
          });
        }
        return;
      }

      lenisRef.current.scrollTo(target, {
        offset: options?.offset ?? 0,
        duration: options?.immediate ? 0 : (options?.duration ?? 1.15),
        immediate: options?.immediate ?? false,
        force: options?.force ?? false,
        easing: editorialScrollEasing,
      });
    },
    [isReducedMotion]
  );

  const value = useMemo<LenisContextValue>(
    () => ({
      lenis: lenisInstance,
      isLocked,
      isReducedMotion,
      stop,
      start,
      stopScroll: stop,
      startScroll: start,
      scrollTo,
    }),
    [lenisInstance, isLocked, isReducedMotion, stop, start, scrollTo]
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

const DEFAULT_LENIS_CONTEXT: LenisContextValue = {
  lenis: null,
  isLocked: false,
  isReducedMotion: false,
  stop: () => {},
  start: () => {},
  stopScroll: () => {},
  startScroll: () => {},
  scrollTo: (target, options) => {
    if (typeof window === "undefined") return;
    if (typeof target === "number") {
      window.scrollTo({
        top: target,
        behavior: options?.immediate ? "auto" : "smooth",
      });
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      el?.scrollIntoView({
        behavior: options?.immediate ? "auto" : "smooth",
      });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({
        behavior: options?.immediate ? "auto" : "smooth",
      });
    }
  },
};

/**
 * Primary hook for controlling Lenis smooth scrolling (start, stop, scrollTo, lenis instance).
 */
export function useLenis(): LenisContextValue {
  const context = useContext(SmoothScrollContext);
  return context ?? DEFAULT_LENIS_CONTEXT;
}

/**
 * Backward compatibility alias for existing components.
 */
export const useSmoothScroll = useLenis;
