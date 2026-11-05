import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  devIndicators: false,
  basePath: "/ICGIT",
  productionBrowserSourceMaps: false,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: false
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "maps.geoapify.com"
      }
    ]
  }
};

export default nextConfig;
