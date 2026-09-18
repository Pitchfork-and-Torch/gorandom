import type { RandomTweet } from "./tweets";
import { formatCount } from "./tweets";

/** Lightweight witty observations  -  no API required, always available offline. */
export function grokTake(tweet: RandomTweet): string {
  if (tweet.kind === "account") {
    const deep = tweet.followers < 5000 && !tweet.verified;
    if (deep) {
      return `Account-level chaos. @${tweet.user} sits at ~${formatCount(tweet.followers)} followers  -  pure stranger coordinates. Teleport and scroll their public timeline. No post pre-selected. The void trusts you to wander.`;
    }
    if (tweet.verified) {
      return `You hit a verified profile in the discovery mesh. Still counts as serendipity if you never followed them. Open the page. Sample the firehose.`;
    }
    return `Random account locked: @${tweet.user}. Profile discovery mode  -  not a single status, the whole public presence. Lurk responsibly.`;
  }

  const snippets: string[] = [];
  const words = tweet.text.trim().split(/\s+/).length;
  const deep = tweet.followers < 5000 && !tweet.verified;
  const hot = tweet.likes >= 100;
  const quiet = tweet.likes < 5;
  const media = tweet.hasMedia;

  if (deep) {
    snippets.push(
      `Deep cut energy. @${tweet.user} has ~${formatCount(tweet.followers)} followers  -  the timeline's quiet corners are where the real texture lives.`,
    );
  } else if (tweet.verified) {
    snippets.push(
      `Verified, but still a stranger to someone. The void does not care about blue checks.`,
    );
  }

  if (quiet) {
    snippets.push(
      `Almost nobody has liked this yet (${tweet.likes}). You may be one of the first humans to witness it. Congrats? Condolences? Both.`,
    );
  } else if (hot) {
    snippets.push(
      `${formatCount(tweet.likes)} likes already. The hive mind voted. You still arrived via pure chaos.`,
    );
  }

  if (media) {
    snippets.push(
      tweet.mediaType === "video"
        ? `There's a video attached. Teleport if you want the full sensory overload.`
        : `Visual evidence included. Words only get you so far on this platform.`,
    );
  }

  if (words < 12) {
    snippets.push(
      `Short and sharp (${words} words). Sometimes the timeline doesn't need an essay.`,
    );
  } else if (words > 60) {
    snippets.push(
      `This one commits to the bit  -  ${words} words. Novelists of the microblog, rise.`,
    );
  }

  if (tweet.text.includes("?")) {
    snippets.push(`Ends in a question. The universe loves unfinished business.`);
  }

  if (snippets.length === 0) {
    snippets.push(
      `A random stranger said this into the void. You're now entangled. Teleport, spin again, or pretend you meant to find this.`,
    );
  }

  const seed = Number(String(tweet.id).replace(/\D/g, "").slice(-4)) || tweet.likes + tweet.user.length;
  const a = snippets[seed % snippets.length]!;
  const b = snippets[(seed + 1) % snippets.length]!;
  if (snippets.length === 1 || a === b) return a;
  return `${a}\n\n${b}`;
}

export function shareText(tweet: RandomTweet): string {
  const url =
    tweet.kind === "account"
      ? `https://x.com/${tweet.user}`
      : `https://x.com/${tweet.user}/status/${tweet.id}`;
  return `Chaos discovery via gorandom.grok.me\n@${tweet.user}: ${tweet.text.slice(0, 140)}${tweet.text.length > 140 ? "..." : ""}\n${url}`;
}
