/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Load remote photos straight in the browser. The upstream CDN (Encar)
    // already serves sized images and blocks/slows Next's server-side optimizer,
    // which caused timeouts — so we skip optimization and avoid the /_next/image
    // proxy entirely.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
