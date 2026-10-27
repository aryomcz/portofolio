import type { ReactNode } from "react";
import type { ProjectThemeId } from "@/data/portfolio";
import { cn } from "@/lib/utils";

interface TechBracketCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly innerClassName?: string;
  readonly bracketSize?: "sm" | "md" | "lg";
  readonly accentOnHover?: boolean;
  readonly activeAccent?: boolean;
  readonly themeColor?: ProjectThemeId;
  readonly as?: "div" | "article" | "section" | "aside";
}

/**
 * Reusable Tech HUD Bracket wrapper (`┌ ┐ └ ┘`).
 * Frames cards, metrics, skill blocks, and project panels with crisp technical corner brackets.
 * On hover, brackets subtly expand and illuminate via precision cubic-bezier transitions.
 */
export function TechBracketCard({
  children,
  className,
  innerClassName,
  bracketSize = "md",
  accentOnHover = true,
  activeAccent = false,
  themeColor,
  as: Component = "div",
}: TechBracketCardProps) {
  const sizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3.5 w-3.5",
    lg: "h-4.5 w-4.5",
  }[bracketSize];

  const bracketColor =
    activeAccent || Boolean(themeColor)
      ? "border-accent-primary"
      : cn(
          "border-border-strong",
          accentOnHover && "group-hover/hud:border-accent-primary"
        );

  return (
    <Component
      data-project-theme={themeColor}
      className={cn(
        "group/hud relative border bg-bg-elevated/90 backdrop-blur-xs transition-colors duration-200",
        themeColor
          ? "border-accent-primary/50 hover:border-accent-primary"
          : "border-border-subtle/80 hover:border-border-strong",
        className
      )}
    >
      {/* Top-Left Bracket ┌ */}
      <span
        aria-hidden="true"
        className={cn(
          "hud-corner-ornament pointer-events-none absolute -top-px -left-px z-20 border-t-2 border-l-2 transition-transform duration-200 ease-out",
          sizeClasses,
          bracketColor,
          accentOnHover &&
            "group-hover/hud:-translate-x-0.5 group-hover/hud:-translate-y-0.5"
        )}
      />

      {/* Top-Right Bracket ┐ */}
      <span
        aria-hidden="true"
        className={cn(
          "hud-corner-ornament pointer-events-none absolute -top-px -right-px z-20 border-t-2 border-r-2 transition-transform duration-200 ease-out",
          sizeClasses,
          bracketColor,
          accentOnHover &&
            "group-hover/hud:translate-x-0.5 group-hover/hud:-translate-y-0.5"
        )}
      />

      {/* Bottom-Left Bracket └ */}
      <span
        aria-hidden="true"
        className={cn(
          "hud-corner-ornament pointer-events-none absolute -bottom-px -left-px z-20 border-b-2 border-l-2 transition-transform duration-200 ease-out",
          sizeClasses,
          bracketColor,
          accentOnHover &&
            "group-hover/hud:-translate-x-0.5 group-hover/hud:translate-y-0.5"
        )}
      />

      {/* Bottom-Right Bracket ┘ */}
      <span
        aria-hidden="true"
        className={cn(
          "hud-corner-ornament pointer-events-none absolute -right-px -bottom-px z-20 border-r-2 border-b-2 transition-transform duration-200 ease-out",
          sizeClasses,
          bracketColor,
          accentOnHover &&
            "group-hover/hud:translate-x-0.5 group-hover/hud:translate-y-0.5"
        )}
      />

      <div className={cn("relative z-10 h-full", innerClassName)}>
        {children}
      </div>
    </Component>
  );
}
