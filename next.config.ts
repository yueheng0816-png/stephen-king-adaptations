import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // All images are local — no remotePatterns needed (STS2 lesson!)
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // SSG: fully static for ~200 pages (builds in < 2 min)
  // No ISR needed at this scale
  output: undefined, // default: hybrid (SSG + optional SSR)

  // Redirects for common paths
  async redirects() {
    return [
      {
        source: '/movies',
        destination: '/adaptations?type=MOVIE',
        permanent: true,
      },
      {
        source: '/tv',
        destination: '/adaptations?type=TV_SERIES',
        permanent: true,
      },
      {
        source: '/top',
        destination: '/adaptations/top',
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
