"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SPRING_LAYOUT, EASE_REDUCED } from "@/lib/motion-tokens";

export default function Template({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { scrollTo } = useSmoothScroll();
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    scrollTo(0, { immediate: true });
  }, [scrollTo]);

  return (
    <motion.div
      initial={
        isReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 12, filter: "blur(2px)" }
      }
      animate={
        isReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
    >
      {children}
    </motion.div>
  );
}
