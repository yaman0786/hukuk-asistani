import { createFileRoute } from "@tanstack/react-router";

/**
 * Public webhook — refreshes public.daily_updates from official Turkish
 * legal sources. Called by pg_cron every 4h. Available as a thin HTTP
 * wrapper around the shared scraper so external callers still work.
 *
 * Auth: requires the Supabase publishable ("apikey") header. The route
 * lives under /api/public/* so no edge auth applies — we enforce it
 * here.
 */

export const Route = createFileRoute("/api/public/hooks/refresh-updates")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const key =
          request.headers.get("apikey") ??
          request.headers.get("x-apikey") ??
          (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!expected || key !== expected) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }

        const { runRefreshUpdates } = await import("@/lib/refresh-updates.server");
        const result = await runRefreshUpdates();
        return Response.json(result);
      },
    },
  },
});
