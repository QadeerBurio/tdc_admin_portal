// scripts/check-press-logos.js: every press / partner logo named in src/web/site.js (logo: { file, w, h }) must be
// committed as public/press/logos/<file>.webp and <file>.png, be a real image of that size. Runs before every build
// ("prebuild" in package.json), so a missing logo fails the build instead of showing a broken image.
//   node scripts/check-press-logos.js        exit 1 and the reasons if anything is wrong
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = path.join(ROOT, "src", "web", "site.js");
const DIR = path.join(ROOT, "public", "press", "logos");

function size(file, ext) {
  const b = fs.readFileSync(file);
  if (ext === "png") {
    if (b.length < 24 || b.toString("latin1", 1, 4) !== "PNG") return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  if (b.length < 30 || b.toString("latin1", 0, 4) !== "RIFF" || b.toString("latin1", 8, 12) !== "WEBP") return null;
  const kind = b.toString("latin1", 12, 16);
  if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  return null;
}

function check() {
  // the code only: comment lines (// ..., /** ... */) may mention "logo:" without being one
  const src = fs.readFileSync(SITE, "utf8").split(/\r?\n/).filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n");
  const logos = [...src.matchAll(/logo:\s*\{\s*file:\s*"([^"]+)",\s*w:\s*(\d+),\s*h:\s*(\d+)\s*\}/g)].map((m) => ({ file: m[1], w: +m[2], h: +m[3] }));
  const problems = [];
  if (!logos.length) problems.push("no logos found in src/web/site.js (expected logo: { file, w, h })");
  // a logo written any other way (an import, a URL) would not be checked: refuse it
  const other = [...src.matchAll(/\blogo:\s*(?!\{\s*file:)[^\s,}][^,}]*/g)].map((m) => m[0]);
  for (const o of other) problems.push(`logo not in the checked form { file, w, h }: ${o}`);
  const names = fs.existsSync(DIR) ? fs.readdirSync(DIR) : [];
  for (const l of logos) {
    for (const ext of ["webp", "png"]) {
      const name = `${l.file}.${ext}`;
      const rel = `public/press/logos/${name}`;
      // the exact name, case included (Windows and macOS don't care, the web server does)
      if (!names.includes(name)) { problems.push(names.some((n) => n.toLowerCase() === name.toLowerCase()) ? `wrong case: ${rel}` : `missing ${rel}`); continue; }
      const s = size(path.join(DIR, name), ext);
      if (!s) problems.push(`not a ${ext.toUpperCase()} image: ${rel}`);
      else if (s.w !== l.w || s.h !== l.h) problems.push(`${rel} is ${s.w}x${s.h}, site.js says ${l.w}x${l.h}`);
    }
  }
  return { logos, problems };
}

if (require.main === module) {
  const { logos, problems } = check();
  if (problems.length) {
    console.error(`press logos: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`press logos: ${logos.length} logos, each with its .webp and .png in public/press/logos`);
}
module.exports = { check };
