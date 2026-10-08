import { describe, it, expect } from 'vitest';
import { story } from '../content/story';
import { createInitialState } from '../engine/engine';
import type { Mission } from '../engine/types';
import { briefLines, paginate } from './script';

describe('the performed script (D-081)', () => {
  it('pages at sentence ends, never inside a number or an ellipsis', () => {
    expect(paginate('Revenue was £2.6m last year. It fell.', 5)).toEqual(['Revenue was £2.6m last year.', 'It fell.']);
    expect(paginate('Wait... then go. Now.', 3)).toEqual(['Wait... then go.', 'Now.']);
    expect(paginate('She said “stop.” Then we did.', 4)).toEqual(['She said “stop.”', 'Then we did.']);
    expect(paginate('One. Two. Three.')).toEqual(['One. Two. Three.']);
  });

  it('opens every decision with the colleague saying what is happening, and no lecture before the choice', () => {
    const state = createInitialState(story);
    for (const id of story.missionOrder) {
      const mission = story.nodes[id] as Mission;
      const lines = briefLines(mission, state);
      expect(lines.length, id).toBeGreaterThan(0);
      if (mission.advisor) expect(lines[0].who, id).toBe(mission.advisor.name);
      expect(lines.some(l => l.text === mission.advisorLine), id).toBe(false);
    }
  });

  it('has an authored reason for every outcome, so “why” is never assembled from labels', () => {
    for (const id of story.missionOrder) {
      const mission = story.nodes[id] as Mission;
      expect(mission.lesson?.because?.trim().length, id).toBeGreaterThan(0);
    }
  });
});
