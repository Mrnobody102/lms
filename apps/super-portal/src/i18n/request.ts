import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale } from '@repo/shared';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const baseLocale = locale || defaultLocale;
  // Validate that the incoming `locale` parameter is valid
  if (!isLocale(baseLocale)) {
    return {
      locale: defaultLocale,
      messages: (await import(`../messages/${defaultLocale}.json`)).default,
    };
  }

  return {
    locale: baseLocale,
    messages: (await import(`../messages/${baseLocale}.json`)).default,
  };
});
