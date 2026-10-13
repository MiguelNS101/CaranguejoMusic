import { describe, it, expect } from 'vitest';
import {
  generateNpcName,
  generateNpcNameBatch,
  NPC_THEMES,
  NpcTheme
} from '../src/utils/npcNameGenerator';

describe('npcNameGenerator', () => {
  it('should generate names for all supported themes', () => {
    const themes: NpcTheme[] = ['fantasy', 'scifi', 'modern', 'gothic', 'cyberpunk', 'tavern'];
    themes.forEach(theme => {
      const result = generateNpcName({ theme, includeTitle: true });
      expect(result.fullName).toBeDefined();
      expect(result.fullName.length).toBeGreaterThan(0);
      expect(result.theme).toBe(theme);
      expect(result.firstName).toBeDefined();
      expect(result.lastName).toBeDefined();
    });
  });

  it('should support gender filters and title toggling', () => {
    const maleResult = generateNpcName({ theme: 'fantasy', gender: 'male', includeTitle: false });
    expect(maleResult.fullName).toBeDefined();
    expect(maleResult.title).toBeUndefined();

    const withTitle = generateNpcName({ theme: 'fantasy', includeTitle: true });
    expect(withTitle.title).toBeDefined();
  });

  it('should generate requested batch count', () => {
    const batch = generateNpcNameBatch('scifi', 7);
    expect(batch.length).toBe(7);
    batch.forEach(item => {
      expect(item.theme).toBe('scifi');
      expect(item.fullName.length).toBeGreaterThan(0);
    });
  });

  it('should export all 6 defined NPC themes', () => {
    expect(NPC_THEMES.length).toBe(6);
    expect(NPC_THEMES.map(t => t.id)).toEqual(
      expect.arrayContaining(['fantasy', 'scifi', 'modern', 'gothic', 'cyberpunk', 'tavern'])
    );
  });
});
