import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://hukuk-asistani-eta.vercel.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/auth", changefreq: "yearly", priority: "0.3" },
          { path: "/ictihat", changefreq: "daily", priority: "0.9" },
          { path: "/kararlar/yargitay", changefreq: "daily", priority: "0.8" },
          { path: "/kararlar/aym", changefreq: "daily", priority: "0.8" },
          { path: "/kararlar/emsal", changefreq: "daily", priority: "0.8" },
          { path: "/sablonlar", changefreq: "weekly", priority: "0.7" },
          { path: "/fiyatlar", changefreq: "monthly", priority: "0.8" },
          { path: "/rehber/maas-bloke-itiraz", changefreq: "monthly", priority: "0.8" },
          { path: "/rehber/dilekce-nasil-yazilir", changefreq: "monthly", priority: "0.8" },
          { path: "/gizlilik", changefreq: "yearly", priority: "0.5" },
          { path: "/kullanim-sartlari", changefreq: "yearly", priority: "0.5" },
          { path: "/kvkk", changefreq: "yearly", priority: "0.5" },
          { path: "/mcp", changefreq: "yearly", priority: "0.1" },
          { path: "/.mcp/list-tools", changefreq: "yearly", priority: "0.1" },
          { path: "/.well-known/oauth-protected-resource", changefreq: "yearly", priority: "0.1" },
        ];

        // Note: /paylas/$token share links are intentionally NOT included in the sitemap.
        // Those links rely on an unguessable token for privacy; publishing them for
        // search engine crawlers would defeat that protection.

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${escapeXml(`${BASE_URL}${e.path}`)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
