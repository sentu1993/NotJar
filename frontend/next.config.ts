import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiDestination = process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000/api/:path*'
      : '/_/backend/api/:path*';

    const trackerDestination = process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000/tracker.js'
      : '/_/backend/tracker.js';

    return [
      {
        source: '/api/:path*',
        destination: apiDestination,
      },
      {
        source: '/tracker.js',
        destination: trackerDestination,
      },
    ];
  },
};

export default nextConfig;
