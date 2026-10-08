/** Ship reviewed production photography only; preserve all public/ authoring originals. */
import { readFile, readdir, unlink, access, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const targetDirectory = path.resolve("dist/art");
const cast = ["priya", "riya", "arjun", "aisha", "sarah", "marcus", "declan"];
const allowed = new Set([
  ...[1, 2, 3, 4, 5].map(chapter => `scene-chapter-${chapter}.webp`),
  ...cast.map(name => `photo-${name}.webp`),
  ...cast.map(name => `cut-${name}.webp`),
  ...["warehouse", "boardroom", "glass-office"].map(name => `env-${name}.webp`),
]);
// Check every required asset before pruning generated output. Missing art is a release blocker.
for (const name of allowed) await access(path.join(targetDirectory, name));
let excluded = 0;
for (const entry of await readdir(targetDirectory, { withFileTypes: true })) {
  const target = path.resolve(targetDirectory, entry.name);
  if (path.dirname(target) !== targetDirectory) throw new Error("Unsafe generated art target");
  if (!entry.isFile()) throw new Error(`Unexpected generated art directory/link: ${entry.name}`);
  if (!allowed.has(entry.name)) { await unlink(target); excluded++; }
}
const assets = [];
for (const name of [...allowed].sort()) {
  const file = path.join(targetDirectory, name), data = await readFile(file);
  assets.push({ path: `art/${name}`, bytes: (await stat(file)).size, sha256: createHash("sha256").update(data).digest("hex") });
}
await writeFile(path.resolve("dist/runtime-assets.json"), JSON.stringify({ version: 1, assets }, null, 2) + "\n");
console.log(`Runtime photography: ${assets.length} reviewed assets, ${assets.reduce((total, asset) => total + asset.bytes, 0)} bytes; ${excluded} legacy files excluded from generated dist only.`);
