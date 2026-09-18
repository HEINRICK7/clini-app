import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // The CLI mode emits no captured output with Node 24; the API mode keeps
    // Next's type checking enabled and works consistently in CI and locally.
    useTypeScriptCli: false,
  },
  async rewrites() {
    const apiOrigin = process.env.CLINI_INTERNAL_API_URL ?? "http://localhost:8080";

    return [{
      source: "/api/v1/:path*",
      destination: `${apiOrigin}/api/v1/:path*`,
    }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
