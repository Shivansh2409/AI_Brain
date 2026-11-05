import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build to static files (out/) so Express can serve them from backend/public
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
