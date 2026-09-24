/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product photos on R2 are the raw uploads — many are 2–5 MB JPEGs/PNGs.
    // Letting next/image resize + convert them to WebP per card size is what
    // keeps the catalog grid light; don't turn `unoptimized` back on.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

module.exports = nextConfig
