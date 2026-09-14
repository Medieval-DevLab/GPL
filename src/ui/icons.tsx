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
  spark: "M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
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
};

const FILLED: Partial<Record<IconId, boolean>> = {};

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
      strokeWidth={1.7}
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

/** Small rounded tile behind an icon, used on option and fact cards. */
export function IconTile({
  name,
  tone = "accent",
  size = 36,
}: {
  name: IconId;
  tone?: "accent" | "neutral" | "good" | "bad";
  size?: number;
}) {
  const tones = {
    accent: { bg: "var(--color-accent-tint)", fg: "var(--color-accent)" },
    neutral: { bg: "var(--color-canvas-deep)", fg: "var(--color-muted)" },
    good: { bg: "#e4f5ef", fg: "var(--color-good)" },
    bad: { bg: "#fbeaea", fg: "var(--color-bad)" },
  }[tone];

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[10px]"
      style={{ width: size, height: size, background: tones.bg, color: tones.fg }}
    >
      <Icon name={name} size={Math.round(size * 0.52)} />
    </span>
  );
}
