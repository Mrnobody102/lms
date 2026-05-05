'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { isLocale, locales, localeNames, type Locale } from '@repo/shared';

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

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
    router.replace(newPath);
    router.refresh(); // Important: clear client cache for translation changes
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 border bg-card/50">
        <Languages className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>

      <div className="absolute right-0 mt-2 w-40 bg-card border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
        {locales.map((loc) => (
          <button
            key={loc}
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
