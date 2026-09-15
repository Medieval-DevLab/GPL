/**
 * Document facsimiles — the artefacts of the job, drawn rather than photographed.
 *
 * The option cards used to carry photographs: 21 WebP crops lifted from the original
 * mockups, every one upscaled about ×1.43 into its frame and losing ~45% of its detail
 * energy doing it, occupying **9.2% of a decision screen's pixels**. A turbine sky
 * measured 23× the colourfulness of the Winability bar it sat beside. And the owner's
 * verdict on the result was that the game "looks like a PPT", which is exactly right:
 * generic office stock behind a heading is the visual grammar of a slide deck.
 *
 * A 132px photograph cannot carry a fact. So these carry the fact instead. Each one is
 * the *thing itself* — the complaint data you bought, the scorecard you are being marked
 * against, the clause you are about to accept, the plan that is slipping. A player who
 * glances at an option card now learns something about the option from the picture.
 *
 * Why SVG rather than better photography:
 *
 *  · **Sharp at any size.** These render from geometry, so the ×1.43 upscale that ruined
 *    the crops cannot happen, at any device pixel ratio.
 *  · **Tokens, not pixels.** They recolour with the palette, so a colour change cannot
 *    leave the imagery behind — which is what happened to the mockup crops.
 *  · **Bytes.** The photographs are 146.66 kB of media. These are a few hundred bytes of
 *    markup each. (Note they land in the JS bundle rather than in media, so this trades
 *    one budget for another — see `tools/size.mjs`.)
 *
 * Every facsimile is `aria-hidden`: it is a picture of something the card already says in
 * words, and the words are what a screen reader should get. If one ever carries a fact
 * that is not also in text, it needs a `<figure>` and a real caption instead.
 */

import type { FacsimileId } from "../engine/types";

/* Drawn on a 320×96 canvas and scaled with `preserveAspectRatio="none"` off, so the
   geometry is stable whatever the card width. Strokes are specified at this scale. */
const W = 320;
const H = 96;

/** Paper, hairline, ink, and the one hue a facsimile is allowed to use. */
const PAPER = "var(--color-surface-card)";
/* `border-control`, not `border-subtle`. The hairlines measured 1.54:1 against the ground
   and simply were not there once a 320px drawing scaled into a 258px card. */
const LINE = "var(--color-border-control)";
const INK = "var(--color-text-strong)";
/* Muted, not subtle: these marks stand in for text and have to read as marks. */
const MUTED = "var(--color-text-muted)";

/** A row of ruled lines standing in for body copy. Never real text: it would be noise. */
function Ruled({ y, widths }: { y: number; widths: number[] }) {
  return (
    <>
      {widths.map((w, i) => (
        <rect
          key={i}
          x={18}
          y={y + i * 9}
          width={w}
          height={3}
          rx={1.5}
          fill={MUTED}
          opacity={0.9}
        />
      ))}
    </>
  );
}

/**
 * Complaint volumes — the evidence the whole story turns on.
 *
 * Post-purchase is the tall pair, because that is the finding: the damage is in
 * deliveries and returns, not in store. The chart says the mission's point before the
 * player has read a word of it.
 */
function Complaints() {
  const bars = [22, 30, 74, 68, 26, 18];
  return (
    <>
      <Ruled y={16} widths={[84]} />
      {bars.map((h, i) => (
        <rect
          key={i}
          x={18 + i * 26}
          y={H - 16 - h * 0.62}
          width={16}
          height={h * 0.62}
          rx={2}
          fill={i === 2 || i === 3 ? "var(--color-win-solid)" : MUTED}
          opacity={i === 2 || i === 3 ? 1 : 0.45}
        />
      ))}
      <rect x={18} y={H - 15} width={W - 36} height={1.5} fill={LINE} />
    </>
  );
}

/** A scorecard: weighted criteria with one column you are winning. */
function Scorecard() {
  const rows = [
    [58, 0.9],
    [72, 0.45],
    [46, 0.7],
    [64, 0.3],
  ] as const;
  return (
    <>
      <Ruled y={14} widths={[96]} />
      {rows.map(([label, fill], i) => (
        <g key={i}>
          <rect x={18} y={34 + i * 14} width={label} height={2.5} rx={1.25} fill={MUTED} opacity={0.8} />
          <rect x={132} y={32 + i * 14} width={158} height={6} rx={3} fill={LINE} />
          <rect
            x={132}
            y={32 + i * 14}
            width={158 * fill}
            height={6}
            rx={3}
            fill={i === 0 ? "var(--color-deliver-solid)" : MUTED}
            opacity={i === 0 ? 1 : 0.4}
          />
        </g>
      ))}
    </>
  );
}

/**
 * Who owns what. The highlighted node is the person who can stop you.
 *
 * The first version drew four empty rounded rectangles and read as four empty rounded
 * rectangles — the connectors were a 1.5px hairline and nothing said "these are people".
 * Each box now carries a name bar, the connectors are ink rather than hairline, and the
 * blocker is a filled node whose name is legible against it.
 */
