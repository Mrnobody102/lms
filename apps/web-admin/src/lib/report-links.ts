export function withCohortQuery(path: string, cohortId?: string) {
  if (!cohortId) return path;
  const params = new URLSearchParams({ cohortId });
  return `${path}?${params.toString()}`;
}

export function buildReportCsvPath(path: string, filters: { cohortId?: string }) {
  return withCohortQuery(path, filters.cohortId);
}
