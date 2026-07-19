/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't fail production builds on lint-only issues (e.g. react/no-unescaped-entities).
  // Lint still runs in dev and via `next lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Allow image uploads through Server Actions. Default is 1 MB, which is too
    // small for photos. Kept comfortably above the 4.5 MB per-image upload cap.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Allow remote images from common storage providers. These are safe hosts;
    // add your own storage domain here if you use a different provider.
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Never expose server-only secrets to the browser. Only public-safe values
  // (measurement IDs, verification tokens) are read via NEXT_PUBLIC_ vars where needed.
  poweredByHeader: false,
};

export default nextConfig;
