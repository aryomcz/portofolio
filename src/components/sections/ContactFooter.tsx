"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ArrowUpRight, FileText } from "lucide-react";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { useBogorClock } from "@/hooks/useBogorClock";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ContactFooter() {
  const { owner } = PORTFOLIO_DATA;
  const bogorTime = useBogorClock();
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

  useEffect(() => {
    if (isReducedMotion) return;

    // 1. ScrollTrigger untuk trigger saat footer di-scroll masuk/keluar
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: "top 90%",
        onEnter: () => runGlitch(),
        onEnterBack: () => runGlitch(),
      });
    }, footerRef);

    // 2. Initial trigger jika halaman dibuka atau di-refresh langsung pada posisi footer
    const initialTimer = setTimeout(() => {
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          runGlitch();
        }
      }
    }, 250);

    return () => {
      clearTimeout(initialTimer);
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      setIsGlitching(false);
      ctx.revert();
    };
  }, [isReducedMotion, runGlitch]);

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
    {
      id: "whatsapp",
      code: "CH // 04",
      label: "WHATSAPP",
      value: owner.contacts.phoneDisplay,
      href: owner.contacts.whatsappUrl,
    },
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
              <p className="font-mono text-xs tracking-widest text-accent-primary">
                {"[ READY FOR NEW CHALLENGES & COLLABORATIONS ]"}
              </p>

              <h2
                id="footer-giant-heading"
                ref={headingRef}
                onMouseEnter={runGlitch}
                onClick={runGlitch}
                className="mt-3 inline-block cursor-pointer select-none font-display text-[clamp(4.5rem,11vw,9.25rem)] leading-[0.85] tracking-wide text-[#F3F5F8]"
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
                    "glitch-text text-accent-primary",
                    isGlitching && "is-glitching"
                  )}
                  data-text="WORK."
                >
                  WORK.
                </span>
              </h2>

              <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-[#9BA5B7] sm:text-base">
                Need a Full-Stack Engineer or System Analyst to architect web
                platforms, mobile apps, or custom operational workflows? Initiate
                a direct connection.
              </p>
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
                className="press-scale group relative flex items-center justify-between border border-[#1D2738] bg-[#0F1520]/90 p-5 transition-colors duration-200 hover:border-accent-primary hover:bg-[#161F2E]"
              >
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
            <span className="text-accent-primary">{bogorTime}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
