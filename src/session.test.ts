import { describe, expect, it } from 'vitest';
import { story } from './content/story';
import { advance, chooseSetup, createInitialState, toggleSelection } from './engine/engine';
import { codeFromState } from './engine/runcode';
import { decodeSave } from './engine/save';
import { ACTION_PLAN_LIMIT, emptyActionPlan, emptyPresentation, normaliseActionPlan, presentationFrom, readResume, serialiseSession } from './session';
const start = () => chooseSetup(advance(createInitialState(story), story), story, 's-connector');
describe('presentation checkpoints and recovery', () => {
  it('preserves an optional plan without changing the portable run code', () => {
    const game = start();
    const actionPlan = { action: 'Ask about the exception.', occasion: 'Next discovery call', evidence: 'A named decision and agreed follow-up.' };
    const raw = serialiseSession({ game, presentation: { ...emptyPresentation(), actionPlan } }, story);
    expect(presentationFrom(raw, game, story).actionPlan).toEqual(actionPlan);
    const loaded = decodeSave(raw, story);
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(codeFromState(loaded.state, story)).toBe(codeFromState(game, story));
  });
  it('keeps older schema-1 presentation saves compatible', () => {
    const game = start();
    const saved = JSON.parse(serialiseSession({ game, presentation: emptyPresentation() }, story));
    delete saved.presentation.actionPlan;
    expect(presentationFrom(JSON.stringify(saved), game, story).actionPlan).toEqual(emptyActionPlan());
  });
  it('bounds and validates malformed saved notes', () => {
    expect(normaliseActionPlan({ action: 'x'.repeat(900), occasion: 4, evidence: 'a\u0000b\nline' })).toEqual({ action: 'x'.repeat(ACTION_PLAN_LIMIT), occasion: '', evidence: 'ab\nline' });
    expect(normaliseActionPlan(null)).toEqual(emptyActionPlan());
    expect(normaliseActionPlan('not an object')).toEqual(emptyActionPlan());
  });
  it('persists chapter map independently of the engine phase', () => {
    const game = start(); const presentation = { ...emptyPresentation(), view: 'map' as const };
    const raw = serialiseSession({ game, presentation }, story);
    expect(decodeSave(raw, story).status).toBe('ok');
    expect(presentationFrom(raw, game, story).view).toBe('map');
  });
  it('opens a restored engagement on its scene, with the map only on request (D-080)', () => {
    const game = start();
    const raw = serialiseSession({ game, presentation: emptyPresentation() }, story);
    expect(presentationFrom(raw, game, story).view).toBe('play');
    expect(presentationFrom(null, game, story).view).toBe('play');
  });
  it('preserves an uncommitted selection', () => {
    let game = advance(advance(start(), story), story);
    game = toggleSelection(game, story, 'o-northwind');
    const raw = serialiseSession({ game, presentation: emptyPresentation() }, story);
    const read = decodeSave(raw, story);
    expect(read.status).toBe('ok');
    if (read.status === 'ok') expect(read.state.selection).toEqual(game.selection);
  });
  it('validates reflection answers instead of accepting arbitrary saved prose', () => {
    const game = start();
    const node = Object.values(story.nodes).find(n => n.kind === 'interlude' && n.responses?.length);
    if (!node || node.kind !== 'interlude') throw new Error('Missing reflection');
    const raw = serialiseSession({ game, presentation: { ...emptyPresentation(), reflections: { [node.id]: node.responses![0], fake: 'unsafe' } } }, story);
    expect(presentationFrom(raw, game, story).reflections).toEqual({ [node.id]: node.responses![0] });
  });
  it('offers different local and LMS sessions rather than overwriting either', () => {
    const local = start();
    const remote = chooseSetup(advance(createInitialState(story), story), story, 's-builder');
    const raw = serialiseSession({ game: local, presentation: emptyPresentation() }, story);
    const result = readResume(story, { getItem: () => raw }, codeFromState(remote, story));
    expect(result.candidates.map(x => x.source)).toEqual(['local', 'lms']);
  });
  it('keeps the precise browser checkpoint when the platform has the same decisions', () => {
    const game = start();
    const raw = serialiseSession({ game, presentation: emptyPresentation() }, story);
    expect(readResume(story, { getItem: () => raw }, codeFromState(game, story)).candidates).toHaveLength(1);
  });
  it('still offers a valid platform run when local storage throws', () => {
    const result = readResume(story, { getItem: () => { throw new Error('denied'); } }, codeFromState(start(), story));
    expect(result.candidates[0]?.source).toBe('lms');
  });
  it('reports invalid platform data without hiding the local save', () => {
    const raw = serialiseSession({ game: start(), presentation: emptyPresentation() }, story);
    const result = readResume(story, { getItem: () => raw }, 'invalid');
    expect(result.invalidLms).toBe(true);
    expect(result.candidates[0]?.source).toBe('local');
  });
});
