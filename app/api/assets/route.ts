import { documentDownloadHeaders } from '@/lib/document-download';
import { prisma } from "@/lib/prisma/client";
import fs from "fs/promises";
import path from "path";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  if (!kind || !["brochure", "sampleAbstract"].includes(kind))
    return new Response("Not found", { status: 404 });
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
    if (!conference) return new Response("Not found", { status: 404 });
    const row = await prisma.systemSetting.findUnique({
      where: { conferenceId_key: { conferenceId: conference.id, key: "document_assets" } }
    });
    const asset = (row?.value as Record<string, any> | undefined)?.[kind];
    if (!asset?.storageKey || path.basename(asset.storageKey) !== asset.storageKey)
      return new Response("Not found", { status: 404 });
    const bytes = await fs.readFile(
      path.resolve(
        process.env.SHARED_UPLOADS_DIR || path.join(process.cwd(), "public", "uploads"),
        "conference-documents",
        asset.storageKey
      )
    );
    return new Response(bytes, {
      headers: documentDownloadHeaders(asset.fileName, asset.storageKey)
    });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}
