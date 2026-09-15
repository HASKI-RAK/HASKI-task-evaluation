/** Reads a positive number from the environment, falling back on anything unusable. */
export const positiveNumber = (
  raw: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
