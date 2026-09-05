import { DiceRollResult } from '../types.js';

export interface ParsedDiceNotation {
  count: number;
  sides: number;
  modifier: number;
}

/**
 * Parses a standard RPG dice string like "1d20", "2d6+3", "3d8-1", "1d100"
 */
export function parseDiceNotation(notation: string): ParsedDiceNotation | null {
  if (!notation || typeof notation !== 'string') return null;

  const clean = notation.trim().toLowerCase().replace(/\s+/g, '');
  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count <= 0 || sides <= 0 || count > 100 || sides > 1000) {
    return null;
  }

  return { count, sides, modifier };
}

/**
 * Rolls dice according to standard D&D / polyhedral notation
 */
export function parseAndRollDice(
  notation: string,
  label?: string,
  randomFn: () => number = Math.random
): DiceRollResult {
  const parsed = parseDiceNotation(notation);
  const count = parsed ? parsed.count : 1;
  const sides = parsed ? parsed.sides : 20;
  const modifier = parsed ? parsed.modifier : 0;

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    const val = Math.floor(randomFn() * sides) + 1;
    rolls.push(val);
  }

  const rollsSum = rolls.reduce((acc, v) => acc + v, 0);
  const total = rollsSum + modifier;

  // D&D 5e critical checks for 1d20
  const isSingleD20 = count === 1 && sides === 20;
  const isCriticalSuccess = isSingleD20 && rolls[0] === 20;
  const isCriticalFail = isSingleD20 && rolls[0] === 1;

  const formattedNotation = `${count}d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''}`;

  return {
    id: 'roll-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    notation: formattedNotation,
    rolls,
    modifier,
    total,
    isCriticalSuccess,
    isCriticalFail,
    label: label?.trim() || undefined,
    timestamp: Date.now()
  };
}
