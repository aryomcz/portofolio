"use client";

import { memo, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { subscribeScrollCamera } from "@/hooks/useScrollCamera";
import { computeMarqueeKinematics } from "@/lib/scrollNavigation";
import { BrandTechIcon } from "@/components/ui/BrandTechIcon";
import { PORTFOLIO_DATA } from "@/data/portfolio";

const ALL_SKILLS = PORTFOLIO_DATA.capabilityDomains.flatMap((d) => d.skills);
const MARQUEE_ITEMS = [...ALL_SKILLS, ...ALL_SKILLS];

/**
 * Velocity-Reactive Tech Stack Marquee:
 * Speed and tilt/skew angle dynamically respond to Lenis scroll velocity.
 */
export const VelocityTechMarquee = memo(function VelocityTechMarquee() {
  const isReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const speedDisplayRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (isReducedMotion || !trackRef.current || !wrapperRef.current) return;

    const container = containerRef.current;
    const track = trackRef.current;
    const wrapper = wrapperRef.current;

    let isVisible = false;
    const observer =
      container && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              isVisible = entry?.isIntersecting ?? false;
            },
            { rootMargin: "150px 0px" }
          )
        : null;
    if (observer && container) {
      observer.observe(container);
    }

    let xPercent = 0;
    let direction = -1;
    let velocityMultiplier = 1;

    const skewTo = gsap.quickTo(wrapper, "skewX", {
      duration: 0.35,
      ease: "power3.out",
    });
    const rotTo = gsap.quickTo(wrapper, "rotation", {
      duration: 0.45,
      ease: "power3.out",
    });

    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeScrollCamera((state) => {
      if (!isVisible) return;

      const { speedMultiplier, skewDeg } = computeMarqueeKinematics(
        state.velocity
      );
      velocityMultiplier = speedMultiplier;
      direction = state.direction >= 0 ? -1 : 1;

      skewTo(skewDeg);
      rotTo(skewDeg * 0.14);

      if (speedDisplayRef.current) {
        speedDisplayRef.current.textContent = `${speedMultiplier.toFixed(1)}x`;
      }

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        velocityMultiplier = 1;
        skewTo(0);
        rotTo(0);
        if (speedDisplayRef.current) {
          speedDisplayRef.current.textContent = "1.0x";
        }
      }, 150);
    });

    const tick = (_time: number, deltaTime: number) => {
      if (!isVisible) return;
      const dt = Math.min(deltaTime, 50) * 0.001;
      const baseSpeed = 4.2; // percent per second
      xPercent += direction * baseSpeed * velocityMultiplier * dt;

      if (xPercent <= -50) xPercent += 50;
      if (xPercent > 0) xPercent -= 50;

      gsap.set(track, { xPercent });
    };

    gsap.ticker.add(tick);

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      observer?.disconnect();
      gsap.ticker.remove(tick);
      unsubscribe();
    };
  }, [isReducedMotion]);

  return (
    <div
      ref={containerRef}
      data-testid="velocity-tech-marquee"
      className="relative my-8 overflow-hidden border-y border-border-subtle bg-bg-elevated/75 py-3.5"
    >
      {/* Top & Right Telemetry Micro Header */}
      <div className="mx-auto mb-2 flex max-w-7xl items-center justify-between px-4 font-mono text-[10px] tracking-widest text-text-muted uppercase sm:px-6 lg:px-8">
        <span>TECH STACK STREAM // VELOCITY-SYNCHRONIZED</span>
        <span className="tabular-nums text-accent-primary">
          VEL: <strong ref={speedDisplayRef}>1.0x</strong>
        </span>
      </div>

      {/* Tilting & Accelerating Marquee Strip */}
      <div ref={wrapperRef} className="will-change-transform">
        <div
          ref={trackRef}
          className="flex w-max items-center gap-3 px-4 will-change-transform"
        >
          {MARQUEE_ITEMS.map((skill, idx) => (
            <div
              key={`${skill.name}-${idx}`}
              className="inline-flex shrink-0 items-center gap-2.5 border border-border-subtle bg-bg-primary/90 px-4 py-2 font-mono text-xs text-text-primary"
            >
              <BrandTechIcon
                name={skill.name}
                className="h-4 w-4 text-accent-primary"
              />
              <span className="font-semibold tracking-wide">{skill.name}</span>
              <span className="text-[10px] text-text-muted">
                [{skill.relatedProjectSlugs.length}]
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
