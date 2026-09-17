/**
 * The reflection node.
 *
 * Four per run, each placed after its chapter's hardest beat. It is a breath between
 * consequential decisions, and it exists because the run currently puts seventeen of
 * them back to back with nothing in between. Slay the Spire guarantees a rest site at
 * floor 15 of every act and rests are 12% of all rooms; scheduled recovery is a design
 * decision there, not slack.
 *
 * THE DEFINING PROPERTY, AND IT IS LOAD-BEARING: this is the only paper screen with the
 * METERS REMOVED. The absence is the teaching. Meters mean stakes, so no meters means
 * nothing is at stake here — and the player learns that without being told, because they
 * have seen the three bars on every other beat of the run. `SCREEN-SPECS.md` §4.5 states
 * the failure mode in one line: if a reflection ever moves a meter it has become a
 * decision wearing a reflection's clothes.
 *
 * So the ground is paper and the chrome is RAILS ONLY. The left rail keeps its place in
 * the chapter; the right rail keeps "Your file", because reference material is not a
 * stake; the Key factors block does not render at all. `ReflectionRail` below is the
 * right rail that does that, and it returns `null` rather than an empty panel when the
 * player has found nothing yet — an empty box is a hole, an absent one is a decision.
 *
 * NOTHING HERE CHANGES STATE. Both responses call the same handler, and the handler's
 * only job is to advance the beat. There is no selection to commit, so the responses are
 * buttons rather than radios: activating one *is* the move, and a radio group would
 * promise a commit step that does not exist.
 *
 * Everything the player reads comes from the node — `advisor`, `prompt`, `responses`,
 * `title`, `body`. A component may not invent story, and the questions are the point:
 * they are Thiagi's debrief phases 4 and 5, "how does this relate to the real world?" and
 * "what if?", which are the two where transfer actually happens and the two that vendor
 * learning products routinely omit.
 */

import type { Interlude } from "../engine/types";
import { Icon, SectionTitle } from "./icons";
import { BEAT_TITLE_ID, Hidden, Monogram, WorkInProgress, artUrl, quoted } from "./shell";

/* ───────────────────────── interface labels ─────────────────────────
   MUST MOVE TO `UI_LABEL` in `ui/shell.tsx`. Declared locally only because several
   agents are editing that module in parallel; move them and delete this block.

   None of it is story. `file` names a rail that already exists under that heading on the
   brief, and `noStake` is the non-colour, non-absence redundancy for the one thing this
   screen says by leaving something out: a sighted player reads "no meters", and a player
   using a screen reader reads nothing at all unless the region says so. */
const REFLECTION_LABEL = {
  /** the right rail, kept from the mission rails so the desk does not change shape */
  file: "Your file",
  /** what the missing meters say, for anyone who cannot see that they are missing */
  noStake: "Nothing on this screen changes your position.",
  /** names the response set for assistive technology; the prompt is the question */
  responses: "How you would answer",
} as const;

/**
 * The right rail on a reflection: the file, and deliberately nothing else.
 *
 * Exported separately because the console owns its rails — `App.tsx` passes this as
 * `right` in place of `InsightRail`, and that substitution is the entire mechanism by
 * which the meters disappear. Doing it by hiding a block inside `InsightRail` would have
 * left the rule where a future edit could quietly undo it.
 */
