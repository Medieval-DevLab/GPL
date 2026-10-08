import { describe, it, expect } from 'vitest';
import { story } from './story';
import { NODE_PRESENTATION, CHAPTER_PRESENTATION, BACKDROP, TURN_DRESSING, MISSION_RULE, LEDGER_RULE, ACT_QUESTION, RULES } from './presentation';
import { ledgerRules } from '../engine/engine';
import { CHARACTERS, characterByName } from './characters';
import { PHOTO_CREDITS } from './assets';
describe('complete presentation contract', () => {
  it('maps every authored node exactly once', () => {
    expect(Object.keys(NODE_PRESENTATION).sort()).toEqual(Object.keys(story.nodes).sort());
    /* Setup, four act openers, eight decisions, four guesses, four debriefs, the calendar
       and the ending (D-086). */
    expect(Object.keys(story.nodes)).toHaveLength(23);
    expect(story.missionOrder).toHaveLength(8);
  });
  it('stages every node against a credited backdrop, and every turn as an artefact', () => {
    expect(Object.keys(BACKDROP).sort()).toEqual(Object.keys(story.nodes).sort());
    for (const asset of Object.values(BACKDROP)) expect(PHOTO_CREDITS.some(p => p.asset === asset)).toBe(true);
    const turns = Object.values(story.nodes).filter(n => n.kind === 'interlude' && n.role === 'turn').map(n => n.id).sort();
    expect(Object.keys(TURN_DRESSING).sort()).toEqual(turns);
  });
  it('files every decision and every record position under one of the three questions (D-080)', () => {
    const ids = new Set(RULES.map(r => r.id));
    for (const id of story.missionOrder) expect(ids.has(MISSION_RULE[id])).toBe(true);
    /* The story's own board (D-086): every position it can show is filed somewhere. */
    expect(story.ledger?.length).toBeGreaterThan(0);
    for (const rule of ledgerRules(story)) expect(ids.has(LEDGER_RULE[rule.label]), rule.label).toBe(true);
    expect(Object.keys(LEDGER_RULE).sort()).toEqual(ledgerRules(story).map(r => r.label).sort());
    expect(Object.keys(MISSION_RULE).sort()).toEqual([...story.missionOrder].sort());
    for (const c of story.chapters) expect(ACT_QUESTION[c.number as 1]).toMatch(/\?$/);
  });
  it('has four routes with real nodes and objectives, covering every node once', () => {
    expect(CHAPTER_PRESENTATION).toHaveLength(story.chapters.length);
    expect(CHAPTER_PRESENTATION).toHaveLength(4);
    for (const chapter of CHAPTER_PRESENTATION) {
      expect(chapter.goal.length).toBeGreaterThan(20);
      for (const id of chapter.route) expect(story.nodes[id]).toBeDefined();
    }
    /* Every node but chapter 0 is on exactly one act's route, so the trail misses nothing. */
    const routed = CHAPTER_PRESENTATION.flatMap(c => c.route);
    expect(new Set(routed).size).toBe(routed.length);
    expect([...routed].sort()).toEqual(Object.keys(story.nodes).filter(id => id !== 'setup').sort());
  });

  it('names each act for its idea, in the same words as its lessons', () => {
    for (const c of story.chapters) {
      expect(c.idea).toBeTruthy();
      expect(c.title + '.').toBe(c.idea);
      expect(CHAPTER_PRESENTATION[c.number - 1]?.title).toBe(c.title);
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
