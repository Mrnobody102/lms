export const DEFAULT_COURSE_COVER =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80';

export function getSafeCourseCoverUrl(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_COURSE_COVER;
  }

  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : DEFAULT_COURSE_COVER;
  } catch {
    return DEFAULT_COURSE_COVER;
  }
}
