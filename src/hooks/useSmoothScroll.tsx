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
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollToOptions {
  readonly offset?: number;
  readonly duration?: number;
  readonly immediate?: boolean;
}

export interface SmoothScrollContextValue {
  readonly isLocked: boolean;
  readonly isReducedMotion: boolean;
  readonly stopScroll: () => void;
  readonly startScroll: () => void;
  readonly scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

// Precision exponential out easing (Emil Kowalski / Swiss editorial feel — NEVER linear)
const editorialScrollEasing = (t: number): number =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function SmoothScrollProvider({ children }: { readonly children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    // 1. Respect prefers-reduced-motion: bypass Lenis hijacking completely
    if (isReducedMotion) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      ScrollTrigger.refresh();
      return;
    }

    // 2. Instantiate Lenis with autoRaf: false so GSAP ticker is the single clock source
    const lenis = new Lenis({
      duration: 1.15,
      easing: editorialScrollEasing,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      autoRaf: false,
    });

    lenisRef.current = lenis;

    // 3. Synchronize Lenis scroll events with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 4. Bind Lenis RAF to GSAP's ticker (converts seconds -> milliseconds)
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // 5. Refresh ScrollTrigger measurements after initialization
    ScrollTrigger.refresh();

    // 6. Strict Lifecycle Cleanup on unmount
    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isReducedMotion]);

  const stopScroll = useCallback(() => {
    lenisRef.current?.stop();
    setIsLocked(true);
  }, []);

  const startScroll = useCallback(() => {
    lenisRef.current?.start();
    setIsLocked(false);
  }, []);

  const scrollTo = useCallback(
    (target: string | number | HTMLElement, options?: ScrollToOptions) => {
      if (isReducedMotion || !lenisRef.current) {
        if (typeof target === "number") {
          window.scrollTo({ top: target, behavior: "auto" });
        } else if (typeof target === "string") {
          const el = document.querySelector(target);
          el?.scrollIntoView({ behavior: "auto" });
        } else {
          target.scrollIntoView({ behavior: "auto" });
        }
        return;
      }

      lenisRef.current.scrollTo(target, {
        offset: options?.offset ?? 0,
        duration: options?.immediate ? 0 : (options?.duration ?? 1.1),
        immediate: options?.immediate ?? false,
        easing: editorialScrollEasing,
      });
    },
    [isReducedMotion]
  );

  const value = useMemo<SmoothScrollContextValue>(
    () => ({
      isLocked,
      isReducedMotion,
      stopScroll,
      startScroll,
      scrollTo,
    }),
    [isLocked, isReducedMotion, stopScroll, startScroll, scrollTo]
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

const DEFAULT_SMOOTH_SCROLL_CONTEXT: SmoothScrollContextValue = {
  isLocked: false,
  isReducedMotion: false,
  stopScroll: () => {},
  startScroll: () => {},
  scrollTo: (target, options) => {
    if (typeof window === "undefined") return;
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: options?.immediate ? "auto" : "smooth" });
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: options?.immediate ? "auto" : "smooth" });
    }
  },
};

export function useSmoothScroll(): SmoothScrollContextValue {
  const context = useContext(SmoothScrollContext);
  return context ?? DEFAULT_SMOOTH_SCROLL_CONTEXT;
}
