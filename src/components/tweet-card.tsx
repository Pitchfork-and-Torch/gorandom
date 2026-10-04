import { useState } from "react";
import {
  BadgeCheck,
  Eye,
  Heart,
  Image as ImageIcon,
  Repeat2,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import {
  avatarUrl,
  formatCount,
  relativeTime,
  type RandomTweet,
} from "@/lib/tweets";
import { cn } from "@/lib/utils";

export function TweetCard({
  tweet,
  className,
}: {
  tweet: RandomTweet;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const isAccount = tweet.kind === "account";
  const initials = tweet.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className={cn(
        "animate-scale-in rounded-[var(--radius-xl)] border border-border bg-bg-card p-5 card-glow sm:p-6",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-cyan/30 bg-bg-panel">
          {!imgFailed ? (
            <img
              src={avatarUrl(tweet.user)}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan/20 to-magenta/20 font-mono text-sm font-medium text-cyan">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-fg">{tweet.name}</span>
            {tweet.verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-cyan"
                aria-label="Verified"
              />
            )}
            {isAccount ? (
              <span className="rounded-full border border-violet/40 bg-violet/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-violet">
                account
              </span>
            ) : tweet.followers < 5000 && !tweet.verified ? (
              <span className="rounded-full border border-lime/30 bg-lime/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-lime">
                deep cut
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-fg-subtle">
            <span className="text-fg-muted">@{tweet.user}</span>
            {!isAccount && (
              <>
                <span aria-hidden>·</span>
                <span>{relativeTime(tweet.createdAt)}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-fg sm:text-base">
        {tweet.text}
      </p>

      {isAccount && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-violet/25 bg-violet/5 px-3 py-2.5 font-mono text-xs text-fg-muted">
          <UserRound className="h-3.5 w-3.5 text-violet" />
          <span>Profile discovery  -  teleport opens their public X page</span>
        </div>
      )}

      {!isAccount && tweet.hasMedia && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-panel/80 px-3 py-2.5 font-mono text-xs text-fg-muted">
          {tweet.mediaType === "video" ? (
            <Video className="h-3.5 w-3.5 text-magenta" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5 text-cyan" />
          )}
          <span>
            {tweet.mediaType === "video" ? "Video" : "Image"} attached on X  - 
            teleport to view
          </span>
        </div>
      )}

      <footer className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/80 pt-4 font-mono text-xs text-fg-subtle">
        {!isAccount && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose" />
              {formatCount(tweet.likes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Repeat2 className="h-3.5 w-3.5 text-lime" />
              {formatCount(tweet.reposts)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-violet" />
              {formatCount(tweet.views)}
            </span>
          </>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-cyan" />
          ~{formatCount(tweet.followers)} followers
        </span>
      </footer>
    </article>
  );
}
