import { describe, it, expect } from 'vitest';
import {
  isValidHexColor,
  getDeterministicPlayerColor,
  resolvePlayerColor,
  DEFAULT_PLAYER_PALETTE
} from '../src/utils/playerColors.js';

describe('Player Colors & Discord Chat Highlights', () => {
  it('should validate hex color strings correctly', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#6366F1')).toBe(true);
    expect(isValidHexColor('#10b981aa')).toBe(true);

    expect(isValidHexColor('rgb(255, 0, 0)')).toBe(false);
    expect(isValidHexColor('#12345')).toBe(false);
    expect(isValidHexColor('invalid')).toBe(false);
    expect(isValidHexColor('')).toBe(false);
  });

  it('should generate deterministic colors for the same author name', () => {
    const color1 = getDeterministicPlayerColor('Guerreiro Thorin');
    const color2 = getDeterministicPlayerColor('Guerreiro Thorin');
    expect(color1).toBe(color2);
    expect(DEFAULT_PLAYER_PALETTE).toContain(color1);
  });

  it('should prioritize custom player color if defined', () => {
    const customMap = {
      'Elfo Legolas': '#06B6D4'
    };

    const resolvedCustom = resolvePlayerColor('Elfo Legolas', customMap);
    expect(resolvedCustom).toBe('#06B6D4');

    const resolvedDefault = resolvePlayerColor('Mago Gandalf', customMap);
    expect(DEFAULT_PLAYER_PALETTE).toContain(resolvedDefault);
  });
});
