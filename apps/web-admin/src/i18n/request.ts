import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@repo/shared";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const baseLocale = locale || defaultLocale;
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(baseLocale as any)) {
    const fallbackLocale = defaultLocale;
    const messages = (await import(`../messages/${fallbackLocale}.json`)).default;
    return { locale: fallbackLocale, messages };
  }

  return {
    locale: baseLocale,
    messages: (await import(`../messages/${baseLocale}.json`)).default,
  };
});
