/** chaosScore must not yield NaN/negative from bad counters. */
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

const cs = src.match(/export function chaosScore[\s\S]*?\n\}/);
assert(cs, "chaosScore found");
assert(/Number\.isFinite\(jumps\)/.test(cs[0]), "jumps finite guard");
assert(/Number\.isFinite\(deepCuts\)/.test(cs[0]), "deepCuts finite guard");
assert(/Number\.isFinite\(mediaFinds\)/.test(cs[0]), "mediaFinds finite guard");

function chaosScore(jumps, deepCuts, mediaFinds) {
  const j = Number.isFinite(jumps) && jumps > 0 ? jumps : 0;
  const d = Number.isFinite(deepCuts) && deepCuts > 0 ? deepCuts : 0;
  const m = Number.isFinite(mediaFinds) && mediaFinds > 0 ? mediaFinds : 0;
  return j * 10 + d * 25 + m * 15;
}

assert(chaosScore(2, 1, 1) === 60, "happy path");
assert(chaosScore(NaN, 1, 1) === 40, "nan jumps");
assert(chaosScore(1, Infinity, 1) === 25, "inf deep");
assert(chaosScore(-5, 1, 1) === 40, "neg jumps");
assert(chaosScore(0, 0, 0) === 0, "zeros");
console.log("ok chaos-score-finite");
