/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@infograph-ai/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
  },
};

export default nextConfig;
