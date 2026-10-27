import { NextResponse } from "next/server";
import type { GithubContributionDay } from "@/data/portfolio";

interface GithubContributionsApiResponse {
  readonly username: string;
  readonly year: number;
  readonly totalContributions: number;
  readonly source: "github-graphql" | "github-public-api" | "github-html";
  readonly weeks: readonly (readonly GithubContributionDay[])[];
}

const LEVEL_MAP: Record<string, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

function clampLevel(val: number): 0 | 1 | 2 | 3 | 4 {
  if (val <= 0) return 0;
  if (val === 1) return 1;
  if (val === 2) return 2;
  if (val === 3) return 3;
  return 4;
}

/**
 * Groups a flat array of daily contributions (sorted ascending by date)
 * into 52-53 columns of 7 days (Sunday -> Saturday), padding the first and last
 * week so every column has exactly 7 cells.
 */
function groupDaysIntoWeeks(
  days: readonly GithubContributionDay[],
  year: number
): readonly (readonly GithubContributionDay[])[] {
  if (days.length === 0) return [];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(`${sorted[0].date}T00:00:00Z`);
  const firstDayOfWeek = Number.isNaN(firstDate.getUTCDay())
    ? 0
    : firstDate.getUTCDay();

  const paddedDays: GithubContributionDay[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    paddedDays.push({
      date: `${year}-01-00`,
      count: 0,
      level: 0,
    });
  }

  for (const day of sorted) {
    paddedDays.push(day);
  }

  while (paddedDays.length % 7 !== 0) {
    paddedDays.push({
      date: `${year}-12-32`,
      count: 0,
      level: 0,
    });
  }

  const weeks: GithubContributionDay[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  // Keep most recent 53 weeks max (or 52-53 standard full year)
  return weeks;
}

/**
 * Tier 1: Official GitHub GraphQL API (Requires GITHUB_TOKEN in .env.local)
 * Supports private + public contributions when token has `read:user`.
 */
async function fetchViaGraphQL(
  username: string,
  year: number,
  token: string
): Promise<GithubContributionsApiResponse | null> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "portofolio-aryo-telemetry",
    },
    body: JSON.stringify({
      query,
      variables: { username, from, to },
    }),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: {
      user?: {
        contributionsCollection?: {
          contributionCalendar?: {
            totalContributions: number;
            weeks: {
              contributionDays: {
                date: string;
                contributionCount: number;
                contributionLevel: string;
              }[];
            }[];
          };
        };
      };
    };
  };

  const calendar =
    json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) return null;

  const flatDays: GithubContributionDay[] = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      flatDays.push({
        date: day.date,
        count: day.contributionCount,
        level: LEVEL_MAP[day.contributionLevel] ?? 0,
      });
    }
  }

  return {
    username,
    year,
    totalContributions: calendar.totalContributions,
    source: "github-graphql",
    weeks: groupDaysIntoWeeks(flatDays, year),
  };
}

/**
 * Tier 2A: Zero-Config Public GitHub Contributions API (jogruber.de)
 * Works immediately without any API token.
 */
async function fetchViaPublicApi(
  username: string,
  year: number
): Promise<GithubContributionsApiResponse | null> {
  const res = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=${year}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "portofolio-aryo-telemetry",
      },
    }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    total?: Record<string, number>;
    contributions?: {
      date: string;
      count: number;
      level: number;
    }[];
  };

  if (!Array.isArray(data.contributions) || data.contributions.length === 0) {
    return null;
  }

  const days: GithubContributionDay[] = data.contributions.map((item) => ({
    date: item.date,
    count: item.count,
    level: clampLevel(item.level),
  }));

  const totalFromSum = days.reduce((acc, d) => acc + d.count, 0);
  const totalContributions =
    typeof data.total?.[String(year)] === "number"
      ? data.total[String(year)]
      : totalFromSum;

  return {
    username,
    year,
    totalContributions,
    source: "github-public-api",
    weeks: groupDaysIntoWeeks(days, year),
  };
}

/**
 * Tier 2B: Direct GitHub Public Contributions HTML Fragment Parser
 * Fallback if third-party public proxy is unreachable.
 */
async function fetchViaGithubHtml(
  username: string,
  year: number
): Promise<GithubContributionsApiResponse | null> {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${year}-01-01&to=${year}-12-31`;
  const res = await fetch(url, {
    headers: {
      Accept: "text/html",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (compatible; portofolio-aryo/1.0)",
    },
  });

  if (!res.ok) return null;
  const html = await res.text();

  const days: GithubContributionDay[] = [];
  const cellRegex =
    /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"/g;
  let match: RegExpExecArray | null = cellRegex.exec(html);

  while (match !== null) {
    const date = match[1];
    const level = clampLevel(Number(match[2]));
    const approxCount = level === 0 ? 0 : level === 1 ? 2 : level === 2 ? 5 : level === 3 ? 9 : 14;
    days.push({ date, count: approxCount, level });
    match = cellRegex.exec(html);
  }

  if (days.length === 0) return null;

  const headingMatch = html.match(/([\d,]+)\s+contributions?\s+in\s+\d{4}/i);
  const parsedTotal = headingMatch
    ? Number(headingMatch[1].replace(/,/g, ""))
    : days.reduce((acc, d) => acc + d.count, 0);

  return {
    username,
    year,
    totalContributions: Number.isNaN(parsedTotal) ? 0 : parsedTotal,
    source: "github-html",
    weeks: groupDaysIntoWeeks(days, year),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim() || "aryomcz";
  const yearParam = Number(searchParams.get("year"));
  const currentYear = new Date().getFullYear();
  const year =
    Number.isInteger(yearParam) && yearParam >= 2008 && yearParam <= currentYear + 1
      ? yearParam
      : currentYear;

  const token = process.env.GITHUB_TOKEN?.trim();

  try {
    if (token) {
      const graphqlData = await fetchViaGraphQL(username, year, token);
      if (graphqlData) {
        return NextResponse.json(graphqlData, {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      }
    }

    const publicApiData = await fetchViaPublicApi(username, year);
    if (publicApiData) {
      return NextResponse.json(publicApiData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }

    const htmlData = await fetchViaGithubHtml(username, year);
    if (htmlData) {
      return NextResponse.json(htmlData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }

    return NextResponse.json(
      { error: "Unable to fetch GitHub contributions" },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch GitHub contributions" },
      { status: 500 }
    );
  }
}
