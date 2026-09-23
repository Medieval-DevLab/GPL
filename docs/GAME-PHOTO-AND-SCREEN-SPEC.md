# Desktop photographic game: screen and asset specification

Companion to `COMPLETE-GAME-BACKLOG.md`. This is the production brief for the complete game, not a statement that photos have already been sourced or visual approval received.

## Shared visual language

Use contemporary business locations and photographs of real adults, with controlled violet accents, warm natural light and a consistent colour grade. Recurring faces and places provide continuity. Retain expressive scenes for conversation and results; use calm upright reading surfaces for detailed information. Avoid geometric placeholder characters, wallpaper-like stock photos behind every screen, fake photographic AI faces labelled real, and permanent navigation rails.

The landscape scene occupies the actual viewport. At 1440×900: a compact 56px orientation/control area, approximately 760px main stage and a 64–84px action zone where appropriate. These are layout guides, not inflexible heights. Narrative screens devote roughly two thirds to people/place; detailed decisions reserve at least half the width for legible facts and actions. A photo crop changes at breakpoints instead of scaling live text down with it.

Use bundled Inter. Proposed desktop scale: main heading 36/44; activity heading 28/36; section heading 20/28; body 16/24; metadata 14/20; exceptionally dense table labels 13/18. Essential prose never uses a ten-pixel decorative label. At 1366×768 reduce margins, scene occupancy and optional metadata first; preserve body size. At 200% zoom allow functional reflow/scroll. Upright documents, aligned comparison labels and clear focus outrank a decorative tilted-paper metaphor.

Spacing: 8, 16, 24, 32, 48, 64. Controls at least 44px high. Reading width about 45–75 characters. Surfaces: deep ink scene frame, warm neutral reading layer, discreet pale-violet selection, amber caution, teal confirmed progress; colour roles require tested contrast. Real outcome state also gets text/icon, never colour alone. Avoid thick repeated rounded boxes around every paragraph.

All essential text and actions are HTML controls over/alongside images. Scene photography must not contain the only readable version of any instruction. Use a predictable Help/Audio/Save/Exit location, but omit irrelevant chrome in a cutscene. Keep one primary progression/commit action per moment.

## Desktop screen inventory and compositions

