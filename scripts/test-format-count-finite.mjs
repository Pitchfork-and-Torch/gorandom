/** formatCount must reject non-finite / negative values. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tweets = readFileSync(join(root, "src/lib/tweets.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const fc = tweets.match(/export function formatCount\(n: number\): string \{[\s\S]*?\n\}/);
assert(fc, "formatCount found");
assert(/Number\.isFinite\(n\)/.test(fc[0]), "formatCount finite guard");

function formatCount(n) {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

assert(formatCount(1500) === "1.5K", "1.5K");
assert(formatCount(2_000_000) === "2M", "2M");
assert(formatCount(42) === "42", "42");
assert(formatCount(NaN) === "0", "nan");
assert(formatCount(Infinity) === "0", "inf");
assert(formatCount(-3) === "0", "neg");
console.log("ok format-count-finite");
