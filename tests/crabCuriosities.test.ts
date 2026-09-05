import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Caranguejo Curiosities Database Integrity', () => {
  const dataPath = path.join(process.cwd(), 'data', 'caranguejoCuriosities.json');

  it('should have a valid caranguejoCuriosities.json file', () => {
    expect(fs.existsSync(dataPath)).toBe(true);
    const content = fs.readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('should verify that all curiosities have required fields and non-empty content', () => {
    const content = fs.readFileSync(dataPath, 'utf-8');
    const curiosities = JSON.parse(content);

    curiosities.forEach((item: any, idx: number) => {
      expect(typeof item.id, `Item ${idx} missing numeric id`).toBe('number');
      expect(typeof item.title, `Item ${idx} missing string title`).toBe('string');
      expect(item.title.length, `Item ${idx} has empty title`).toBeGreaterThan(0);
      expect(typeof item.fact, `Item ${idx} missing string fact`).toBe('string');
      expect(item.fact.length, `Item ${idx} has empty fact`).toBeGreaterThan(0);
      const hook = item.rpg_hook || item.rpgHook;
      expect(typeof hook, `Item ${idx} missing string rpg_hook`).toBe('string');
      expect(hook.length, `Item ${idx} has empty rpg_hook`).toBeGreaterThan(0);
    });
  });
});
