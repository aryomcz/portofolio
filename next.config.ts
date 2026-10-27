import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
      (rule: any) => typeof rule === "object" && rule && Array.isArray(rule.oneOf)
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
