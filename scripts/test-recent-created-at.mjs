/** Future / invalid createdAt must not pass the recent filter. */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const raw = readFileSync(new URL("../src/lib/tweets.ts", import.meta.url), "utf8");
const m = raw.match(
  /const RECENT_MS = [^;]+;\s*\/\*\* Age[\s\S]*?function isRecentCreatedAt\([\s\S]*?\n\}/,
);
if (!m) {
  console.error("FAIL: isRecentCreatedAt not found");
  process.exit(1);
}
const tmp = join(tmpdir(), `recent-${process.pid}.mjs`);
writeFileSync(
  tmp,
  m[0]
    .replace(/: string/g, "")
    .replace(/: boolean/g, "")
    .replace(/, now = Date\.now\(\)/, ", now = Date.now()") +
    `\nfunction assert(c,msg){if(!c){console.error('FAIL',msg);process.exit(1)}}\n` +
    `const now = Date.parse('2026-09-18T00:00:00Z');\n` +
    `assert(isRecentCreatedAt(new Date(now - 3600e3).toISOString(), now), '1h ago');\n` +
    `assert(!isRecentCreatedAt(new Date(now + 86400e3).toISOString(), now), 'tomorrow');\n` +
    `assert(!isRecentCreatedAt(new Date(now + 1).toISOString(), now), '1ms future');\n` +
    `assert(!isRecentCreatedAt('not-a-date', now), 'invalid');\n` +
    `assert(!isRecentCreatedAt(new Date(now - RECENT_MS - 1).toISOString(), now), 'too old');\n` +
    `assert(isRecentCreatedAt(new Date(now).toISOString(), now), 'exact now');\n` +
    `console.log('ok recent-created-at');\n`,
);
const r = spawnSync(process.execPath, [tmp], { encoding: "utf8" });
unlinkSync(tmp);
process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
process.exit(r.status ?? 1);
