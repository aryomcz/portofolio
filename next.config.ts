import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  experimental: {
    agentFeedback: true,
    inlineCss: true,
    optimizePackageImports: [
      "lucide-react",
      "motion",
      "gsap",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/project/:slug*",
        destination: "/projects/:slug*",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  webpack: (config) => {
    const oneOfRule = config.module?.rules?.find(
      (rule: unknown): rule is { oneOf: Array<{ test?: { toString(): string }; use?: Array<{ loader?: string }> }> } =>
        typeof rule === "object" &&
        rule !== null &&
        "oneOf" in rule &&
        Array.isArray((rule as { oneOf?: unknown }).oneOf)
    );
    if (oneOfRule) {
      for (const rule of oneOfRule.oneOf) {
        if (rule.test && rule.test.toString().includes("css")) {
          if (Array.isArray(rule.use)) {
            rule.use.push({
              loader: "@tailwindcss/turbopack",
            });
          }
        }
      }
    }
    return config;
  },
};

export default nextConfig;
