import { describe, it, expect } from 'vitest';
import { parseDiceNotation, parseAndRollDice } from '../src/utils/diceParser.js';

describe('D&D / Polyhedral Dice Parser & Roller', () => {
  it('should parse valid dice notations correctly', () => {
    expect(parseDiceNotation('1d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
    expect(parseDiceNotation('2d6+4')).toEqual({ count: 2, sides: 6, modifier: 4 });
    expect(parseDiceNotation('3d8-2')).toEqual({ count: 3, sides: 8, modifier: -2 });
    expect(parseDiceNotation('d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
    expect(parseDiceNotation('1d100')).toEqual({ count: 1, sides: 100, modifier: 0 });
  });

  it('should reject invalid dice notations', () => {
    expect(parseDiceNotation('abc')).toBeNull();
    expect(parseDiceNotation('')).toBeNull();
    expect(parseDiceNotation('0d20')).toBeNull();
    expect(parseDiceNotation('1d0')).toBeNull();
    expect(parseDiceNotation('500d20')).toBeNull(); // exceeds max count
  });

  it('should roll dice and produce results within bounds', () => {
    const roll = parseAndRollDice('2d6+3', 'Ataque de Espada');
    expect(roll.notation).toBe('2d6+3');
    expect(roll.label).toBe('Ataque de Espada');
    expect(roll.rolls.length).toBe(2);
    expect(roll.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(roll.rolls[0]).toBeLessThanOrEqual(6);
    expect(roll.rolls[1]).toBeGreaterThanOrEqual(1);
    expect(roll.rolls[1]).toBeLessThanOrEqual(6);
    expect(roll.total).toBe(roll.rolls[0] + roll.rolls[1] + 3);
  });

  it('should detect natural 20 critical success on 1d20', () => {
    // Mock random returning 0.9999 -> floor(0.9999 * 20) + 1 = 20
    const critRoll = parseAndRollDice('1d20', 'Crítico', () => 0.999);
    expect(critRoll.rolls[0]).toBe(20);
    expect(critRoll.isCriticalSuccess).toBe(true);
    expect(critRoll.isCriticalFail).toBe(false);
  });

  it('should detect natural 1 critical fail on 1d20', () => {
    // Mock random returning 0.0 -> floor(0.0 * 20) + 1 = 1
    const failRoll = parseAndRollDice('1d20', 'Desastre', () => 0.0);
    expect(failRoll.rolls[0]).toBe(1);
    expect(failRoll.isCriticalSuccess).toBe(false);
    expect(failRoll.isCriticalFail).toBe(true);
  });
});
