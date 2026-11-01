import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const records: any[] = [];

  // 1. Fetch Registrations
  try {
    const dbRegistrations = await prisma.registration.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    dbRegistrations.forEach((r) => {
      records.push({
        id: r.id,
        kind: "registration",
        name: r.fullName,
        email: r.email,
        phone: "",
        organisation: r.organization || "",
        status: r.status === "CONFIRMED" ? "Confirmed" : "New",
        created_at: r.createdAt.toISOString(),
        payload: {
          category: r.category,
          currency: r.currency,
          role: r.participationRole,
          abstractReference: r.abstractReference,
          stay: r.hasStay,
          room: r.roomType,
          rooms: r.roomCount,
          totalAmountCents: r.totalAmountCents,
          referenceNumber: r.referenceNumber
        },
        notes: ""
      });
    });
  } catch {
    // Read from backup
    const backupFile = path.join(process.cwd(), "storage", "registrations_backup.json");
    if (fs.existsSync(backupFile)) {
      try {
        const list = JSON.parse(fs.readFileSync(backupFile, "utf8"));
        list.forEach((r: any) => {
          records.push({
            id: r.id,
            kind: "registration",
            name: r.fullName,
            email: r.email,
            phone: "",
            organisation: r.organization || "",
            status: r.status === "CONFIRMED" ? "Confirmed" : "New",
            created_at: r.createdAt,
            payload: {
              category: r.category,
              currency: r.currency,
              role: r.participationRole,
              abstractReference: r.abstractReference,
              stay: r.hasStay,
              room: r.roomType,
              rooms: r.roomCount,
              totalAmountCents: r.totalAmountCents,
              referenceNumber: r.referenceNumber
            },
            notes: ""
          });
        });
      } catch {}
    }
  }

  // 2. Fetch Abstracts
  const absBackup = path.join(process.cwd(), "storage", "abstracts_backup.json");
  if (fs.existsSync(absBackup)) {
    try {
      const list = JSON.parse(fs.readFileSync(absBackup, "utf8"));
      list.forEach((a: any) => {
        records.push({
          id: a.id,
          kind: "abstract",
          name: a.presentingAuthor,
          email: a.email,
          phone: a.phone || "",
          organisation: a.institution || "",
          status: "Under review",
          created_at: a.submittedAt,
          file_name: a.fileName,
          payload: {
            title: a.title,
            track: a.track,
            presentation: a.presentationPreference,
            referenceNumber: a.referenceNumber,
            coAuthors: a.coAuthors
          },
          notes: ""
        });
      });
    } catch {}
  }

  // 3. Fetch Contact / Brochure Queries
  try {
    const contacts = await prisma.contactMessage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    contacts.forEach((c) => {
      const isBrochure = c.message.startsWith("Brochure Request");
      records.push({
        id: c.id,
        kind: isBrochure ? "brochure" : "query",
        name: c.name,
        email: c.email,
        phone: "",
        organisation: "",
        status: "New",
        created_at: c.createdAt.toISOString(),
        payload: {
          category: c.category,
          message: c.message
        },
        notes: ""
      });
    });
  } catch {}

  // Sort newest first
  records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ records });
}

export async function PATCH(request: Request) {
  try {
    const { id, status, notes } = await request.json();
    return NextResponse.json({ ok: true, id, status, notes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update record" }, { status: 400 });
  }
}

