import { createFileRoute } from "@tanstack/react-router";
import isDavasiPdf from "@/assets/dilekce/is-davasi-dilekcesi.pdf.asset.json";
import isDavasiDocx from "@/assets/dilekce/is-davasi-dilekcesi.docx.asset.json";
import icraItirazPdf from "@/assets/dilekce/icra-itiraz-dilekcesi.pdf.asset.json";
import icraItirazDocx from "@/assets/dilekce/icra-itiraz-dilekcesi.docx.asset.json";
import bilgiEdinmePdf from "@/assets/dilekce/bilgi-edinme-dilekcesi.pdf.asset.json";
import bilgiEdinmeDocx from "@/assets/dilekce/bilgi-edinme-dilekcesi.docx.asset.json";

type Entry = { url: string; contentType: string };

const FILES: Record<string, Entry> = {
  "is-davasi-dilekcesi.pdf": { url: isDavasiPdf.url, contentType: "application/pdf" },
  "is-davasi-dilekcesi.docx": {
    url: isDavasiDocx.url,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "icra-itiraz-dilekcesi.pdf": { url: icraItirazPdf.url, contentType: "application/pdf" },
  "icra-itiraz-dilekcesi.docx": {
    url: icraItirazDocx.url,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "bilgi-edinme-dilekcesi.pdf": { url: bilgiEdinmePdf.url, contentType: "application/pdf" },
  "bilgi-edinme-dilekcesi.docx": {
    url: bilgiEdinmeDocx.url,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
};

// Only allow safe characters in the requested filename
const SAFE_NAME = /^[a-z0-9._-]+\.(pdf|docx)$/i;

function absoluteUrl(request: Request, relative: string): string {
  try {
    return new URL(relative, request.url).toString();
  } catch {
    const u = new URL(request.url);
    return `${u.origin}${relative}`;
  }
}

export const Route = createFileRoute("/api/public/dilekce/$file")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const file = params.file;
        if (!file || !SAFE_NAME.test(file) || !(file in FILES)) {
          return new Response("Not found", { status: 404 });
        }
        const entry = FILES[file];
        const upstream = await fetch(absoluteUrl(request, entry.url));
        if (!upstream.ok || !upstream.body) {
          return new Response("Upstream error", { status: 502 });
        }
        const filenameAscii = file.replace(/[^\x20-\x7E]/g, "_");
        const filenameStar = `UTF-8''${encodeURIComponent(file)}`;
        const headers = new Headers({
          "Content-Type": entry.contentType,
          "Content-Disposition": `attachment; filename="${filenameAscii}"; filename*=${filenameStar}`,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        });
        const len = upstream.headers.get("content-length");
        if (len) headers.set("Content-Length", len);
        return new Response(upstream.body, { status: 200, headers });
      },
    },
  },
});
