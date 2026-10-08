import { useState } from 'react';
import type { Content, GameState } from '../../engine/types';
import { RECALL, RECALL_COPY } from '../../content/recall';

/**
 * Recall on return (D-088): one question per finished act, answered in your head and then
 * revealed. Optional and unscored, and nothing is saved, so it never gates play.
 */
export function Recall({ content, game }: { content: Content; game: GameState }) {
  const finished = content.chapters.filter(c => c.missionIds.length > 0 && c.missionIds.every(id => game.completed.includes(id))).map(c => c.number);
  const items = finished.map(n => RECALL[n]).filter(Boolean);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  if (!items.length || game.phase === 'ending') return null;
  if (!open) return <button className="recall-open" onClick={() => setOpen(true)}>{RECALL_COPY.open}</button>;
  const item = items[i];
  if (!item) return <p className="recall recall-done" role="status">{RECALL_COPY.done}</p>;
  return <section className="recall" aria-labelledby="recall-q">
    <p className="recall-count">{i + 1} {RECALL_COPY.of} {items.length} · {RECALL_COPY.lead}</p>
    <h2 id="recall-q" className="recall-q">{item.question}</h2>
    {shown ? <>
      <p className="recall-a" role="status">{item.answer}</p>
      <button className="secondary" onClick={() => { setI(i + 1); setShown(false); }}>{i + 1 < items.length ? RECALL_COPY.next : RECALL_COPY.finish}</button>
    </> : <button className="secondary" onClick={() => setShown(true)}>{RECALL_COPY.show}</button>}
  </section>;
}
