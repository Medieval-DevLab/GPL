/** Deterministic, self-contained offline and SCORM 1.2 archives. Run after build. */
import { readFile, writeFile, readdir, mkdir, mkdtemp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import path from "node:path";
import "./prepare-runtime.mjs";

const DIST = path.resolve("dist"), RELEASE = path.resolve("dist-release");
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const version = String(pkg.version).replace(/[^a-zA-Z0-9.-]/g, "-");
async function listFiles(dir, base = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${rel}`);
    if (entry.isDirectory()) out.push(...await listFiles(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out.sort();
}
const files = (await listFiles(DIST)).filter(f => f !== "imsmanifest.xml" && !f.endsWith(".map") && !f.startsWith("."));
if (!files.includes("index.html")) throw new Error("dist/index.html missing: run npm run build first");
const escape = value => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="GPL-${version}" version="1.2"
 xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
 xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
 <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
 <organizations default="gpl-org"><organization identifier="gpl-org">
  <title>Global Pursuit League</title>
  <item identifier="gpl-item" identifierref="gpl-res" isvisible="true"><title>Global Pursuit League</title></item>
 </organization></organizations>
 <resources><resource identifier="gpl-res" type="webcontent" adlcp:scormtype="sco" href="index.html">
${files.map(f => `  <file href="${escape(f)}" />`).join("\n")}
 </resource></resources>
</manifest>
`;
// No mastery score, pass/fail or analytics: completion and portable resume only.
await writeFile(path.join(DIST, "imsmanifest.xml"), manifest);
const runtime = await Promise.all(files.map(async name => ({ name, data: await readFile(path.join(DIST, name)) })));
try { runtime.push({ name: "PHOTO-PROVENANCE.md", data: await readFile("docs/PHOTO-PROVENANCE.md") }); } catch (error) { if (error.code !== "ENOENT") throw error; }
for (const name of ["FACILITATOR-GUIDE.md", "LEARNER-EVALUATION.md"]) {
  runtime.push({ name, data: await readFile(path.join("docs", name)) });
}
runtime.push({ name: "PACKAGE-INFO.txt", data: Buffer.from(`Global Pursuit League ${version}\nFive chapters, 18 business decisions; branching endings.\nOpen index.html in a desktop browser. No server or network required.\nProgress is stored in this browser. Portable run codes restore committed choices, not drafts.\nSCORM 1.2 reports completion only; no score.\nPhotos depict models in fictional roles, not actual employees or clients.\n`) });
const sha = data => createHash("sha256").update(data).digest("hex");
const hashes = Object.fromEntries([...runtime].sort((a,b) => a.name.localeCompare(b.name)).map(f => [f.name, sha(f.data)]));
runtime.push({ name: "asset-checksums.json", data: Buffer.from(JSON.stringify({ version, algorithm: "sha256", files: hashes }, null, 2) + "\n") });
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(entries) {
  const parts = [], central = []; let offset = 0;
  for (const entry of [...entries].sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const name = Buffer.from(entry.name), data = deflateRawSync(entry.data, { level: 9 }), crc = crc32(entry.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(33, 12); // 1980-01-01: independent of machine timezone and file timestamps.
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(entry.data.length, 22); local.writeUInt16LE(name.length, 26);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x800, 8); header.writeUInt16LE(8, 10); header.writeUInt16LE(33, 14);
    header.writeUInt32LE(crc, 16); header.writeUInt32LE(data.length, 20); header.writeUInt32LE(entry.data.length, 24);
    header.writeUInt16LE(name.length, 28); header.writeUInt32LE(offset, 42);
    central.push(header, name); parts.push(local, name, data); offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}
await mkdir(RELEASE, { recursive: true });
const reports = [];
for (const kind of ["offline", "scorm12"]) {
  const entries = kind === "scorm12" ? [...runtime, { name: "imsmanifest.xml", data: Buffer.from(manifest) }] : runtime;
  const archive = zip(entries), filename = `gpl-${version}-${kind}.zip`;
  if (!archive.equals(zip(entries))) throw new Error("Archive is not reproducible");
  await writeFile(path.join(RELEASE, filename), archive);
  // Verify the actual archive bytes, then open the extracted package in a browser.
  const extracted = await mkdtemp(path.join(tmpdir(), "gpl-package-")), absoluteExtraction = path.resolve(extracted);
  if (!absoluteExtraction.startsWith(path.resolve(tmpdir()) + path.sep) || !path.basename(absoluteExtraction).startsWith("gpl-package-")) throw new Error("Unsafe extraction directory");
  try {
    const bytes = await readFile(path.join(RELEASE, filename)); let cursor = 0, count = 0;
    while (bytes.readUInt32LE(cursor) === 0x04034b50) {
      const compressedLength = bytes.readUInt32LE(cursor + 18), nameLength = bytes.readUInt16LE(cursor + 26), extraLength = bytes.readUInt16LE(cursor + 28);
      const name = bytes.subarray(cursor + 30, cursor + 30 + nameLength).toString(), target = path.resolve(extracted, name);
      if (!target.startsWith(absoluteExtraction + path.sep)) throw new Error("Unsafe archive entry");
      const start = cursor + 30 + nameLength + extraLength, data = inflateRawSync(bytes.subarray(start, start + compressedLength));
      if (crc32(data) !== bytes.readUInt32LE(cursor + 14) || sha(data) !== sha(entries.find(f => f.name === name).data)) throw new Error(`Corrupt archive: ${name}`);
      await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, data); cursor = start + compressedLength; count++;
    }
    if (count !== entries.length) throw new Error("Archive lost an entry");
    execFileSync(process.execPath, ["tools/file-url-check.mjs", path.join(extracted, "index.html")], { stdio: "inherit" });
  } finally { await rm(absoluteExtraction, { recursive: true, force: true }); }
  reports.push({ file: filename, bytes: archive.length, sha256: sha(archive), files: entries.length });
}
await writeFile(path.join(RELEASE, "checksums.json"), JSON.stringify({ version, archives: reports }, null, 2) + "\n");
for (const report of reports) console.log(`${report.file}: ${report.bytes} bytes, ${report.files} files, SHA-256 ${report.sha256}`);
