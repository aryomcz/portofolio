"use client";

import { useCallback, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { ArrowUpRight, FileText } from "lucide-react";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { useBogorClock } from "@/hooks/useBogorClock";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { KineticBlockReveal } from "@/components/ui/KineticBlockReveal";
import { cn } from "@/lib/utils";

function BogorClockReadout() {
  const bogorTime = useBogorClock();
  return <span className="text-accent-primary">{bogorTime}</span>;
}

export function ContactFooter() {
  const { owner } = PORTFOLIO_DATA;
  const isReducedMotion = useReducedMotion();
  const footerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);

  const runGlitch = useCallback(() => {
    if (isReducedMotion || !headingRef.current) return;

    if (tlRef.current) {
      tlRef.current.kill();
    }

    setIsGlitching(true);

    const headingEl = headingRef.current;
    const tl = gsap.timeline({
      repeat: 2,
      onComplete: () => {
        setIsGlitching(false);
        gsap.set(headingEl, { x: 0, skewX: 0 });
      },
    });

    tlRef.current = tl;

    // Wiggle and skew displacement sequence
    tl.to(headingEl, { x: -3, skewX: 7, duration: 0.05, ease: "power1.inOut" })
      .to(headingEl, { x: 3, skewX: -6, duration: 0.05, ease: "power1.inOut" })
      .to(headingEl, { x: -3, skewX: 3, duration: 0.04, ease: "power1.inOut" })
      .to(headingEl, { x: 0, skewX: 0, duration: 0.05, ease: "power1.inOut" });
  }, [isReducedMotion]);

  useGSAP(
    () => {
      if (isReducedMotion) return;

      // 1. Single-shot glitch trigger for LET'S WORK heading
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => runGlitch(),
      });

      // 2. Kinetic Card Wipe & Stagger entrance for contact channel cards
      const cards = gsap.utils.toArray<HTMLElement>(".contact-channel-card");
      if (cards.length > 0) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: cards[0],
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });

        cards.forEach((card, idx) => {
          const beam = card.querySelector<HTMLElement>(".contact-card-beam");
          const cardDelay = idx * 0.12;

          // Animate card self-unmasking with horizontal clip-path wipe
          tl.fromTo(
            card,
            {
              clipPath: "inset(0% 100% 0% 0%)",
              x: -18,
              autoAlpha: 0,
            },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              x: 0,
              autoAlpha: 1,
              duration: 0.65,
              ease: "power3.out",
              clearProps: "clipPath,transform",
            },
            cardDelay
          );

          // Synchronized kinetic laser beam traveling along the unmask edge
          if (beam) {
            tl.fromTo(
              beam,
              {
                left: "0%",
                autoAlpha: 1,
              },
              {
                left: "100%",
                autoAlpha: 0,
                duration: 0.65,
                ease: "power3.out",
              },
              cardDelay
            );
          }
        });
      }
    },
    { scope: footerRef, dependencies: [isReducedMotion, runGlitch] }
  );

  const contactItems = [
    {
      id: "email",
      code: "CH // 01",
      label: "EMAIL",
      value: owner.contacts.email,
      href: `mailto:${owner.contacts.email}`,
    },
    {
      id: "github",
      code: "CH // 02",
      label: "GITHUB",
      value: `github.com/${owner.contacts.githubHandle.replace("@", "")}`,
      href: owner.contacts.githubUrl,
    },
    {
      id: "linkedin",
      code: "CH // 03",
      label: "LINKEDIN",
      value: `linkedin.com/${owner.contacts.linkedinHandle}`,
      href: owner.contacts.linkedinUrl,
    },
    // {
    //   id: "whatsapp",
    //   code: "CH // 04",
    //   label: "WHATSAPP",
    //   value: owner.contacts.phoneDisplay,
    //   href: owner.contacts.whatsappUrl,
    // },
  ];

  return (
    <footer
      id="contact"
      ref={footerRef}
      aria-labelledby="footer-giant-heading"
      className="relative mt-12 border-t border-[#1D2738] bg-bg-footer text-[#F3F5F8]"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {/* Top HUD Status Bar */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#1D2738] pb-4 font-mono text-xs text-[#9BA5B7]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-emerald" />
            </span>
            <span className="text-[#F3F5F8]">
              {owner.availability.detailBanner}
            </span>
          </div>
          <span className="text-accent-primary">{"SYS.HUD // 07 — TRANSMISSION"}</span>
        </div>

        {/* Main 2-Column Footer Grid */}
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          {/* Left 7 Cols: Giant Display "LET'S WORK." + Quick Actions */}
          <div className="flex flex-col justify-between space-y-8 lg:col-span-7">
            <div>
              <KineticBlockReveal delay={0.05} blockColor="bg-[#0e7c86]">
                <p className="font-mono text-xs tracking-widest text-[#0e7c86]">
                  {"[ READY FOR NEW CHALLENGES & COLLABORATIONS ]"}
                </p>
              </KineticBlockReveal>

              <div className="mt-3">
                <KineticBlockReveal delay={0.15} blockColor="bg-[#0e7c86]">
                  <h2
                    id="footer-giant-heading"
                    ref={headingRef}
                    onMouseEnter={runGlitch}
                    onClick={runGlitch}
                    className="inline-block cursor-pointer select-none font-display text-[clamp(4.5rem,11vw,9.25rem)] leading-[0.85] tracking-wide text-[#F3F5F8]"
                    title="Hover or click to glitch"
                  >
                    <span
                      className={cn("glitch-text", isGlitching && "is-glitching")}
                      data-text="LET'S"
                    >
                      LET&apos;S
                    </span>{" "}
                    <span
                      className={cn(
                        "glitch-text text-[#0e7c86]",
                        isGlitching && "is-glitching"
                      )}
                      data-text="WORK."
                    >
                      WORK.
                    </span>
                  </h2>
                </KineticBlockReveal>
              </div>

              <div className="mt-4">
                <KineticBlockReveal delay={0.25} blockColor="bg-[#14b8a6]">
                  <p className="max-w-[54ch] text-sm leading-relaxed text-[#9BA5B7] sm:text-base">
                    Need a Full-Stack Engineer or System Analyst to architect web
                    platforms, mobile apps, or custom operational workflows? Initiate
                    a direct connection.
                  </p>
                </KineticBlockReveal>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CopyEmailButton
                email={owner.contacts.email}
                variant="pill"
                className="border-[#33435D] bg-[#0F1520] text-[#F3F5F8] hover:text-accent-primary hover:border-accent-primary"
              />

              <a
                href={owner.contacts.resumePdfPath}
                target="_blank"
                rel="noopener noreferrer"
                download="Aryo-Ristiawan-Machfudz-CV.pdf"
                className="press-scale inline-flex min-h-11 items-center gap-2 border border-[#33435D] bg-[#0F1520] px-4 py-3 font-mono text-xs text-[#F3F5F8] hover:border-accent-primary"
              >
                <FileText
                  className="h-3.5 w-3.5 text-accent-primary"
                  aria-hidden="true"
                />
                <span>DOWNLOAD OFFICIAL CV (PDF)</span>
              </a>
            </div>
          </div>

          {/* Right 5 Cols: Tech-Bracketed Contact Menu (Email, GitHub, LinkedIn, WhatsApp) */}
          <div className="flex flex-col gap-3.5 lg:col-span-5">
            {contactItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target={item.id === "email" ? undefined : "_blank"}
                rel={item.id === "email" ? undefined : "noopener noreferrer"}
                className="contact-channel-card press-scale group relative flex items-center justify-between border border-[#1D2738] bg-[#0F1520]/90 p-5 transition-colors duration-200 hover:border-accent-primary hover:bg-[#161F2E]"
              >
                {/* Kinetic Laser Beam leading edge (only active during stagger unmask) */}
                {!isReducedMotion && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                  >
                    <span className="contact-card-beam pointer-events-none absolute inset-y-0 w-[2.5px] bg-accent-primary shadow-[0_0_14px_#0e7c86] z-30 opacity-0 will-change-transform" />
                  </div>
                )}

                {/* Tech HUD Corner Brackets ┌ ┐ └ ┘ */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-[#33435D] transition-all duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-accent-primary"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-[#33435D] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-accent-primary"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-[#33435D] transition-all duration-200 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 group-hover:border-accent-primary"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-px -bottom-px h-3 w-3 border-r-2 border-b-2 border-[#33435D] transition-all duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:border-accent-primary"
                />

                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#647084]">
                    <span className="text-accent-primary">{item.code}</span>
                    <span>·</span>
                    <span>{item.label}</span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-medium text-[#F3F5F8] sm:text-base">
                    {item.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center border border-[#1D2738] bg-[#090D14] text-[#9BA5B7] transition-colors duration-200 group-hover:border-accent-primary group-hover:bg-accent-primary group-hover:text-white">
                  <ArrowUpRight
                    className="h-5 w-5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Technical Colophon */}
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-[#1D2738] pt-6 font-mono text-xs text-[#647084] sm:flex-row sm:items-center">
          <p>
            © 2026 {owner.fullName}. Software Engineering —{" "}
            {owner.education.university}.
          </p>

          <p className="tabular-nums text-[#9BA5B7]">
            {owner.location.city}, {owner.location.country} — LOCAL TIME:{" "}
            <BogorClockReadout />
          </p>
        </div>
      </div>
    </footer>
  );
}