| ID / screen | Landscape composition | Required interaction and states | Content instances |
|---|---|---|---|
| S01 Welcome/setup | Wide client-city or studio photography; role/premise on restrained gradient; setup moves to 3 aligned starting-strength choices | Start, Resume when valid, setup select/confirm; saved-run protection | Home + setup |
| S02 Journey | Five sequential photo destinations across a landscape engagement journey; current destination expands to objective/steps; chapter numbering secondary to names | Enter current chapter, inspect completed history read-only, Return to active activity; future not actionable | All chapter boundaries, mid-run map, end state |
| S03 Chapter arrival | Environmental photograph with advisor portrait/cutout; title and capability at readable left/right safe zone; three short activity previews | Begin, help; first/resume semantics explicit | int-1…int-5 |
| S04 Story event | Wide situational image or authored message reveal, grounded in location/time; sparse contextual text and named source | Continue after reading, reveal text instantly if animated; no meaningless choice | Rival, award, resignation |
| S05 Brief/dossier | About 40% scene/person, 60% upright client file; tabbed known evidence only, one objective above | Read/inspect detail, View choices; known/unknown states distinct | Every mission brief |
| S06 Comparison | Brief/context across top; three or four aligned approach columns with modest scene imagery; five-choice support by designed 3+2 layout if reused | Inspect, select, review authored commitment, commit; no forecast | m1/m4/m6b/m10b |
| S07 Investigation/allocation | Scene-specific task board occupying two thirds; chosen slots and resource count stay adjacent; person/advisor scene occupies remaining space | Select/deselect/swap, exact count, clear unavailable state; keyboard parity | m2: 2/5; m5b: 2/6; m7: 3/6 |
| S08 Chat | Landscape split: real speaker/setting about 35%; coherent thread and reply choices 65%; draft area grounded in conversation | Read history, choose draft, send; response arrival then outcome; preserve conditional lines | m3/m7b/m9/m9b/m10 |
| S09 Call/meeting | Large real-person photographic stage 45%; readable transcript and aligned response list 55%; simulated-call cue | Transcript, selection, commit; no fake working mic/camera; repeat text at will | m5/m6/m8/m10c |
| S10 Evidence argument/handover | Stakeholder photo with challenge at left; upright evidence and learner commitments middle; argument options below/alongside without covering evidence | Earned/locked evidence, select supported response, commit; actual ledger attached | m9a/m10h |
| S11 Consequence | Same scene/person for continuity, changed reaction/crop; clear chosen approach, outcome, why, carry-forward; quiet actual dimension deltas | Continue, expand explanation, inspect updated record; strong/mixed/hard and early terminal | All 18 missions, resolved variants |
| S12 Reflection | Quieter scene crop; short transfer question and responses; spacious reading, no dramatic scored choice styling | Respond and continue; optional explanatory reflection within existing semantics | Four reflections |
| S13 Chapter debrief | Chapter photograph and advisor; two or three actual decision snapshots and a principle; next chapter preview | Return to map; at final chapter enter final review; inspect prior commitment read-only | deb-1…deb-5 |
| S14 Final review | Photographic closure; actual engagement outcome plus chronological causal story with expandable details | Finish, inspect chain, optional existing attribution, export/replay/new run | Delivery/loss/walk endings |
| S15 Evidence/history drawer | Upright 480–600px desktop drawer over a dimmed current scene; larger reader expands centrally for complex files | Close, scroll, focus return, accessible unavailable explanation; earned-only information | Shared audit/ledger/history/recognition |
| S16 Utilities/recovery | Quiet, readable overlay for settings/glossary/help or dedicated recovery screen for invalid save | Save notice, run code, source conflict, retry, confirmed restart; persistent audio/motion settings | All lifecycle/error states |

These are reusable screen types, not sixteen new engine missions. Inbox/email is a variant of S04/S08 when appropriate to authored story; no new mandatory chat node or additional question is created merely to fill the inventory.

## Decision composition: exact information order

1. At entry, name chapter, activity and objective. Learner sees why the activity follows the last one.
2. Present current person/client situation and only known facts. Evidence tabs open readable content with a clear return.
3. Offer actual approaches, with aligned costs/commitments and fair alternatives. A selected card/row has border, check and explicit selected label; never imply correctness.
4. Show selection summary: what the learner proposes to do/spend/promise. Do not reveal future reactions, projected metric changes or which option will win.
5. Commit through one clear action. Engine resolves once and produces result.
6. Keep the same cast/environment and acknowledge the chosen approach; reveal result and explain causal reason. This is where actual changes and stakeholder response become visible.

Full-screen illustrations behind a small dialogue box are suitable for a scene but insufficient for a dense audit. Keep scene richness while changing the actual layout by task. Do not reduce the five-option delivery scene to two options to make a composition fit.

## Real-person cast manifest

Character names/roles belong to fiction. Photography depicts models, not actual named employees. Use approved organisation material or stock with a recorded licence/use grant for intended distribution. Do not purchase or pretend to possess an unavailable licence. If employee photos are supplied, confirm they are approved for this specific fictional/training use; do not fetch profile portraits independently.

| Cast ID | Canonical name / role | Asset keys | Continuity requirements |
|---|---|---|---|
| priya | Priya Sharma / Client Growth Lead | Existing `portrait-priya`; add `person-priya-*` only as needed | Setup/Chapter 1 guidance; same identity across home, chat, opener and debrief |
| riya | Riya Kapoor / Engagement Director | Existing `portrait-riya` | Chapters 2 and 4 use one person, not separate casting |
| arjun | Arjun Mehta / Solutions Director | Existing `portrait-arjun` | Solution/workshop/photo details consistent through Chapter 3 |
| aisha | Aisha Khan / Delivery Lead | Existing `portrait-aisha` | Delivery and handover; contextual concerns via writing and real expression variants |
| sarah | Sarah Lim / Chief Transformation Officer | Proposed `portrait-sarah`, `person-sarah-*` | Sponsor conversations, award/departure; same person throughout |
| marcus | Marcus Reed / Operations Director | Proposed `portrait-marcus`, `person-marcus-*` | Reveal only when content permits; never expose identity/role as earned knowledge early |
| declan | Declan Foyle / Procurement | Proposed `portrait-declan`, `person-declan-*` | Procurement confrontation framed as business role, not villain caricature |

