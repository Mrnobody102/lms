import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale } from '@repo/shared';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const baseLocale = locale || defaultLocale;
  // Validate that the incoming `locale` parameter is valid
  if (!isLocale(baseLocale)) {
    const fallbackLocale = defaultLocale;
    const messages = (await import(`../messages/${fallbackLocale}.json`)).default;
    return { locale: fallbackLocale, messages };
  }

  return {
    locale: baseLocale,
    messages: (await import(`../messages/${baseLocale}.json`)).default,
  };
});
