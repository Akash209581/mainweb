const fs = require('fs');

const content = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
`;

fs.writeFileSync('c:/Users/banda/Desktop/conference-admin/next.config.ts', content, 'utf8');
console.log('Fixed conference-admin next.config.ts successfully');
