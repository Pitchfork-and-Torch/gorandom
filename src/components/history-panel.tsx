import { Download, ExternalLink, Trash2, X } from "lucide-react";
import {
  clearHistory,
  exportHistory,
  type HistoryEntry,
} from "@/lib/history";
import { formatCount, tweetUrl } from "@/lib/tweets";
import { Button } from "@/components/ui/button";

export function HistoryPanel({
  open,
  onClose,
  items,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  items: HistoryEntry[];
  onRefresh: () => void;
}) {
  if (!open) return null;

  const download = (format: "json" | "text") => {
    const blob = new Blob([exportHistory(format)], {
      type: format === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gorandom-history.${format === "json" ? "json" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Discovery history"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        aria-label="Close history"
        onClick={onClose}
      />
      <div className="animate-scale-in relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-[var(--radius-xl)] border border-border bg-bg-elevated shadow-[var(--shadow-card)] sm:rounded-[var(--radius-xl)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-fg">Your chaos log</h2>
            <p className="mt-0.5 font-mono text-xs text-fg-subtle">
              {items.length} saved discover{items.length === 1 ? "y" : "ies"} · local only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-2 text-fg-muted hover:bg-bg-panel hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-fg-muted">
              No discoveries yet. Spin the void. Save what sticks.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((h) => (
                <li
                  key={`${h.id}-${h.foundAt}`}
                  className="rounded-[var(--radius-md)] border border-border bg-bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {h.name}{" "}
                        <span className="font-mono text-xs text-fg-subtle">
                          @{h.user}
                        </span>
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-fg-muted">
                        {h.text}
                      </p>
                      <p className="mt-1.5 font-mono text-[10px] text-fg-subtle">
                        {new Date(h.foundAt).toLocaleString()} · {h.mode}
                        {h.kind === "account" ? " · account" : ` · ${formatCount(h.likes)} likes`}
                      </p>
                    </div>
                    <a
                      href={tweetUrl({
                        user: h.user,
                        id: h.id,
                        kind: h.kind === "account" ? "account" : "tweet",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-[var(--radius-sm)] border border-border p-2 text-cyan hover:border-cyan/40 hover:bg-cyan/10"
                      aria-label={`Open @${h.user} on X`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
          <Button
            size="sm"
            variant="secondary"
            disabled={items.length === 0}
            onClick={() => download("text")}
          >
            <Download className="h-3.5 w-3.5" />
            Export text
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={items.length === 0}
            onClick={() => download("json")}
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={items.length === 0}
            className="ml-auto"
            onClick={() => {
              clearHistory();
              onRefresh();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