export function ReflectionRail({
  file,
}: {
  file?: { id: string; label: string; reveals: string }[];
}) {
  if (!file || file.length === 0) return null;
  return (
    <div data-region="account" className="space-y-2.5">
      <section>
        <SectionTitle icon="search" className="mb-1.5">
          {REFLECTION_LABEL.file}
        </SectionTitle>
        <ul className="space-y-1.5">
          {file.map((e) => (
            <li key={e.id}>
              <p className="text-[12px] font-bold text-(--color-accent-deep)">{e.label}</p>
              <p className="line-clamp-3 text-[12px] leading-snug text-(--color-muted)">
                {e.reveals}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * The colleague, at the top of the card.
 *
 * A photograph where content supplies one, and the monogram otherwise — the same device
 * the call surface uses, where initials in a circle are what a real product shows and not
 * a stand-in for a missing asset.
 */
function Speaker({ name, role, photo }: { name: string; role: string; photo?: string }) {
  return (
    <div className="flex items-center gap-3.5">
      {photo ? (
        <img
          src={artUrl(photo)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <Monogram name={name} size={56} />
      )}
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-(--color-ink)">{name}</p>
        <p className="text-[13px] font-medium text-(--color-accent)">{role}</p>
      </div>
    </div>
  );
}

export function ReflectionScreen({
  node,
  onRespond,
  titleId = BEAT_TITLE_ID,
}: {
  node: Interlude;
  /**
   * Advance. It takes the index only so a caller could log which thought the player
   * recognised; it must never be used to branch, and no outcome reads it.
   */
  onRespond?: (index: number) => void;
  titleId?: string;
}) {
  const prompt = node.prompt;
  const responses = node.responses ?? [];
  const advisor = node.advisor;

  return (
    <section
      data-region="reflection"
      aria-label={node.title}
      /* Paper, warmer. The console paints the work area `--color-canvas` and this lays a
         warm wash over it, so the beat is recognisably a different room on the same floor
         — see the note on the layer below for why the first attempt could not be seen.
         `min-h-full` rather than a fixed height, so the card centres in whatever the
         console gives it and the screen fits at 739 and at 863 without arithmetic. */
      className="relative isolate flex min-h-full flex-col items-center justify-center px-8 py-10"
      style={{ background: "var(--color-canvas)" }}
    >
      {/* Warmer, and measurably so. The first attempt washed the desk with the brand
          tint at 78% and was invisible on a screenshot — `--color-accent-tint` is a
          lavender within 1.1:1 of the desk it sat on, which is the same mistake the
          palette notes record for the meter tracks. `--color-surface-panel` is the warm
          paper step at 1.39:1 against white, so a wash toward it reads as a different
          room at a glance and still leaves the white card the lightest thing on screen. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(86% 76% at 50% 42%, color-mix(in oklab, var(--color-surface-panel) 72%, transparent) 0%, color-mix(in oklab, var(--color-surface-panel) 22%, transparent) 62%, transparent 100%)",
        }}
      />

      {!prompt || responses.length === 0 ? (
        <WorkInProgress
          what="Reflection node"
          left={[
            "content has no prompt or responses on this node yet",
            "the screen is built; the four questions are being authored",
          ]}
        />
      ) : null}

      <div className="relative w-full max-w-[560px]">
        {/* The beat's own name, quiet and sentence case. Not an eyebrow: a tracked
            capital label over every heading is the tell this interface is avoiding, and
            here it would shout over a screen whose whole argument is that it is calm.

            It takes `titleId` when there is no prompt to take it. The console names its
            work area after whatever carries that id, so an unauthored node would
            otherwise leave `<main aria-labelledby>` pointing at nothing — an unnamed
            six-region console, which is the failure the id exists to prevent. */}
        <p
          id={prompt ? undefined : titleId}
          className="mb-3 text-center text-[13px] font-medium text-(--color-muted)"
        >
          {node.title}
        </p>

        <div className="m-enter card px-8 pt-7 pb-7 elev-1">
          {advisor && <Speaker name={advisor.name} role={advisor.role} photo={advisor.photo} />}

          {node.body.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-(--color-line) pt-5">
              {node.body.map((line, i) => (
                <p key={i} className="text-[13px] leading-relaxed text-(--color-muted) text-pretty">
                  {line}
                </p>
              ))}
            </div>
          )}

          {prompt && (
            /* The question is the beat, so it is the heading. 24px is the largest step
               below a display numeral and the right one for ~20 words: three lines in a
               496px measure, which is inside the 45–75 character band. */
            <h1
              id={titleId}
              className={`text-[24px] leading-[1.32] font-bold tracking-[-0.01em] text-(--color-ink) text-pretty ${
                node.body.length > 0 ? "mt-4" : "mt-5 border-t border-(--color-line) pt-5"
              }`}
            >
              {quoted(prompt)}
            </h1>
          )}

          {/* The missing meters, in words, for the one channel that cannot perceive an
              absence. `SCREEN-SPECS.md` §4.5 is explicit that the teaching here is the
              absence itself — so this must not be visible type, or the screen would
              explain its own joke to the people who can already see it. A player using a
              screen reader has no "where the meters used to be" to look at, and would
              otherwise meet a reflection as an ordinary beat with two buttons. */}
          <Hidden>{REFLECTION_LABEL.noStake}</Hidden>

          {responses.length > 0 && (
            <div className="mt-6" role="group" aria-label={REFLECTION_LABEL.responses}>
              <div className="m-deal space-y-2.5">
                {responses.map((text, i) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => onRespond?.(i)}
                    className="choice flex min-h-[48px] w-full items-center gap-3 px-4 py-3"
                  >
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-(--color-accent)"
                    >
                      <Icon name="talk" size={16} />
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] leading-[1.45] text-(--color-ink)">
                      {quoted(text)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
