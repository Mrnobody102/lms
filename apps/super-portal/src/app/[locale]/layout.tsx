import '@repo/ui/styles.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@repo/ui';
import { QueryProvider } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Super Portal',
  description: 'LMS Super Admin Portal',
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Toaster } from 'react-hot-toast';

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
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Toaster position="top-right" />
            <QueryProvider>{children}</QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
