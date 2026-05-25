export const DURATION_PATTERN = /^\d+(ms|s|m|h|d)$/;
const DURATION_CAPTURE_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

const DURATION_UNIT_TO_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

export function parseDurationToMs(value: string): number {
  const match = value.match(DURATION_CAPTURE_PATTERN);

  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof DURATION_UNIT_TO_MS;

  return amount * DURATION_UNIT_TO_MS[unit];
}
