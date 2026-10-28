"use client";

import React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ProjectThemeId } from "@/data/portfolio";
import { cn } from "@/lib/utils";

/**
 * Palette mapping for project themes & vibrant kinetic highlighter shades.
 */
export const THEME_COLOR_MAP: Record<string, string> = {
  orange: "#f97316",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  red: "#ef4444",
  fuchsia: "#8b5cf6",
  teal: "#0e7c86",
  emerald: "#10b981",
};

export interface KineticBlockRevealProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly textClassName?: string;
  /**
   * Tailwind class for block curtain (e.g. "bg-accent-primary", "bg-[#0e7c86]").
   * Backwards-compatible with existing usages.
   */
  readonly blockColor?: string;
  /**
   * ProjectThemeId or theme name (e.g. "orange", "blue", "sky", "red", "fuchsia", "teal").
   * Automatically resolves to the project's signature color.
   */
  readonly themeColor?: ProjectThemeId | string;
  /**
   * Direct color code (hex "#f97316", "rgb(...)", CSS var "var(--accent-primary)", or theme ID).
   */
  readonly color?: string;
  readonly delay?: number;
  readonly duration?: number;
  readonly as?: "span" | "div" | "h1" | "h2" | "h3" | "h4" | "p";
}

interface BlockVisuals {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Resolves color styling with priority:
 * 1. themeColor prop (e.g. "orange", "blue", etc. or custom hex)
 * 2. color prop (hex, rgb, theme name, or CSS var)
 * 3. blockColor prop (Tailwind class or hex)
 * 4. Default fallback: "bg-accent-primary", which natively inherits
 *    var(--accent-primary) from any ancestor with data-project-theme!
 */
function resolveBlockVisuals(
  themeColor?: ProjectThemeId | string,
  color?: string,
  blockColor?: string
): BlockVisuals {
  // 1. Check themeColor
  if (themeColor) {
    const hex =
      THEME_COLOR_MAP[themeColor] ||
      (themeColor.startsWith("#") ? themeColor : undefined);
    if (hex) {
      return {
        style: {
          backgroundColor: hex,
          boxShadow:
            hex.startsWith("#") && hex.length === 7
              ? `0 0 18px ${hex}66`
              : `0 0 16px rgba(14,124,134,0.35)`,
        },
      };
    }
  }

  // 2. Check direct color
  if (color) {
    const hex =
      THEME_COLOR_MAP[color] || (color.startsWith("#") ? color : undefined);
    if (hex) {
      return {
        style: {
          backgroundColor: hex,
          boxShadow:
            hex.startsWith("#") && hex.length === 7
              ? `0 0 18px ${hex}66`
              : undefined,
        },
      };
    }
    if (
      color.startsWith("rgb") ||
      color.startsWith("hsl") ||
      color.startsWith("var(")
    ) {
      return {
        style: {
          backgroundColor: color,
        },
      };
    }
    if (color.startsWith("bg-")) {
      return { className: color };
    }
  }

  // 3. Check blockColor (legacy class or value)
  if (blockColor) {
    if (blockColor in THEME_COLOR_MAP) {
      const hex = THEME_COLOR_MAP[blockColor];
      return {
        style: {
          backgroundColor: hex,
          boxShadow: `0 0 18px ${hex}66`,
        },
      };
    }
    if (blockColor.startsWith("#")) {
      return {
        style: {
          backgroundColor: blockColor,
          boxShadow:
            blockColor.length === 7 ? `0 0 18px ${blockColor}66` : undefined,
        },
      };
    }
    return {
      className: blockColor,
    };
  }

  // 4. Default: Use dynamic CSS accent-primary
  // When inside a container with [data-project-theme], this automatically
  // reflects the project's exact theme color (orange, blue, sky, red, fuchsia).
  return {
    className: "bg-accent-primary shadow-[0_0_16px_var(--accent-primary)]",
  };
}

/**
 * KineticBlockReveal
 * Recreates the signature Lando Norris text highlighter block reveal animation.
 * A high-energy neon/theme block sweeps across the text line from left to right,
 * then smoothly collapses to the right, revealing typography underneath.
 *
 * Supports dynamic themeColor / color styling matching each individual project.
 */
export function KineticBlockReveal({
  children,
  className,
  textClassName,
  blockColor,
  themeColor,
  color,
  delay = 0,
  duration = 0.65,
  as = "span",
}: KineticBlockRevealProps) {
  const isReducedMotion = useReducedMotion();

  if (isReducedMotion) {
    const Tag = as;
    return (
      <Tag className={cn("inline-block", className, textClassName)}>
        {children}
      </Tag>
    );
  }

  const Component = motion[as] as typeof motion.span;
  const blockVisuals = resolveBlockVisuals(themeColor, color, blockColor);

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
        style={blockVisuals.style}
        className={cn(
          "pointer-events-none absolute inset-0 z-20 will-change-transform",
          blockVisuals.className
        )}
      />
    </Component>
  );
}
