/** Inline line icons. No asset files, no icon library, no network request. */

import type { IconId } from "../engine/types";

const PATHS: Record<IconId, string> = {
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4",
  people:
    "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 8v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.3a3.5 3.5 0 0 1 0 6.8",
  // A handshake has too many crossing strokes to survive at 19px. A speech
  // bubble says the same thing here — both places it is used are conversations.
  talk: "M20.5 11.7a8 8 0 0 1-8.6 8 8.7 8.7 0 0 1-3.2-.6L3.5 20.5l1.6-4.8a7.8 7.8 0 0 1-.7-3.3 8 8 0 0 1 8.6-8 8 8 0 0 1 7.5 7.3Z",
  megaphone: "M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1Zm13-1a4 4 0 0 1 0 6",
  shield: "M12 21s7-3.2 7-9V6l-7-3-7 3v6c0 5.8 7 9 7 9Z",
  // A four-point sparkle. The previous eight-ray sun turned to mush at 16px.
  spark: "M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9L12 3.5Z",
  chart: "M5 20V11m7 9V5m7 15v-6M3 20h18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3 2",
  coins: "M12 11c3.9 0 7-1.3 7-3s-3.1-3-7-3-7 1.3-7 3 3.1 3 7 3Zm7-3v8c0 1.7-3.1 3-7 3s-7-1.3-7-3V8m14 4c0 1.7-3.1 3-7 3s-7-1.3-7-3",
  warning: "M12 9v4m0 3.5v.1M10.3 4.2 2.9 17.4A2 2 0 0 0 4.6 20.4h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  cross: "M6 6l12 12M18 6 6 18",
  block: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12h8",
  rocket: "M13.5 4.5c3.5-1.8 6-1.5 6-1.5s.3 2.5-1.5 6c-1.4 2.8-4.6 5.4-6.6 6.8L8 13.6c1.4-2 4-5.2 5.5-6.6ZM8 13.6 5 12.8l2-3.4 3 .5M10.4 16.8l.8 3 3.4-2-.5-3M6.5 17.5 4 20",
  layers: "m12 3 9 4.5-9 4.5-9-4.5L12 3Zm9 9-9 4.5L3 12m18 4.5L12 21l-9-4.5",
  scale: "M12 4v16M7 20h10M12 6 5 9m7-3 7 3M5 9l-2.5 5a2.8 2.8 0 0 0 5 0L5 9Zm14 0-2.5 5a2.8 2.8 0 0 0 5 0L19 9Z",
  flag: "M5 21V4m0 0 6.5 1.8a3 3 0 0 0 2.3-.3L19 3v10l-5.2 2.5a3 3 0 0 1-2.3.3L5 14",
  trophy: "M8 4h8v4a4 4 0 0 1-8 0V4Zm0 1H5.5A1.5 1.5 0 0 0 4 6.5C4 8.4 5.6 10 7.5 10H8m8-5h2.5A1.5 1.5 0 0 1 20 6.5C20 8.4 18.4 10 16.5 10H16M9.5 12.2 9 16h6l-.5-3.8M7 20h10m-5-4v4",
  bulb: "M9 18h6m-5 3h4M12 3a6 6 0 0 1 3.6 10.8c-.4.3-.6.8-.6 1.2v1H9v-1c0-.4-.2-.9-.6-1.2A6 6 0 0 1 12 3Z",
};

const FILLED: Partial<Record<IconId, boolean>> = {};

/**
 * Optical sizing — the stroke is a constant apparent weight, not a constant number.
 *
 * Every icon in the game is drawn on a 24-unit grid and rendered at 9 to 38px. A fixed
 * `strokeWidth={1.7}` is therefore not one weight: it is `1.7 × size / 24` device pixels,
 * which measured **0.64px on the 9px cross inside an option's trade-off row and 1.98px on
 * the 28px option medallion** — a 3.1× range of apparent weight inside a single card. The
 * small ones read as hairlines about to disappear and the large ones as a heavier family.
 *
 * Inverting the scale fixes it with arithmetic rather than with taste: at
 * `1.5 × 24 / size` the rendered stroke is 1.5px at every size, which is the weight the
 * 18px default was already drawing. Rounded to two places only so the DOM stays readable.
 *
 * 1.5 rather than 1.7 because 1.7 was measured at the 18px default — `1.7 × 18 / 24` is
 * 1.28px — and matching the *rendered* weight of the icons the game already ships would
 * have kept the hairline. 1.5px is the weight of the type's stem at 13px, which is what
 * these sit beside.
 */
const APPARENT_STROKE_PX = 1.5;
const strokeFor = (size: number) =>
  Math.round(((APPARENT_STROKE_PX * 24) / Math.max(1, size)) * 100) / 100;

export function Icon({
  name,
  size = 18,
  className,
  style,
}: {
  name: IconId;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeFor(size)}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} fill={FILLED[name] ? "currentColor" : "none"} />
    </svg>
  );
}

/**
 * A bullet, and deliberately not an icon.
 *
 * `layers` was carrying four meanings, three of them on one screen — Deliverability's
 * identity, a section heading, and the bullet marker in "What is now different" — so a
 * pictogram that means "can we deliver it?" was also being used to mean "item in a list".
 * A list marker has no meaning to carry: it is punctuation. 3px of ink says "item" and
 * cannot be mistaken for a dimension.
 *
 * Square rather than round because every round mark in this interface is a state — a
 * stepper node, a cost dot, a tone medallion — and a bullet is not a state.
 */
export function Bullet({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-[3px] w-[3px] shrink-0 bg-current ${className ?? ""}`}
    />
  );
}

export type Tone = "accent" | "neutral" | "good" | "warn" | "bad";

export const TONES: Record<Tone, { bg: string; fg: string }> = {
  accent: { bg: "var(--color-accent-tint)", fg: "var(--color-accent)" },
  neutral: { bg: "var(--color-canvas-deep)", fg: "var(--color-muted)" },
  good: { bg: "var(--color-good-tint)", fg: "var(--color-good)" },
  warn: { bg: "var(--color-warn-tint)", fg: "var(--color-warn)" },
  bad: { bg: "var(--color-bad-tint)", fg: "var(--color-bad)" },
};

/** Small rounded tile behind an icon, used on option and fact cards. */
export function IconTile({
  name,
  tone = "accent",
  size = 36,
}: {
  name: IconId;
  tone?: Tone;
  size?: number;
}) {
  const t = TONES[tone];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: size, height: size, background: t.bg, color: t.fg }}
    >
      <Icon name={name} size={Math.round(size * 0.52)} />
    </span>
  );
}

/**
 * Filled status chip. The main scannability device on the page: a tinted chip
 * is read in peripheral vision, whereas coloured body text still has to be
 * read word by word.
 */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <span className="chip" style={{ background: t.bg, color: t.fg }}>
      {children}
    </span>
  );
}

/** Dark, bold, with a coloured icon. Never a faint uppercase label. */
export function SectionTitle({
  icon,
  tone = "accent",
  children,
  className,
}: {
  icon?: IconId;
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`section-title ${className ?? ""}`}>
      {icon && (
        <span className="shrink-0" style={{ color: TONES[tone].fg }}>
          <Icon name={icon} size={16} />
        </span>
      )}
      {children}
    </h2>
  );
}
