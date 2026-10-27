import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ExternalLink,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  getAllCaseStudies,
  getCaseStudyBySlug,
  getAdjacentCaseStudies,
} from "@/data/portfolio";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { BrandTechIcon } from "@/components/ui/BrandTechIcon";
import { ArchitectureDiagram } from "@/components/ui/ArchitectureDiagram";
import { ContactFooter } from "@/components/sections/ContactFooter";

export function generateStaticParams() {
  return getAllCaseStudies().map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) {
    return {
      title: "Case Study Not Found — Aryo Ristiawan Machfudz",
    };
  }

  return {
    title: `${study.title} — Case Study | Aryo Ristiawan Machfudz`,
    description: study.cardSummary,
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);

  if (!study) {
    notFound();
  }

  const { prev, next } = getAdjacentCaseStudies(study.slug);
  const isAchievement = study.kind === "achievement";

  return (
    <main className="min-h-screen text-text-primary">
      <article className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        {/* 1. Top Breadcrumb & Case Study HUD Header */}
        <header className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <Link
              href={isAchievement ? "/#achievements" : "/#projects"}
              className="press-scale group inline-flex items-center gap-2 border border-border-strong bg-bg-elevated px-4 py-2 font-mono text-xs text-text-primary hover:border-accent-primary"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-1"
                aria-hidden="true"
              />
              <span>
                {isAchievement ? "BACK TO ACHIEVEMENTS" : "BACK TO PROJECTS"}
              </span>
            </Link>

            <div className="flex items-center gap-2.5 font-mono text-xs">
              {isAchievement ? (
                <span className="inline-flex items-center gap-1 bg-accent-primary px-2.5 py-1 font-bold text-white">
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{study.badgeText ?? "CHAMPION"}</span>
                </span>
              ) : null}
              <span className="text-accent-primary">
                {`CASE STUDY // ${study.index}`}
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-text-secondary">{study.year}</span>
            </div>
          </div>

          {/* Display Title & Summary */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="space-y-4 lg:col-span-8">
              <p className="font-mono text-xs text-accent-emerald">
                ● {study.heroMetricPill}
              </p>

              <h1 className="font-display text-[clamp(3.2rem,7vw,5.75rem)] leading-[0.9] tracking-wide text-text-primary">
                {study.title}
              </h1>

              <p className="font-mono text-sm font-medium text-accent-primary sm:text-base">
                {study.subtitle}
              </p>

              <p className="max-w-[65ch] text-base leading-relaxed text-text-secondary">
                {study.cardSummary}
              </p>
            </div>

            {/* Right 4 Cols: HUD Metadata & Live Site CTA */}
            <TechBracketCard
              bracketSize="md"
              className="flex flex-col justify-between p-6 lg:col-span-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono text-[11px] text-text-muted">
                  <span>[ DEPLOYMENT DOSSIER ]</span>
                  <span className="text-accent-emerald">VERIFIED</span>
                </div>
                <dl className="space-y-2 border-t border-border-subtle pt-3 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="font-mono text-text-muted">ROLE:</dt>
                    <dd className="text-right font-medium text-text-primary">
                      {study.role}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="font-mono text-text-muted">CONTEXT:</dt>
                    <dd className="text-right font-medium text-text-primary">
                      {study.clientOrContext}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="font-mono text-text-muted">YEAR:</dt>
                    <dd className="tabular-nums font-mono text-text-primary">
                      {study.year}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6">
                {study.liveUrl ? (
                  <a
                    href={study.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-scale flex w-full items-center justify-between bg-accent-primary px-4 py-3 font-mono text-xs font-semibold text-white hover:opacity-95"
                  >
                    <span>VISIT LIVE PRODUCTION SITE</span>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <div className="border border-border-subtle bg-bg-primary px-4 py-3 text-center font-mono text-xs text-text-secondary">
                    INTERNAL / CLIENT PRODUCTION SYSTEM
                  </div>
                )}
              </div>
            </TechBracketCard>
          </div>

          {/* 3-Column Verified Metrics HUD Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {study.verifiedMetrics.map((metric, idx) => (
              <TechBracketCard
                key={idx}
                bracketSize="sm"
                className="p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-text-muted">
                    {`METRIC // 0${idx + 1}`}
                  </span>
                  <CheckCircle2
                    className="h-4 w-4 text-accent-emerald"
                    aria-hidden="true"
                  />
                </div>
                <p className="tabular-nums mt-2 font-display text-4xl tracking-wide text-accent-primary sm:text-5xl">
                  {metric.value}
                </p>
                <h2 className="mt-1 font-mono text-xs font-semibold text-text-primary">
                  {metric.label}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {metric.detail}
                </p>
              </TechBracketCard>
            ))}
          </div>
        </header>

        {/* 2. DUMMY PHOTO & INTERFACE GALLERY SECTION (Requested for /projects/[slug]) */}
        <section
          aria-labelledby="gallery-heading"
          className="mt-14 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2 font-mono text-xs text-accent-primary">
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span>{"VISUAL DOCUMENTATION & INTERFACE SNAPSHOTS"}</span>
            </div>
            <span className="font-mono text-xs text-text-muted">
              {study.dummyGallery.length} FRAMES CAPTURED
            </span>
          </div>

          {/* Hero Banner Dummy Photo */}
          <TechBracketCard bracketSize="lg" className="overflow-hidden p-3 sm:p-4">
            <div className="relative aspect-[16/9] w-full overflow-hidden border border-border-subtle bg-bg-primary sm:aspect-[21/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={study.previewImage.src}
                alt={study.previewImage.alt}
                className="h-full w-full object-cover object-top opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
                <div className="border border-border-strong bg-bg-primary/90 px-3.5 py-2 backdrop-blur-xs">
                  <p className="font-mono text-[10px] text-accent-primary">
                    PRIMARY SYSTEM SHOWCASE // {study.shortTitle.toUpperCase()}
                  </p>
                  <p className="text-xs font-medium text-text-primary sm:text-sm">
                    {study.previewImage.alt}
                  </p>
                </div>
              </div>
            </div>
          </TechBracketCard>

          {/* 3-Column Dummy Photo Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {study.dummyGallery.map((photo) => (
              <TechBracketCard
                key={photo.id}
                bracketSize="md"
                className="flex flex-col justify-between overflow-hidden p-4"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden border border-border-subtle bg-bg-primary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-85 transition-transform duration-300 ease-out hover:scale-105"
                    />
                    <span className="absolute top-2 left-2 border border-border-strong bg-bg-primary/90 px-2 py-0.5 font-mono text-[10px] text-accent-primary">
                      {photo.tag}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-2xl tracking-wide text-text-primary">
                    {photo.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {photo.caption}
                  </p>
                </div>
              </TechBracketCard>
            ))}
          </div>
        </section>

        {/* 3. Deep-Dive Engineering Breakdown & Architecture Blueprint */}
        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left 4 Cols: Tech Stack & Quick TOC */}
          <div className="space-y-6 lg:col-span-4">
            <TechBracketCard bracketSize="md" className="p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3 font-mono text-xs text-accent-primary">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>TECHNOLOGY STACK</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {study.techStack.map((t) => (
                  <span
                    key={t.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-primary px-3 py-1.5 font-mono text-xs text-text-primary"
                  >
                    <BrandTechIcon
                      name={t.name}
                      className="text-accent-primary"
                    />
                    <span>{t.name}</span>
                  </span>
                ))}
              </div>

              <div className="mt-6 border-t border-border-subtle pt-4">
                <p className="font-mono text-[11px] text-text-muted">
                  ARCHITECTURAL SECTIONS
                </p>
                <nav
                  aria-label="Case study sections"
                  className="mt-3 flex flex-col space-y-2 font-mono text-xs"
                >
                  <a
                    href="#overview"
                    className="text-text-secondary hover:text-accent-primary"
                  >
                    {"01 // Problem & Bottleneck"}
                  </a>
                  <a
                    href="#system-analysis"
                    className="text-text-secondary hover:text-accent-primary"
                  >
                    {"02 // System Analysis"}
                  </a>
                  <a
                    href="#architecture"
                    className="text-text-secondary hover:text-accent-primary"
                  >
                    {"03 // Architecture Blueprint"}
                  </a>
                  <a
                    href="#execution"
                    className="text-text-secondary hover:text-accent-primary"
                  >
                    {"04 // Engineering Decisions"}
                  </a>
                  <a
                    href="#outcomes"
                    className="text-text-secondary hover:text-accent-primary"
                  >
                    {"05 // Impact & Outcomes"}
                  </a>
                </nav>
              </div>
            </TechBracketCard>
          </div>

          {/* Right 8 Cols: Narrative Sections */}
          <div className="space-y-8 lg:col-span-8">
            {/* 01 // Overview */}
            <TechBracketCard
              as="section"
              bracketSize="md"
              className="p-6 sm:p-8"
            >
              <div id="overview" className="space-y-4">
                <span className="font-mono text-xs text-accent-primary">
                  {"01 // BUSINESS CONTEXT & OPERATIONAL BOTTLENECK"}
                </span>
                <h2 className="font-display text-3xl tracking-wide text-text-primary sm:text-4xl">
                  {study.problemStatement.headline}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-text-secondary sm:text-base">
                  {study.problemStatement.contextParagraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                <div className="mt-4 border border-border-subtle bg-bg-primary p-4">
                  <p className="font-mono text-xs text-text-primary">
                    IDENTIFIED PAIN POINTS:
                  </p>
                  <ul className="mt-2.5 space-y-2 text-xs text-text-secondary sm:text-sm">
                    {study.problemStatement.painPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent-primary" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TechBracketCard>

            {/* 02 // System Analysis */}
            <TechBracketCard
              as="section"
              bracketSize="md"
              className="p-6 sm:p-8"
            >
              <div id="system-analysis" className="space-y-4">
                <span className="font-mono text-xs text-accent-emerald">
                  {"02 // SYSTEM ANALYSIS & DATA MODELING"}
                </span>
                <h2 className="font-display text-3xl tracking-wide text-text-primary sm:text-4xl">
                  {study.systemAnalysis.headline}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-text-secondary sm:text-base">
                  {study.systemAnalysis.methodologyParagraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                <div className="mt-4 border border-border-subtle bg-bg-primary p-4">
                  <p className="font-mono text-xs text-text-primary">
                    WORKFLOW &amp; SCHEMA SPECIFICATIONS:
                  </p>
                  <ul className="mt-2.5 space-y-2 text-xs text-text-secondary sm:text-sm">
                    {study.systemAnalysis.keySchemaOrWorkflowBullets.map(
                      (bullet, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <ShieldCheck
                            className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald"
                            aria-hidden="true"
                          />
                          <span>{bullet}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </TechBracketCard>

            {/* 03 // Architecture Blueprint */}
            <div id="architecture">
              <ArchitectureDiagram blueprint={study.architectureBlueprint} />
            </div>

            {/* 04 // Key Engineering Decisions */}
            <TechBracketCard
              as="section"
              bracketSize="md"
              className="p-6 sm:p-8"
            >
              <div id="execution" className="space-y-5">
                <span className="font-mono text-xs text-accent-primary">
                  {"04 // KEY ENGINEERING DECISIONS"}
                </span>
                <h2 className="font-display text-3xl tracking-wide text-text-primary sm:text-4xl">
                  {study.engineeringExecution.headline}
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {study.engineeringExecution.decisions.map((decision, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col justify-between border border-border-subtle bg-bg-primary p-5"
                    >
                      <div>
                        <span className="font-mono text-[11px] text-accent-primary">
                          {`DECISION // 0${idx + 1}`}
                        </span>
                        <h3 className="mt-1 font-display text-2xl tracking-wide text-text-primary">
                          {decision.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
                          {decision.description}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
                        {decision.techTags.map((tag) => (
                          <span
                            key={tag}
                            className="border border-border-subtle bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TechBracketCard>

            {/* 05 // Impact & Outcomes */}
            <TechBracketCard
              as="section"
              bracketSize="md"
              className="p-6 sm:p-8"
            >
              <div id="outcomes" className="space-y-5">
                <span className="font-mono text-xs text-accent-emerald">
                  {"05 // QUANTIFIABLE IMPACT & OUTCOMES"}
                </span>
                <h2 className="font-display text-3xl tracking-wide text-text-primary sm:text-4xl">
                  BEFORE VS. AFTER INTERVENTION
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
                  {study.impactAndOutcomes.summary}
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {study.impactAndOutcomes.beforeAfterComparison.map(
                    (row, idx) => (
                      <div
                        key={idx}
                        className="border border-border-subtle bg-bg-primary p-4"
                      >
                        <p className="font-mono text-xs font-semibold text-accent-primary">
                          {row.dimension.toUpperCase()}
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="border-l-2 border-border-strong pl-3">
                            <span className="font-mono text-[10px] text-text-muted">
                              BEFORE:
                            </span>
                            <p className="mt-0.5 text-xs text-text-secondary">
                              {row.before}
                            </p>
                          </div>
                          <div className="border-l-2 border-accent-emerald pl-3">
                            <span className="font-mono text-[10px] text-accent-emerald">
                              AFTER:
                            </span>
                            <p className="mt-0.5 text-xs font-medium text-text-primary">
                              {row.after}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TechBracketCard>
          </div>
        </div>

        {/* 4. Adjacent Case Study Navigation */}
        <nav
          aria-label="Adjacent case studies"
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <Link href={`/projects/${prev.slug}`} className="press-scale block">
            <TechBracketCard bracketSize="md" className="p-6">
              <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <ArrowLeft className="h-3.5 w-3.5 text-accent-primary" />
                <span>PREVIOUS ({prev.index})</span>
              </div>
              <p className="mt-2 font-display text-3xl tracking-wide text-text-primary">
                {prev.title}
              </p>
              <p className="font-mono text-xs text-text-secondary">
                {prev.subtitle}
              </p>
            </TechBracketCard>
          </Link>

          <Link href={`/projects/${next.slug}`} className="press-scale block">
            <TechBracketCard bracketSize="md" className="p-6 text-right">
              <div className="flex items-center justify-end gap-2 font-mono text-xs text-text-muted">
                <span>NEXT ({next.index})</span>
                <ArrowRight className="h-3.5 w-3.5 text-accent-primary" />
              </div>
              <p className="mt-2 font-display text-3xl tracking-wide text-text-primary">
                {next.title}
              </p>
              <p className="font-mono text-xs text-text-secondary">
                {next.subtitle}
              </p>
            </TechBracketCard>
          </Link>
        </nav>
      </article>

      <ContactFooter />
    </main>
  );
}
