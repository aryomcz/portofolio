"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { motion } from "motion/react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { SPRING_LAYOUT, EASE_REDUCED } from "@/lib/motion-tokens";
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
  stiffness: 320,
  damping: 28,
  mass: 0.8,
};

export function AdaptiveNavbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { scrollTo } = useSmoothScroll();
  const isReducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    scrollTo(href, { offset: -88 });
  };

  const springTransition = isReducedMotion ? EASE_REDUCED : SPLIT_SPRING;

  return (
    <header className="fixed top-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <motion.div
        layout
        transition={springTransition}
        className={cn(
          "pointer-events-auto flex items-center transition-colors duration-300",
          isScrolled
            ? "w-full max-w-5xl justify-between gap-3 sm:gap-4"
            : "w-auto justify-center gap-2 rounded-full border border-border-subtle/70 bg-bg-glass px-3 py-1.5 shadow-[0_8px_30px_rgba(10,17,32,0.08)] backdrop-blur-md sm:gap-4 sm:px-5 sm:py-2"
        )}
      >
        {/* Island A (Left): Brand Logo */}
        <motion.div
          layout
          transition={springTransition}
          className={cn(
            "flex items-center shrink-0 transition-all duration-300",
            isScrolled
              ? "rounded-full border border-border-subtle/70 bg-bg-glass px-4 py-2 shadow-[0_8px_30px_rgba(10,17,32,0.08)] backdrop-blur-md"
              : "pl-1"
          )}
        >
          {isHome ? (
            <a
              href="#hero"
              onClick={(e) => handleNavClick(e, "#hero", "hero")}
              className="press-scale font-display text-base tracking-wider text-text-primary hover:text-accent-primary sm:text-lg"
            >
              ARYO
            </a>
          ) : (
            <Link
              href="/"
              className="press-scale group inline-flex items-center gap-1.5 font-mono text-xs font-medium text-text-primary hover:text-accent-primary"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span>ARYO</span>
            </Link>
          )}
        </motion.div>

        {/* Island B (Center): Navigation anchors with active scroll-spy indicators */}
        {isHome ? (
          <motion.nav
            layout
            transition={springTransition}
            aria-label="Primary navigation"
            className={cn(
              "hidden items-center gap-1 md:flex lg:gap-1.5 transition-all duration-300",
              isScrolled
                ? "rounded-full border border-border-subtle/70 bg-bg-glass px-4 py-1.5 shadow-[0_8px_30px_rgba(10,17,32,0.08)] backdrop-blur-md"
                : "px-1"
            )}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.id)}
                  className={cn(
                    "press-scale relative rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
                    isActive
                      ? "font-semibold text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="active-nav-pill"
                      transition={isReducedMotion ? EASE_REDUCED : SPRING_LAYOUT}
                      className="absolute inset-0 rounded-full bg-bg-subtle/80 dark:bg-bg-subtle"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
          </motion.nav>
        ) : null}

        {/* Island C (Right): Action cluster (CV download, theme toggle, Contact ↗) */}
        <motion.div
          layout
          transition={springTransition}
          className={cn(
            "flex items-center gap-2 shrink-0 transition-all duration-300",
            isScrolled
              ? "rounded-full border border-border-subtle/70 bg-bg-glass px-3 py-1.5 shadow-[0_8px_30px_rgba(10,17,32,0.08)] backdrop-blur-md sm:px-4 sm:py-2"
              : ""
          )}
        >
          <a
            href={PORTFOLIO_DATA.owner.contacts.resumePdfPath}
            target="_blank"
            rel="noopener noreferrer"
            download="Aryo-Ristiawan-Machfudz-CV.pdf"
            className="press-scale inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs font-mono font-medium text-text-primary hover:border-accent-primary hover:text-accent-primary"
            aria-label="Download Official CV (PDF)"
          >
            <FileText className="h-3.5 w-3.5 text-accent-primary" aria-hidden="true" />
            <span>CV</span>
          </a>

          <ThemeToggle />

          <a
            href={isHome ? "#contact" : "/#contact"}
            onClick={(e) => handleNavClick(e, "#contact", "contact")}
            className="press-scale group inline-flex items-center gap-1.5 rounded-full bg-[#0A1120] px-4 py-2 text-[13px] font-medium text-white shadow-xs transition-all hover:opacity-90 dark:bg-accent-primary"
          >
            <span>Contact</span>
            <ArrowUpRight
              className="arrow-drift h-3.5 w-3.5"
              aria-hidden="true"
            />
          </a>
        </motion.div>
      </motion.div>
    </header>
  );
}
