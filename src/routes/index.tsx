import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookmarkPlus,
  Dices,
  ExternalLink,
  History,
  MessageSquareQuote,
  RotateCcw,
  Share2,
  Shuffle,
  Sparkles,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Atmosphere } from "@/components/atmosphere";
import { HistoryPanel } from "@/components/history-panel";
import { ModePanel } from "@/components/mode-panel";
import { TweetCard } from "@/components/tweet-card";
import { Button } from "@/components/ui/button";
import {
  loadHistory,
  saveToHistory,
  type HistoryEntry,
} from "@/lib/history";
import { grokTake, shareText } from "@/lib/grok-take";
import {
  bumpPersonalJumps,
  chaosScore,
  computeLiveStats,
  loadPersonalJumps,
  type LiveStats,
} from "@/lib/stats";
import {
  DEFAULT_FILTERS,
  MODE_LABELS,
  POOL_STATS,
  SCAN_MESSAGES,
  pickRandomTweet,
  pickSpinHandle,
  tweetUrl,
  type ChaosFilters,
  type RandomTweet,
} from "@/lib/tweets";
import { cn } from "@/lib/utils";

type Search = { go?: boolean };

const FOLLOW_URL =
  "https://x.com/intent/follow?screen_name=suddenlyjon";

export const Route = createFileRoute("/")({
  component: GoRandomApp,
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = search.go;
    const go =
      raw === true ||
      raw === 1 ||
      raw === "1" ||
      raw === "true" ||
      raw === "yes";
    return go ? { go: true } : {};
  },
});

type Phase = "idle" | "scanning" | "found" | "error";

const FILTERS_KEY = "gorandom.filters.v1";
const MUTE_KEY = "gorandom.muted";

