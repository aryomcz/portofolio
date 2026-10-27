"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PORTFOLIO_DATA } from "@/data/portfolio";
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

export function AdaptiveNavbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { scrollTo } = useSmoothScroll();
  const [activeSection, setActiveSection] = useState<string>("hero");

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

  return (
    <header className="fixed top-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border-subtle/70 bg-bg-glass px-3 py-1.5 shadow-[0_8px_30px_rgba(10,17,32,0.08)] backdrop-blur-md sm:gap-5 sm:px-5 sm:py-2">
        {/* Left: Bold Condensed Brand Name (RIN LAYHEANG style) */}
        {isHome ? (
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "#hero", "hero")}
            className="press-scale pl-2 font-display text-base tracking-wider text-text-primary sm:text-lg"
          >
            ARYO
          </a>
        ) : (
          <Link
            href="/"
            className="press-scale group inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-medium text-text-primary hover:text-accent-primary"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span>ARYO</span>
          </Link>
        )}

        {/* Center: Clean Editorial Links */}
        {isHome ? (
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 md:flex lg:gap-2"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.id)}
                  className={cn(
                    "press-scale rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
                    isActive
                      ? "text-text-primary font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        ) : null}

        {/* Right: CV Download, Theme Toggle & Solid Dark Pill "Contact ↗" */}
        <div className="flex items-center gap-2">
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
              className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </header>
  );
}
