"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface PageTransitionContextValue {
  readonly isNavigating: boolean;
  readonly navigate: (href: string, label?: string) => Promise<void>;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  isNavigating: false,
  navigate: async () => {},
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

const TRANSIT_FALLBACK_TIMEOUT = 1800;

export function PageTransitionProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { stop, start, scrollTo } = useLenis();
  const isReducedMotion = useReducedMotion();

  const [isNavigating, setIsNavigating] = useState(false);
  const [hudLabel, setHudLabel] = useState<string>("INITIALIZING ROUTE");

  const topPanelRef = useRef<HTMLDivElement | null>(null);
  const bottomPanelRef = useRef<HTMLDivElement | null>(null);
  const centerHudRef = useRef<HTMLDivElement | null>(null);
  const isTransitioningRef = useRef(false);
  const pendingTargetRef = useRef<{ href: string; hash?: string } | null>(null);
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize shutter panels off-screen
  useEffect(() => {
    if (topPanelRef.current && bottomPanelRef.current && centerHudRef.current) {
      gsap.set(topPanelRef.current, { yPercent: -100 });
      gsap.set(bottomPanelRef.current, { yPercent: 100 });
      gsap.set(centerHudRef.current, { autoAlpha: 0 });
    }
  }, []);

  // Forcibly clear and unlock transitions (safety net against stuck overlays)
  const forceUnlock = useCallback(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }

    isTransitioningRef.current = false;
    pendingTargetRef.current = null;
    setIsNavigating(false);
    start();

    if (topPanelRef.current && bottomPanelRef.current && centerHudRef.current) {
      gsap.to([topPanelRef.current, bottomPanelRef.current], {
        yPercent: (index) => (index === 0 ? -100 : 100),
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(centerHudRef.current, {
        autoAlpha: 0,
        duration: 0.15,
        overwrite: "auto",
      });
    }
  }, [start]);

  // Requirement 4: Handle browser back/forward buttons seamlessly without getting trapped
  useEffect(() => {
    const handlePopState = () => {
      forceUnlock();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [forceUnlock]);

  // Execute opening aperture transition when route commitment finishes
  const openTransition = useCallback(
    (targetHash?: string) => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }

      // Requirement 3: Reset scroll or jump to target hash
      if (targetHash) {
        scrollTo(targetHash, { offset: -88, immediate: true, force: true });
      } else {
        scrollTo(0, { immediate: true, force: true });
      }

      if (isReducedMotion) {
        forceUnlock();
        return;
      }

      const openTl = gsap.timeline({
        onComplete: () => {
          isTransitioningRef.current = false;
          setIsNavigating(false);
          start();
          // Notify components that new page is ready
          window.dispatchEvent(new CustomEvent("hud:route-transition-complete"));
        },
      });

      // Fade out telemetry center text
      openTl.to(centerHudRef.current, {
        autoAlpha: 0,
        duration: 0.15,
        ease: "power2.out",
      });

      // Shutter aperture panels slide outward
      openTl.to(
        topPanelRef.current,
        {
          yPercent: -100,
          duration: 0.35,
          ease: "power3.out",
        },
        "-=0.05"
      );

      openTl.to(
        bottomPanelRef.current,
        {
          yPercent: 100,
          duration: 0.35,
          ease: "power3.out",
        },
        "<"
      );
    },
    [isReducedMotion, forceUnlock, scrollTo, start]
  );

  // Monitor pathname changes to trigger the opening shutter sequence
  useEffect(() => {
    if (isTransitioningRef.current) {
      const targetHash = pendingTargetRef.current?.hash;
      pendingTargetRef.current = null;
      // Slight tick for DOM hydration in the new page
      const timer = setTimeout(() => {
        openTransition(targetHash);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [pathname, openTransition]);

  // Requirement 2: Intercept navigation and orchestrate the closing shutter sequence
  const navigate = useCallback(
    async (href: string, label?: string) => {
      if (isNavigating || isTransitioningRef.current) return;

      const [targetPath, targetHash] = href.split("#");
      const normalizedPath = targetPath === "" ? "/" : targetPath;
      const isSamePath =
        normalizedPath === pathname ||
        (normalizedPath === "/" && pathname === "/");

      // Same-page anchor jump: smooth scroll directly without shutter overlay
      if (isSamePath && targetHash) {
        scrollTo(`#${targetHash}`, { offset: -88 });
        return;
      }

      if (isSamePath && !targetHash) {
        scrollTo(0);
        return;
      }

      // Requirement 7: Reduced-motion fast path (no shutter)
      if (isReducedMotion) {
        if (targetHash) {
          router.push(href);
          setTimeout(() => {
            scrollTo(`#${targetHash}`, { offset: -88, immediate: true });
          }, 60);
        } else {
          router.push(href);
          scrollTo(0, { immediate: true });
        }
        return;
      }

      // Format clean HUD destination label
      let computedLabel = label;
      if (!computedLabel) {
        if (href.startsWith("/projects/")) {
          const slug = href.replace("/projects/", "").split("#")[0].toUpperCase();
          computedLabel = `DOSSIER // ${slug}`;
        } else if (href === "/" || href.startsWith("/#")) {
          computedLabel = "ROOT // MAIN ARCHITECTURE";
        } else {
          computedLabel = "TRANSFERRING TELEMETRY";
        }
      }

      setIsNavigating(true);
      isTransitioningRef.current = true;
      pendingTargetRef.current = {
        href,
        hash: targetHash ? `#${targetHash}` : undefined,
      };
      setHudLabel(computedLabel);

      // Stop Lenis during transition
      stop();

      // Arm safety fallback timeout in case route fetching is delayed
      safetyTimeoutRef.current = setTimeout(() => {
        forceUnlock();
      }, TRANSIT_FALLBACK_TIMEOUT);

      // Shutter close timeline
      const closeTl = gsap.timeline({
        onComplete: () => {
          // Push route once screen is fully obscured by HUD panels
          router.push(href);
        },
      });

      closeTl.to(
        [topPanelRef.current, bottomPanelRef.current],
        {
          yPercent: 0,
          duration: 0.32,
          ease: "power3.inOut",
        },
        0
      );

      closeTl.to(
        centerHudRef.current,
        {
          autoAlpha: 1,
          duration: 0.22,
          ease: "power2.inOut",
        },
        "-=0.1"
      );
    },
    [isNavigating, pathname, isReducedMotion, stop, forceUnlock, router, scrollTo]
  );

  return (
    <PageTransitionContext.Provider value={{ isNavigating, navigate }}>
      {children}

      {/* Persistent Root Layout Transition Shutter Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      >
        {/* Top Shutter Curtain Panel */}
        <div
          ref={topPanelRef}
          className="absolute top-0 right-0 left-0 h-1/2 bg-[#060A12] border-b border-accent-primary/25 will-change-transform"
        />

        {/* Bottom Shutter Curtain Panel */}
        <div
          ref={bottomPanelRef}
          className="absolute right-0 bottom-0 left-0 h-1/2 bg-[#060A12] border-t border-accent-primary/25 will-change-transform"
        />

        {/* HUD Navigation Telemetry Display */}
        <div
          ref={centerHudRef}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-accent-primary">
            <span className="h-1.5 w-1.5 animate-pulse bg-accent-primary" />
            <span>SYS.TRANSIT // QUANTUM ROUTE ACCESS</span>
          </div>

          <p className="mt-3 font-mono text-xs font-semibold tracking-wider text-[#F3F5F8] sm:text-sm">
            {hudLabel}
          </p>

          <div className="mt-4 flex items-center gap-1 font-mono text-[10px] text-text-muted">
            <span>[ PROTOCOL: APERTURE SHUTTER ]</span>
            <span>·</span>
            <span className="text-accent-emerald">READY</span>
          </div>
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}
