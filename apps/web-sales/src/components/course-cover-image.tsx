'use client';

import { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { DEFAULT_COURSE_COVER, getSafeCourseCoverUrl } from '@/lib/course-images';

type CourseCoverImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  /** Raw cover URL from the course payload; may be null/invalid. */
  coverUrl: string | null | undefined;
};

/**
 * Renders a course cover with a resilient fallback. The source is sanitized
 * (only http/https URLs pass through) and any runtime load failure — e.g. a
 * dead S3 link or a removed image — falls back to the default cover so the
 * card never shows a broken-image placeholder.
 */
export function CourseCoverImage({ coverUrl, alt, ...rest }: CourseCoverImageProps) {
  const safeUrl = getSafeCourseCoverUrl(coverUrl);
  const [src, setSrc] = useState(safeUrl);

  // Reset when the incoming cover changes (e.g. navigating between courses).
  useEffect(() => {
    setSrc(safeUrl);
  }, [safeUrl]);

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      onError={() => {
        if (src !== DEFAULT_COURSE_COVER) {
          setSrc(DEFAULT_COURSE_COVER);
        }
      }}
    />
  );
}
