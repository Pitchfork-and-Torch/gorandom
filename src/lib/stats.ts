const JUMPS_KEY = "gorandom.jumps";
const GLOBAL_SEED = 1_847_291;

export type LiveStats = {
  personalJumps: number;
  teleportsToday: number;
  totalChaos: number;
  activeExplorers: number;
};

function daySeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/** Exciting live-feeling global counters, seeded per day + personal activity */
export function computeLiveStats(personalJumps: number): LiveStats {
  const day = daySeed();
  const hour = new Date().getUTCHours();
  const minute = new Date().getUTCMinutes();
  // Smooth fake global activity that ticks with time of day
  const teleportsToday =
    4200 +
    ((day * 17) % 3000) +
    hour * 187 +
    minute * 3 +
    Math.floor(personalJumps * 1.7);
  const totalChaos = GLOBAL_SEED + day * 913 + hour * 41 + personalJumps * 11;
  const activeExplorers =
    180 + ((day + hour) % 90) + Math.floor(minute / 3) + Math.min(personalJumps, 40);

  return {
    personalJumps,
    teleportsToday,
    totalChaos,
    activeExplorers,
  };
}

export function loadPersonalJumps(): number {
  try {
    // Corrupted localStorage can store "Infinity" / negatives. `Number("Infinity") || 0`
    // keeps Infinity (truthy), which poisons teleportsToday / totalChaos in
    // computeLiveStats. Distinct from formatCount's display-side finite guard.
    const n = Number(localStorage.getItem(JUMPS_KEY) || 0);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  } catch {
    return 0;
  }
}

export function bumpPersonalJumps(): number {
  const n = loadPersonalJumps() + 1;
  try {
    localStorage.setItem(JUMPS_KEY, String(n));
  } catch {
    /* ignore */
  }
  return n;
}

export function chaosScore(jumps: number, deepCuts: number, mediaFinds: number): number {
  // Corrupted counters (NaN/Inf/negatives) would paint NaN or negative chaos
  // into the HUD. Distinct from loadPersonalJumps / formatCount finite guards.
  const j = Number.isFinite(jumps) && jumps > 0 ? jumps : 0;
  const d = Number.isFinite(deepCuts) && deepCuts > 0 ? deepCuts : 0;
  const m = Number.isFinite(mediaFinds) && mediaFinds > 0 ? mediaFinds : 0;
  return j * 10 + d * 25 + m * 15;
}
