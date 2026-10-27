import type { Transition } from "motion/react";

/**
 * Emil Kowalski-inspired tactile spring configurations & precision cubic-bezier tokens.
 * Rule 1 (SYSTEM_RULES.md): Linear easing ("linear") is strictly prohibited across all UI state transitions.
 */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const SPRING_LAYOUT: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 1,
};

export const SPRING_MODAL: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 30,
  mass: 0.9,
};

export const EASE_OUT_STRONG: Transition = {
  duration: 0.24,
  ease: [0.23, 1, 0.32, 1],
};

export const EASE_OUT_EXPO: Transition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
};

export const EASE_REDUCED: Transition = {
  duration: 0.01,
  ease: [0.16, 1, 0.3, 1],
};
