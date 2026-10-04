import type { RandomTweet } from "./tweets";
import { tweetUrl } from "./tweets";

const KEY = "gorandom.history.v1";
const MAX = 80;

export type HistoryEntry = {
  id: string;
  user: string;
  name: string;
  text: string;
  likes: number;
  hasMedia: boolean;
  foundAt: string;
  mode: string;
  kind?: "tweet" | "account";
};

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToHistory(
  tweet: RandomTweet,
  mode: string,
): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: tweet.id,
    user: tweet.user,
    name: tweet.name,
    text: tweet.text,
    likes: tweet.likes,
    hasMedia: tweet.hasMedia,
    foundAt: new Date().toISOString(),
    mode,
    kind: tweet.kind,
  };
  const prev = loadHistory().filter((h) => h.id !== entry.id);
  const next = [entry, ...prev].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function exportHistory(format: "json" | "text"): string {
  const items = loadHistory();
  if (format === "json") return JSON.stringify(items, null, 2);
  return items
    .map((h) => {
      const url = tweetUrl({
        user: h.user,
        id: h.id,
        kind: h.kind === "account" ? "account" : "tweet",
      });
      return `[${h.foundAt}] @${h.user}  -  ${h.text.slice(0, 120)}${h.text.length > 120 ? "..." : ""}\n${url}`;
    })
    .join("\n\n");
}
