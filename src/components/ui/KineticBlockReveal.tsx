"use client";

import React, { useEffect, useRef, useState } from "react";
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
  /** Stagger step in seconds applied between lines when >1 line is detected (default: 0.12s) */
  readonly stagger?: number;
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

/**
 * Detects visual rendered lines of text inside an element by measuring word bounding rects.
 * Returns an array of line strings if > 1 line, or empty array if <= 1 line.
 */
function detectTextLines(root: HTMLElement): string[] {
  if (typeof document === "undefined" || !root) return [];

  const rawText = root.textContent?.trim();
  if (!rawText) return [];

  // Search inside .kinetic-reveal-text if present, or root
  const textContainer = root.querySelector(".kinetic-reveal-text") || root;

  const walker = document.createTreeWalker(
    textContainer,
    NodeFilter.SHOW_TEXT,
    null
  );
  const words: { word: string; top: number }[] = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    const text = currentNode.textContent || "";
    const regex = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const word = match[0];
      const range = document.createRange();
      try {
        range.setStart(currentNode, match.index);
        range.setEnd(currentNode, match.index + word.length);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          words.push({ word, top: rect.top });
        }
      } catch {
        // Fallback for detached range
      }
    }
    currentNode = walker.nextNode();
  }

  if (words.length <= 1) return [];

  const lines: string[] = [];
  let currentLineWords: string[] = [];
  let currentLineTop = words[0].top;

  for (let i = 0; i < words.length; i++) {
    const { word, top } = words[i];
    // Threshold of 6px safely accounts for sub-pixel baseline variations while detecting actual line wraps
    if (Math.abs(top - currentLineTop) > 6) {
      if (currentLineWords.length > 0) {
        lines.push(currentLineWords.join(" "));
      }
      currentLineWords = [word];
      currentLineTop = top;
    } else {
      currentLineWords.push(word);
    }
  }

  if (currentLineWords.length > 0) {
    lines.push(currentLineWords.join(" "));
  }

  return lines;
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
  stagger = 0.12,
  as = "span",
}: KineticBlockRevealProps) {
  const isReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    if (isReducedMotion) return;
    const el = rootRef.current;
    if (!el) return;

    // 1. Observe intersection for reveal trigger
    const observer = getSharedRevealObserver();
    if (!observer) {
      el.dataset.revealed = "true";
    } else {
      observer.observe(el);
    }

    // 2. Measure lines across words
    const measureLines = () => {
      const targetEl = rootRef.current;
      if (!targetEl) return;
      const detected = detectTextLines(targetEl);
      if (detected.length > 1) {
        setLines((prev) => {
          if (
            prev &&
            prev.length === detected.length &&
            prev.every((line, i) => line === detected[i])
          ) {
            return prev;
          }
          return detected;
        });
      } else {
        setLines(null);
      }
    };

    // Execute measurement after paint
    const rafId = requestAnimationFrame(measureLines);

    // Re-check after document fonts finish loading (handles font reflow)
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(measureLines);
    }

    // Debounced resize listener for responsive layout shifts
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureLines, 120);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      if (observer) {
        observer.unobserve(el);
      }
    };
  }, [isReducedMotion]);

  const isBlockChild =
    React.isValidElement(children) &&
    typeof children.type === "string" &&
    /^(h[1-6]|p|div|section|article)$/.test(children.type);

  const Tag = (as === "span" && isBlockChild ? "div" : as) as React.ElementType;

  if (isReducedMotion) {
    return (
      <Tag className={cn("inline-block", className, textClassName)}>
        {children}
      </Tag>
    );
  }

  const blockVisuals = resolveBlockVisuals(themeColor, color, blockColor);

  // Staggered multi-line rendering when > 1 line is detected
  if (lines && lines.length > 1) {
    const lineElements = lines.map((lineText, idx) => {
      const lineDelay = +(delay + idx * stagger).toFixed(3);
      const lineTextDelay = +(lineDelay + duration * 0.36).toFixed(3);

      return (
        <span
          key={`kb-line-${idx}-${lineText.slice(0, 16)}`}
          className="kinetic-reveal-line-block block"
        >
          <span
            style={
              {
                "--kb-delay": `${lineDelay}s`,
                "--kb-duration": `${duration}s`,
                "--kb-text-delay": `${lineTextDelay}s`,
              } as React.CSSProperties
            }
            className="kinetic-reveal-line-wrap relative inline-block overflow-hidden align-top"
          >
            <span
              className={cn("kinetic-reveal-text inline-block", textClassName)}
            >
              {lineText}
            </span>
            <span
              aria-hidden="true"
              style={blockVisuals.style}
              className={cn(
                "kinetic-reveal-curtain pointer-events-none absolute inset-0 z-20 will-change-transform",
                blockVisuals.className
              )}
            />
          </span>
        </span>
      );
    });

    if (React.isValidElement(children)) {
      const childElement = children as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;
      return (
        <Tag
          ref={rootRef}
          className={cn(
            "kinetic-reveal-root relative inline-block align-top max-w-full",
            className
          )}
        >
          {React.cloneElement(
            childElement,
            {
              className: cn(childElement.props.className),
            },
            lineElements
          )}
        </Tag>
      );
    }

    return (
      <Tag
        ref={rootRef}
        className={cn(
          "kinetic-reveal-root relative inline-block align-top max-w-full",
          className
        )}
      >
        {lineElements}
      </Tag>
    );
  }

  // Single-line default rendering (when lines <= 1)
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
