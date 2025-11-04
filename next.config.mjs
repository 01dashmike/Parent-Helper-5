/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      console.log("⚙️ Disabled Webpack persistent cache for dev mode");
    }
    return config;
  },
};

export default nextConfig;
