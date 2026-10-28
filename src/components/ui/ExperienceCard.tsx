import { Clock3, MapPin } from "lucide-react";
import type { ExperienceEntry } from "@/data/portfolio";
import { TechBracketCard } from "@/components/ui/TechBracketCard";
import { formatTenure, formatTenureLength } from "@/lib/experience";

/** Captures figures like `15+`, `150+`, `25%` so they can be emphasised. */
const METRIC_PATTERN = /(\d+(?:\.\d+)?\+?%?)/;

function HighlightText({ text }: { readonly text: string }) {
  // `split` with a capture group keeps matches at odd indices.
  const parts = text.split(METRIC_PATTERN);
  return (
    <>
      {parts.map((part, idx) =>
        idx % 2 === 1 ? (
          <strong
            key={idx}
            className="font-semibold text-text-primary tabular-nums"
          >
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

interface ExperienceCardProps {
  readonly entry: ExperienceEntry;
}

/**
 * HUD editorial experience card framed by technical corner brackets.
 * Pure markup — rendered on the server and streamed into the client tab shell.
 */
export function ExperienceCard({ entry }: ExperienceCardProps) {
  const isOngoing = entry.tenure.end === null;
  const tenureLength = formatTenureLength(entry.tenure);
  const typeLabel =
    entry.kind === "work" ? entry.employmentType : entry.organizationType;

  return (
    <TechBracketCard as="article" bracketSize="md" className="p-5 sm:p-7">
      {/* Header: role, organisation, tenure */}
      <header className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-text-muted">{typeLabel}</p>
          <h3 className="mt-1.5 font-display text-2xl leading-[1.05] tracking-wide text-balance text-text-primary sm:text-3xl">
            {entry.role}
          </h3>
          <p className="mt-1.5 text-sm font-medium text-accent-primary">
            {entry.organization}
          </p>
        </div>

        <p
          className={
            isOngoing
              ? "inline-flex shrink-0 items-center gap-2 self-start border border-accent-primary/60 bg-accent-primary/10 px-2.5 py-1 font-mono text-[11px] text-accent-primary tabular-nums"
              : "inline-flex shrink-0 items-center gap-2 self-start border border-border-strong bg-bg-primary px-2.5 py-1 font-mono text-[11px] text-text-primary tabular-nums"
          }
        >
          {isOngoing ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent-primary"
              aria-hidden="true"
            />
          ) : null}
          <time dateTime={entry.tenure.start}>{formatTenure(entry.tenure)}</time>
        </p>
      </header>

      {/* Meta: location + tenure length */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] text-text-muted">
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{entry.location}</span>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{tenureLength ?? "Ongoing"}</span>
        </li>
      </ul>

      {/* Impact statements */}
      <ul className="mt-5 space-y-3">
        {entry.highlights.map((highlight) => (
          <li
            key={highlight}
            className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary sm:text-[15px]"
          >
            <span
              className="mt-[0.55em] h-1.5 w-1.5 shrink-0 bg-accent-primary"
              aria-hidden="true"
            />
            <span className="max-w-[68ch]">
              <HighlightText text={highlight} />
            </span>
          </li>
        ))}
      </ul>

      {/* Technologies & competencies */}
      <ul
        aria-label={`Skills applied at ${entry.organization}`}
        className="mt-6 flex flex-wrap gap-1.5 border-t border-border-subtle pt-4"
      >
        {entry.skills.map((skill) => (
          <li
            key={skill}
            className="border border-border-subtle bg-bg-primary px-2.5 py-1 font-mono text-[11px] text-text-secondary"
          >
            {skill}
          </li>
        ))}
      </ul>
    </TechBracketCard>
  );
}
