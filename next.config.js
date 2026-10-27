/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 2,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.notion.so',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com',
      },
    ],
  },
}

module.exports = nextConfig
