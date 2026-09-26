import type { NextConfig } from "next";
import path from "node:path";

/**
 * Local `next dev` proxies the desk API to uvicorn. A production build must
 * not embed a loopback address. On Vercel, vercel.json routes these paths to
 * the Python service. `next build` sets NODE_ENV=production, and Vercel also
 * sets VERCEL=1, so neither build keeps the proxy.
 */
function localFathomRewrites(): { source: string; destination: string }[] {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return [];
  const api = process.env.FATHOM_API_URL || process.env.API_PROXY_URL || "http://127.0.0.1:8741";
  return [
    { source: "/fathom/api/:path*", destination: `${api}/fathom/api/:path*` },
    { source: "/fathom/Monitoring/:path*", destination: `${api}/fathom/Monitoring/:path*` },
    { source: "/fathom/openapi.json", destination: `${api}/fathom/openapi.json` },
    { source: "/fathom/docs", destination: `${api}/fathom/docs` },
    { source: "/fathom/docs/:path*", destination: `${api}/fathom/docs/:path*` },
    { source: "/fathom/redoc", destination: `${api}/fathom/redoc` },
  ];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/research", destination: "/property/research", permanent: true },
      { source: "/cache", destination: "/property/cache", permanent: true },
      { source: "/settings", destination: "/property/settings", permanent: true },
    ];
  },
  async rewrites() {
    return { beforeFiles: localFathomRewrites() };
  },
};

export default nextConfig;
