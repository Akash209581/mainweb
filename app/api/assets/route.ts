import { documentDownloadHeaders } from '@/lib/document-download';
import { prisma } from "@/lib/prisma/client";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  if (!kind || !["brochure", "sampleAbstract"].includes(kind))
    return new Response("Not found", { status: 404 });

  let asset: { fileName: string; storageKey?: string; key?: string } | null = null;

  try {
    const conference = await prisma.conference.findFirst({
      where: {
        slug: {
          equals: process.env.PUBLIC_CONFERENCE_SLUG || "icgit-2026",
          mode: "insensitive"
        },
        deletedAt: null
      }
    });
    if (conference) {
      const row = await prisma.systemSetting.findUnique({
        where: { conferenceId_key: { conferenceId: conference.id, key: "document_assets" } }
      });
      asset = (row?.value as Record<string, any> | undefined)?.[kind] || null;
    }
  } catch {
    // Continue to fallback
  }

  if (!asset) {
    try {
      const sf = path.join(process.cwd(), "storage", "settings.json");
      const raw = await fs.readFile(sf, "utf8");
      const parsed = JSON.parse(raw);
      asset = parsed.assets?.[kind] || null;
    } catch {}
  }

  const storageKey = asset?.storageKey || asset?.key;
  if (!asset || !storageKey || path.basename(storageKey) !== storageKey) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const filePath = path.resolve(
      process.env.SHARED_UPLOADS_DIR || path.join(process.cwd(), "public", "uploads"),
      "conference-documents",
      storageKey
    );
    const bytes = await fs.readFile(filePath);
    return new Response(bytes, {
      headers: documentDownloadHeaders(asset.fileName || `${kind}.pdf`, storageKey)
    });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}
