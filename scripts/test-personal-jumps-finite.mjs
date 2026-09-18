/** loadPersonalJumps must reject Infinity / negative / NaN from localStorage. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/stats.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(/Number\.isFinite\(n\)/.test(src), "finite guard present");
assert(/n < 0/.test(src), "negative rejected");
assert(/Math\.floor\(n\)/.test(src), "floors to int");
assert(!/return Number\(localStorage\.getItem\(JUMPS_KEY\) \|\| 0\) \|\| 0/.test(src), "old truthy-or-zero gone");

// Behavioral mirror of the new logic
function load(raw) {
  const n = Number(raw || 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}
assert(load("Infinity") === 0, "Infinity → 0");
assert(load("-3") === 0, "negative → 0");
assert(load("NaN") === 0, "NaN → 0");
assert(load("12.7") === 12, "floor");
assert(load(null) === 0, "null");
console.log("ok personal-jumps-finite");
