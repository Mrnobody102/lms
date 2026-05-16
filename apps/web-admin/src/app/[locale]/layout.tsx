import '@repo/ui/styles.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@repo/ui';
import { QueryProvider } from '@/components/providers';
import { ProgressBar } from '@/components/common/progress-bar';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'LMS Admin',
  description: 'LMS Admin Portal',
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

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
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Suspense fallback={null}>
              <ProgressBar />
            </Suspense>
            <QueryProvider>{children}</QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
