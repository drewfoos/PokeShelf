import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['images.pokemontcg.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**',
      },
    ],
    // Add these optimizations:
    minimumCacheTTL: 31536000, // Cache for 1 year (in seconds)
    formats: ['image/webp'], // Prefer WebP format for better compression
    deviceSizes: [640, 750, 1080, 1200, 1920], // Limit to essential sizes
    imageSizes: [16, 32, 64, 128, 256], // Limit image sizes
    // Optional: adjust quality for all images (default is 75)
    // quality: 75,
  },
};

export default nextConfig;