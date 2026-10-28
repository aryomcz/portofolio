import { useId } from "react";
import { InteractiveTopographyCanvas } from "./InteractiveTopographyCanvas";

/**
 * Interactive WebGL Topographic Contour Lines background with GLSL shader
 * and static SVG fallback.
 * Gives the canvas an authentic Creative Tech / Modern HUD terrain feel
 * without interfering with text contrast or pointer interactions.
 */
export function TopographicBg() {
  const patternId = useId();

  return (
    <>
      <InteractiveTopographyCanvas />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.035] dark:opacity-[0.045]"
      >
      <svg
        className="h-full w-full text-text-primary"
         xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={patternId}
            width="640"
            height="640"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer Contour Loops */}
            <path
              d="M-80 120 C 80 40, 240 200, 400 100 C 520 20, 620 140, 720 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M-80 180 C 100 90, 260 260, 420 150 C 540 70, 610 200, 720 180"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.85"
            />
            <path
              d="M-80 240 C 120 150, 280 310, 440 210 C 560 130, 600 260, 720 240"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            {/* Mid Elevation Contours */}
            <path
              d="M40 380 C 160 290, 310 340, 460 280 C 570 240, 610 350, 700 330"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M-60 440 C 110 360, 290 430, 450 350 C 560 300, 630 420, 720 410"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.85"
            />
            <path
              d="M-80 520 C 90 460, 250 540, 430 450 C 550 390, 620 510, 720 500"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            {/* Closed Topographic Ridge Rings */}
            <ellipse
              cx="210"
              cy="195"
              rx="85"
              ry="42"
              transform="rotate(-12 210 195)"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <ellipse
              cx="210"
              cy="195"
              rx="48"
              ry="22"
              transform="rotate(-12 210 195)"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.65"
            />
            <ellipse
              cx="470"
              cy="420"
              rx="110"
              ry="52"
              transform="rotate(15 470 420)"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <ellipse
              cx="470"
              cy="420"
              rx="62"
              ry="28"
              transform="rotate(15 470 420)"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.65"
            />
            {/* Technical Grid Crosshairs */}
            <path
              d="M320 314 L320 326 M314 320 L326 320"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M80 74 L80 86 M74 80 L86 80"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M560 554 L560 566 M554 560 L566 560"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
    </>
  );
}
