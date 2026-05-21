const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/shared', '@repo/ui', '@repo/api-client'],
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ['127.0.0.1', '100.117.44.38'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