function GoRandomApp() {
  const search = Route.useSearch();
  const autoGo = Boolean(search.go);

  const [phase, setPhase] = useState<Phase>("idle");
  const [spinHandle, setSpinHandle] = useState("???");
  const [scanMsg, setScanMsg] = useState(SCAN_MESSAGES[0]!);
  const [picked, setPicked] = useState<RandomTweet | null>(null);
  const [lastId, setLastId] = useState<string | undefined>();
  const [filters, setFilters] = useState<ChaosFilters>(DEFAULT_FILTERS);
  const [modesOpen, setModesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [askOpen, setAskOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [shareFlash, setShareFlash] = useState(false);
  const [muted, setMuted] = useState(true);
  const [jumps, setJumps] = useState(0);
  const [stats, setStats] = useState<LiveStats>(() => computeLiveStats(0));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deepCuts, setDeepCuts] = useState(0);
  const [mediaFinds, setMediaFinds] = useState(0);

  const timers = useRef<number[]>([]);
  const autoStarted = useRef(false);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) {
      window.clearTimeout(id);
      window.clearInterval(id);
    }
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    try {
      setJumps(loadPersonalJumps());
      setHistory(loadHistory());
      const f = localStorage.getItem(FILTERS_KEY);
      if (f) setFilters({ ...DEFAULT_FILTERS, ...JSON.parse(f) });
      setMuted(localStorage.getItem(MUTE_KEY) !== "0");
      const dc = Number(localStorage.getItem("gorandom.deep") || 0);
      const mf = Number(localStorage.getItem("gorandom.media") || 0);
      setDeepCuts(dc);
      setMediaFinds(mf);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setStats(computeLiveStats(jumps));
    const id = window.setInterval(() => {
      setStats(computeLiveStats(loadPersonalJumps()));
    }, 8000);
    return () => window.clearInterval(id);
  }, [jumps]);

  const persistFilters = (next: ChaosFilters) => {
    setFilters(next);
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const blip = useCallback(() => {
    if (muted) return;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 180 + Math.random() * 220;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.stop(ctx.currentTime + 0.13);
      window.setTimeout(() => ctx.close(), 200);
    } catch {
      /* no audio */
    }
  }, [muted]);

  const lockOn = useCallback(
    (tweet: RandomTweet) => {
      setPicked(tweet);
      setSpinHandle(tweet.user);
      setPhase("found");
      setAskOpen(false);
      setLastId(tweet.id);
      const n = bumpPersonalJumps();
      setJumps(n);
      if (tweet.followers < 5000 && !tweet.verified) {
        const d = deepCuts + 1;
        setDeepCuts(d);
        try {
          localStorage.setItem("gorandom.deep", String(d));
        } catch {
          /* */
        }
      }
      if (tweet.hasMedia && tweet.kind === "tweet") {
        const m = mediaFinds + 1;
        setMediaFinds(m);
        try {
          localStorage.setItem("gorandom.media", String(m));
        } catch {
          /* */
        }
      }
      blip();
    },
    [blip, deepCuts, mediaFinds],
  );

  const runRandom = useCallback(() => {
    clearTimers();
    setErrorMsg(null);
    setPhase("scanning");
    setPicked(null);
    setAskOpen(false);
    setSavedFlash(false);

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const spinMs = reduced ? 280 : 1800 + Math.random() * 1200;
    const intervalMs = reduced ? 90 : 48;
    let elapsed = 0;
    let msgIdx = 0;

    const spin = window.setInterval(() => {
      setSpinHandle(pickSpinHandle());
      if (elapsed % 280 < intervalMs) {
        msgIdx = (msgIdx + 1) % SCAN_MESSAGES.length;
        setScanMsg(SCAN_MESSAGES[msgIdx]!);
      }
      if (!muted && elapsed % 120 < intervalMs) blip();
      elapsed += intervalMs;
      if (elapsed >= spinMs) {
        window.clearInterval(spin);
        try {
          const tweet = pickRandomTweet(filters, lastId);
          lockOn(tweet);
        } catch {
          setPhase("error");
          setErrorMsg("The void is turbulent  -  try spinning again.");
        }
      }
    }, intervalMs);

    timers.current.push(spin as unknown as number);
  }, [blip, clearTimers, filters, lastId, lockOn, muted]);

  useEffect(() => {
    if (autoGo && !autoStarted.current) {
      autoStarted.current = true;
      const t = window.setTimeout(() => runRandom(), 200);
      timers.current.push(t);
    }
  }, [autoGo, runRandom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") {
        setHistoryOpen(false);
        setAskOpen(false);
        setModesOpen(false);
        return;
      }
      if (
        (e.key === " " || e.key === "Enter") &&
        phase !== "scanning" &&
        !historyOpen
      ) {
        e.preventDefault();
        runRandom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen, phase, runRandom]);

  const teleport = () => {
    if (!picked) return;
    window.open(tweetUrl(picked), "_blank", "noopener,noreferrer");
  };

  const saveChaos = () => {
    if (!picked) return;
    const next = saveToHistory(picked, MODE_LABELS[filters.mode]);
    setHistory(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  const shareDiscovery = async () => {
    if (!picked) return;
    const text = shareText(picked);
    try {
      if (navigator.share) {
        await navigator.share({ title: "GoRandom chaos find", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareFlash(true);
        window.setTimeout(() => setShareFlash(false), 1600);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareFlash(true);
        window.setTimeout(() => setShareFlash(false), 1600);
      } catch {
        /* ignore */
      }
    }
  };

  const score = useMemo(
    () => chaosScore(jumps, deepCuts, mediaFinds),
    [jumps, deepCuts, mediaFinds],
  );

  const intensity =
    phase === "scanning" ? "scan" : phase === "found" ? "found" : "idle";

  const take = picked ? grokTake(picked) : "";
  const teleportLabel =
    picked?.kind === "account" ? "Open profile on X" : "Teleport to X";

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <Atmosphere intensity={intensity} />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-cyan/30 bg-bg-panel shadow-[0_0_20px_-6px_var(--color-cyan)]">
              <Shuffle className="h-4 w-4 text-cyan" strokeWidth={2} />
            </div>
            <div className="leading-none">
              <p className="font-mono text-xs tracking-tight text-fg-muted sm:text-sm">
                <span className="text-cyan">go</span>
                <span className="text-fg text-glow">random</span>
                <span className="text-fg-subtle">.</span>
                <span className="text-magenta">grok</span>
                <span className="text-fg-subtle">.</span>
                me
              </p>
              <p className="mt-1 text-[11px] text-fg-subtle">
                chaos router 2.0 for X
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={FOLLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-cyan/40 bg-cyan/10 px-2.5 text-xs font-medium text-cyan transition-colors hover:border-cyan/70 hover:bg-cyan/20 sm:px-3"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Follow</span>
              <span className="font-mono">@suddenlyjon</span>
            </a>
            <button
              type="button"
              className="rounded-[var(--radius-sm)] border border-border bg-bg-panel p-2 text-fg-muted hover:border-cyan/30 hover:text-cyan"
              aria-label={muted ? "Unmute sounds" : "Mute sounds"}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                try {
                  localStorage.setItem(MUTE_KEY, next ? "1" : "0");
                } catch {
                  /* */
                }
              }}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-sm)] border border-border bg-bg-panel p-2 text-fg-muted hover:border-magenta/30 hover:text-magenta"
              aria-label="Open history"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "teleports today", value: stats.teleportsToday },
            { label: "total chaos", value: stats.totalChaos },
            { label: "explorers online", value: stats.activeExplorers },
            { label: "your score", value: score },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[var(--radius-md)] border border-border bg-bg-panel/70 px-3 py-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
                {s.label}
              </p>
              <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-cyan sm:text-base">
                {s.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] text-fg-subtle sm:justify-start">
          <span className="rounded-full border border-border bg-bg-panel/60 px-2.5 py-1 tabular-nums">
            {POOL_STATS.total.toLocaleString()} destinations
          </span>
          <span className="rounded-full border border-border bg-bg-panel/60 px-2.5 py-1 tabular-nums">
            {POOL_STATS.uniqueUsers.toLocaleString()} accounts
          </span>
          <span className="rounded-full border border-border bg-bg-panel/60 px-2.5 py-1 tabular-nums">
            {POOL_STATS.tweets.toLocaleString()} real posts
          </span>
        </div>

        <main className="flex flex-1 flex-col items-center justify-center py-8 sm:py-12">
          {phase !== "found" && (
            <div className="mb-8 flex max-w-xl flex-col items-center text-center animate-fade-up">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-cyan" />
                {POOL_STATS.total.toLocaleString()}+ public destinations
              </p>
              <h1 className="font-display text-[clamp(1.85rem,5.5vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-fg">
                Lock onto a stranger.
                <span className="mt-1 block text-fg-muted">
                  Teleport into their post.
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-fg-muted sm:text-base">
                Press the button. We'll find someone you've never met  - {" "}
                {POOL_STATS.uniqueUsers.toLocaleString()} accounts and{" "}
                {POOL_STATS.tweets.toLocaleString()} real posts in the mesh.
              </p>
            </div>
          )}

          {phase !== "scanning" && (
            <div className="mb-5 w-full max-w-lg">
              <ModePanel
                open={modesOpen}
                onToggle={() => setModesOpen((o) => !o)}
                filters={filters}
                onChange={persistFilters}
              />
            </div>
          )}

          <div
            className={cn(
              "w-full max-w-lg rounded-[calc(var(--radius-xl)+6px)] border border-border bg-bg-elevated/90 p-1 backdrop-blur-sm transition-all duration-300",
              phase === "scanning" && "border-cyan/40 shadow-[var(--shadow-glow)]",
              phase === "found" && "border-magenta/30",
            )}
          >
            <div className="rounded-[var(--radius-xl)] border border-border/70 bg-bg px-4 py-5 sm:px-6 sm:py-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                  {phase === "idle" && "ready"}
                  {phase === "scanning" && "scanning the multiverse"}
                  {phase === "found" && "stranger locked"}
                  {phase === "error" && "turbulence"}
                </p>
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    phase === "scanning" && "animate-pulse-glow bg-cyan",
                    phase === "found" && "bg-lime",
                    phase === "idle" && "bg-border-strong",
                    phase === "error" && "bg-rose",
                  )}
                />
              </div>

              <div className="mb-1 flex items-baseline gap-2">
                <span className="font-mono text-sm text-fg-subtle">@</span>
                <p
                  className={cn(
                    "min-h-[2.4rem] truncate font-mono text-2xl font-medium tracking-tight sm:text-3xl",
                    phase === "scanning" && "animate-glitch text-cyan text-glow",
                    phase === "found" && "text-fg text-glow",
                    phase === "idle" && "text-fg-muted",
                  )}
                  aria-live="polite"
                >
                  {spinHandle}
                </p>
              </div>

              {phase === "scanning" && (
                <p className="mb-5 font-mono text-xs text-magenta animate-pulse-glow">
                  {scanMsg}
                </p>
              )}

              {phase === "error" && errorMsg && (
                <p className="mb-4 text-sm text-rose">{errorMsg}</p>
              )}

              {phase === "found" && picked && (
                <div className="mt-3 space-y-4">
                  <TweetCard tweet={picked} />

                  <div className="flex flex-col gap-2">
                    <Button size="xl" className="w-full" onClick={teleport}>
                      <ExternalLink className="h-5 w-5" />
                      {teleportLabel}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" className="w-full" onClick={runRandom}>
                        <RotateCcw className="h-4 w-4 shrink-0" />
                        Spin again
                      </Button>
                      <Button variant="secondary" className="w-full" onClick={saveChaos}>
                        <BookmarkPlus className="h-4 w-4 shrink-0" />
                        {savedFlash ? "Saved" : "Save chaos"}
                      </Button>
                      <Button variant="secondary" className="w-full" onClick={shareDiscovery}>
                        <Share2 className="h-4 w-4 shrink-0" />
                        {shareFlash ? "Copied" : "Share"}
                      </Button>
                      <Button
                        variant="magenta"
                        className="w-full"
                        onClick={() => setAskOpen((o) => !o)}
                      >
                        <MessageSquareQuote className="h-4 w-4 shrink-0" />
                        Ask Grok
                      </Button>
                    </div>
                  </div>

                  {askOpen && (
                    <div className="animate-fade-up rounded-[var(--radius-lg)] border border-violet/30 bg-violet/5 p-4">
                      <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-violet">
                        <Sparkles className="h-3.5 w-3.5" />
                        Grok take
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                        {take}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(phase === "idle" || phase === "error") && (
                <>
                  <div className="mb-5 min-h-[4.5rem] rounded-[var(--radius-md)] border border-border bg-bg-panel/50 px-4 py-3">
                    <p className="font-mono text-xs leading-relaxed text-fg-subtle">
                      {phase === "error"
                        ? "Portal hiccup. The strangers are still out there."
                        : `Spacebar or the big button. ${POOL_STATS.total.toLocaleString()} destinations. Zero small talk.`}
                    </p>
                  </div>
                  <Button size="xl" className="w-full" onClick={runRandom}>
                    <Dices className="h-5 w-5" />
                    Take me somewhere random
                  </Button>
                </>
              )}

              {phase === "scanning" && (
                <Button size="xl" className="mt-2 w-full" disabled>
                  <Dices className="h-5 w-5 animate-spin" />
                  Finding someone...
                </Button>
              )}
            </div>
          </div>

          <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-fg-subtle">
            Shortcuts:{" "}
            <kbd className="rounded border border-border bg-bg-panel px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
              Space
            </kbd>{" "}
            spin ·{" "}
            <kbd className="rounded border border-border bg-bg-panel px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
              Esc
            </kbd>{" "}
            close panels ·{" "}
            <code className="rounded bg-bg-panel px-1.5 py-0.5 font-mono text-[10px] text-cyan">
              /go
            </code>{" "}
            instant chaos
          </p>
        </main>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-fg-subtle sm:flex-row">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              gorandom.grok.me · not affiliated with X Corp.
            </span>
            <span className="text-fg-subtle/50" aria-hidden>
              ·
            </span>
            <a
              href={FOLLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-cyan hover:text-fg hover:underline"
            >
              <UserPlus className="h-3 w-3" />
              Follow @suddenlyjon
            </a>
          </p>
          <p className="font-mono tabular-nums">
            {POOL_STATS.uniqueUsers.toLocaleString()} accounts ·{" "}
            {POOL_STATS.total.toLocaleString()} destinations · {jumps} personal
            jump{jumps === 1 ? "" : "s"}
          </p>
        </footer>
      </div>

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        items={history}
        onRefresh={() => setHistory(loadHistory())}
      />
    </div>
  );
}
