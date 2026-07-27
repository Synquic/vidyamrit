// Cross-platform gradle runner for the android/ project.
// Usage: node scripts/gradle.mjs bundleRelease assembleRelease
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const androidDir = join(dirname(fileURLToPath(import.meta.url)), "..", "android");
// Absolute path: cmd.exe does not reliably resolve a wrapper script from cwd alone.
const cmd = join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");

const { status } = spawnSync(`"${cmd}"`, process.argv.slice(2), {
  cwd: androidDir,
  stdio: "inherit",
  shell: true,
});

process.exit(status ?? 1);
