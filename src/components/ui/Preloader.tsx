"use client";

import { useEffect, useState, useRef } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { gsap } from "@/lib/gsap";

const PRELOADER_SESSION_KEY = "aryo_hud_preloader_seen";
const FALLBACK_TIMEOUT_MS = 750;

export function Preloader() {
  const { stop, start, scrollTo } = useLenis();
  const isReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const finishedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topPanelRef = useRef<HTMLDivElement | null>(null);
  const bottomPanelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Client-only mount synchronization to eliminate React Hydration Warning
    queueMicrotask(() => {
      setMounted(true);
    });

    const finishPreloader = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      setIsActive(false);
      start();

      try {
        window.sessionStorage.setItem(PRELOADER_SESSION_KEY, "true");
      } catch {
        // Fallback for private browsing environments where sessionStorage may fail
      }

      // Point 5: Direct hash landing after preloader completes and Lenis starts
      if (window.location.hash) {
        scrollTo(window.location.hash, { offset: -88, immediate: true });
      }

      // Notify HeroSection and Template that hero entrance and hash landing can proceed
      window.dispatchEvent(new CustomEvent("hud:preloader-complete"));
    };

    // 1. Only show blocking full-screen preloader when explicitly requested (?preloader=1)
    // so initial page visits and PageSpeed Insights / Lighthouse audits have zero LCP element render delay.
    const forcePreloader =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preloader") === "1";
    if (isReducedMotion || !forcePreloader) {
      finishPreloader();
      return;
    }

    // 2. Check if already displayed in current browser session
    let hasSeen = false;
    try {
      hasSeen = window.sessionStorage.getItem(PRELOADER_SESSION_KEY) === "true";
    } catch {
      hasSeen = false;
    }

    if (hasSeen) {
      finishPreloader();
      return;
    }

    // 3. Mark active and stop smooth scrolling during preloader playback
    queueMicrotask(() => {
      setIsActive(true);
    });
    stop();

    // 4. Deterministic safety fallback: forcibly open after 1.3s if animation stalls
    const fallbackTimer = setTimeout(() => {
      finishPreloader();
    }, FALLBACK_TIMEOUT_MS);

    const progressObj = { value: 0 };

    // Total duration: 0.55s (counter) + 0.05s (dwell) + 0.45s (shutter) = 1.05s (<= 1.2s requirement)
    const tl = gsap.timeline({
      onComplete: () => {
        // Dual shutter panels open animation
        const openTl = gsap.timeline({
          onComplete: () => {
            clearTimeout(fallbackTimer);
            finishPreloader();
          },
        });

        // Telemetry stage content fade & scale down
        openTl.to(contentRef.current, {
          opacity: 0,
          scale: 0.96,
          duration: 0.2,
          ease: "power2.in",
        });

        // Top aperture shutter slide up
        openTl.to(
          topPanelRef.current,
          {
            yPercent: -100,
            duration: 0.45,
            ease: "power3.inOut",
          },
          "-=0.08"
        );

        // Bottom aperture shutter slide down
        openTl.to(
          bottomPanelRef.current,
          {
            yPercent: 100,
            duration: 0.45,
            ease: "power3.inOut",
          },
          "<"
        );
      },
    });

    // Snappy tabular counter 0 -> 100 in 0.55s
    tl.to(progressObj, {
      value: 100,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: () => {
        setProgress(Math.round(progressObj.value));
      },
    });

    return () => {
      clearTimeout(fallbackTimer);
      tl.kill();
    };
  }, [isReducedMotion, stop, start, scrollTo]);

  // Prevent any SSR/Client hydration mismatch
  if (!mounted || !isActive) return null;

  return (
    <div
      ref={containerRef}
      role="progressbar"
      aria-label="System Initializing"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Dual Shutter Curtain Panels with Accent Highlight Trims */}
      <div
        ref={topPanelRef}
        className="absolute top-0 right-0 left-0 h-1/2 bg-[#060A12] border-b border-accent-primary/20 will-change-transform"
      />

      {/* Bottom Shutter Curtain Panel */}
      <div
        ref={bottomPanelRef}
        className="absolute right-0 bottom-0 left-0 h-1/2 bg-[#060A12] border-t border-accent-primary/20 will-change-transform"
      />

      {/* Centered Technical Telemetry Stage */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-6 text-center select-none"
      >
        {/* Top Header Tag */}
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-accent-primary">
          <span className="h-1.5 w-1.5 animate-pulse bg-accent-primary" />
          <span>SYS.BOOT // INITIALIZING HUD ARCHITECTURE</span>
        </div>

        {/* Tabular Percentage Counter */}
        <div className="tabular-nums mt-4 font-display text-7xl tracking-wide text-[#F3F5F8] sm:text-8xl">
          {String(progress).padStart(2, "0")}
          <span className="text-3xl text-accent-primary sm:text-4xl">%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="mt-5 h-1 w-full max-w-[280px] overflow-hidden rounded-full bg-[#172236]">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-accent-primary transition-all duration-75 ease-out"
          />
        </div>

        {/* Revealed Identity Tag once 40% reached */}
        <div
          className={`mt-6 space-y-1 transition-opacity duration-300 ${
            progress > 45 ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono text-xs font-semibold tracking-wider text-[#F3F5F8]">
            ARYO RISTIAWAN MACHFUDZ
          </p>
          <p className="font-mono text-[10px] tracking-widest text-[#64748B] uppercase">
            FULL-STACK DEVELOPER &amp; SYSTEM ANALYST
          </p>
        </div>

        {/* Corner HUD Ticks */}
        <div className="pointer-events-none absolute -top-8 -left-4 h-3 w-3 border-t-2 border-l-2 border-accent-primary/60" />
        <div className="pointer-events-none absolute -top-8 -right-4 h-3 w-3 border-t-2 border-r-2 border-accent-primary/60" />
        <div className="pointer-events-none absolute -bottom-8 -left-4 h-3 w-3 border-b-2 border-l-2 border-accent-primary/60" />
        <div className="pointer-events-none absolute -bottom-8 -right-4 h-3 w-3 border-r-2 border-b-2 border-accent-primary/60" />
      </div>
    </div>
  );
}
