'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { isLocale, locales, localeNames, type Locale } from '@repo/shared';
import { cn } from './lib/utils';

interface LanguageToggleProps {
  menuAlign?: 'left' | 'right';
  menuPlacement?: 'bottom' | 'top';
}

export function LanguageToggle({
  menuAlign = 'right',
  menuPlacement = 'bottom',
}: LanguageToggleProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
    window.location.assign(`${newPath}${suffix}`);
  };

  return (
    <div className="relative z-[80]" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 border bg-card/50"
      >
        <Languages className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>

      <div
        role="menu"
        className={cn(
          'absolute w-40 bg-card border rounded-xl shadow-xl transition-all duration-200 z-[90] p-1',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
          menuAlign === 'left' ? 'left-0' : 'right-0',
          menuPlacement === 'top' ? 'bottom-full mb-2' : 'mt-2',
        )}
      >
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            role="menuitem"
            onClick={() => handleLanguageChange(loc)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
              locale === loc
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{localeNames[loc]}</span>
            {locale === loc && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}
