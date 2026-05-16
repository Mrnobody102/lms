'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3,
});

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Finish NProgress on route change
    NProgress.done();

    return () => {
      // Start NProgress on unmount (when navigating away)
      // This is a bit tricky in Next.js App Router as there's no official route change events
      // But starting it here works for many cases
      NProgress.start();
    };
  }, [pathname, searchParams]);

  return null;
}
