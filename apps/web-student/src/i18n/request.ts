import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale } from '@repo/shared';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const baseLocale = locale || defaultLocale;
  // Validate that the incoming `locale` parameter is valid
  if (!isLocale(baseLocale)) {
    // Fallback to default locale to prevent crashing
    const fallbackLocale = defaultLocale;
    return {
      locale: fallbackLocale,
      messages: (await import(`../messages/${fallbackLocale}.json`)).default,
    };
  }

  return {
    locale: baseLocale,
    messages: (await import(`../messages/${baseLocale}.json`)).default,
  };
});
