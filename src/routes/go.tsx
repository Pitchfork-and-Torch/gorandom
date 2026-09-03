import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Instant path: /go → home with auto-spin.
 * Power-user bookmark for zero-friction chaos.
 */
export const Route = createFileRoute("/go")({
  beforeLoad: () => {
    throw redirect({ to: "/", search: { go: true } });
  },
});
