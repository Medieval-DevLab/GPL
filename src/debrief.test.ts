import { describe, expect, it } from 'vitest';
import { story } from './content/story';
import { advance, getNode } from './engine/engine';
import { isMission } from './engine/types';
import { pastSetup, playMission, possibleSelections } from './engine/analysis';
import { emptyPresentation, type Session } from './session';
import { debriefText, reflectionRecord } from './debrief';

function completed(): Session {
  let game = pastSetup(story, 's-connector');
  for (let i = 0; i < 100 && game.phase !== 'ending'; i++) {
    const node = getNode(story, game.nodeId);
    game = isMission(node) ? playMission(game, story, possibleSelections(node, game)[0]) : advance(game, story);
  }
  expect(game.phase).toBe('ending');
  return { game, presentation: emptyPresentation() };
}
describe('portable learner debrief', () => {
  it('orders reflections by the learning journey, not source-file insertion order', () => {
    const session = completed();
    for (const node of Object.values(story.nodes)) {
      if (node.kind === 'interlude' && node.role === 'reflection' && node.responses?.length) session.presentation.reflections[node.id] = node.responses[0];
    }
    expect(reflectionRecord(session, story).map(r => r.chapter)).toEqual([2, 3, 4, 5]);
  });
  it('includes actual decisions and a non-certification notice', () => {
    const session = completed(); const text = debriefText(session, story);
    expect(session.game.history).toHaveLength(18);
    for (const h of session.game.history) expect(text).toContain(h.chosenLabel);
    expect(text).toContain('18 decisions made');
    expect(text).toContain('No certification or pass score');
  });
  it('exports validated reflections and the optional plan in the same record', () => {
    const session = completed();
    const node = Object.values(story.nodes).find(n => n.kind === 'interlude' && n.role === 'reflection');
    if (!node || node.kind !== 'interlude' || !node.responses) throw new Error('Missing reflection');
    session.presentation.reflections[node.id] = node.responses[0];
    session.presentation.reflections.invalid = 'not authored';
    session.presentation.actionPlan = { action: ' Ask earlier. ', occasion: 'Next meeting', evidence: 'An agreed next step' };
    const text = debriefText(session, story);
    expect(reflectionRecord(session, story)).toHaveLength(1);
    expect(text).toContain(node.responses[0]); expect(text).not.toContain('not authored');
    expect(text).toContain('Ask earlier.'); expect(text).toContain('Next meeting'); expect(text).toContain('An agreed next step');
    expect(text).toContain('not reflections or your action plan');
  });
  it('does not invent responses for skipped or code-restored reflections', () => {
    const session = completed();
    expect(reflectionRecord(session, story)).toEqual([]);
    expect(debriefText(session, story)).toContain('No reflection responses recorded');
    expect(debriefText(session, story)).toContain('No personal action plan recorded');
  });
});
