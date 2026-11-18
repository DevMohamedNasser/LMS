import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",//https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAK9aqGHOKkKZDOqB55kAZsev2Eyk0GTlJ0p1HDGgGMA&s=10
        hostname: "encrypted-tbn0.gstatic.com",
        pathname: "/images/**",
      },
    ],
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
