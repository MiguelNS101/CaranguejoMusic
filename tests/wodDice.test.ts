import { describe, it, expect } from 'vitest';
import { rollWodDice, parseWodCommand } from '../server/wodDice.js';

describe('World of Darkness (WoD) Dice Engine', () => {
  it('should roll between 1 and 100 dice within valid bounds', () => {
    const result1 = rollWodDice(5, false, 'Tester', 'Ataque');
    expect(result1.diceCount).toBe(5);
    expect(result1.baseRolls.length).toBe(5);
    result1.baseRolls.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    });

    // Clamp low bound
    const resultLow = rollWodDice(0);
    expect(resultLow.diceCount).toBe(1);

    // Clamp high bound
    const resultHigh = rollWodDice(200);
    expect(resultHigh.diceCount).toBe(100);
  });

  it('should set standard critThreshold to 10 and successThreshold to 7', () => {
    const result = rollWodDice(10, false, 'Mestre');
    expect(result.critThreshold).toBe(10);
    expect(result.successThreshold).toBe(7);
    expect(result.isKeenRoll).toBe(false);
  });

  it('should set keen critThreshold to 9 on Keen Roll', () => {
    const result = rollWodDice(10, true, 'Vampiro');
    expect(result.critThreshold).toBe(9);
    expect(result.successThreshold).toBe(7);
    expect(result.isKeenRoll).toBe(true);
    expect(result.command).toContain('\\kr');
  });

  it('should calculate netSuccesses and format text properly', () => {
    const result = rollWodDice(6, false, 'Lobisomem', 'Frenesi');
    expect(result.formattedOutput).toBeDefined();
    expect(result.formattedOutput).toContain('Lobisomem');
    expect(result.formattedOutput).toContain('Frenesi');
    expect(typeof result.totalSuccesses).toBe('number');
    expect(result.totalSuccesses).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalCriticalFails).toBe('number');
  });

  it('should parse Discord command strings like \\r and \\kr', () => {
    expect(parseWodCommand('\\r 5d10')).toEqual({ count: 5, isKeen: false, label: undefined });
    expect(parseWodCommand('\\kr 8d10 Tiro')).toEqual({ count: 8, isKeen: true, label: 'Tiro' });
    expect(parseWodCommand('!r 3 Percepção')).toEqual({ count: 3, isKeen: false, label: 'Percepção' });
    expect(parseWodCommand('invalid')).toBeNull();
  });
});
