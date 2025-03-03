import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 31536000, // Cache for 1 year (in seconds)
    formats: ['image/webp'], // Prefer WebP format for better compression
    deviceSizes: [640, 750, 1080, 1200, 1920], // Limit to essential sizes
    imageSizes: [16, 32, 64, 128, 256], // Limit image sizes
    // quality: 75, // Optional: adjust quality for all images
  },
};

export default nextConfig;
