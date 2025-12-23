/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    // required to be an object, not boolean
    serverActions: {},
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.workoutapi.com',
      },
      {
        // ExerciseDB API GIF images (v2.p.rapidapi.com hosts)
        protocol: 'https',
        hostname: 'v2.exercisedb.io',
      },
      {
        // ExerciseDB API direct images
        protocol: 'https',
        hostname: '*.exercisedb.io',
      },
      {
        // Legacy: Gym-Fit API S3 images (kept for backward compatibility)
        protocol: 'https',
        hostname: 'gym-fit.s3.us-east-1.amazonaws.com',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
