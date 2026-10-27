"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING_SNAPPY, EASE_REDUCED } from "@/lib/motion-tokens";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const THEME_CHANGE_EVENT = "portfolio-theme-change";

function subscribeTheme(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getThemeSnapshot(): "dark" | "light" {
  if (typeof document === "undefined") {
    return "light";
  }
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

function getThemeServerSnapshot(): "dark" | "light" {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );
  const isReducedMotion = useReducedMotion();

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      window.localStorage.setItem("theme", nextTheme);
    } catch {
      // Ignore storage errors in restricted environments
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="press-scale relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle/80 bg-bg-primary/60 text-text-secondary hover:border-border-strong hover:text-text-primary"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.span
            key="sun"
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
            className="flex items-center justify-center"
          >
            <Sun className="h-3.5 w-3.5 text-accent-primary" aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
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
            className="flex items-center justify-center"
          >
            <Moon className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
