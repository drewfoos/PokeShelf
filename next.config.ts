// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Images: bypass built-in optimization if you’re handling images externally.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**',
      },
    ],
  },

  // Caching: set long cache times for all routes and specifically for Next.js image requests.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Experimental features for performance improvements.
  experimental: {
    optimizeCss: true, // Inline critical CSS for faster first paint.
  },

  // Enable React Strict Mode for catching potential issues early.
  reactStrictMode: true,
};

export default nextConfig;
