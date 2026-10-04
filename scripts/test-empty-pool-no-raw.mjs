/** Ultimate empty-pool path must not assign raw TWEET_POOL (reads tweets.ts). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/tweets.ts"), "utf8");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

assert(!/poolList\s*=\s*TWEET_POOL\s*;/.test(src), "no raw poolList dump");
assert(!/soft\s*=\s*TWEET_POOL\s*;/.test(src), "no raw soft dump");
assert(/matchesFilters\(exp,\s*filters,\s*excludeId\)/.test(src), "account mesh honors filters");
assert(/Never dump the raw pool/.test(src) || /do not fall through to raw TWEET_POOL/.test(src), "comment present");
console.log("ok empty-pool-no-raw");
