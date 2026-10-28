import type { ExperienceEntry } from "@/data/portfolio";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { ExperienceCard } from "@/components/ui/ExperienceCard";
import {
  ExperienceTracks,
  type ExperienceTrack,
} from "@/components/sections/ExperienceTracks";

function TrackTimeline({ entries }: { readonly entries: readonly ExperienceEntry[] }) {
  return (
    <ol className="relative space-y-8 pl-8 sm:pl-12">
      {/* Vertical spine */}
      <span
        className="absolute top-6 bottom-6 left-[7.5px] w-px bg-border-subtle"
        aria-hidden="true"
      />
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          {/* Spine node */}
          <span
            className="absolute top-6 -left-8 flex h-4 w-4 items-center justify-center border border-accent-primary bg-bg-primary sm:-left-12"
            aria-hidden="true"
          >
            <span className="h-2 w-2 bg-accent-primary" />
          </span>
          <ExperienceCard entry={entry} />
        </li>
      ))}
    </ol>
  );
}

/**
 * Experience section split into two explicit tracks:
 * Professional Work Experience and Organizational & Leadership Experience.
 * Cards render on the server; only the tab switcher ships as client JS.
 */
export function ExperienceSection() {
  const { workExperiences, organizationalExperiences } = PORTFOLIO_DATA;

  const tracks: ExperienceTrack[] = [];
  if (workExperiences.length > 0) {
    tracks.push({
      id: "work",
      label: "WORK EXPERIENCE",
      shortLabel: "WORK",
      count: workExperiences.length,
      panel: <TrackTimeline entries={workExperiences} />,
    });
  }
  if (organizationalExperiences.length > 0) {
    tracks.push({
      id: "organization",
      label: "ORGANIZATIONAL LEADERSHIP",
      shortLabel: "LEADERSHIP",
      count: organizationalExperiences.length,
      panel: <TrackTimeline entries={organizationalExperiences} />,
    });
  }

  if (tracks.length === 0) return null;

  return <ExperienceTracks tracks={tracks} />;
}
