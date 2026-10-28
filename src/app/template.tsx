"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SPRING_LAYOUT, EASE_REDUCED } from "@/lib/motion";

export default function Template({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { scrollTo } = useLenis();
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const performHashLanding = () => {
      const hash = window.location.hash;
      if (hash) {
        // Calibrated anchor offset (-88px navbar height) with immediate jump
        scrollTo(hash, { offset: -88, immediate: true });
      }
    };

    // Check if session preloader was already completed or skipped
    let hasSeenPreloader = false;
    try {
      hasSeenPreloader =
        window.sessionStorage.getItem("aryo_hud_preloader_seen") === "true";
    } catch {
      hasSeenPreloader = true;
    }

    if (hasSeenPreloader || isReducedMotion) {
      // Immediate execution for returning visits and reduced-motion environments
      const timer = setTimeout(performHashLanding, 50);
      return () => clearTimeout(timer);
    }

    // First session visit: synchronize with Preloader completion
    window.addEventListener("hud:preloader-complete", performHashLanding, {
      once: true,
    });
    return () => {
      window.removeEventListener("hud:preloader-complete", performHashLanding);
    };
  }, [scrollTo, isReducedMotion]);

  return (
    <motion.div
      initial={
        isReducedMotion
          ? { opacity: 1 }
          : { opacity: 0, y: 8 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
    >
      {children}
    </motion.div>
  );
}