Per person target: one high-resolution portrait/cutout, one avatar crop, and two additional real expression/pose photographs where available from the same session/model. Minimum final scope is seven verified identities, with a consistent portrait/large crop for each. Extra poses are preferred, not permission to substitute generated humans. Reuse lighting/crop changes if only one suitable photo is available. Do not animate faces to manufacture speech. Check existing four advisor WebPs for real-photo provenance before accepting them; file existence proves neither source nor licence.

## Environment and prop manifest

| Scene ID | Purpose/location | Required use |
|---|---|---|
| env-studio | Engagement team's contemporary project studio | Welcome/setup/home/internal chat |
| env-client | Orion retail exterior/interior and client meeting | Chapter 1/brief, sponsor calls; make fictional company clear |
| env-qualify | Client workshop/meeting room | Chapter 2/opportunity and rival response |
| env-solution | Workshop with business process/project material | Chapter 3/solution alternatives and proposal |
| env-deal | Negotiation/procurement room | Chapter 4/pricing/award |
| env-delivery | Delivery team room/operations setting | Chapter 5/staffing/handover |
| env-close | Reflective meeting or neutral workplace closure | Ending/recap; variations for early exit and delivery |

Existing reusable source keys to review: `hero-boardroom`, `hero-retail-exterior`, `hero-retail-plaza`, `hero-client-meeting`, `hero-retail-interior`, `solution-workshop`, `hero-negotiation`, `solution-in-store-tech`, `solution-screen`, `thumb-retail-store`. Do not regenerate an acceptable real photograph simply to rename it. Source high-resolution versions with safe left/right crops for overlay placements; one usable wide image per environment is the minimum. Chapter map thumbnails derive from these images for continuity.

Props: account brief, evidence questions, stakeholder record, six workstream items, six proposal components, commercial terms, procurement criteria, authored award/departure message, commitment ledger, handover record and causal summary. These should be live UI/document compositions backed by actual content. Use photography for environmental context and authentic objects; never rasterise essential business text. Any photographic screens/whiteboards should contain no unrelated legible client data.

### Asset record fields

For every production asset store: stable ID; local source/master path; output path; source URL/provider and source asset ID; author/credit where required; licence/use-grant reference and acquisition date; depicted model ID; release/source permission status; fictional role binding; intended screens; crop/focal point; light/dark variant if used; dimensions; byte size; alt/decorative treatment; approval status; fallback. Production manifests contain paths/metadata needed at runtime; source/legal records remain an authoring deliverable.

Suggested implementation paths: `src/content/characters.ts`, `src/content/presentation.ts`, `src/content/assets.ts`, with typed additions in engine types only when shared data needs them; local production art stays in `public/art`. These are proposed files, not existing API claims. Renderer never infers a cast member by matching arbitrary display strings. Resolve speaker/character bindings once using stable data while retaining conditional quote behaviour.

## Review and release evidence

Deliver individual landscape images at 1440×900 or 1920×1080. A montage is only an index. Review S06 with four alternatives, S07 with six components, S08 with five replies, S10 with locked evidence, and S11 for a hard outcome. Confirm readable text at actual size, real people visibly present, all interaction targets clear, and essential evidence not obscured by art. Also show S04→S09 and S10→S11 pairs to prove character/scene continuity.

The actual source licences and user visual approval are runtime-production dependencies; this planning package records them as required deliverables, not work already performed. No external photo purchases or publication occurred in preparing this backlog.
