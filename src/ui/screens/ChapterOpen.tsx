import type { Chapter, Interlude } from '../../engine/types';
import { COPY } from '../../content/interface';
import { BACKDROP, CHAPTER_LIGHT, CHAPTER_PRESENTATION } from '../../content/presentation';
import { CHARACTERS } from '../../content/characters';
import { Action, Cutout, Heading, Paras, art, pad2 } from '../parts';

/** Small connecting words whisper in serif italic; the last word — the noun the act is about — is struck in a block. */
const SMALL = new Set(['a', 'an', 'the', 'it', 'of', 'to', 'and', 'in', 'on', 'for', 'is']);
function wordVoice(word: string, index: number, count: number) {
  if (index === count - 1) return 'w-key';
  return SMALL.has(word.toLowerCase()) ? 'w-small' : 'w-bold';
}

/**
 * The act card — the one screen in each chapter that is flooded with its colour.
 *
 * It is the breather between acts (Persona's calendar beat does the same job) and the
 * loudest moment of the chapter's colour script. The title is set in mixed treatments,
 * a restrained take on Persona's cut-out lettering: every third word changes voice, so the
 * title reads as a headline someone composed rather than a label. Deterministic by word
 * position, so the same chapter always looks the same.
 */
export function ChapterOpen({ node, chapter, onBegin }: { node: Interlude; chapter: Chapter; onBegin(): void }) {
  const p = CHAPTER_PRESENTATION[node.chapter - 1];
  const guide = CHARACTERS[p.advisor];
  const words = node.title.split(' ');
  return <section className="stage scr-chapter">
    <div className="flood" aria-hidden="true">
      <img src={art(BACKDROP[node.id] ?? p.scene)} alt="" />
      <span className="flood-number display">{pad2(node.chapter)}</span>
    </div>
    <Cutout id={p.advisor} frame={{ x: '80%', y: 0.17, face: 0.22 }} className="chapter-guide enter-cast" style={{ ['--d' as string]: '280ms' }} />
    <div className="chapter-copy">
      <p className="chapter-eyebrow mono enter-rise">{node.eyebrow} · {CHAPTER_LIGHT[node.chapter as 1]} · {pad2(node.chapter)} / 05</p>
      <Heading className="chapter-title enter-wipe">
        {words.map((w, i) => <span key={i} className={'w ' + wordVoice(w, i, words.length)}>{w}</span>)}
      </Heading>
      <p className="chapter-goal enter-rise" style={{ ['--i' as string]: 1 }}>{p.goal}</p>
      <Paras lines={node.body} className="chapter-body enter-rise" />
      <div className="chapter-agenda enter-rise" style={{ ['--i' as string]: 3 }}>
        <p className="mono">{COPY.stage.agenda}</p>
        <ol>{chapter.steps.map((s, i) => <li key={s}><span className="mono">{pad2(i + 1)}</span>{s}</li>)}</ol>
      </div>
      <div className="chapter-action enter-rise" style={{ ['--i' as string]: 4 }}>
        <Action onClick={onBegin}>{COPY.begin}</Action>
        <p className="chapter-guide-name"><small className="mono">{COPY.stage.advisorFor}</small><strong>{guide.name}</strong><span>{guide.role}</span></p>
      </div>
    </div>
  </section>;
}
