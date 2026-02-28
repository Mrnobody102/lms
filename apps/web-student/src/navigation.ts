import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "@repo/shared";

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales: locales as unknown as string[],
  defaultLocale,
  localePrefix: "always",
});
