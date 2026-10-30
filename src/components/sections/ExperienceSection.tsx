import type { ExperienceEntry } from "@/data/portfolio";
import { PORTFOLIO_DATA } from "@/data/portfolio";
import { ExperienceCard } from "@/components/ui/ExperienceCard";
import {
  ExperienceTracks,
  type ExperienceTrack,
} from "@/components/sections/ExperienceTracks";

function TrackTimeline({ entries }: { readonly entries: readonly ExperienceEntry[] }) {
  return (
    <ol
      data-testid="experience-timeline-list"
      className="experience-timeline-list relative space-y-8 pl-8 sm:pl-12"
    >
      {/* Base Vertical Track Rail */}
      <span
        className="absolute top-6 bottom-6 left-[7px] w-[2px] bg-border-subtle/75"
        aria-hidden="true"
      />
      {/* Scroll-Drawn Active Progress Spine (Animated via GSAP ScrollTrigger scrub) */}
      <span
        style={{ transform: "scaleY(0)", transformOrigin: "top center" }}
        className="experience-timeline-progress-line absolute top-6 bottom-6 left-[7px] w-[2px] bg-gradient-to-b from-accent-primary via-accent-emerald to-accent-primary shadow-[0_0_12px_rgba(14,124,134,0.65)] will-change-transform"
        aria-hidden="true"
      />
      {entries.map((entry) => (
        <li key={entry.id} className="experience-timeline-item relative">
          {/* Spine Node Marker */}
          <span
            className="experience-timeline-node absolute top-6 -left-8 flex h-4 w-4 items-center justify-center border border-accent-primary bg-bg-primary transition-transform duration-300 sm:-left-12"
            aria-hidden="true"
          >
            <span className="experience-timeline-node-dot h-2 w-2 bg-accent-primary" />
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
