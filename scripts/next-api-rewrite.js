/* global module, process */

const LOCAL_API_ORIGIN = 'http://127.0.0.1:4000';

function getApiRewriteDestination() {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!configuredApiUrl && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL is required for production API rewrites');
  }

  const apiOrigin = (configuredApiUrl || LOCAL_API_ORIGIN)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

  return `${apiOrigin}/api/:path*`;
}

module.exports = { getApiRewriteDestination };
