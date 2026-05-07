export function getRequestPath(request: {
  originalUrl?: string;
  path?: string;
  url?: string;
}): string {
  const rawPath = request.originalUrl ?? request.path ?? request.url ?? '/';
  return rawPath.split('?')[0] || '/';
}
