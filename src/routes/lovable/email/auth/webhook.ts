import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SignupEmail } from "@/lib/email-templates/signup";
import { InviteEmail } from "@/lib/email-templates/invite";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";
import { RecoveryEmail } from "@/lib/email-templates/recovery";
import { EmailChangeEmail } from "@/lib/email-templates/email-change";
import { ReauthenticationEmail } from "@/lib/email-templates/reauthentication";

// Configuration
const SITE_NAME = "Türkiye Hukuk Master AI";
const SENDER_DOMAIN = "notify.ozc.yaman.com";
const ROOT_DOMAIN = "ozc.yaman.com";
const FROM_DOMAIN = "ozc.yaman.com";
const SITE_URL = `https://${ROOT_DOMAIN}`;

// The SDK handler owns verification, dispatch, and retry semantics; this file
// owns only the email decisions: subjects, templates, and per-type props.
const createHandler = async () => {
  if (!process.env.LOVABLE_API_KEY) return null;
  const { createAuthEmailHandler } = await import("@lovable.dev/email-js");
  return createAuthEmailHandler({
  apiKey: process.env.LOVABLE_API_KEY,
  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
  senderDomain: SENDER_DOMAIN,
  sendUrl: process.env.LOVABLE_SEND_URL,
  emails: {
    signup: {
      subject: "E‑postanızı doğrulayın",
      render: (data: { email: string; url: string }) =>
        React.createElement(SignupEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          recipient: data.email,
          confirmationUrl: data.url,
        }),
    },
    invite: {
      subject: "Hukuk Master AI'ya davet edildiniz",
      render: (data: { url: string }) =>
        React.createElement(InviteEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          confirmationUrl: data.url,
        }),
    },
    magiclink: {
      subject: "Giriş bağlantınız",
      render: (data: { url: string }) =>
        React.createElement(MagicLinkEmail, {
          siteName: SITE_NAME,
          confirmationUrl: data.url,
        }),
    },
    recovery: {
      subject: "Şifre sıfırlama",
      render: (data: { url: string }) =>
        React.createElement(RecoveryEmail, {
          siteName: SITE_NAME,
          confirmationUrl: data.url,
        }),
    },
    email_change: {
      subject: "Yeni e‑postanızı onaylayın",
      render: (data: {
        email: string;
        url: string;
        old_email?: string | null;
        new_email?: string | null;
      }) =>
        React.createElement(EmailChangeEmail, {
          siteName: SITE_NAME,
          oldEmail: data.old_email ?? "",
          email: data.email,
          newEmail: data.new_email ?? "",
          confirmationUrl: data.url,
        }),
    },
    reauthentication: {
      subject: "Doğrulama kodunuz",
      render: (data: { token?: string | null }) =>
        React.createElement(ReauthenticationEmail, { token: data.token ?? "" }),
    },
  },
  });
};

export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const handler = await createHandler();
        if (!handler) return Response.json({ error: "Email service is not configured" }, { status: 503 });
        return handler(request);
      },
    },
  },
});
