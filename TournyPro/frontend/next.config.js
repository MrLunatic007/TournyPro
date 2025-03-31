/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    poweredByHeader: false,
    images: {
      domains: ['localhost'],
    },
    // Add production-specific configurations
    productionBrowserSourceMaps: false,
    compress: true,
    // Add security headers
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on',
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload',
            },
          ],
        },
      ];
    },
  }
  
  module.exports = nextConfig