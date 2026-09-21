/**
 * Wrap `dist/` as a SCORM 1.2 package.
 *
 *   npm run build && node tools/scorm-package.mjs
 *
 * Writes `imsmanifest.xml` beside the built files and reports what an LMS will see. It
 * does NOT zip: every LMS wants the zip made differently (some want the manifest at the
 * archive root, some tolerate a wrapping folder), and a zip step that is wrong is worse
 * than no zip step, because it fails at upload time in someone else's tool.
 *
 * SCORM 1.2 rather than 2004 deliberately. 2004 adds sequencing this game does not use —
 * it is one SCO with its own internal navigation — and 1.2 is the version every corporate
 * LMS still accepts. Choosing the newer standard would buy nothing and cost compatibility.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const DIST = path.resolve("dist");

/** Everything in dist, as manifest `<file>` entries. LMSs vary on whether they care. */
async function listFiles(dir, base = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await listFiles(path.join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const files = (await listFiles(DIST)).filter((f) => f !== "imsmanifest.xml");

if (!files.includes("index.html")) {
  console.error("✗ dist/index.html is missing — run `npm run build` first");
  process.exit(1);
}

/**
 * `masteryscore` is deliberately absent.
 *
 * SCORM 1.2 lets an organisation declare a pass mark, and an LMS will then decide
 * pass/fail from `cmi.core.score.raw`. This game reports no score at all (see
 * `src/scorm.ts`), so declaring a mastery score would create a threshold against a value
 * that never arrives — which some LMSs resolve as "failed". Completion only.
 */
const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="GPL-${pkg.version ?? "1.0.0"}" version="1.2"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd
                      http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>

  <organizations default="gpl-org">
    <organization identifier="gpl-org">
      <title>Global Pursuit League</title>
      <item identifier="gpl-item" identifierref="gpl-res" isvisible="true">
        <title>Global Pursuit League</title>
        <adlcp:datafromlms></adlcp:datafromlms>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="gpl-res" type="webcontent" adlcp:scormtype="sco" href="index.html">
${files.map((f) => `      <file href="${f}" />`).join("\n")}
    </resource>
  </resources>
</manifest>
`;

await writeFile(path.join(DIST, "imsmanifest.xml"), manifest, "utf8");

console.log(`✓ imsmanifest.xml written — 1 SCO, ${files.length} files`);
console.log("  reports : cmi.core.lesson_status (incomplete → completed)");
console.log("  resumes : cmi.suspend_data, the 13-14 char run code");
console.log("  score   : none, by design — see src/scorm.ts");
console.log(`\n  Zip the CONTENTS of dist/ (manifest at the archive root) and upload.`);
