"use client";

import React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface KineticBlockRevealProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly textClassName?: string;
  readonly blockColor?: string;
  readonly delay?: number;
  readonly duration?: number;
  readonly as?: "span" | "div" | "h1" | "h2" | "h3" | "h4" | "p";
}

/**
 * KineticBlockReveal
 * Recreates the signature Lando Norris text highlighter block reveal animation.
 * A high-energy neon block sweeps across the line of text from left to right,
 * then smoothly collapses to the right, revealing the typography underneath.
 */
export function KineticBlockReveal({
  children,
  className,
  textClassName,
  blockColor = "bg-[#0e7c86]",
  delay = 0,
  duration = 0.65,
  as = "span",
}: KineticBlockRevealProps) {
  const isReducedMotion = useReducedMotion();

  if (isReducedMotion) {
    const Tag = as;
    return <Tag className={cn("inline-block", className, textClassName)}>{children}</Tag>;
  }

  const Component = motion[as] as typeof motion.span;

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      className={cn("relative inline-block overflow-hidden align-top", className)}
    >
      {/* 1. Underlying typography revealed as the block clears */}
      <motion.span
        variants={{
          hidden: { opacity: 0, y: "15%" },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.35,
              delay: delay + duration * 0.42,
              ease: [0.23, 1, 0.32, 1],
            },
          },
        }}
        className={cn("inline-block", textClassName)}
      >
        {children}
      </motion.span>

      {/* 2. Precision Highlighter Block Curtain */}
      <motion.span
        aria-hidden="true"
        variants={{
          hidden: {
            scaleX: 0,
            originX: 0,
          },
          visible: {
            scaleX: [0, 1, 1, 0],
            originX: [0, 0, 1, 1],
            transition: {
              duration,
              delay,
              times: [0, 0.48, 0.52, 1],
              ease: [0.16, 1, 0.3, 1],
            },
          },
        }}
        className={cn(
          "pointer-events-none absolute inset-0 z-20 will-change-transform shadow-[0_0_16px_rgba(14,124,134,0.35)]",
          blockColor
        )}
      />
    </Component>
  );
}
