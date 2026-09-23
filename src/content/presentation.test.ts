import { describe, it, expect } from 'vitest';
import { story } from './story';
import { NODE_PRESENTATION, CHAPTER_PRESENTATION } from './presentation';
import { CHARACTERS, characterByName } from './characters';
import { PHOTO_CREDITS } from './assets';
describe('complete presentation contract', () => {
  it('maps every authored node exactly once', () => {
    expect(Object.keys(NODE_PRESENTATION).sort()).toEqual(Object.keys(story.nodes).sort());
    expect(Object.keys(story.nodes)).toHaveLength(37);
    expect(story.missionOrder).toHaveLength(18);
  });
  it('has five routes with real nodes and objectives', () => {
    expect(CHAPTER_PRESENTATION).toHaveLength(5);
    for (const chapter of CHAPTER_PRESENTATION) {
      expect(chapter.goal.length).toBeGreaterThan(20);
      for (const id of chapter.route) expect(story.nodes[id]).toBeDefined();
    }
  });
  it('maps seven distinct fictional identities to sourced portraits', () => {
    const characters = Object.values(CHARACTERS);
    expect(characters).toHaveLength(7);
    expect(new Set(characters.map(c => c.portrait)).size).toBe(7);
    for (const c of characters) {
      expect(characterByName(c.name)).toEqual(c);
      expect(PHOTO_CREDITS.some(p => p.asset === c.portrait && p.source.startsWith('https://www.pexels.com/'))).toBe(true);
    }
    expect(characterByName('Unknown stakeholder')).toBeUndefined();
  });
});
