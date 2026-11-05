import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build to static files (out/) so Express can serve them from backend/public
  output: "export",
  // Emit auth/login/index.html instead of auth/login.html. Next 16 also writes an
  // auth/login/ folder (prefetch segments), so express.static would otherwise
  // redirect /auth/login -> /auth/login/ and 404.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
