import '@repo/ui/styles.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@repo/ui';
import { QueryProvider } from '@/components/providers';

export const metadata: Metadata = {
  title: 'LMS Student',
  description: 'LMS Student Portal',
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales } from '@repo/shared';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const params = await props.params;
  const locale = params.locale;
  const children = props.children;

  // Enable static rendering
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className="font-sans min-h-screen bg-background text-foreground antialiased overflow-x-hidden flex flex-col"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <QueryProvider>{children}</QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
