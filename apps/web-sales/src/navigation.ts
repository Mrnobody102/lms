import { createNavigation } from 'next-intl/navigation';
import { defaultLocale, locales } from '@repo/shared';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales: locales as unknown as string[],
  defaultLocale,
  localePrefix: 'always',
});
