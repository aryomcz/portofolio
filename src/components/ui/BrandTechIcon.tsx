import { cn } from "@/lib/utils";

interface BrandTechIconProps {
  readonly name: string;
  readonly className?: string;
}

/**
 * Crisp SVG brand & technical iconography for skill pills and tech badges.
 * Strictly follows ui-ux-pro-max rules: zero emojis, 100% vector SVG paths.
 */
export function BrandTechIcon({ name, className }: BrandTechIconProps) {
  const key = name.toLowerCase();
  const baseClass = cn("h-3.5 w-3.5 shrink-0", className);

  if (key.includes("next")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8.5 16V8L16.5 17.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M15.5 8V13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (key.includes("typescript")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M7.5 11H12.5M10 11V17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M17.5 11.5C17 11 15.2 10.8 15 12C14.8 13.2 17.8 13.5 17.6 15.5C17.4 17 15.3 17 14.5 16.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (key.includes("react")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (key.includes("laravel") || key.includes("php")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M4 7.5L8.5 5L13 7.5V13.5L17.5 11L20 12.5V16.5L13 20.5L4 15.5V7.5Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
        <path d="M8.5 5V11L13 13.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (key.includes("express") || key.includes("node")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M9 10L15 14M15 10L9 14" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      </svg>
    );
  }

  if (key.includes("flutter") || key.includes("dart")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M14 3L5 12L8.5 15.5L21 3H14Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
        <path d="M14 12L9.5 16.5L14 21H20.5L16 16.5L20.5 12H14Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      </svg>
    );
  }

  if (key.includes("tailwind")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M6 10.5C7.2 8 9.2 7 12 7.5C14.5 8 15.2 9.8 17 10.2C18.3 10.5 19.5 10 20.5 8.5C19.3 11 17.3 12 14.5 11.5C12 11 11.3 9.2 9.5 8.8C8.2 8.5 7 9 6 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M3.5 15.5C4.7 13 6.7 12 9.5 12.5C12 13 12.7 14.8 14.5 15.2C15.8 15.5 17 15 18 13.5C16.8 16 14.8 17 12 16.5C9.5 16 8.8 14.2 7 13.8C5.7 13.5 4.5 14 3.5 15.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  if (key.includes("postgres") || key.includes("mysql") || key.includes("database")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <ellipse cx="12" cy="6" rx="7.5" ry="3" stroke="currentColor" strokeWidth="1.75" />
        <path d="M4.5 6V12C4.5 13.66 7.86 15 12 15C16.14 15 19.5 13.66 19.5 12V6" stroke="currentColor" strokeWidth="1.75" />
        <path d="M4.5 12V18C4.5 19.66 7.86 21 12 21C16.14 21 19.5 19.66 19.5 18V12" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }

  if (key.includes("mongo")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M12 2.5C12 2.5 6.5 7.5 6.5 13C6.5 17 9.2 19.8 12 21C14.8 19.8 17.5 17 17.5 13C17.5 7.5 12 2.5 12 2.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M12 9V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (key.includes("prisma")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M12.5 3L4.5 16.5L10.5 21L19.5 17.5L12.5 3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        <path d="M12.5 3L10.5 21" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (key.includes("git")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <circle cx="7" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="7" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M7 8.2V15.8M7 9.5C7 11.5 10 12 14.8 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (key.includes("vercel")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M12 4L21 19.5H3L12 4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
    );
  }

  if (key.includes("xendit") || key.includes("payment")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M3 10H21M7 15H11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  if (key.includes("api") || key.includes("webhook")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
        <path d="M7 8L3 12L7 16M17 8L21 12L17 16M14 4L10 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Default Architectural Cube / System Analysis Icon
  return (
    <svg viewBox="0 0 24 24" fill="none" className={baseClass} aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.65" />
      <rect x="13.5" y="4" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.65" />
      <rect x="4" y="13.5" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.65" />
      <path d="M13.5 16.75H20M16.75 13.5V20" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}
