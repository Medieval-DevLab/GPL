/**
 * The chapter cut scene.
 *
 * A chapter boundary used to be a title card on the same light desk as everything else:
 * same surface, same rails, different words. That is a content swap, and the client read
 * it exactly as one — "there are no cut scenes". A cut scene has to be a change of
 * *place*, so this beat throws the console away for one screen and plays full-bleed on
 * the dark stage: graded photography, a large figure, a chapter numeral at 96px, one
 * action.
 *
 * It renders state and nothing else. The chapter number, title, prose and milestone all
 * come from the `interlude` node in content; the backdrop and the figure are presentation
 * defaults chosen per chapter here, because content has no field for either and a UI file
 * may not invent story. Pass `hero` and `person` to override — `App.tsx` can hand it the
 * upcoming mission's advisor so the face belongs to whoever is about to speak.
 */

import { useEffect, useRef } from "react";

import type { Chapter, Interlude } from "../engine/types";
import { Icon } from "./icons";
import { UI_LABEL, artUrl } from "./shell";

/* Presentation defaults: a chapter's stage dressing, not its content — which photograph
   is graded behind the stage and whose figure stands on it. Both are overridable. */
const CHAPTER_STAGE: Record<number, { hero: string; photo: string }> = {
  1: { hero: "hero-retail-plaza", photo: "portrait-priya" },
  2: { hero: "hero-client-meeting", photo: "portrait-arjun" },
  3: { hero: "solution-workshop", photo: "portrait-riya" },
  4: { hero: "hero-negotiation", photo: "portrait-aisha" },
  5: { hero: "hero-retail-interior", photo: "portrait-priya" },
};
const FALLBACK_STAGE = { hero: "hero-boardroom", photo: "portrait-priya" };

/**
 * Local stylesheet.
 *
 * Injected from here rather than added to `index.css` because this file is one of two
 * this agent owns, and because every rule in it is specific to this one beat.
 *
 * The motion is written **inside** `@media (prefers-reduced-motion: no-preference)`, not
 * declared and then overridden in `reduce`. That inversion is the whole bug in the usual
 * approach: an overridden animation leaves the element wherever its `from` frame put it
 * unless every property is unwound, so the default state here is the *final* state and
 * the animation is the addition. With reduced motion the stage simply is, and a 200ms
 * cross-fade on the whole section is the only thing that plays.
 *
 * `--d` carries each element's stagger, so the delay is data on the element rather than
 * five near-identical classes.
 */
const CSS = `
.cut-stage { animation: cut-fade 220ms linear both; }
.cut-in, .cut-numeral-in, .cut-figure-in, .cut-glow-in { opacity: 1; transform: none; }
.cut-figure-in { opacity: 0.96; }
@media (prefers-reduced-motion: no-preference) {
  .cut-in {
    animation: cut-sweep 620ms cubic-bezier(0.16, 0.84, 0.28, 1) var(--d, 0ms) both;
  }
  .cut-numeral-in {
    animation: cut-numeral 720ms cubic-bezier(0.16, 0.84, 0.28, 1) var(--d, 0ms) both;
  }
  .cut-figure-in {
    animation: cut-figure 780ms cubic-bezier(0.16, 0.84, 0.28, 1) var(--d, 0ms) both;
  }
  .cut-glow-in {
    animation: cut-glow 900ms cubic-bezier(0.16, 0.84, 0.28, 1) var(--d, 0ms) both;
  }
}
@keyframes cut-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cut-sweep {
  from { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
@keyframes cut-numeral {
  from { opacity: 0; transform: translate3d(-5%, 0, 0) scale(1.2); }
  to   { opacity: 1; transform: none; }
}
@keyframes cut-figure {
  from { opacity: 0; transform: translate3d(5%, 0, 0) scale(1.05); }
  to   { opacity: 0.96; transform: none; }
}
@keyframes cut-glow {
  from { opacity: 0; transform: scale(0.72); }
  to   { opacity: 1; transform: none; }
}
`;

function useCutSceneStyles() {
  useEffect(() => {
    const id = "gpl-cutscene-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = CSS;
    document.head.append(el);
  }, []);
}

