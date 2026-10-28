"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, GSAP_MEDIA_QUERIES } from "@/lib/gsap";

export function ProjectDetailEntrance({
  children,
}: {
  readonly children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: GSAP_MEDIA_QUERIES.isDesktop,
          isMobile: GSAP_MEDIA_QUERIES.isMobile,
          reduceMotion: GSAP_MEDIA_QUERIES.reduceMotion,
        },
        (context) => {
          const { reduceMotion } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
            reduceMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(
              [
                ".project-detail-title",
                ".project-detail-meta",
                ".project-hero-clip",
              ],
              {
                autoAlpha: 1,
                y: 0,
                yPercent: 0,
                clipPath: "none",
                clearProps: "all",
              }
            );
            return;
          }

          // 1. Requirement 5: Judul per baris kinetic masked reveal
          gsap.fromTo(
            ".project-detail-title",
            { yPercent: 110, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.85,
              ease: "power3.out",
              clearProps: "all",
            }
          );

          // 2. Requirement 5: Meta HUD dossier & metric cards staggered entrance
          gsap.fromTo(
            ".project-detail-meta",
            { y: 22, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.65,
              stagger: 0.08,
              ease: "power3.out",
              clearProps: "all",
              delay: 0.1,
            }
          );

          // 3. Requirement 5: Gambar utama clip-path horizontal aperture reveal
          gsap.fromTo(
            ".project-hero-clip",
            {
              clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
              scale: 1.04,
            },
            {
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              scale: 1,
              duration: 0.9,
              ease: "power3.inOut",
              clearProps: "clipPath,transform",
              delay: 0.15,
            }
          );
        }
      );
    },
    { scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
