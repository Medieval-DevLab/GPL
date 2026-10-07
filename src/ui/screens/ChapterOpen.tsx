import type { Chapter, Interlude } from '../../engine/types';
import { COPY } from '../../content/interface';
import { ACT_QUESTION, CHAPTER_PRESENTATION, placeOf } from '../../content/presentation';
import { CHARACTERS } from '../../content/characters';
import { Action, Heading, Paras, Portrait, art } from '../parts';

/** An act begins: its question, what you will decide in it, and who is with you. */
export function ChapterOpen({ node, chapter, onBegin }: { node: Interlude; chapter: Chapter; onBegin(): void }) {
  const p = CHAPTER_PRESENTATION[node.chapter - 1];
  const guide = CHARACTERS[p.advisor];
  const place = placeOf(node.id);
  return <section className="page scr-chapter">
    <div className="frame">
      <div className="act">
        <div>
          <p className="kicker">{COPY.stage.act} {node.chapter} {COPY.stage.of} 5 · {chapter.label}</p>
          <Heading className="h1">{node.title}</Heading>
          <p className="act-question">{ACT_QUESTION[node.chapter as 1]}</p>
          <Paras lines={node.body} className="read" />
          <ol className="agenda" aria-label={COPY.stage.agenda}>{chapter.steps.map((s, i) => <li key={s}><small>{COPY.stage.decision} {i + 1}</small>{s}</li>)}</ol>
          <p className="guide"><Portrait name={guide.name} /><span><small>{COPY.stage.advisorFor}</small><strong>{guide.name}</strong><small>{guide.role}</small></span></p>
        </div>
        <figure className="photo-frame act-photo"><img src={art(place.photo)} alt="" /><figcaption>{place.name}</figcaption></figure>
      </div>
    </div>
    <footer className="cmd-bar"><p>{p.goal}</p><Action onClick={onBegin}>{COPY.begin}</Action></footer>
  </section>;
}
