# Production photography

Acquired and checked 23 September 2026. These are photographs published as free stock by Pexels, not generated faces. The complete local set is 850,424 bytes: seven recurring model portraits and five 1920 × 1080 scene photographs. No payment, private profile scraping or external account access was used.

The [Pexels licence](https://www.pexels.com/license/) permits free personal/commercial app use and modification, with attribution appreciated rather than required. Its restrictions include offensive portrayal, implied endorsement, standalone resale and redistribution as stock. The game uses the photographs within an authored fictional learning simulation. Stock models are not represented as actual Accenture employees, clients, named people, endorsers, or speakers of real quotations. Individual model releases have not been obtained independently; this record documents the provider's published grant, not a separate release assurance.

Required in the game's Help/About: “A fictional business simulation. Names, organisations and events are invented. Photographs depict stock models, not the named people or employees; no endorsement is implied.” Exported as `FICTION_NOTICE` in `src/content/characters.ts`. Credits and licence URL are exported in `src/content/assets.ts` for the same panel.

## Cast

Role labels and model associations below are fictional. The listed source asset ID is the continuity/model binding, not an inferred real identity. One image is reused throughout each character's scenes; do not substitute unrelated faces or generate expressions. Runtime image paths are `art/<asset>.webp` under the deployment base.

| Asset / fictional role | Photographer and source | Delivered dimensions / bytes | Crop focus |
|---|---|---|---|
| `photo-priya` / Priya Sharma, Client Growth Lead | [Los Muertos Crew, 10041258](https://www.pexels.com/photo/portrait-of-businesswoman-10041258/) | 720 × 1078 / 52,668 | 53% 29% |
| `photo-riya` / Riya Kapoor, Engagement Director | [Andrea Piacquadio, 3769021](https://www.pexels.com/photo/happy-ethnic-woman-sitting-at-table-with-laptop-3769021/) | 720 × 480 / 14,594 | 51% 45% |
| `photo-arjun` / Arjun Mehta, Solutions Director | [Italo Melo, 2379004](https://www.pexels.com/photo/portrait-photo-of-smiling-man-with-his-arms-crossed-standing-in-front-of-a-wall-2379004/) | 720 × 1087 / 122,920 | 45% 35% |
| `photo-aisha` / Aisha Khan, Delivery Lead | [Christina Morillo, 1181690](https://www.pexels.com/photo/woman-wearing-white-shirt-1181690/) | 720 × 480 / 18,568 | 65% 33% |
| `photo-sarah` / Sarah Lim, Chief Transformation Officer | [Ketut Subiyanto, 4965004](https://www.pexels.com/photo/a-portrait-of-a-woman-in-a-plaid-suit-4965004/) | 720 × 480 / 18,354 | 48% 42% |
| `photo-marcus` / Marcus Reed, Operations Director | [LinkedIn Sales Navigator, 2182970](https://www.pexels.com/photo/man-wearing-white-dress-shirt-and-black-blazer-2182970/) | 720 × 1080 / 30,694 | 46% 31% |
| `photo-declan` / Declan Foyle, Procurement | [Tony James-Andersson, 1674743](https://www.pexels.com/photo/portrait-of-a-man-in-a-suit-1674743/) | 720 × 1020 / 78,916 | 50% 34% |

Intended use: advisor portraits at relevant chapter arrivals, briefs, reflections and debriefs; client portraits only where the resolved story speaker is known. Do not put Marcus in a universal stakeholder list before the story reveals him. Use the existing condition resolver, then exact `characterByName(resolvedName)` mapping. Advisors' roles retain one identity across chapters.

## Environments

These are representative stock locations, not claims about the actual premises of any company. People in environment photos are ambient cast; they are not alternate portraits of the seven named characters. A scene photo supplies setting and atmosphere, never evidence, business facts or essential instructions.

| Asset | Source / credit | Dimensions / bytes | Screens |
|---|---|---|---|
| `scene-chapter-1` | [Maria Orlova, 4940756](https://www.pexels.com/photo/fashion-store-interior-with-garments-hanging-on-racks-4940756/) | 1920 × 1080 / 198,344 | Client arrival, discovery, chapter map |
| `scene-chapter-2` | [fauxels, 3184291](https://www.pexels.com/photo/colleagues-shaking-each-other-s-hands-3184291/) | 1920 × 1080 / 117,950 | Qualification, team planning, welcome |
| `scene-chapter-3` | [Yan Krukau, 7793653](https://www.pexels.com/photo/people-sitting-in-a-conference-room-7793653/) | 1920 × 1080 / 75,928 | Solution workshop, proposal, team review |
| `scene-chapter-4` | [Mikhail Nilov, 8102300](https://www.pexels.com/photo/empty-conference-room-8102300/) | 1920 × 1080 / 37,646 | Negotiation, procurement, offer review |
| `scene-chapter-5` | [Gustavo Fring, 4872017](https://www.pexels.com/photo/people-at-a-meeting-in-a-conference-room-4872017/) | 1920 × 1080 / 83,842 | Delivery, handover, continuity, closure |

Use a centred crop as the default; keep a readable gradient behind overlaid text. Scenery should be decorative (`alt=""`) when adjacent live text names the location. Give a standalone scene informative alt text from `SCENE_DESCRIPTIONS`. Portraits beside a visible name can be decorative; otherwise use the fictional character's name with the fiction notice available in About. If a photograph fails, retain the HTML character name/role, task and controls against the solid theme background; never hide the learning content.

## D-081 update (8 October 2026)

The seven cut-outs (`cut-<character>.webp`) are back in the repository and the runtime set, restored byte-identical from commit `cff5a2a`. Their provenance, method and face-frame measurements are described under "October 2026 additions" below. They are staged without rim light or colour grading: people stand in daylight rooms with a natural shadow. The runtime set is 22 files: 7 portraits, 7 cut-outs, 5 chapter scenes and 3 locations.

## D-080 update (8 October 2026)

The daylight rebuild removed the six night photographs (`env-skyline-dusk`, `env-skyline-blue`, `env-tower-night`, `env-windows-night`, `env-storefront-night`, `env-desk-night`) and all seven cut-outs from the repository and the runtime set. Photographs are now shown framed, with the place named beneath, never behind text. Three locations remain: `env-warehouse`, `env-boardroom` and `env-glass-office`. The runtime set is 15 files (1.35 MB): 7 portraits, 5 chapter scenes and 3 locations. The table below is kept as the record of what was acquired.

## October 2026 additions: locations and cut-outs

Added 8 October 2026 for the presentation rebuild (`D-077`). They are from the same provider and licence, and credited in Help/About from `PHOTO_CREDITS`.

**Locations.** Nine photographs, none with identifiable people, so no stranger competes with the named cast. They were downloaded from the provider's 1920 × 1080 crop endpoint and re-encoded to WebP (quality 74). Photographer credits were read from each source page on 8 October.

| Asset | Photographer and source |
|---|---|
| `env-skyline-dusk` | [Bruno Glätsch, 1398003](https://www.pexels.com/photo/photo-of-city-skyline-during-dusk-1398003/) |
| `env-skyline-blue` | [Marc Onana, 5823946](https://www.pexels.com/photo/city-skyline-during-night-time-5823946/) |
| `env-tower-night` | [Candid Flaneur, 29931645](https://www.pexels.com/photo/modern-office-building-at-night-with-illuminated-windows-29931645/) |
| `env-windows-night` | [Line Knipst, 18824803](https://www.pexels.com/photo/lights-in-windows-of-office-skyscraper-at-night-18824803/) |
| `env-warehouse` | [Maor Attias, 5156696](https://www.pexels.com/photo/boxes-on-shelves-inside-a-warehouse-5156696/) |
| `env-storefront-night` | [Erik Mclean, 12973623](https://www.pexels.com/photo/store-front-during-nighttime-12973623/) |
| `env-desk-night` | [Al-Razi Production, 9333180](https://www.pexels.com/photo/a-laptop-and-a-mobile-phone-on-the-wooden-table-in-a-dark-room-9333180/) |
| `env-boardroom` | [myHQ-Workspaces, 5444180](https://www.pexels.com/photo/office-boardroom-interior-design-5444180/) |
| `env-glass-office` | [cottonbro studio, 5483051](https://www.pexels.com/photo/black-rolling-chairs-beside-desk-5483051/) |

**Cut-outs** (`cut-<character>.webp`). Each is the same source photograph as the matching `photo-<character>` asset, fetched at 1400 px wide. The background was removed locally with rembg (`isnet-general-use` model), matte noise below alpha 12 cleared, and the image cropped to content with the bottom 12% feathered. It was then re-encoded to WebP (quality 82). These are derivatives of the licensed images: no face was generated, altered or substituted, and identity continuity with the existing portraits is preserved. Face boxes for consistent on-screen scale were measured with OpenCV YuNet (`face_detection_yunet_2023mar`) and stored as `CUTOUT_FRAME` in `src/content/assets.ts`; re-measure if a cut-out is regenerated. The Pexels licence permits modification. The fiction notice and no-endorsement wording apply to cut-outs exactly as to portraits.

The runtime set is now 28 files (3.04 MB): 7 portraits, 7 cut-outs, 5 chapter scenes and 9 locations. `tools/prepare-runtime.mjs` hashes all of them into `dist/runtime-assets.json`.

## Acquisition and verification

Downloaded directly from the source provider's image endpoint:

`https://images.pexels.com/photos/<source-id>/pexels-photo-<source-id>.jpeg?auto=compress&cs=tinysrgb&w=720&fm=webp`

Scene variants use `w=1920&h=1080&fit=crop&fm=webp&q=80`. These are resized/compressed provider variants, not generated or retouched people. The downloaded WebPs are the delivered source files; no separately hosted master is necessary at runtime. Original/source URLs above remain the reference for higher resolution or additional review. All files were decoded with Pillow and visually inspected at delivery; all 12 are valid WebP images with the recorded dimensions/bytes. Runtime makes no image-provider requests.

The initial supermarket and screen-filled boardroom candidate images were replaced during selection; the final files are the clothing-store and quiet meeting-room photographs listed above. File stems did not change. Only this final source list describes the shipped candidates.

The legacy `portrait-*.webp` and `hero-*.webp` assets were extracted from small mockup crops by `tools/extract-art.py`. A broad reuse claim exists in old planning material, but item-level source and real-photography provenance were unavailable. They are retained to preserve existing work and are not accepted as production photographs by this manifest. The new renderer should reference the `photo-*` and `scene-chapter-*` set exclusively.

Approval status: selected and technically inspected for the implementation; not claimed as user visual approval or organisation brand approval. No claim is made that stock photographers or models endorse this simulation.
