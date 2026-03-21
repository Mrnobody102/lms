const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/shared', '@repo/ui', '@repo/api-client'],
  output: 'standalone',
  skipTrailingSlashRedirect: true,
};

module.exports = withNextIntl(nextConfig);
