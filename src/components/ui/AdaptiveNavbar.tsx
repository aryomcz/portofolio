"use client";

import { useEffect, useState } from "react";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileText, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { SPRING_LAYOUT, EASE_REDUCED } from "@/lib/motion";
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
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "timeline", label: "Experience", href: "#timeline" },
];

const SPLIT_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 0.6,
};

export function AdaptiveNavbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { scrollTo } = useLenis();
  const isReducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isHome) return;

    const sectionIds = [...NAV_ITEMS.map((item) => item.id), "contact"];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: 0,
      }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [isHome]);

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

  const springTransition = isReducedMotion ? EASE_REDUCED : SPLIT_SPRING;

  // Shared surface class for each independent island (never applied to the outer wrapper)
  const islandSurfaceClass =
    "pointer-events-auto flex h-13 shrink-0 items-center border border-border-subtle bg-bg-glass shadow-[0_8px_28px_rgba(10,17,32,0.06)] backdrop-blur-md";

  return (
    <header className="pointer-events-none fixed top-5 right-0 left-0 z-40 flex flex-col items-center px-4 sm:px-8">
      {/* Transparent layout track — zero background, zero border, zero shadow */}
      <div
        className={cn(
          "pointer-events-none flex items-center",
          isScrolled
            ? "w-full max-w-6xl justify-between gap-3 sm:gap-4"
            : "w-auto justify-center gap-0"
        )}
      >
        {/* IslandLeft: Brand Logo (ARYO) */}
        <motion.div
          layout
          transition={springTransition}
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
        </motion.div>

        {/* IslandCenter: Desktop Navigation Links */}
        {isHome ? (
          <motion.nav
            layout
            transition={springTransition}
            aria-label="Primary navigation"
            onMouseLeave={() => setHoveredSection(null)}
            className={cn(
              islandSurfaceClass,
              "hidden gap-1 md:flex lg:gap-1.5",
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
                    "press-scale relative rounded-full px-3.5 py-1.5 text-[13px] font-medium",
                    isActive
                      ? "font-semibold text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {/* Active Section Solid Pill */}
                  {isActive ? (
                    <motion.span
                      layoutId="active-nav-pill"
                      transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                      className="absolute inset-0 rounded-full bg-bg-subtle shadow-xs"
                      aria-hidden="true"
                    />
                  ) : null}

                  {/* Interactive Cursor-Following Hover Pill */}
                  {isHovered && !isActive ? (
                    <motion.span
                      layoutId="hover-nav-pill"
                      transition={
                        isReducedMotion
                          ? EASE_REDUCED
                          : { type: "spring", stiffness: 420, damping: 30 }
                      }
                      className="absolute inset-0 rounded-full bg-bg-subtle/60"
                      aria-hidden="true"
                    />
                  ) : null}

                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
          </motion.nav>
        ) : null}

        {/* IslandRight: Action Cluster (CV, Theme Toggle, Contact ↗, Mobile Menu) */}
        <motion.div
          layout
          transition={springTransition}
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
              className="press-scale flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </motion.div>
      </div>

      {/* Mobile Slide-Down Drawer Navigation */}
      <AnimatePresence>
        {isHome && isMobileMenuOpen ? (
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={
              isReducedMotion
                ? EASE_REDUCED
                : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
            }
            className="pointer-events-auto mt-2 w-full max-w-sm origin-top rounded-2xl border border-border-subtle bg-bg-glass p-3 shadow-2xl backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href, item.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent-primary/10 font-semibold text-accent-primary"
                        : "text-text-secondary hover:bg-bg-subtle/60 hover:text-text-primary"
                    )}
                  >
                    <span>{item.label}</span>
                    {isActive ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                    ) : null}
                  </a>
                );
              })}

              <div className="border-t border-border-subtle/60 pt-2">
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, "#contact", "contact")}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs"
                >
                  <span>Contact Aryo</span>
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
