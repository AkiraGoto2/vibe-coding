/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "media.giphy.com" },
      { protocol: "https", hostname: "media0.giphy.com" },
      { protocol: "https", hostname: "media1.giphy.com" },
      { protocol: "https", hostname: "media2.giphy.com" },
      { protocol: "https", hostname: "media3.giphy.com" },
      { protocol: "https", hostname: "media4.giphy.com" },
      { protocol: "https", hostname: "v2.exercisedb.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/gif",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;
