"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";
import { usePageTransition } from "./PageTransition";

export interface TransitionLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    LinkProps {
  readonly label?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Universal TransitionLink component for internal HUD-choreographed routing.
 * Intercepts navigation clicks:
 * 1. Blocks double-clicks while navigation is active.
 * 2. Pauses Lenis smooth scrolling.
 * 3. Triggers aperture shutter closing sequence.
 * 4. Pushes next route and resets scroll coordinates.
 * 5. Re-opens aperture shutter and resumes Lenis.
 */
export function TransitionLink({
  href,
  label,
  children,
  className,
  onClick,
  target,
  ...rest
}: TransitionLinkProps) {
  const { isNavigating, navigate } = usePageTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;

    const hrefStr = typeof href === "string" ? href : href.pathname ?? "";

    // Allow native browser behavior for external URLs, downloads, or modifier keys (new tab)
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      target === "_blank" ||
      hrefStr.startsWith("http://") ||
      hrefStr.startsWith("https://") ||
      hrefStr.startsWith("mailto:")
    ) {
      return;
    }

    // Intercept internal routing
    e.preventDefault();

    // Requirement 8: Prevent double clicks
    if (isNavigating) return;

    void navigate(hrefStr, label);
  };

  return (
    <Link
      href={href}
      target={target}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
