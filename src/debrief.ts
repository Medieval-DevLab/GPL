import type { Content } from './engine/types';
import { causalThreads, finalVerdict } from './engine/engine';
import { codeFromState } from './engine/runcode';
import { ACTION_PLAN_FIELDS, type Session } from './session';
import { COPY } from './content/interface';

export function reflectionRecord(session: Session, content: Content) {
  return Object.values(content.nodes).flatMap(node => {
    const answer = session.presentation.reflections[node.id];
    return node.kind === 'interlude' && node.role === 'reflection' && answer && node.responses?.includes(answer)
      ? [{ id: node.id, chapter: node.chapter, title: node.title, prompt: node.prompt, answer }] : [];
  }).sort((a, b) => a.chapter - b.chapter);
}

/** One deterministic source for the learner's portable, human-readable record. */
export function debriefText(session: Session, content: Content): string {
  const { game: state, presentation } = session;
  const verdict = finalVerdict(state.dims, state.flags, content);
  const reflections = reflectionRecord(session, content);
  const plan = ACTION_PLAN_FIELDS.filter(({ key }) => presentation.actionPlan[key].trim());
  return [
    COPY.brand, 'Engagement debrief — fictional learning simulation', '',
    /* SV-02: an unfinished engagement has no verdict yet, and must not announce one. */
    ...(state.phase === 'ending' ? [verdict.title, verdict.summary, ...verdict.extras] : ['Engagement in progress', 'This record covers the decisions committed so far; the engagement has not ended.']), `${state.history.length} decisions made`, '',
    /* The promise calendar, when it has come due (D-086). */
    ...(state.settled ? ['HOW EVERY PROMISE CAME DUE', ...(state.settled.length ? state.settled.map(r => `${r.due} · ${r.line}`) : ['No promise in your hand came due.']), ''] : []),
    'YOUR DECISION RECORD',
    ...state.history.flatMap(h => [`Chapter ${h.chapter} · ${h.missionTitle}`, 'Your commitment: ' + h.chosenLabel, h.headline, h.lesson.principle, h.lesson.because, h.lesson.watchFor ?? '', '']),
    'HOW YOUR CHOICES CONNECTED',
    ...causalThreads(state, content).flatMap(t => ['Because: ' + t.because, 'So later: ' + t.soLater, '']),
    'YOUR REFLECTIONS',
    ...(reflections.length ? reflections.flatMap(r => [`Chapter ${r.chapter} · ${r.title}`, r.prompt ?? '', r.answer, '']) : ['No reflection responses recorded in this browser.', '']),
    'YOUR NEXT-ENGAGEMENT PLAN',
    ...(plan.length ? plan.flatMap(({ key, label }) => [label, presentation.actionPlan[key].trim(), '']) : ['No personal action plan recorded.', '']),
    'Run code: ' + (codeFromState(state, content) ?? ''),
    'Run codes preserve committed decisions, not reflections or your action plan. Those appear only in this downloaded record and the browser that saved them.',
    'Review your notes before sharing this file. No certification or pass score is implied.',
  ].join('\n');
}
