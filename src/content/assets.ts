import type { CharacterId } from "./characters";

export type ChapterNumber = 1 | 2 | 3 | 4 | 5;
export type SceneAsset = `scene-chapter-${ChapterNumber}`;
/** Daylight locations with no identifiable people, so no stranger competes with the cast (D-080). */
export type EnvironmentId = "warehouse" | "boardroom" | "glass-office";
export type EnvironmentAsset = `env-${EnvironmentId}`;
/** A backdrop is any photograph that can sit behind a screen: a chapter scene or an environment. */
export type BackdropAsset = SceneAsset | EnvironmentAsset;
/** Background-removed derivative of the same licensed portrait, so a character can stand in the scene. */
export type CutoutAsset = `cut-${CharacterId}`;
export type PhotoAsset = `photo-${CharacterId}` | BackdropAsset | CutoutAsset;

export const CHAPTER_SCENES: Readonly<Record<ChapterNumber, SceneAsset>> = {
  1: "scene-chapter-1", 2: "scene-chapter-2", 3: "scene-chapter-3",
  4: "scene-chapter-4", 5: "scene-chapter-5",
};

export const SCENE_DESCRIPTIONS: Readonly<Record<BackdropAsset, string>> = {
  "scene-chapter-1": "A retail environment, representing the fictional client context",
  "scene-chapter-2": "Colleagues meeting around a table",
  "scene-chapter-3": "A project team working through ideas in a workshop",
  "scene-chapter-4": "A contemporary client meeting room",
  "scene-chapter-5": "A delivery team reviewing work together",
  "env-warehouse": "Warehouse aisles stacked with stock",
  "env-boardroom": "An empty boardroom with glass walls",
  "env-glass-office": "An empty open-plan office behind glass",
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


/**
 * Where each cut-out's face sits, as fractions of the image — measured, not guessed.
 *
 * The seven source photographs are cropped very differently: Priya is nearly full length,
 * Sarah is a close head-and-shoulders. Rendered at the same height they look like a giant
 * and a child, so placement is driven by the face instead. Measured with OpenCV's YuNet
 * detector (opencv_zoo, face_detection_yunet_2023mar) on the delivered WebP files:
 *   top    face box top / image height
 *   size   face box height / image height
 *   centre face centre x / image width
 *   aspect image width / height
 * Re-measure if a cut-out is ever regenerated.
 */
export const CUTOUT_FRAME: Readonly<Record<CharacterId, { top: number; size: number; centre: number; aspect: number }>> = {
  priya: { top: 0.066, size: 0.212, centre: 0.491, aspect: 0.504 },
  riya: { top: 0.158, size: 0.422, centre: 0.516, aspect: 0.856 },
  arjun: { top: 0.099, size: 0.271, centre: 0.433, aspect: 0.626 },
  aisha: { top: 0.079, size: 0.279, centre: 0.518, aspect: 1.106 },
  sarah: { top: 0.194, size: 0.536, centre: 0.519, aspect: 1.096 },
  marcus: { top: 0.071, size: 0.338, centre: 0.49, aspect: 0.709 },
  declan: { top: 0.08, size: 0.337, centre: 0.541, aspect: 0.738 },
};

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
  { asset: "env-warehouse", photographer: "Maor Attias", sourceId: "5156696", source: "https://www.pexels.com/photo/boxes-on-shelves-inside-a-warehouse-5156696/", width: 1920, height: 1080, bytes: 269292 },
  { asset: "env-boardroom", photographer: "myHQ-Workspaces", sourceId: "5444180", source: "https://www.pexels.com/photo/office-boardroom-interior-design-5444180/", width: 1920, height: 1080, bytes: 189660 },
  { asset: "env-glass-office", photographer: "cottonbro studio", sourceId: "5483051", source: "https://www.pexels.com/photo/black-rolling-chairs-beside-desk-5483051/", width: 1920, height: 1080, bytes: 39984 },
  /* Cut-outs: the same licensed portraits at a higher provider resolution (w=1400), background
     removed locally (rembg, isnet-general-use), cropped and bottom-feathered. Derivative, not new people. */
  { asset: "cut-priya", photographer: "Los Muertos Crew", sourceId: "10041258", source: "https://www.pexels.com/photo/portrait-of-businesswoman-10041258/", width: 705, height: 1400, bytes: 108042 },
  { asset: "cut-riya", photographer: "Andrea Piacquadio", sourceId: "3769021", source: "https://www.pexels.com/photo/happy-ethnic-woman-sitting-at-table-with-laptop-3769021/", width: 549, height: 641, bytes: 34182 },
  { asset: "cut-arjun", photographer: "Italo Melo", sourceId: "2379004", source: "https://www.pexels.com/photo/portrait-photo-of-smiling-man-with-his-arms-crossed-standing-in-front-of-a-wall-2379004/", width: 877, height: 1400, bytes: 193200 },
  { asset: "cut-aisha", photographer: "Christina Morillo", sourceId: "1181690", source: "https://www.pexels.com/photo/woman-wearing-white-shirt-1181690/", width: 998, height: 902, bytes: 39920 },
  { asset: "cut-sarah", photographer: "Ketut Subiyanto", sourceId: "4965004", source: "https://www.pexels.com/photo/a-portrait-of-a-woman-in-a-plaid-suit-4965004/", width: 984, height: 898, bytes: 66830 },
  { asset: "cut-marcus", photographer: "LinkedIn Sales Navigator", sourceId: "2182970", source: "https://www.pexels.com/photo/man-wearing-white-dress-shirt-and-black-blazer-2182970/", width: 993, height: 1400, bytes: 70062 },
  { asset: "cut-declan", photographer: "Tony James-Andersson", sourceId: "1674743", source: "https://www.pexels.com/photo/portrait-of-a-man-in-a-suit-1674743/", width: 1033, height: 1400, bytes: 249670 },
];
