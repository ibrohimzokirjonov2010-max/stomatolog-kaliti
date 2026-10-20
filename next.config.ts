import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return ["bemorlar", "uchrashuvlar", "ombor", "davolash-rejalari", "tolovlar"].map((s) => ({
      source: `/klinika/${s}`,
      destination: `/crm/${s}`,
      permanent: false,
    }));
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.alicdn.com" },
      { protocol: "https", hostname: "**.alibaba.com" },
      { protocol: "https", hostname: "sc01.alicdn.com" },
      { protocol: "https", hostname: "sc04.alicdn.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.telegram-cdn.org" },
      { protocol: "https", hostname: "t.me" },
    ],
  },
};

export default nextConfig;
