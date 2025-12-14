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
    ],
  },
};

export default nextConfig;
