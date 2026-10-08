import { describe, expect, it } from 'vitest';
import { story } from './content/story';
import { advance, getNode } from './engine/engine';
import { isMission } from './engine/types';
import { pastSetup, playMission, playScript, possibleSelections } from './engine/analysis';
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
  it('records an unfinished engagement as in progress, without a verdict it has not reached (SV-02)', () => {
    let game = pastSetup(story, 's-connector');
    const node = getNode(story, game.nodeId);
    if (isMission(node)) game = playMission(game, story, possibleSelections(node, game)[0]);
    const finished = completed();
    const text = debriefText({ game, presentation: emptyPresentation() }, story);
    expect(text).toContain('Engagement in progress');
    expect(text).toContain('1 decisions made');
    const verdictLine = debriefText(finished, story).split(String.fromCharCode(10))[3];
    expect(text).not.toContain(verdictLine);
  });
  it('orders reflections by the learning journey, not source-file insertion order', () => {
    const session = completed();
    for (const node of Object.values(story.nodes)) {
      if (node.kind === 'interlude' && node.role === 'reflection' && node.responses?.length) session.presentation.reflections[node.id] = node.responses[0];
    }
    /* One unscored guess per act, at its break (D-086). */
    expect(reflectionRecord(session, story).map(r => r.chapter)).toEqual([1, 2, 3, 4]);
  });
  it('includes actual decisions and a non-certification notice', () => {
    /* The first-listed path loses the work at the price push, so it is six decisions long. */
    const session = completed(); const text = debriefText(session, story);
    const n = session.game.history.length;
    expect(n).toBe(session.game.completed.length);
    expect(n).toBeGreaterThan(0);
    for (const h of session.game.history) expect(text).toContain(h.chosenLabel);
    expect(text).toContain(`${n} decisions made`);
    expect(text).toContain('No certification or pass score');
  });
  it('records the content ending, its extra lines and the promise calendar (D-086)', () => {
    const game = playScript(story, [
      ['d1-delivery', 'd1-complaints'], ['d2-found', 'd2-marcus'], ['d3-two', 'd3-paid'], ['d4-reframe', 'd4-figures'],
      ['d5-after-sale', 'd5-month-five', 'd5-by-day'], ['d6-half', 'd6-drop-nothing', 'd6-ops-lead'], ['d7-no-late-fee', 'd7-sign'], ['d8-tell', 'd8-contractors'],
    ], 's-connector');
    expect(game.phase).toBe('ending');
    const text = debriefText({ game, presentation: emptyPresentation() }, story);
    expect(text).toContain('8 decisions made');
    expect(text).toContain('We kept our promises, and it paid');
    expect(text).toContain('Sarah has asked us to bid for next year’s work.');
    expect(text).toContain('HOW EVERY PROMISE CAME DUE');
    expect(text).toContain('Month 5 · Kept. We had planned around the summer freeze.');
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
