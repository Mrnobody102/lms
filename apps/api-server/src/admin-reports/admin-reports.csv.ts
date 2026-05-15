/**
 * Minimal RFC-4180 CSV builder.
 * Produces UTF-8 text. Caller is responsible for setting Content-Type and Content-Disposition.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

const CR_LF = '\r\n';
// UTF-8 BOM so Excel opens Vietnamese characters correctly.
const UTF8_BOM = String.fromCharCode(0xfeff);

function escapeCell(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const value = String(raw);
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv<T>(rows: readonly T[], columns: ReadonlyArray<CsvColumn<T>>): string {
  const headerLine = columns.map((column) => escapeCell(column.header)).join(',');
  const bodyLines = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(','),
  );
  return `${UTF8_BOM}${[headerLine, ...bodyLines].join(CR_LF)}${CR_LF}`;
}
