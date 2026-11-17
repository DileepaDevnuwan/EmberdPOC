import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/:mode/assets/:path*", destination: "/assets/:path*" }];
  },
};

export default nextConfig;
