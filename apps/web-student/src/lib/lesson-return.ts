export function getReturnLessonHref(returnLessonId: string | null) {
  return returnLessonId ? `/lessons/${encodeURIComponent(returnLessonId)}` : null;
}

export function withReturnLessonId(path: string, returnLessonId: string | null) {
  if (!returnLessonId) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}returnLessonId=${encodeURIComponent(returnLessonId)}`;
}
