import { describe, it, expect } from 'vitest';
import { story } from '../content/story';
import { CHAPTER_PRESENTATION, COMPARE, MILESTONE, MYSTERY } from '../content/presentation';
import { EARNED } from '../content/gates';
import { createInitialState } from '../engine/engine';
import type { Mission } from '../engine/types';
import { handOf, isCard, pileOf, sourceOf, stageNameOf } from './cards';

describe('the trail and the hand (D-083)', () => {
  it('names every decision and every story turn on the map', () => {
    for (const id of story.missionOrder) expect(MILESTONE[id], id).toBeTruthy();
    const turns = Object.values(story.nodes).filter(n => n.kind === 'interlude' && n.role === 'turn').map(n => n.id);
    for (const id of turns) expect(MILESTONE[id], id).toBeTruthy();
    for (const p of CHAPTER_PRESENTATION) expect(stageNameOf(story, p.chapter)).toBeTruthy();
  });

  it('compares only real options, and every option on every row', () => {
    for (const [id, rows] of Object.entries(COMPARE)) {
      const mission = story.nodes[id] as Mission;
      expect(mission.kind, id).toBe('choice');
      if (mission.kind !== 'choice') continue;
      for (const row of rows) for (const o of mission.options) expect(row.values[o.id], id + ' · ' + row.label).toBeTruthy();
    }
  });

  it('can say where every strength card comes from', () => {
    const cards = Object.keys(EARNED).filter(f => isCard(f) && pileOf(f) === 'strength');
    for (const f of cards) expect(sourceOf(story, f), f).toBeTruthy();
    expect(sourceOf(story, 'knows:real_pain')).toBe(MILESTONE.m2);
  });

  it('keeps the mystery solvable, and tells a fresh run where each starting card next matters', () => {
    for (const f of MYSTERY.clues) expect(sourceOf(story, f), f).toBeTruthy();
    const state = { ...createInitialState(story), flags: ['start:builder', 'credibility'] };
    const hand = handOf(state, story);
    expect(hand.map(c => c.flag)).toContain('credibility');
    expect(hand.find(c => c.flag === 'credibility')?.next?.at).toBeTruthy();
  });
});
