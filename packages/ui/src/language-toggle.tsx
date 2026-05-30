'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { isLocale, locales, localeNames, type Locale } from '@repo/shared';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu';

interface LanguageToggleProps {
  menuAlign?: 'start' | 'center' | 'end';
  menuPlacement?: 'bottom' | 'top';
}

export function LanguageToggle({
  menuAlign = 'end',
  menuPlacement = 'bottom',
}: LanguageToggleProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Split pathname: "/vi/dashboard" -> ["", "vi", "dashboard"]
    const pathParts = pathname.split('/');

    // In our apps with localePrefix: "always", the URL starts with /locale/
    // segments[1] should be the current locale
    if (pathParts.length > 1 && isLocale(pathParts[1])) {
      pathParts[1] = newLocale;
    } else {
      // Fallback: prepend the new locale if it's missing
      pathParts.splice(1, 0, newLocale);
    }

    const newPath = pathParts.join('/') || '/';
    const suffix =
      typeof window === 'undefined' ? '' : `${window.location.search}${window.location.hash}`;

    router.replace(`${newPath}${suffix}`, { scroll: false });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 shrink-0 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 border bg-card/50"
        >
          <Languages className="w-4 h-4" />
          <span className="uppercase">{locale}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={menuAlign} side={menuPlacement} className="w-40 rounded-xl z-50">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
              locale === loc
                ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{localeNames[loc]}</span>
            {locale === loc && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
