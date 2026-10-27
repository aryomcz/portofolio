"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING_SNAPPY, EASE_REDUCED } from "@/lib/motion-tokens";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface CopyEmailButtonProps {
  readonly email: string;
  readonly className?: string;
  readonly variant?: "compact" | "pill";
}

/**
 * Emil Kowalski-style tactile clipboard button.
 * Combines scale(0.97) press compression with blur(2px -> 0px) state crossfade.
 */
export function CopyEmailButton({
  email,
  className,
  variant = "compact",
}: CopyEmailButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const timeoutRef = useRef<number | null>(null);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }, [email]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy email address ${email}`}
      className={cn(
        "press-scale group relative inline-flex items-center gap-2.5 border border-border-subtle bg-bg-elevated font-mono text-xs text-text-secondary hover:border-border-strong hover:text-text-primary",
        variant === "pill" ? "px-4 py-3 text-sm" : "px-3.5 py-2.5",
        className
      )}
    >
      <span className="sr-only" aria-live="polite">
        {copied ? `Copied ${email} to clipboard` : ""}
      </span>

      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied-icon"
            initial={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, filter: "blur(2px)" }
            }
            animate={
              isReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }
            }
            exit={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, filter: "blur(2px)" }
            }
            transition={isReducedMotion ? EASE_REDUCED : SPRING_SNAPPY}
            className="flex items-center justify-center text-accent-emerald"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="copy-icon"
            initial={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, filter: "blur(2px)" }
            }
            animate={
              isReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }
            }
            exit={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, filter: "blur(2px)" }
            }
            transition={isReducedMotion ? EASE_REDUCED : SPRING_SNAPPY}
            className="flex items-center justify-center text-text-muted group-hover:text-accent-primary"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied-label"
            initial={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: "blur(2px)" }
            }
            animate={
              isReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, filter: "blur(0px)" }
            }
            exit={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: "blur(2px)" }
            }
            transition={isReducedMotion ? EASE_REDUCED : SPRING_SNAPPY}
            className="text-accent-emerald"
          >
            Copied {email}
          </motion.span>
        ) : (
          <motion.span
            key="default-label"
            initial={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: "blur(2px)" }
            }
            animate={
              isReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, filter: "blur(0px)" }
            }
            exit={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: "blur(2px)" }
            }
            transition={isReducedMotion ? EASE_REDUCED : SPRING_SNAPPY}
          >
            {email}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
