/** Fictional characters represented by licensed stock models; see PHOTO-PROVENANCE.md. */
export type CharacterId = "priya" | "riya" | "arjun" | "aisha" | "sarah" | "marcus" | "declan";

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  /** Filename stem, resolved relative to the deployment base by the UI. */
  portrait: `photo-${CharacterId}`;
  /** Safe focal point for avatar and tall photographic crops. */
  focus: string;
  affiliation: "team" | "client";
}

export const CHARACTERS: Readonly<Record<CharacterId, Character>> = {
  priya: { id: "priya", name: "Priya Sharma", role: "Client Growth Lead", portrait: "photo-priya", focus: "53% 29%", affiliation: "team" },
  riya: { id: "riya", name: "Riya Kapoor", role: "Engagement Director", portrait: "photo-riya", focus: "51% 45%", affiliation: "team" },
  arjun: { id: "arjun", name: "Arjun Mehta", role: "Solutions Director", portrait: "photo-arjun", focus: "45% 35%", affiliation: "team" },
  aisha: { id: "aisha", name: "Aisha Khan", role: "Delivery Lead", portrait: "photo-aisha", focus: "65% 33%", affiliation: "team" },
  sarah: { id: "sarah", name: "Sarah Lim", role: "Chief Transformation Officer", portrait: "photo-sarah", focus: "48% 42%", affiliation: "client" },
  marcus: { id: "marcus", name: "Marcus Reed", role: "Operations Director", portrait: "photo-marcus", focus: "46% 31%", affiliation: "client" },
  declan: { id: "declan", name: "Declan Foyle", role: "Procurement", portrait: "photo-declan", focus: "50% 34%", affiliation: "client" },
};

/** Only call with an already resolved quote/advisor name. Does not reveal unseen speakers. */
export function characterByName(name: string | undefined): Character | undefined {
  return name ? Object.values(CHARACTERS).find((character) => character.name === name) : undefined;
}

export const FICTION_NOTICE = "A fictional business simulation. Names, organisations and events are invented. Photographs depict stock models, not the named people or employees; no endorsement is implied.";
