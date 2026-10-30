"use client";

import React, { useEffect, useRef } from "react";
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
  readonly blockColor?: string;
  readonly themeColor?: ProjectThemeId | string;
  readonly color?: string;
  readonly delay?: number;
  readonly duration?: number;
  readonly as?: "span" | "div" | "h1" | "h2" | "h3" | "h4" | "p";
}

interface BlockVisuals {
  className?: string;
  style?: React.CSSProperties;
}

function resolveBlockVisuals(
  themeColor?: ProjectThemeId | string,
  color?: string,
  blockColor?: string
): BlockVisuals {
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

  return {
    className: "bg-accent-primary shadow-[0_0_16px_var(--accent-primary)]",
  };
}

// Shared singleton IntersectionObserver across all KineticBlockReveal instances
// Eliminates ~60 separate IntersectionObservers and ~180 Framer Motion fibers
let sharedObserver: IntersectionObserver | null = null;

function getSharedRevealObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.dataset.revealed = "true";
            sharedObserver?.unobserve(target);
          }
        }
      },
      { threshold: 0.1 }
    );
  }
  return sharedObserver;
}

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
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isReducedMotion) return;
    const el = rootRef.current;
    if (!el) return;

    const observer = getSharedRevealObserver();
    if (!observer) {
      el.dataset.revealed = "true";
      return;
    }

    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
  }, [isReducedMotion]);

  const Tag = as as React.ElementType;

  if (isReducedMotion) {
    return (
      <Tag className={cn("inline-block", className, textClassName)}>
        {children}
      </Tag>
    );
  }

  const blockVisuals = resolveBlockVisuals(themeColor, color, blockColor);
  const textDelay = +(delay + duration * 0.36).toFixed(3);

  return (
    <Tag
      ref={rootRef}
      style={
        {
          "--kb-delay": `${delay}s`,
          "--kb-duration": `${duration}s`,
          "--kb-text-delay": `${textDelay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "kinetic-reveal-root relative inline-block overflow-hidden align-top",
        className
      )}
    >
      <span className={cn("kinetic-reveal-text inline-block", textClassName)}>
        {children}
      </span>
      <span
        aria-hidden="true"
        style={blockVisuals.style}
        className={cn(
          "kinetic-reveal-curtain pointer-events-none absolute inset-0 z-20 will-change-transform",
          blockVisuals.className
        )}
      />
    </Tag>
  );
}
