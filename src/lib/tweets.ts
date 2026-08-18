import realTweets from "@/data/real-tweets.json";
import accountHandles from "@/data/accounts.json";

export type ChaosMode =
  | "pure"
  | "engagement"
  | "media"
  | "deep"
  | "recent";

export type TweetLang = "en" | "es" | "ja" | "fr" | "pt" | "de" | "any";

export type DiscoveryKind = "tweet" | "account";

export type RandomTweet = {
  id: string;
  user: string;
  name: string;
  text: string;
  likes: number;
  reposts: number;
  views: number;
  followers: number;
  verified: boolean;
  hasMedia: boolean;
  mediaType?: "image" | "video";
  lang: TweetLang;
  createdAt: string;
  isReply: boolean;
  isRetweet: boolean;
  kind: DiscoveryKind;
};

export type ChaosFilters = {
  mode: ChaosMode;
  lang: TweetLang;
  excludeReplies: boolean;
  excludeRetweets: boolean;
};

export const DEFAULT_FILTERS: ChaosFilters = {
  mode: "pure",
  lang: "en",
  excludeReplies: true,
  excludeRetweets: true,
};

const ACCOUNT_BLURBS = [
  "A stranger on the public timeline. Teleport to their profile and wander.",
  "Deep-cut account discovery  -  open their feed and see what the void holds.",
  "Random human, random corner of X. No algorithm. Just coordinates.",
  "You have never met this person. That is the entire point.",
  "Chaos routed you here. Their posts are the rest of the story.",
  "Profile-level serendipity. Scroll at your own risk.",
  "A completely random account from the discovery mesh.",
  "Not famous. Not filtered. Just someone posting into the night.",
  "The multiverse picked this handle. Go say hi (or lurk).",
  "Stranger signal locked. Opening their public presence on X.",
  "One of a hundred thousand possible humans. Coordinates locked.",
  "Account mesh hit. Teleport for the full public timeline.",
];

