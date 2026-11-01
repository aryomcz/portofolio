import { NextResponse } from "next/server";
import { PORTFOLIO_DATA } from "@/data/portfolio";

interface LanguageEdge {
  readonly size: number;
  readonly node: {
    readonly name: string;
    readonly color: string | null;
  };
}

interface RepoNode {
  readonly name: string;
  readonly isFork?: boolean;
  readonly languages?: {
    readonly edges: readonly LanguageEdge[];
  };
}

export interface GithubLanguageItem {
  readonly language: string;
  readonly percentage: number;
  readonly colorToken: string;
  readonly bytes?: number;
}

// Fallback color mapping for common languages when GitHub color is not returned
const FALLBACK_LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  PHP: "#4F5D95",
  "PHP / Laravel": "#4F5D95",
  Dart: "#00B4AB",
  "Dart / Flutter": "#00B4AB",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  Shell: "#89e051",
  Blade: "#f7523f",
  "Jupyter Notebook": "#da5b0b",
};

/**
 * Tier 1: GitHub GraphQL API (1 single request, returns size and colors for all repos)
 */
async function fetchViaGraphQL(
  username: string,
  token: string,
  filterMarkup: boolean
): Promise<GithubLanguageItem[] | null> {
  const query = `
    query($username: String!) {
      user(login: $username) {
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            name
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "portofolio-aryo-telemetry",
      },
      body: JSON.stringify({ query, variables: { username } }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: {
        user?: {
          repositories?: {
            nodes?: RepoNode[];
          };
        };
      };
    };

    const repos = data?.data?.user?.repositories?.nodes;
    if (!Array.isArray(repos) || repos.length === 0) return null;

    const langStats: Record<string, { size: number; color: string }> = {};

    for (const repo of repos) {
      if (!repo.languages?.edges) continue;
      for (const edge of repo.languages.edges) {
        const name = edge.node.name;
        const color =
          edge.node.color || FALLBACK_LANG_COLORS[name] || "#0e7c86";
        if (!langStats[name]) {
          langStats[name] = { size: 0, color };
        }
        langStats[name].size += edge.size;
      }
    }

    return computePercentages(langStats, filterMarkup);
  } catch {
    return null;
  }
}

/**
 * Tier 2: Public GitHub REST API (Zero token required)
 * Fetches user repos and aggregates top repository languages.
 */
async function fetchViaRestApi(
  username: string,
  filterMarkup: boolean
): Promise<GithubLanguageItem[] | null> {
  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&sort=pushed`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "portofolio-aryo-telemetry",
        },
        next: { revalidate: 86400 },
      }
    );

    if (!reposRes.ok) return null;

    const repos = (await reposRes.json()) as {
      fork: boolean;
      languages_url: string;
      language: string | null;
    }[];

    if (!Array.isArray(repos) || repos.length === 0) return null;

    // Filter non-fork repositories, take up to 12 most recent to stay within public rate limits
    const nonForks = repos.filter((r) => !r.fork).slice(0, 12);
    const langStats: Record<string, { size: number; color: string }> = {};

    await Promise.all(
      nonForks.map(async (repo) => {
        try {
          const langRes = await fetch(repo.languages_url, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "portofolio-aryo-telemetry",
            },
            next: { revalidate: 86400 },
          });
          if (langRes.ok) {
            const raw = (await langRes.json()) as Record<string, number>;
            for (const [lang, bytes] of Object.entries(raw)) {
              if (typeof bytes === "number" && bytes > 0) {
                if (!langStats[lang]) {
                  langStats[lang] = {
                    size: 0,
                    color: FALLBACK_LANG_COLORS[lang] || "#0e7c86",
                  };
                }
                langStats[lang].size += bytes;
              }
            }
          }
        } catch {
          // Ignore individual repo fetch failures
        }
      })
    );

    const items = computePercentages(langStats, filterMarkup);
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

function computePercentages(
  langStats: Record<string, { size: number; color: string }>,
  filterMarkup: boolean
): GithubLanguageItem[] {
  const normalizedStats: Record<string, { size: number; color: string }> = {};

  for (const [lang, data] of Object.entries(langStats)) {
    if (filterMarkup) {
      // Exclude pure markup/styling noise so primary engineering languages are reflected
      if (["CSS", "HTML", "SCSS", "Less", "Pug"].includes(lang)) continue;

      // Group Blade into PHP / Laravel
      if (lang === "Blade" || lang === "PHP") {
        const key = "PHP / Laravel";
        if (!normalizedStats[key]) {
          normalizedStats[key] = { size: 0, color: "#4F5D95" };
        }
        normalizedStats[key].size += data.size;
        continue;
      }

      // Group Jupyter Notebook into Python
      if (lang === "Jupyter Notebook" || lang === "Python") {
        const key = "Python";
        if (!normalizedStats[key]) {
          normalizedStats[key] = { size: 0, color: "#3572A5" };
        }
        normalizedStats[key].size += data.size;
        continue;
      }
    }

    if (!normalizedStats[lang]) {
      normalizedStats[lang] = { ...data };
    } else {
      normalizedStats[lang].size += data.size;
    }
  }

  const totalBytes = Object.values(normalizedStats).reduce(
    (acc, curr) => acc + curr.size,
    0
  );
  if (totalBytes === 0) return [];

  const sorted = Object.entries(normalizedStats)
    .map(([language, { size, color }]) => ({
      language,
      percentage: Number(((size / totalBytes) * 100).toFixed(1)),
      colorToken: color,
      bytes: size,
    }))
    .sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0));

  // Take top 4 or 5 languages with >= 1% share
  const top = sorted.filter((l) => l.percentage >= 1.0).slice(0, 5);

  // Normalize integer percentages to sum to 100%
  const totalTopPercent = top.reduce((acc, curr) => acc + curr.percentage, 0);
  if (totalTopPercent > 0) {
    return top.map((item) => ({
      language: item.language,
      percentage: Math.max(1, Math.round((item.percentage / totalTopPercent) * 100)),
      colorToken: item.colorToken,
      bytes: item.bytes,
    }));
  }

  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username =
    searchParams.get("username") ||
    PORTFOLIO_DATA.githubTelemetry.username ||
    "aryomcz";
  const filterMarkup = searchParams.get("filterMarkup") !== "false";

  const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

  // 1. Try GraphQL if token is available
  if (token) {
    const graphqlResult = await fetchViaGraphQL(username, token, filterMarkup);
    if (graphqlResult && graphqlResult.length > 0) {
      return NextResponse.json({
        username,
        source: "github-graphql",
        languages: graphqlResult,
      });
    }
  }

  // 2. Try REST API as zero-token fallback
  const restResult = await fetchViaRestApi(username, filterMarkup);
  if (restResult && restResult.length > 0) {
    return NextResponse.json({
      username,
      source: "github-rest",
      languages: restResult,
    });
  }

  // 3. Fallback to predefined data if offline / rate-limited
  return NextResponse.json({
    username,
    source: "static-fallback",
    languages: PORTFOLIO_DATA.githubTelemetry.languageDistribution,
  });
}
