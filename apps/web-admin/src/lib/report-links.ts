export function withCohortQuery(path: string, cohortId?: string) {
  if (!cohortId) return path;
  const params = new URLSearchParams({ cohortId });
  return `${path}?${params.toString()}`;
}

export function buildReportCsvPath(
  path: string,
  filters: { cohortId?: string; startDate?: string; endDate?: string },
) {
  const params = new URLSearchParams();
  if (filters.cohortId) params.append('cohortId', filters.cohortId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
