import { describe, it, expect } from 'vitest';
import { normalizeRouletteSlices, getWinningSliceAtAngle } from '../src/utils/rouletteUtils.js';

describe('Custom Roulette Utilities', () => {
  it('should normalize slice percentages so their sum is strictly 100%', () => {
    const rawSlices = [
      { id: '1', label: 'Sucesso', weight: 10 },
      { id: '2', label: 'Desastre', weight: 5 },
      { id: '3', label: 'Sorte Neutra', weight: 15 }
    ];

    const normalized = normalizeRouletteSlices(rawSlices);
    expect(normalized.length).toBe(3);

    const sum = normalized.reduce((acc, s) => acc + s.percentage, 0);
    expect(Math.round(sum * 10) / 10).toBe(100);
  });

  it('should handle zero or empty weights gracefully', () => {
    const rawSlices = [
      { id: '1', label: 'A', weight: 0 },
      { id: '2', label: 'B', weight: 0 }
    ];

    const normalized = normalizeRouletteSlices(rawSlices);
    expect(normalized.length).toBe(2);
    expect(normalized[0].percentage).toBe(50);
    expect(normalized[1].percentage).toBe(50);
  });

  it('should resolve winning slice given an angular position', () => {
    const slices = [
      { id: 'first', label: 'Primeiro Quarto', weight: 25 },
      { id: 'second', label: 'Segundo Quarto', weight: 25 },
      { id: 'third', label: 'Terceiro Quarto', weight: 25 },
      { id: 'fourth', label: 'Quarto Quarto', weight: 25 }
    ];

    // At 45 degrees, should be in first slice (0..90)
    const win1 = getWinningSliceAtAngle(slices, 45);
    expect(win1?.slice.id).toBe('first');

    // At 120 degrees, should be in second slice (90..180)
    const win2 = getWinningSliceAtAngle(slices, 120);
    expect(win2?.slice.id).toBe('second');

    // At 300 degrees, should be in fourth slice (270..360)
    const win4 = getWinningSliceAtAngle(slices, 300);
    expect(win4?.slice.id).toBe('fourth');
  });
});
