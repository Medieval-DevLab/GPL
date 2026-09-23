import type { CharacterId } from "./characters";

export type ChapterNumber = 1 | 2 | 3 | 4 | 5;
export type SceneAsset = `scene-chapter-${ChapterNumber}`;
export type PhotoAsset = `photo-${CharacterId}` | SceneAsset;

export const CHAPTER_SCENES: Readonly<Record<ChapterNumber, SceneAsset>> = {
  1: "scene-chapter-1", 2: "scene-chapter-2", 3: "scene-chapter-3",
  4: "scene-chapter-4", 5: "scene-chapter-5",
};

export const SCENE_DESCRIPTIONS: Readonly<Record<SceneAsset, string>> = {
  "scene-chapter-1": "A retail environment, representing the fictional client context",
  "scene-chapter-2": "Colleagues meeting around a table",
  "scene-chapter-3": "A project team working through ideas in a workshop",
  "scene-chapter-4": "A contemporary client meeting room",
  "scene-chapter-5": "A delivery team reviewing work together",
};

/** Local assets remain usable in nested deployments and packaged LMS distribution. */
export function photoUrl(asset: PhotoAsset, base = import.meta.env.BASE_URL): string {
  return `${base.endsWith("/") ? base : `${base}/`}art/${asset}.webp`;
}

export interface PhotoCredit {
  asset: PhotoAsset;
  photographer: string;
  sourceId: string;
  source: string;
  width: number;
  height: number;
  bytes: number;
}

export const PHOTO_LICENCE = "https://www.pexels.com/license/";
export const PHOTO_ACQUIRED = "2026-09-23";

export const PHOTO_CREDITS: readonly PhotoCredit[] = [
  { asset: "photo-priya", photographer: "Los Muertos Crew", sourceId: "10041258", source: "https://www.pexels.com/photo/portrait-of-businesswoman-10041258/", width: 720, height: 1078, bytes: 52668 },
  { asset: "photo-riya", photographer: "Andrea Piacquadio", sourceId: "3769021", source: "https://www.pexels.com/photo/happy-ethnic-woman-sitting-at-table-with-laptop-3769021/", width: 720, height: 480, bytes: 14594 },
  { asset: "photo-arjun", photographer: "Italo Melo", sourceId: "2379004", source: "https://www.pexels.com/photo/portrait-photo-of-smiling-man-with-his-arms-crossed-standing-in-front-of-a-wall-2379004/", width: 720, height: 1087, bytes: 122920 },
  { asset: "photo-aisha", photographer: "Christina Morillo", sourceId: "1181690", source: "https://www.pexels.com/photo/woman-wearing-white-shirt-1181690/", width: 720, height: 480, bytes: 18568 },
  { asset: "photo-sarah", photographer: "Ketut Subiyanto", sourceId: "4965004", source: "https://www.pexels.com/photo/a-portrait-of-a-woman-in-a-plaid-suit-4965004/", width: 720, height: 480, bytes: 18354 },
  { asset: "photo-marcus", photographer: "LinkedIn Sales Navigator", sourceId: "2182970", source: "https://www.pexels.com/photo/man-wearing-white-dress-shirt-and-black-blazer-2182970/", width: 720, height: 1080, bytes: 30694 },
  { asset: "photo-declan", photographer: "Tony James-Andersson", sourceId: "1674743", source: "https://www.pexels.com/photo/portrait-of-a-man-in-a-suit-1674743/", width: 720, height: 1020, bytes: 78916 },
  { asset: "scene-chapter-1", photographer: "Maria Orlova", sourceId: "4940756", source: "https://www.pexels.com/photo/fashion-store-interior-with-garments-hanging-on-racks-4940756/", width: 1920, height: 1080, bytes: 198344 },
  { asset: "scene-chapter-2", photographer: "fauxels", sourceId: "3184291", source: "https://www.pexels.com/photo/colleagues-shaking-each-other-s-hands-3184291/", width: 1920, height: 1080, bytes: 117950 },
  { asset: "scene-chapter-3", photographer: "Yan Krukau", sourceId: "7793653", source: "https://www.pexels.com/photo/people-sitting-in-a-conference-room-7793653/", width: 1920, height: 1080, bytes: 75928 },
  { asset: "scene-chapter-4", photographer: "Mikhail Nilov", sourceId: "8102300", source: "https://www.pexels.com/photo/empty-conference-room-8102300/", width: 1920, height: 1080, bytes: 37646 },
  { asset: "scene-chapter-5", photographer: "Gustavo Fring", sourceId: "4872017", source: "https://www.pexels.com/photo/people-at-a-meeting-in-a-conference-room-4872017/", width: 1920, height: 1080, bytes: 83842 },
];
