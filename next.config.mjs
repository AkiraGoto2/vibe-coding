/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Tauri build (uncomment for production)
  // output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable trailing slashes for Tauri compatibility
  // trailingSlash: false,
}

export default nextConfig
