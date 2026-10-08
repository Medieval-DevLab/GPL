import { useState } from 'react';
import type { Chapter, Interlude } from '../../engine/types';
import type { ChapterNumber } from '../../content/assets';
import { COPY } from '../../content/interface';
import { ACT_BRIEFING, ACT_QUESTION, CHAPTER_PRESENTATION, placeOf } from '../../content/presentation';
import { CHARACTERS } from '../../content/characters';
import { Backdrop, Heading } from '../parts';
import type { Line } from '../script';
import { DialogueBox } from './Dialogue';
import { Figure, VoicedTitle, useAdvanceKeys } from './FrameParts';

/**
 * An act begins. The act's colour floods in from the left and carries its number and title;
 * the act's guide walks into the room and tells you what the act is about, one line at a time:
 * the act's own opening, what to watch for, and then the question the act will answer. The
 * last line's action begins the act, so the guide hands you the first decision (D-081).
 */
export function ChapterOpen({ node, chapter, onBegin }: { node: Interlude; chapter: Chapter; onBegin(): void }) {
  const n = node.chapter as ChapterNumber;
  const p = CHAPTER_PRESENTATION[n - 1];
  const guide = CHARACTERS[p.advisor];
  const place = placeOf(node.id);
  const say = (text: string, note?: string): Line => ({ who: guide.name, role: guide.role, text, voice: 'say', note });
  const lines = [...node.body.map(t => say(t)), ...(ACT_BRIEFING[n] ?? []).map(t => say(t)), say(ACT_QUESTION[n], COPY.frames.open.question)];
  const [i, setI] = useState(0);
  const last = i === lines.length - 1;
  useAdvanceKeys();
  return <section className="page fs f-open">
    <Backdrop photo={place.photo} />
    <Figure id={p.advisor} className="f-open-guide" enter="right" delay={650} box={{ left: '52%', right: 0, top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.08, face: 0.19 }} />
    <p className="f-place">{place.name}</p>

    <div className="f-flood" data-n={n}>
      <p className="f-open-act">{COPY.stage.act} {n} {COPY.stage.of} 5</p>
      <Heading className="f-open-title"><VoicedTitle text={node.title} /></Heading>
      <p className="f-open-goal">{p.goal}</p>
      {/* The act's question stays on the card; when the guide asks it, it lights up. */}
      <div className={'f-open-q' + (last ? ' is-asked' : '')}>
        <p>{COPY.frames.open.question}</p>
        <p className="f-open-q-text">{ACT_QUESTION[n]}</p>
      </div>
      <div className="f-open-agenda">
        <p>{COPY.stage.agenda}</p>
        <ol>{chapter.steps.map((s, k) => <li key={s} style={{ ['--i' as string]: k }}><b>{k + 1}</b><span>{s}</span></li>)}</ol>
      </div>
    </div>

    <DialogueBox className="f-say" line={lines[i]} index={i} count={lines.length} last={last} lastLabel={COPY.begin}
      onNext={last ? onBegin : () => setI(k => Math.min(k + 1, lines.length - 1))}
      onSkip={() => setI(lines.length - 1)} skipLabel={COPY.frames.open.skip} />
  </section>;
}
