import { ChevronDown } from "lucide-react";
import {
  MODE_BLURBS,
  MODE_LABELS,
  type ChaosFilters,
  type ChaosMode,
  type TweetLang,
} from "@/lib/tweets";
import { cn } from "@/lib/utils";

const MODES: ChaosMode[] = ["pure", "engagement", "media", "deep", "recent"];
const LANGS: { id: TweetLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "any", label: "Any" },
  { id: "es", label: "Español" },
  { id: "ja", label: "日本語" },
  { id: "fr", label: "Français" },
  { id: "pt", label: "Português" },
  { id: "de", label: "Deutsch" },
];

export function ModePanel({
  open,
  onToggle,
  filters,
  onChange,
}: {
  open: boolean;
  onToggle: () => void;
  filters: ChaosFilters;
  onChange: (next: ChaosFilters) => void;
}) {
  return (
    <div className="w-full max-w-lg">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-bg-panel/80 px-4 py-3 text-left transition-colors hover:border-cyan/30"
        aria-expanded={open}
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
            Chaos mode
          </p>
          <p className="mt-0.5 text-sm font-medium text-fg">
            {MODE_LABELS[filters.mode]}
            <span className="text-fg-subtle"> · </span>
            <span className="text-fg-muted">
              {LANGS.find((l) => l.id === filters.lang)?.label}
            </span>
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-fg-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="animate-fade-up mt-2 space-y-4 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle">
              Modes
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange({ ...filters, mode })}
                  className={cn(
                    "rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors",
                    filters.mode === mode
                      ? "border-cyan/50 bg-cyan/10 text-fg"
                      : "border-border bg-bg-panel text-fg-muted hover:border-border-strong hover:text-fg",
                  )}
                >
                  <span className="block text-sm font-medium">{MODE_LABELS[mode]}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-fg-subtle">
                    {MODE_BLURBS[mode]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle">
              Language
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onChange({ ...filters, lang: l.id })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                    filters.lang === l.id
                      ? "border-magenta/50 bg-magenta/15 text-magenta"
                      : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan"
                checked={filters.excludeReplies}
                onChange={(e) =>
                  onChange({ ...filters, excludeReplies: e.target.checked })
                }
              />
              Exclude replies
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan"
                checked={filters.excludeRetweets}
                onChange={(e) =>
                  onChange({ ...filters, excludeRetweets: e.target.checked })
                }
              />
              Exclude reposts
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
