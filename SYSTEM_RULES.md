# System & Engineering Rules (`SYSTEM_RULES.md`)
## Mandatory Guardrails for Aryo Ristiawan Machfudz Portfolio

This document defines the non-negotiable architectural, animation, accessibility, and code-quality standards for this repository. Every component, hook, and stylesheet **must** comply with these rules before any task is marked complete.

---

## Rule 1: Zero Linear Easing — Precision Spring Physics & Cubic-Bezier Only
1. **Strict Prohibition of `linear` Easing**:
   - Using `ease: "linear"`, `transition-timing-function: linear`, or `transition-all duration-300` without an explicit custom curve is **strictly forbidden** across all UI state transitions, hover states, modals, and layout shifts.
2. **Mandatory Motion Standards (Emil Kowalski Style)**:
   - **Interactive Micro-Interactions (Buttons, Cards, Badges, Icon Morphs)**: Must use tactile spring physics from `src/lib/motion-tokens.ts`:
     - `SPRING_SNAPPY`: `{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }`
     - Active press states must compress subtly (`scale: 0.98`) and release via spring physics.
   - **Shared Layout Transitions (`layoutId` Pill Indicators, Filter Tabs, Dynamic Drawer/Modal)**:
     - `SPRING_LAYOUT`: `{ type: "spring", stiffness: 380, damping: 32, mass: 1 }`
   - **CSS & Scroll-Triggered Reveals**:
     - CSS transitions must use precision cubic-bezier curves:
       - Expo Out: `cubic-bezier(0.16, 1, 0.3, 1)`
       - Quint Out: `cubic-bezier(0.22, 1, 0.36, 1)`
     - GSAP animations must use `"expo.out"`, `"power3.out"`, or `"power4.out"`.
3. **Interruptibility**:
   - All UI animations (such as opening/closing the Case Study Quick Modal, switching GitHub contribution years, or toggling Dark/Light mode) must be interruptible mid-flight without visual snapping.

---

## Rule 2: Deterministic GSAP & Lenis Lifecycle Management (Zero Memory Leaks)
1. **Mandatory `gsap.context()` / `useGSAP()` Wrapping**:
   - Every GSAP tween, timeline, or `ScrollTrigger` created inside a React component **must** be scoped inside `gsap.context(() => { ... }, containerRef)` (or `@gsap/react`'s `useGSAP` hook).
   - Every `useEffect` that initializes a `gsap.context()` **must** return `() => ctx.revert()` in its cleanup function so all inline styles, event listeners, and `ScrollTrigger` instances are completely destroyed on unmount or route navigation (`/` <-> `/projects/[slug]`).
2. **Single RAF Loop for Lenis + GSAP**:
   - Lenis must be instantiated with `autoRaf: false` inside `SmoothScrollProvider` (`src/hooks/useSmoothScroll.ts`) and driven exclusively by `gsap.ticker.add((time) => lenis.raf(time * 1000))` with `gsap.ticker.lagSmoothing(0)`.
   - Never run a separate `requestAnimationFrame` loop alongside `gsap.ticker`.
3. **Strict DOM Node Separation Between GSAP and Motion**:
   - Never attach a GSAP `ScrollTrigger` transform to the exact same DOM element that has a `motion.*` `layout` or `layoutId` prop. Wrap the GSAP-animated container around an inner `motion.div` to prevent transform matrix conflicts.
4. **Modal & Overlay Scroll Locking**:
   - Whenever a modal (`CaseStudyQuickModal`, `CommandMenu`) opens, `stopScroll()` from `useSmoothScroll()` must be invoked immediately (`lenis.stop()`), and `startScroll()` (`lenis.start()`) must be invoked in the cleanup/close handler.

---

## Rule 3: Mandatory `prefers-reduced-motion` & Accessibility Compliance
1. **OS/Browser Reduced Motion Respect**:
   - Every custom animation hook and scroll effect must check `useReducedMotion()` (`(prefers-reduced-motion: reduce)`).
   - When `isReducedMotion === true`:
     - **Lenis smooth scroll hijacking is disabled**; the browser uses native scrolling.
     - **GSAP ScrollTrigger scrub & parallax animations are bypassed**; all elements render immediately at `opacity: 1` and `transform: none`.
     - **Motion transitions** fall back to `EASE_REDUCED` (`duration: 0.01s`) with zero spatial translation (`y: 0`, `scale: 1`).
2. **Global CSS Reduced-Motion Safety Net (`src/app/globals.css`)**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
3. **WCAG 2.1 AA & Keyboard First**:
   - All text and interactive elements must maintain `>= 4.5:1` contrast ratio in both Dark Mode (`#0C0C0C`) and Light Mode (`#F7F6F2`).
   - All interactive controls must display a visible `:focus-visible` outline (`2px solid var(--accent-primary)`) and support full keyboard operation (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
   - All numeric counters, Quick Stats (`3.83 GPA`, `150+ Teams`, `< 2s`), GitHub commit counts, and the live Bogor clock (`UTC+7`) must apply `font-variant-numeric: tabular-nums` to guarantee `0.00` Cumulative Layout Shift (CLS).

---

## Rule 4: Clean Code, Data Separation, Zero TypeScript Errors & Mobile-First Design
1. **Strict Separation of Data and UI (`src/data/portfolio.ts`)**:
   - **No Hardcoded Content in JSX**: All project descriptions (`POS Livingroom`, `TIGO`, `CMS PT BKS`, `Driver App PT KJHMS`), achievement details (`1st Winner Prisma Fest 2025 — Lumind`), capability matrix items, and timeline entries (`GDGoC IPB`, `IT Festival 2025`, `IPB RPL`, `Matra Hillindo`) must be imported from `src/data/portfolio.ts`.
   - **Content Exclusion Rule**: Organizational experience must **strictly exclude Karang Taruna**, focusing exclusively on technical, competition governance, industry, and academic milestones.
2. **TypeScript Strictness (`0` Errors)**:
   - `strict: true` in `tsconfig.json` is mandatory.
   - `any` and `@ts-ignore` / `@ts-expect-error` are forbidden. All component props, hook return values, and Next.js 16 route parameters (`params: Promise<{ slug: string }>`) must be explicitly typed.
3. **Semantic CSS Variables Only (Zero Raw Hex in JSX)**:
   - Components must reference semantic Tailwind tokens (`bg-bg-primary`, `bg-bg-elevated`, `text-text-primary`, `text-text-secondary`, `border-border-subtle`, `text-accent-primary`, `text-accent-emerald`) mapped to CSS variables in `src/app/globals.css`.
   - Never hardcode hex values (`#0C0C0C`, `#FF4F00`) or "AI Slop" neon purple/blue glow classes inside JSX classNames.
4. **Mobile-First Responsive Architecture**:
   - All layouts must be authored **mobile-first** (base classes target `320px–639px` viewports, scaling progressively via `sm:`, `md:`, `lg:`, and `xl:` breakpoints).
   - Touch targets on mobile must be at least `44px × 44px`.
   - Complex grids (12-column Swiss editorial grid, 52-week GitHub contribution heatmap, 4-domain capability matrix, and 2-column `/projects/[slug]` layout) must stack or scroll horizontally with clean ergonomics on narrow viewports without causing horizontal page overflow (`overflow-x: hidden` / `overflow-x: clip` on root).