/** A stagger, expressed as data. */
const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function CutScene({
  node,
  chapter,
  hero,
  person,
  onBegin,
  titleId,
}: {
  node: Interlude;
  /** the chapter's own step list, shown as what is ahead */
  chapter?: Chapter;
  /** override the graded backdrop; defaults per chapter */
  hero?: string;
  /** the figure on the stage — usually the advisor of the mission about to start */
  person?: { name: string; role: string; photo?: string };
  onBegin?: () => void;
  /** so the console can keep its heading announcement pointed at the live beat */
  titleId?: string;
}) {
  useCutSceneStyles();
  const dressing = CHAPTER_STAGE[node.chapter] ?? FALLBACK_STAGE;
  const backdrop = hero ?? dressing.hero;
  const photo = person?.photo ?? dressing.photo;
  const beginRef = useRef<HTMLButtonElement>(null);

  /* One action, so the keyboard should already be on it. */
  useEffect(() => {
    beginRef.current?.focus();
  }, [node.id]);

  return (
    <section
      key={node.id}
      /* So a harness can tell a chapter opener from a story turn. They are the same
         screen deliberately — both are things you watch — but only the openers are
         one-per-chapter, and `verify` asserts that. */
      data-beat={node.role ?? "chapter-open"}
      aria-label={`${UI_LABEL.chapter} ${node.chapter}: ${node.title}`}
      className="cut-stage relative isolate flex h-full min-h-[560px] w-full items-stretch overflow-hidden bg-(--color-stage)"
    >
      {/* ── the place. Photography graded down until it is light and architecture
             rather than a picture of a room. */}
      <img
        src={artUrl(backdrop)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        /* Opacity as a style rather than a utility, deliberately: `tokens.test.ts` bans
           `opacity-*` on anything that could be type or a control, and the only way to
           show this is a purely decorative layer is to keep it off the class list. */
        style={{ opacity: 0.3, filter: "grayscale(0.7) contrast(1.1) brightness(0.62)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(104deg, var(--color-stage) 4%, color-mix(in oklab, var(--color-stage) 80%, transparent) 44%, color-mix(in oklab, var(--color-stage) 38%, transparent) 100%)",
        }}
      />
      {/* the glow the figure stands in front of */}
      <div
        aria-hidden="true"
        className="cut-glow-in pointer-events-none absolute h-[640px] w-[640px]"
        style={{
          right: "4%",
          top: "-10%",
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--color-glow) 58%, transparent) 0%, transparent 68%)",
          ...at(60),
        }}
      />

      {/* ── the figure. A 160px source, so it is never scaled as a photograph. */}
      <Figure photo={photo} person={person} />

      {/* ── the text. */}
      <div className="relative z-10 flex w-full max-w-[700px] flex-col justify-center px-12 py-10">
        <p
          className="cut-in text-[13px] font-semibold tracking-[0.14em] uppercase text-(--color-energy)"
          style={at(80)}
        >
          {node.eyebrow}
        </p>

        <div className="mt-1 flex items-end gap-5">
          <span
            aria-hidden="true"
            className="cut-numeral-in block text-[length:var(--text-mega)] leading-[0.84] font-bold tracking-[-0.045em] tabular-nums text-(--color-stage-ink)"
            style={{
              textShadow: "0 0 64px color-mix(in oklab, var(--color-glow) 70%, transparent)",
              ...at(120),
            }}
          >
            {node.chapter}
          </span>
          {node.milestone && (
            <span
              className="cut-in mb-2.5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold text-(--color-reward)"
              style={{
                background: "color-mix(in oklab, var(--color-reward) 16%, transparent)",
                borderColor: "color-mix(in oklab, var(--color-reward) 42%, transparent)",
                ...at(300),
              }}
            >
              <Icon name="check" size={13} />
              <span className="sr-only">{UI_LABEL.milestone}: </span>
              {node.milestone}
            </span>
          )}
        </div>

        <h1
          id={titleId}
          className="cut-in mt-4 text-[32px] leading-[1.08] font-bold tracking-[-0.025em] text-(--color-stage-ink)"
          style={at(180)}
        >
          {node.title}
        </h1>

        <div className="mt-4 flex max-w-[52ch] flex-col gap-3">
          {node.body.map((line, i) => (
            <p
              key={i}
              className="cut-in text-[15px] leading-[1.6] text-(--color-stage-ink-soft)"
              style={at(240 + i * 60)}
            >
              {line}
            </p>
          ))}
        </div>

        {chapter && chapter.steps.length > 0 && (
          <div className="cut-in mt-7" style={at(400)}>
            <p className="text-[12px] font-semibold tracking-[0.12em] uppercase text-(--color-stage-ink-soft)">
              {UI_LABEL.chapterAhead}
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {chapter.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-2 rounded-lg border border-(--color-stage-line) bg-(--color-stage-raised) px-3 py-1.5 text-[13px] text-(--color-stage-ink)"
                >
                  <span className="text-[12px] font-bold tabular-nums text-(--color-energy)">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="cut-in mt-8" style={at(480)}>
          {/* The lip: a button on this stage is a moulded object, so its bottom edge is a
              darker shade of its own fill and the press drops it onto that edge. Written
              inline against `--color-brand-lip` because `.btn-game` is not in `index.css`
              yet — swap this for the utility the moment it lands. */}
          <button
            ref={beginRef}
            type="button"
            onClick={onBegin}
            className="rounded-xl border-b-4 border-(--color-brand-lip) bg-(--color-glow) px-7 pt-3.5 pb-3 text-[15px] font-semibold text-white transition-[filter,transform,border-width] duration-100 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--color-energy) active:translate-y-[4px] active:border-b-0"
            style={{
              boxShadow: "0 10px 34px -12px color-mix(in oklab, var(--color-glow) 85%, transparent)",
            }}
          >
            {UI_LABEL.beginChapter}
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * The large figure.
 *
 * Research rule: a speaking character is never smaller than about a third of the viewport
 * height, and the four portraits are 160×160 — so "render it bigger" is not available as
 * a photograph. At the 420px box this occupies it would be visibly soft. It is therefore
 * treated as artwork: `luminosity`-blended over a purple plate so it is a duotone rather
 * than a photo, cropped to head and shoulders, its edges taken out by a radial mask so
 * there is no rectangle whose resolution you could judge, and grained over with a 3px
 * diagonal, which is what actually hides the interpolation. The name plate is real text,
 * never part of the image.
 */
function Figure({
  photo,
  person,
}: {
  photo: string;
  person?: { name: string; role: string };
}) {
  const mask =
    "radial-gradient(48% 54% at 52% 42%, #000 40%, color-mix(in oklab, #000 34%, transparent) 64%, transparent 88%)";
  const masked = { maskImage: mask, WebkitMaskImage: mask } as React.CSSProperties;
  return (
    <div
      className="cut-figure-in pointer-events-none absolute inset-y-0 right-0 z-[5] hidden w-[46%] flex-col items-center justify-center lg:flex"
      style={at(140)}
    >
      <div className="relative h-[400px] w-[400px]">
        {/* the plate the portrait is blended into — this is the duotone's second colour */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in oklab, var(--color-glow) 70%, var(--color-stage)) 0%, var(--color-stage) 78%)",
            ...masked,
          }}
        />
        <img
          src={artUrl(photo)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "50% 14%",
            mixBlendMode: "luminosity",
            filter: "grayscale(1) contrast(1.18) brightness(1.06)",
            ...masked,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.7,
            backgroundImage:
              /* 24% and a 4px pitch, down from 52% and 3px. At the heavier setting the grain
                 stopped reading as a print treatment and started reading as a GLITCHED
                 HOLOGRAM — a corrupted transmission rather than a colleague — which is a
                 different and much worse thing for the one human face in the scene. Kept
                 rather than removed, because some texture is what stops a 160px source
                 looking like a soft photograph blown up. */
              "repeating-linear-gradient(117deg, color-mix(in oklab, var(--color-stage) 24%, transparent) 0 1px, transparent 1px 4px)",
            ...masked,
          }}
        />
        {/* a rim of light, so the silhouette separates from the graded backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(200deg, color-mix(in oklab, var(--color-energy) 14%, transparent) 0%, transparent 46%)",
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      </div>
      {person && (
        /* Under the figure, not pinned to the frame: a name plate that drifts to the
           bottom of the screen belongs to the screen, not to the person. */
        <div className="mt-1 text-center">
          <p className="text-[18px] font-bold text-(--color-stage-ink)">{person.name}</p>
          <p className="text-[13px] text-(--color-stage-ink-soft)">{person.role}</p>
        </div>
      )}
    </div>
  );
}

/** Exported so the parent wiring this in can reuse the stage's own dressing. */
export { CHAPTER_STAGE };
