// Bumps android/version.properties.
// Usage: node scripts/bump-version.mjs [patch|minor|major]   (default: patch)
//
// versionCode always increments by 1 — Play rejects a re-used versionCode.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "android",
  "version.properties"
);

const kind = process.argv[2] ?? "patch";
if (!["patch", "minor", "major"].includes(kind)) {
  console.error(`Unknown bump type "${kind}". Use patch, minor or major.`);
  process.exit(1);
}

const text = readFileSync(file, "utf8");
const read = (key) => text.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim();

const code = Number(read("versionCode")) + 1;
let [major, minor, patch] = read("versionName").split(".").map(Number);

if (kind === "major") [major, minor, patch] = [major + 1, 0, 0];
else if (kind === "minor") [minor, patch] = [minor + 1, 0];
else patch += 1;

const name = `${major}.${minor}.${patch}`;

writeFileSync(
  file,
  [
    "# Single source of truth for the Android app version.",
    "# Auto-bumped by pwa/scripts/bump-version.mjs on every `npm run android:release`.",
    `versionCode=${code}`,
    `versionName=${name}`,
    "",
  ].join("\n")
);

console.log(`bumped (${kind}) -> versionCode ${code}, versionName ${name}`);
