import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sites serves public assets directly. Bypass the runtime image optimizer so
  // deployed product media never depends on a platform-specific proxy route.
  images: { unoptimized: true },
};

export default nextConfig;
