/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    // required to be an object, not boolean
    serverActions: {},
  },
};

export default nextConfig;
