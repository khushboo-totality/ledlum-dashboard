/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser Supabase client (lib/supabaseClient.ts) needs these two —
  // only NEXT_PUBLIC_* vars reach the browser by default, so pass them in
  // explicitly. Both are safe to expose: the project URL, and the public anon
  // key (limited by row-level security). They're inlined at BUILD time, so
  // they must be available to the build. Never add secrets here.
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
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
