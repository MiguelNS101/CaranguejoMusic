export interface RouletteSlice {
  id: string;
  label: string;
  weight: number;
  color?: string;
  probability?: number;
}

/**
 * Normalizes slice weights so the sum of probabilities is exactly 100%.
 */
export function normalizeRouletteSlices<T extends { weight: number }>(
  slices: T[]
): (T & { percentage: number })[] {
  if (!slices || slices.length === 0) return [];

  const totalWeight = slices.reduce((acc, s) => acc + Math.max(0, s.weight || 0), 0);
  if (totalWeight <= 0) {
    const equalPart = Math.round((100 / slices.length) * 10) / 10;
    return slices.map(s => ({ ...s, percentage: equalPart }));
  }

  let accumulated = 0;
  return slices.map((s, idx) => {
    const weight = Math.max(0, s.weight || 0);
    if (idx === slices.length - 1) {
      // Last slice absorbs rounding remainder to ensure exact 100%
      const finalPercent = Math.max(0, Math.round((100 - accumulated) * 10) / 10);
      return { ...s, percentage: finalPercent };
    }
    const pct = Math.round((weight / totalWeight) * 1000) / 10;
    accumulated += pct;
    return { ...s, percentage: pct };
  });
}

/**
 * Determines which slice is selected given an angular pointer in degrees (0 to 360).
 */
export function getWinningSliceAtAngle<T extends { weight: number }>(
  slices: T[],
  angleDegrees: number
): { slice: T; index: number } | null {
  if (!slices || slices.length === 0) return null;

  const normalizedAngle = ((angleDegrees % 360) + 360) % 360;
  const totalWeight = slices.reduce((acc, s) => acc + Math.max(0.001, s.weight || 0), 0);

  let currentDegree = 0;
  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const weight = Math.max(0.001, slice.weight || 0);
    const sliceSpan = (weight / totalWeight) * 360;
    const nextDegree = currentDegree + sliceSpan;

    if (normalizedAngle >= currentDegree && (normalizedAngle < nextDegree || i === slices.length - 1)) {
      return { slice, index: i };
    }
    currentDegree = nextDegree;
  }

  return { slice: slices[0], index: 0 };
}
