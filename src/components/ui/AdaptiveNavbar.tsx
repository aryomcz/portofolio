"use client";

import { useEffect, useRef, useState } from "react";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileText, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/hooks/useLenis";
import { subscribeScrollCamera } from "@/hooks/useScrollCamera";
import { MAIN_PAGE_SECTIONS } from "@/lib/scrollNavigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { EASE_REDUCED } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: "hero", label: "About", href: "#hero" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "achievements", label: "Achievements", href: "#achievements" },
  { id: "artifacts", label: "3D Telemetry", href: "#artifacts" },
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "timeline", label: "Experience", href: "#timeline" },
];

export function AdaptiveNavbar() {
  const headerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { scrollTo } = useLenis();
  const isReducedMotion = useReducedMotion();

  const [activeSection, setActiveSection] = useState<string>("hero");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Zero-reflow Navbar Orchestration via shared subscribeScrollCamera
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let lastScrolledState = lastScrollY > 50;
    let lastActiveId = "hero";
    let isHidden = false;

    return subscribeScrollCamera((state) => {
      const currentScrollY = typeof window !== "undefined" ? window.scrollY : 0;
      const delta = currentScrollY - lastScrollY;

      const nextScrolled = currentScrollY > 50;
      if (nextScrolled !== lastScrolledState) {
        lastScrolledState = nextScrolled;
        setIsScrolled(nextScrolled);
      }

      if (isHome) {
        const sec = MAIN_PAGE_SECTIONS[state.activeSectionIndex];
        const rawId = sec?.id ?? "hero";
        const mappedId =
          rawId === "contact" || rawId === "github" ? "timeline" : rawId;
        if (mappedId !== lastActiveId) {
          lastActiveId = mappedId;
          setActiveSection(mappedId);
        }
      }

      if (!isReducedMotion && headerRef.current) {
        if (currentScrollY <= 40 && isHidden) {
          isHidden = false;
          gsap.to(headerRef.current, {
            y: 0,
            duration: 0.28,
            ease: "power3.out",
            overwrite: "auto",
          });
        } else if (delta > 6 && currentScrollY > 100 && !isHidden) {
          isHidden = true;
          gsap.to(headerRef.current, {
            y: -100,
            duration: 0.32,
            ease: "power3.out",
            overwrite: "auto",
          });
        } else if (delta < -6 && isHidden) {
          isHidden = false;
          gsap.to(headerRef.current, {
            y: 0,
            duration: 0.28,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      }

      lastScrollY = currentScrollY;
    });
  }, [isHome, isReducedMotion]);

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string
  ) => {
    if (!isHome) return;
    event.preventDefault();
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    const targetOffset = id === "hero" ? 0 : -88;
    scrollTo(href, { offset: targetOffset, duration: 1.15 });
  };

  // Shared surface class for each independent island (never applied to the outer wrapper)
  const islandSurfaceClass =
    "pointer-events-auto flex h-13 shrink-0 items-center border border-border-subtle bg-bg-glass shadow-[0_8px_28px_rgba(10,17,32,0.06)] backdrop-blur-md transition-[padding,border-radius,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <header
      ref={headerRef}
      className="pointer-events-none fixed top-5 right-0 left-0 z-40 flex flex-col items-center px-4 sm:px-8 will-change-transform"
    >
      {/* Transparent layout track — zero background, zero border, zero shadow */}
      <div
        className={cn(
          "pointer-events-none flex items-center transition-[width,gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isScrolled
            ? "w-full max-w-6xl justify-between gap-3 sm:gap-4"
            : "w-auto justify-center gap-0"
        )}
      >
        {/* IslandLeft: Brand Logo (ARYO) */}
        <div
          className={cn(
            islandSurfaceClass,
            isScrolled
              ? "rounded-full px-6"
              : "rounded-l-full rounded-r-none border-r-0 pr-4 pl-6"
          )}
        >
          {isHome ? (
            <a
              href="#hero"
              onClick={(e) => handleNavClick(e, "#hero", "hero")}
              className="press-scale font-display text-lg tracking-wider text-text-primary hover:text-accent-primary"
            >
              ARYO
            </a>
          ) : (
            <TransitionLink
              href="/"
              label="ROOT // MAIN ARCHITECTURE"
              className="press-scale group inline-flex items-center gap-1.5 font-mono text-xs font-medium text-text-primary hover:text-accent-primary"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span>ARYO</span>
            </TransitionLink>
          )}
        </div>

        {/* IslandCenter: Desktop Navigation Links */}
        {isHome ? (
          <nav
            aria-label="Primary navigation"
            onMouseLeave={() => setHoveredSection(null)}
            className={cn(
              islandSurfaceClass,
              "hidden gap-1 lg:flex lg:gap-1.5",
              isScrolled
                ? "rounded-full px-5"
                : "rounded-none border-x-0 px-3"
            )}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              const isHovered = hoveredSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.id)}
                  onMouseEnter={() => setHoveredSection(item.id)}
                  className={cn(
                    "press-scale group relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
                    isActive
                      ? "font-semibold text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {/* Active Section Solid Pill (Zero-reflow CSS transition) */}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-full bg-bg-subtle shadow-xs transition-opacity duration-200",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden="true"
                  />

                  {/* Interactive Hover Pill */}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-full bg-bg-subtle/60 transition-opacity duration-150",
                      isHovered && !isActive ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden="true"
                  />

                  {/* Batch [3A]: Emil Kowalski Text-Roll Hover Effect */}
                  <span className="relative z-10 inline-flex h-[1.3em] overflow-hidden leading-tight">
                    <span className="transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-full">
                      {item.label}
                    </span>
                    <span
                      className="absolute top-0 left-0 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] translate-y-full group-hover:translate-y-0 text-accent-primary"
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                </a>
              );
            })}
          </nav>
        ) : null}

        {/* IslandRight: Action Cluster (CV, Theme Toggle, Contact ↗, Mobile Menu) */}
        <div
          className={cn(
            islandSurfaceClass,
            "gap-2",
            isScrolled
              ? "rounded-full px-3"
              : "rounded-l-none rounded-r-full border-l-0 pr-2.5 pl-3"
          )}
        >
          {/* CV Download CTA */}
          <a
            href={PORTFOLIO_DATA.owner.contacts.resumePdfPath}
            target="_blank"
            rel="noopener noreferrer"
            download="Aryo-Ristiawan-Machfudz-CV.pdf"
            className="press-scale inline-flex h-9 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-elevated px-3.5 font-mono text-xs font-medium text-text-primary hover:border-accent-primary hover:text-accent-primary"
            aria-label="Download Official CV (PDF)"
          >
            <FileText
              className="h-3.5 w-3.5 text-accent-primary"
              aria-hidden="true"
            />
            <span>CV</span>
          </a>

          <ThemeToggle />

          {/* Desktop Contact CTA */}
          <a
            href={isHome ? "#contact" : "/#contact"}
            onClick={(e) => handleNavClick(e, "#contact", "contact")}
            className="press-scale group hidden h-9 items-center gap-1.5 rounded-full bg-accent-primary px-4 text-[13px] font-medium text-white shadow-xs hover:opacity-90 sm:inline-flex"
          >
            <span>Contact</span>
            <ArrowUpRight
              className="arrow-drift h-3.5 w-3.5"
              aria-hidden="true"
            />
          </a>

          {/* Mobile Menu Hamburger Toggle */}
          {isHome ? (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={
                isMobileMenuOpen ? "Close menu" : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
              className="press-scale flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile Editorial Drawer Navigation (Inspired by Lando Norris Menu) */}
      <AnimatePresence>
        {isHome && isMobileMenuOpen ? (
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={
              isReducedMotion
                ? EASE_REDUCED
                : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
            }
            className="pointer-events-auto mt-2 w-full max-w-sm origin-top border border-border-subtle bg-bg-elevated/95 p-4 shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2 font-mono text-[10px] text-text-muted">
              <span>{"// NAVIGATION HUD"}</span>
              <span className="text-[#0e7c86]">ARM PROTOCOL</span>
            </div>

            <nav className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item, idx) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href, item.id)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 text-left transition-colors",
                      isActive
                        ? "bg-[#0e7c86]/10 text-text-primary"
                        : "text-text-secondary hover:bg-bg-subtle/80 hover:text-text-primary"
                    )}
                  >
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[10px] text-text-muted group-hover:text-[#0e7c86]">
                        0{idx + 1}
                      </span>
                      <span className="font-display text-xl tracking-wide uppercase">
                        {item.label}
                      </span>
                    </div>

                    {isActive ? (
                      <span className="h-2 w-2 rounded-full bg-[#0e7c86] shadow-[0_0_8px_rgba(14,124,134,0.8)]" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 text-[#0e7c86]" />
                    )}
                  </a>
                );
              })}

              <div className="border-t border-border-subtle pt-3 mt-2">
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, "#contact", "contact")}
                  className="press-scale flex items-center justify-between bg-accent-primary px-4 py-2.5 font-mono text-xs font-bold text-white shadow-xs hover:bg-[#0e7c86] hover:text-white transition-colors"
                >
                  <span>CONTACT ARYO</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
