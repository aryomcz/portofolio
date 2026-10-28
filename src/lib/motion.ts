import type { Transition } from "motion/react";

/**
 * MOTION_SPEC.md — Core Motion Tokens
 * Centralized timing tokens, custom cubic-bezier curves, spring physics,
 * spatial translation steps, and stagger configurations.
 * 
 * Rule 1: Zero linear easing for UI interactions.
 * Rule 2: Precision spring physics and custom cubic-bezier only.
 * Rule 3: ease: "none" strictly reserved for ScrollTrigger scrub animations.
 */

// 1. Timing Tokens (in seconds)
export const MOTION_TIMINGS = {
  instant: 0.12,   // 120ms: press feedback, hover state, tab indicator
  snappy: 0.2,     // 200ms: tooltip, dropdown, quick badges, bracket expansion
  standard: 0.35,  // 350ms: scramble text, panel reveal, modal dialog
  deliberate: 0.6, // 600ms: card scroll reveal, section transition
  cinematic: 0.95, // 950ms: hero headline kinetic mask, topographic line draw
} as const;

// 2. Cubic-Bezier Curves & Easing Equivalents
export const MOTION_EASINGS = {
  // Strong Ease-Out: Immediate response, gentle settle (UI default)
  easeOutStrong: [0.23, 1, 0.32, 1] as const,
  // Cinematic Expo-Out: High momentum for large elements
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  // Smooth Ease-In-Out: For elements moving on-screen
  easeInOutStrong: [0.77, 0, 0.175, 1] as const,
  // GSAP String Equivalents
  gsapEaseOut: "power3.out",
  gsapEaseExpo: "expo.out",
  gsapScrub: "none", // Mandatory for scrubbed ScrollTrigger to match Lenis inertia
} as const;

// 3. Emil Kowalski Spring Configurations (stiffness, damping, mass)
export const SPRING_PHYSICS = {
  // Buttons, active press, badges, arrow drift: stiff, highly damped, zero wobble
  snappy: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 },
  // Layout shift, active tab pill (layoutId): fluid, follows movement without lag
  layout: { type: "spring" as const, stiffness: 350, damping: 28, mass: 0.9 },
  // Modal dialog, dynamic drawer: smooth, calm settling
  modal: { type: "spring" as const, stiffness: 220, damping: 24, mass: 0.95 },
} as const;

// 4. Motion (Framer Motion) Transition Tokens
export const SPRING_SNAPPY: Transition = SPRING_PHYSICS.snappy;
export const SPRING_LAYOUT: Transition = SPRING_PHYSICS.layout;
export const SPRING_MODAL: Transition = SPRING_PHYSICS.modal;

export const EASE_OUT_STRONG: Transition = {
  duration: MOTION_TIMINGS.standard,
  ease: [0.23, 1, 0.32, 1],
};

export const EASE_OUT_EXPO: Transition = {
  duration: MOTION_TIMINGS.deliberate,
  ease: [0.16, 1, 0.3, 1],
};

export const EASE_REDUCED: Transition = {
  duration: 0.01,
  ease: [0.16, 1, 0.3, 1],
};

// 5. Spatial Translation Tokens (in pixels)
export const SPATIAL_TOKENS = {
  micro: 2,       // 2-4px: arrow drift, bracket hover offset
  standard: 10,   // 8-12px: tab switch, dropdown glide
  section: 24,    // 20-28px: card scroll reveal (never > 36px)
  mask: "100%",   // Kinetic mask text reveal
} as const;

// 6. Stagger Tokens (in seconds)
export const STAGGER_TOKENS = {
  fast: 0.04,     // 40ms: dense lists, pills
  standard: 0.06, // 60ms: card columns, grid items
  maxTotal: 0.32, // 320ms cap: user interaction is never blocked
} as const;

// 7. Lenis Precision Exponential Out Easing
export const editorialScrollEasing = (t: number): number =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));
