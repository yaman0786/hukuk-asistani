import { createFileRoute } from "@tanstack/react-router";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export const Route = createFileRoute("/api/public/verify-recaptcha")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        if (!secret) {
          // Site key yoksa doğrulama devre dışı — client de token göndermez.
          return Response.json({ ok: true, skipped: true });
        }
        let token: string | undefined;
        let action: string | undefined;
        try {
          const body = (await request.json()) as { token?: string; action?: string };
          token = body.token;
          action = body.action;
        } catch {
          return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
        }
        if (!token) {
          return Response.json({ ok: false, error: "missing_token" }, { status: 400 });
        }
        const params = new URLSearchParams({ secret, response: token });
        const res = await fetch(VERIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        const data = (await res.json()) as {
          success: boolean;
          score?: number;
          action?: string;
          "error-codes"?: string[];
        };
        const score = data.score ?? 0;
        const okAction = !action || !data.action || data.action === action;
        if (!data.success || score < 0.5 || !okAction) {
          return Response.json(
            { ok: false, score, action: data.action, errors: data["error-codes"] },
            { status: 403 },
          );
        }
        return Response.json({ ok: true, score });
      },
    },
  },
});
