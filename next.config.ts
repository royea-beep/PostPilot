import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@royea/shared-utils', '@royea/prompt-guard', '@royea/flush-queue', '@royea/url-guard'],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
    ],
  },
};

export default nextConfig;
