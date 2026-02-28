import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@repo/shared";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const baseLocale = locale || defaultLocale;
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(baseLocale as any)) {
    return {
      locale: baseLocale,
      messages: {},
    };
  }

  let messages;
  switch (baseLocale) {
    case "vi":
      messages = (await import("../messages/vi.json")).default;
      break;
    case "en":
      messages = (await import("../messages/en.json")).default;
      break;
    default:
      messages = (await import("../messages/vi.json")).default;
  }

  return {
    locale: baseLocale,
    messages,
  };
});
