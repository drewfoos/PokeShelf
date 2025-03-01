import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['images.pokemontcg.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '**',
      },
    ],
  },
  
  // Add security headers
  headers: async () => {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // First use Report-Only to find any issues without breaking functionality
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.pokeshelf.com https://challenges.cloudflare.com https://cdnjs.cloudflare.com;
              connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://api.clerk.dev https://api.pokemontcg.io https://*.mongodb-api.com;
              img-src 'self' data: https://images.pokemontcg.io https://img.clerk.com;
              worker-src 'self' blob:;
              style-src 'self' 'unsafe-inline';
              frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com;
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim()
          },
        ],
      },
    ];
  },
};

export default nextConfig;