const LANGS: TweetLang[] = ["en", "en", "en", "en", "en", "es", "ja", "fr", "pt", "de"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function expandAccount(user: string): RandomTweet {
  const h = hash(user);
  return {
    id: `acct_${user}`,
    user,
    name: user,
    text: ACCOUNT_BLURBS[h % ACCOUNT_BLURBS.length]!,
    likes: 0,
    reposts: 0,
    views: h % 10000,
    followers: 40 + (h % 120000),
    verified: h % 41 === 0,
    hasMedia: h % 6 === 0,
    mediaType: h % 6 === 0 ? (h % 2 === 0 ? "image" : "video") : undefined,
    lang: LANGS[h % LANGS.length]!,
    createdAt: new Date(Date.now() - (h % 120) * 86400000).toISOString(),
    isReply: false,
    isRetweet: false,
    kind: "account",
  };
}

const TWEET_POOL: RandomTweet[] = (realTweets as RandomTweet[]).map((t) => ({
  ...t,
  kind: "tweet" as const,
  mediaType: t.mediaType as RandomTweet["mediaType"],
  lang: (t.lang as TweetLang) || "en",
}));

const ACCOUNT_LIST = accountHandles as string[];

export const POOL_STATS = {
  total: TWEET_POOL.length + ACCOUNT_LIST.length,
  tweets: TWEET_POOL.length,
  accounts: ACCOUNT_LIST.length,
  uniqueUsers: ACCOUNT_LIST.length, // handles are unique; tweets subset overlap
};

export const SPIN_HANDLES: string[] = (() => {
  const base = [
    ...TWEET_POOL.map((t) => t.user),
    "suddenlyjon",
    "elonmusk",
    "grok",
    "xai",
    "nasa",
    "levelsio",
    "naval",
    "karpathy",
    "sama",
  ];
  const sample: string[] = [];
  const step = Math.max(1, Math.floor(ACCOUNT_LIST.length / 500));
  for (let i = 0; i < ACCOUNT_LIST.length; i += step) {
    sample.push(ACCOUNT_LIST[i]!);
    if (sample.length >= 500) break;
  }
  return Array.from(new Set([...base, ...sample]));
})();

const DEEP_CUT_FOLLOWERS = 5000;
const HIGH_ENGAGEMENT_LIKES = 50;
const RECENT_MS = 1000 * 60 * 60 * 24 * 21;

export function tweetUrl(t: Pick<RandomTweet, "user" | "id" | "kind">): string {
  if (t.kind === "account" || String(t.id).startsWith("acct_")) {
    return `https://x.com/${t.user}`;
  }
  return `https://x.com/${t.user}/status/${t.id}`;
}

export function profileUrl(user: string): string {
  return `https://x.com/${user}`;
}

export function avatarUrl(user: string): string {
  return `https://unavatar.io/twitter/${user}?fallback=false`;
}

/** @deprecated Prefer pickRandomTweet  -  full expansion is O(n) and avoided on hot path */
export function filterTweets(
  filters: ChaosFilters,
  excludeId?: string,
): RandomTweet[] {
  // Only used as fallback  -  never materialize all 100k accounts
  const now = Date.now();
  if (
    filters.mode === "engagement" ||
    filters.mode === "media" ||
    filters.mode === "recent"
  ) {
    return TWEET_POOL.filter((t) => {
      if (excludeId && t.id === excludeId) return false;
      if (filters.excludeReplies && t.isReply) return false;
      if (filters.excludeRetweets && t.isRetweet) return false;
      if (filters.lang !== "any" && filters.lang !== "en" && t.lang !== filters.lang)
        return false;
      if (filters.mode === "engagement") return t.likes >= HIGH_ENGAGEMENT_LIKES;
      if (filters.mode === "media") return t.hasMedia;
      if (filters.mode === "recent")
        return now - new Date(t.createdAt).getTime() < RECENT_MS;
      return true;
    });
  }

  // Sample a window of accounts for deep/pure fallback filters
  const sampleSize = 800;
  const accounts: RandomTweet[] = [];
  for (let i = 0; i < sampleSize; i++) {
    const user = ACCOUNT_LIST[Math.floor(Math.random() * ACCOUNT_LIST.length)]!;
    const exp = expandAccount(user);
    if (excludeId && exp.id === excludeId) continue;
    if (filters.mode === "deep" && (exp.followers >= DEEP_CUT_FOLLOWERS || exp.verified))
      continue;
    if (filters.lang !== "any" && filters.lang !== "en" && exp.lang !== filters.lang)
      continue;
    accounts.push(exp);
  }
  const tweets = TWEET_POOL.filter((t) => {
    if (excludeId && t.id === excludeId) return false;
    if (filters.mode === "deep")
      return t.followers < DEEP_CUT_FOLLOWERS && !t.verified;
    return true;
  });
  return [...tweets, ...accounts];
}

export function pickRandomTweet(
  filters: ChaosFilters = DEFAULT_FILTERS,
  excludeId?: string,
): RandomTweet {
  if (filters.mode === "pure") {
    const roll = Math.random();
    // ~30% real curated posts when available
    if (roll < 0.3 && TWEET_POOL.length) {
      let pick = TWEET_POOL[Math.floor(Math.random() * TWEET_POOL.length)]!;
      let guard = 0;
      while (pick.id === excludeId && guard++ < 8) {
        pick = TWEET_POOL[Math.floor(Math.random() * TWEET_POOL.length)]!;
      }
      return pick;
    }
    // Account mesh (O(1)  -  never scans 100k)
    let user = ACCOUNT_LIST[Math.floor(Math.random() * ACCOUNT_LIST.length)]!;
    let guard = 0;
    while (`acct_${user}` === excludeId && guard++ < 8) {
      user = ACCOUNT_LIST[Math.floor(Math.random() * ACCOUNT_LIST.length)]!;
    }
    return expandAccount(user);
  }

  if (
    filters.mode === "engagement" ||
    filters.mode === "media" ||
    filters.mode === "recent"
  ) {
    let poolList = TWEET_POOL.filter((t) => {
      if (excludeId && t.id === excludeId) return false;
      if (filters.excludeReplies && t.isReply) return false;
      if (filters.excludeRetweets && t.isRetweet) return false;
      if (filters.lang !== "any" && filters.lang !== "en" && t.lang !== filters.lang)
        return false;
      if (filters.mode === "engagement") return t.likes >= HIGH_ENGAGEMENT_LIKES;
      if (filters.mode === "media") return t.hasMedia;
      if (filters.mode === "recent")
        return Date.now() - new Date(t.createdAt).getTime() < RECENT_MS;
      return true;
    });
    if (poolList.length === 0) poolList = TWEET_POOL;
    if (filters.mode === "engagement") {
      const total = poolList.reduce((s, t) => s + Math.log10(t.likes + 10), 0);
      let r = Math.random() * total;
      for (const t of poolList) {
        r -= Math.log10(t.likes + 10);
        if (r <= 0) return t;
      }
    }
    return poolList[Math.floor(Math.random() * poolList.length)]!;
  }

  if (filters.mode === "deep") {
    for (let attempt = 0; attempt < 16; attempt++) {
      const user =
        ACCOUNT_LIST[Math.floor(Math.random() * ACCOUNT_LIST.length)]!;
      const exp = expandAccount(user);
      if (
        exp.followers < DEEP_CUT_FOLLOWERS &&
        !exp.verified &&
        exp.id !== excludeId
      ) {
        return exp;
      }
    }
    const deepTweets = TWEET_POOL.filter(
      (t) =>
        t.followers < DEEP_CUT_FOLLOWERS &&
        !t.verified &&
        t.id !== excludeId,
    );
    if (deepTweets.length) {
      return deepTweets[Math.floor(Math.random() * deepTweets.length)]!;
    }
  }

  const poolList = filterTweets(filters, excludeId);
  return poolList[Math.floor(Math.random() * poolList.length)]!;
}

export function pickSpinHandle(): string {
  return SPIN_HANDLES[Math.floor(Math.random() * SPIN_HANDLES.length)]!;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const years = Math.floor(days / 365);
  if (years >= 1) return `${years}y`;
  return `${Math.floor(days / 30)}mo`;
}

export const MODE_LABELS: Record<ChaosMode, string> = {
  pure: "Pure Random",
  engagement: "High Engagement",
  media: "Media Only",
  deep: "Deep Cuts",
  recent: "Recent Only",
};

export const MODE_BLURBS: Record<ChaosMode, string> = {
  pure: "Anyone. Anywhere. Absolute chaos.",
  engagement: "Posts that actually moved the timeline.",
  media: "Images, clips, visual noise only.",
  deep: "Low-follower strangers. Maximum discovery.",
  recent: "Fresh off the void  -  last few weeks.",
};

export const SCAN_MESSAGES = [
  "Scanning the multiverse...",
  "Pinging strangers at 3am...",
  "Untangling the firehose...",
  "Bribing the algorithm with chaos...",
  "Opening a portal to the timeline...",
  "Looking for someone you've never met...",
  "Sampling public signal only...",
  "Avoiding the usual suspects...",
  "Locking coordinates...",
  "Almost there  -  don't blink...",
  "Shuffling a hundred thousand accounts...",
  "Rolling the discovery mesh...",
];

/** Compatibility export  -  length only, no full materialization */
export const TWEETS = {
  get length() {
    return POOL_STATS.total;
  },
};
