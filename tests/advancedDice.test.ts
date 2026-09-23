import { describe, it, expect } from 'vitest';
import { parseAdvancedDiceFormula, rollAdvancedDice, buildFormulaFromQuantities } from '../src/utils/advancedDice';

describe('Advanced Dice Parser and Roller', () => {
  it('should parse simple dice formula with modifier', () => {
    const parsed = parseAdvancedDiceFormula('1d20+5');
    expect(parsed).not.toBeNull();
    expect(parsed?.groups.length).toBe(1);
    expect(parsed?.groups[0].count).toBe(1);
    expect(parsed?.groups[0].sides).toBe(20);
    expect(parsed?.modifier).toBe(5);
    expect(parsed?.cleanFormula).toBe('1d20 + 5');
  });

  it('should parse multi-dice formulas with multiple types', () => {
    const parsed = parseAdvancedDiceFormula('2d20kh1 + 1d8 + 2d6 - 3');
    expect(parsed).not.toBeNull();
    expect(parsed?.groups.length).toBe(3);
    expect(parsed?.groups[0].count).toBe(2);
    expect(parsed?.groups[0].sides).toBe(20);
    expect(parsed?.groups[0].keepMode).toBe('kh');
    expect(parsed?.groups[0].keepCount).toBe(1);

    expect(parsed?.groups[1].count).toBe(1);
    expect(parsed?.groups[1].sides).toBe(8);

    expect(parsed?.groups[2].count).toBe(2);
    expect(parsed?.groups[2].sides).toBe(6);

    expect(parsed?.modifier).toBe(-3);
  });

  it('should roll dice with predictable sequence and calculate correct totals', () => {
    // Mock random returning 0.5 (which is 11 on d20, 4 on d6)
    let seq = [0.99, 0.05, 0.49]; // on d20 -> 20, 2; on d6 -> 3
    let index = 0;
    const mockRandom = () => {
      const val = seq[index % seq.length];
      index++;
      return val;
    };

    const result = rollAdvancedDice('2d20kh1 + 1d6 + 3', 'Guerreiro', 'Ataque Crítico', mockRandom);
    expect(result.groups.length).toBe(2);
    // d20 group kept highest (20 vs 2) -> kept 20, dropped 2
    expect(result.groups[0].keptRolls).toEqual([20]);
    expect(result.groups[0].droppedRolls).toEqual([2]);
    expect(result.groups[0].isCriticalSuccess).toBe(true);

    // d6 group rolled 3
    expect(result.groups[1].keptRolls).toEqual([3]);

    // Total: 20 + 3 + 3 = 26
    expect(result.total).toBe(26);
    expect(result.isCriticalSuccess).toBe(true);
    expect(result.isCriticalFail).toBe(false);
  });

  it('should build formula from standard dice quantities and advantage mode', () => {
    const formula = buildFormulaFromQuantities({ d20: 1, d6: 2, d4: 1 }, 4, 'advantage');
    expect(formula).toBe('2d20kh1 + 1d4 + 2d6 + 4');
  });

  it('should handle d100 rolls properly', () => {
    const parsed = parseAdvancedDiceFormula('1d100');
    expect(parsed).not.toBeNull();
    expect(parsed?.groups[0].sides).toBe(100);
  });
});
