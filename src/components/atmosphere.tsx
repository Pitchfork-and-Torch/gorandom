import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function Atmosphere({ intensity = "idle" }: { intensity?: "idle" | "scan" | "found" }) {
  const particles = useMemo(
    () =>
      Array.from({ length: intensity === "scan" ? 28 : 16 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        delay: `${(i * 0.35) % 6}s`,
        duration: `${8 + (i % 7)}s`,
        color: i % 3 === 0 ? "var(--color-magenta)" : i % 3 === 1 ? "var(--color-violet)" : "var(--color-cyan)",
        size: 1 + (i % 3),
      })),
    [intensity],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 grid-cyber opacity-70" />
      <div className="absolute inset-0 noise opacity-50" />
      <div
        className={cn(
          "absolute inset-0 scanlines opacity-40 transition-opacity duration-500",
          intensity === "scan" && "opacity-70",
        )}
      />
      <div
        className={cn(
          "absolute left-1/2 top-[-10%] h-[50vh] w-[80vw] -translate-x-1/2 rounded-full transition-all duration-700",
          intensity === "scan" ? "opacity-80 scale-110" : "opacity-50",
        )}
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklab, var(--color-cyan) 18%, transparent), color-mix(in oklab, var(--color-magenta) 8%, transparent) 45%, transparent 70%)",
        }}
      />
      {intensity === "scan" && (
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full portal-ring animate-portal sm:h-64 sm:w-64" />
      )}
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: "-4px",
            animationDelay: p.delay,
            animationDuration: p.duration,
            background: p.color,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
