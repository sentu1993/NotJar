import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:5000/api/:path*'
          : '/api/:path*',
      },
      {
        source: '/tracker.js',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:5000/tracker.js'
          : '/tracker.js',
      },
    ];
  },
};

export default nextConfig;
