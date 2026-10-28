"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { X, ArrowUpRight, ExternalLink, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ProjectCaseStudy } from "@/data/portfolio";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SPRING_MODAL, EASE_REDUCED } from "@/lib/motion-tokens";
import { ArchitectureDiagram } from "@/components/ui/ArchitectureDiagram";

interface CaseStudyQuickModalProps {
  readonly study: ProjectCaseStudy | null;
  readonly onClose: () => void;
}

const emptySubscribe = () => () => {};

/**
 * Accessible Quick Preview Modal for Case Studies & Featured Achievements.
 * Rendered via React Portal directly to document.body with explicit 100vw x 100dvh
 * viewport coordinates so it is always dead-center in the active browser viewport
 * and never trapped by ancestor transforms or section stacking contexts.
 */
export function CaseStudyQuickModal({
  study,
  onClose,
}: CaseStudyQuickModalProps) {
  const { stopScroll, startScroll } = useSmoothScroll();
  const isReducedMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!study) return;

    stopScroll();
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Prevent browser from scrolling the document when focusing the close button
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevBodyOverflow;
      startScroll();
    };
  }, [study, stopScroll, startScroll, onClose]);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {study ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-modal-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100dvh",
            zIndex: 100,
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
        >
          {/* Full-Viewport Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={isReducedMotion ? EASE_REDUCED : { duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100dvh",
            }}
            className="fixed inset-0 bg-[#0A1120]/75 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Centered Modal Dialog Surface */}
          <motion.div
            initial={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 10 }
            }
            animate={
              isReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              isReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8 }
            }
            transition={isReducedMotion ? EASE_REDUCED : SPRING_MODAL}
            data-project-theme={study.themeColor}
            style={{ maxHeight: "84dvh" }}
            className="relative z-10 my-auto flex w-full max-w-4xl flex-col overflow-hidden border border-accent-primary/60 bg-bg-primary text-text-primary shadow-2xl"
          >
            {/* Sticky Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-accent-primary/35 bg-bg-elevated px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden="true" />
                <span className="font-semibold text-accent-primary">
                  {`${study.index} // QUICK ARCHITECTURAL PREVIEW`}
                </span>
                <span className="hidden text-text-muted sm:inline">·</span>
                <span className="hidden text-text-secondary sm:inline">
                  {study.clientOrContext}
                </span>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close quick preview modal"
                className="press-scale inline-flex h-8 w-8 items-center justify-center border border-border-subtle bg-bg-primary text-text-secondary hover:border-border-strong hover:text-text-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div
              className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7 space-y-6"
            >
              <div>
                <p className="font-mono text-xs text-accent-emerald">
                  {study.heroMetricPill}
                </p>
                <h2
                  id="quick-modal-title"
                  className="mt-1.5 font-display text-3xl tracking-wide text-text-primary sm:text-4xl"
                >
                  {study.title}
                </h2>
                <p className="mt-1 font-mono text-xs text-accent-primary sm:text-sm">
                  {study.subtitle}
                </p>
              </div>

              {/* Verified Metrics Row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {study.verifiedMetrics.map((m, i) => (
                  <div
                    key={i}
                    className="border border-border-subtle bg-bg-elevated p-4"
                  >
                    <p className="tabular-nums font-mono text-xl font-semibold text-accent-primary">
                      {m.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-text-primary">
                      {m.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                      {m.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Problem & System Analysis */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="border border-border-subtle bg-bg-elevated p-5">
                  <h3 className="font-mono text-xs text-accent-primary">
                    {"01 // PROBLEM & BOTTLENECK"}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {study.problemStatement.headline}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {study.problemStatement.contextParagraphs[0]}
                  </p>
                </div>

                <div className="border border-border-subtle bg-bg-elevated p-5">
                  <h3 className="font-mono text-xs text-accent-emerald">
                    {"02 // SYSTEM ANALYSIS & EXECUTION"}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {study.systemAnalysis.headline}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                    {study.systemAnalysis.keySchemaOrWorkflowBullets.map(
                      (b, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-accent-primary" />
                          <span>{b}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* Interactive System Architecture Blueprint */}
              <ArchitectureDiagram blueprint={study.architectureBlueprint} />
            </div>

            {/* Sticky Modal Footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-bg-elevated px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-2 font-mono text-xs text-text-secondary">
                <Layers
                  className="h-3.5 w-3.5 text-accent-primary"
                  aria-hidden="true"
                />
                <span>Role: {study.role}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {study.liveUrl ? (
                  <a
                    href={study.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-scale inline-flex items-center gap-1.5 border border-border-strong bg-bg-primary px-4 py-2 font-mono text-xs text-text-primary hover:border-text-primary"
                  >
                    <span>Visit Live Site</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}

                <TransitionLink
                  href={`/projects/${study.slug}`}
                  label={`DOSSIER // ${study.shortTitle.toUpperCase()}`}
                  onClick={onClose}
                  className="press-scale inline-flex items-center gap-1.5 bg-accent-primary px-4 py-2 font-mono text-xs font-semibold text-white hover:opacity-90"
                >
                  <span>Open Full Case Study Page</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </TransitionLink>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