function OrgChart() {
  const kids = [40, 130, 220];
  return (
    <>
      {/* the sponsor */}
      <rect x={122} y={12} width={76} height={20} rx={4} fill={INK} />
      <rect x={132} y={20} width={44} height={3} rx={1.5} fill="#fff" opacity={0.85} />

      {/* the tree: ink, not hairline, or it disappears at card size */}
      <rect x={159} y={32} width={2} height={12} fill={MUTED} opacity={0.9} />
      <rect x={53} y={44} width={214} height={2} fill={MUTED} opacity={0.9} />
      {kids.map((x) => (
        <rect key={x} x={x + 26} y={44} width={2} height={10} fill={MUTED} opacity={0.9} />
      ))}

      {kids.map((x, i) => {
        const blocker = i === 2;
        return (
          <g key={x}>
            <rect
              x={x}
              y={54}
              width={54}
              height={22}
              rx={4}
              fill={blocker ? "var(--color-win-solid)" : PAPER}
              stroke={blocker ? "none" : LINE}
              strokeWidth={1.5}
            />
            <rect
              x={x + 9}
              y={63}
              width={blocker ? 36 : 28}
              height={3}
              rx={1.5}
              fill={blocker ? "#fff" : MUTED}
              opacity={blocker ? 0.95 : 0.6}
            />
          </g>
        );
      })}

      {/* everything under him is his */}
      <rect x={220} y={84} width={54} height={3} rx={1.5} fill="var(--color-win-text)" />
    </>
  );
}

/** A contract clause, with the sentence somebody will have to keep picked out. */
function Clause() {
  return (
    <>
      <rect x={18} y={14} width={44} height={8} rx={2} fill={MUTED} opacity={0.75} />
      <Ruled y={32} widths={[266, 248, 272]} />
      <rect x={14} y={62} width={3} height={22} rx={1.5} fill="var(--color-risk-solid)" />
      <Ruled y={66} widths={[210, 164]} />
    </>
  );
}

/** A plan where one bar has already moved past the line. */
function Timeline() {
  const bars = [
    [18, 120],
    [54, 92],
    [96, 168],
  ] as const;
  return (
    <>
      <Ruled y={14} widths={[72]} />
      {bars.map(([x, w], i) => (
        <rect
          key={i}
          x={x}
          y={34 + i * 18}
          width={w}
          height={10}
          rx={5}
          fill={i === 2 ? "var(--color-risk-solid)" : "var(--color-deliver-solid)"}
          opacity={i === 2 ? 1 : 0.55}
        />
      ))}
      <rect x={236} y={26} width={2} height={62} fill={INK} opacity={0.9} />
    </>
  );
}

/** A price broken into phases — the same total, a smaller first decision. */
function Phases() {
  return (
    <>
      <Ruled y={14} widths={[88]} />
      <rect x={18} y={34} width={72} height={40} rx={4} fill="var(--color-profit-solid)" />
      <rect x={98} y={34} width={90} height={40} rx={4} fill={PAPER} stroke={LINE} strokeWidth={1.5} strokeDasharray="4 3" />
      <rect x={196} y={34} width={106} height={40} rx={4} fill={PAPER} stroke={LINE} strokeWidth={1.5} strokeDasharray="4 3" />
      <rect x={18} y={82} width={44} height={2.5} rx={1.25} fill="var(--color-profit-text)" />
    </>
  );
}

/** A proposal's contents, with the workstream nobody asked for included anyway. */
function Proposal() {
  return (
    <>
      <rect x={18} y={12} width={110} height={9} rx={2} fill={INK} opacity={0.8} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect
            x={18}
            y={34 + i * 14}
            width={7}
            height={7}
            rx={1.5}
            fill={i === 1 ? "var(--color-deliver-solid)" : MUTED}
            opacity={i === 1 ? 1 : 0.4}
          />
          <rect
            x={32}
            y={35 + i * 14}
            width={i === 1 ? 188 : 148 - i * 18}
            height={2.5}
            rx={1.25}
            fill={i === 1 ? "var(--color-deliver-text)" : MUTED}
            opacity={i === 1 ? 1 : 0.5}
          />
        </g>
      ))}
    </>
  );
}

/** A market view: three competitors and a gap none of them covers. */
function Market() {
  return (
    <>
      <Ruled y={14} widths={[80]} />
      <rect x={18} y={H - 15} width={W - 36} height={1.5} fill={LINE} />
      {[
        [30, 46],
        [96, 58],
        [162, 40],
      ].map(([x, h], i) => (
        <rect key={i} x={x} y={H - 16 - h} width={40} height={h} rx={3} fill={MUTED} opacity={0.65} />
      ))}
      <rect
        x={228}
        y={H - 16 - 64}
        width={40}
        height={64}
        rx={3}
        fill="none"
        stroke="var(--color-win-solid)"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
    </>
  );
}

const DRAWINGS: Record<FacsimileId, () => React.ReactElement> = {
  complaints: Complaints,
  scorecard: Scorecard,
  org: OrgChart,
  clause: Clause,
  timeline: Timeline,
  phases: Phases,
  proposal: Proposal,
  market: Market,
};

/**
 * One facsimile, filling its frame.
 *
 * `aria-hidden` throughout: every fact drawn here is also written on the card, and a
 * screen reader should get the sentence rather than a description of a picture of it.
 */
export function Facsimile({ kind, className }: { kind: FacsimileId; className?: string }) {
  const Drawing = DRAWINGS[kind];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden="true"
      focusable="false"
      role="presentation"
      style={{ background: "var(--color-surface-panel)", display: "block" }}
    >
      <Drawing />
    </svg>
  );
}
