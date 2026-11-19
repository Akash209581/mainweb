import { NextResponse } from "next/server";
// @ts-expect-error Untyped JS module from admin portal
import { INITIAL_TRACKS, INITIAL_COMMITTEE } from "@/hansci-novum-admin-portal/app/content-defaults";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma/client";
import { invalidateCache } from "@/lib/cache";
import { z } from "zod";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { requireAdminMutation } from "@/lib/security/admin-mutation";
import { limitRequests, readBody, readJson } from "@/lib/security/checkout";
import { PaymentError } from "@/lib/paypal/config";

export const dynamic = "force-dynamic";

const SETTINGS_FILE = path.join(process.cwd(), "storage", "settings.json");

type Rates = { EUR: number; USD: number; GBP: number };
type PublishedContent = { id?: string; published?: boolean; photo?: { fileName: string; key: string; url: string }; [key: string]: unknown };
interface Settings {
  conference: Record<string, string>;
  registration: { student: Rates; academic: Rates; industry: Rates; label?: string; note?: string; accommodation?: { single: Rates; double: Rates } };
  accommodation: { single: Rates; double: Rates };
  abstract: Record<string, number>;
  policies: Record<string, string>;
  assets: Record<string, { fileName: string; storageKey: string; url: string }>;
  tracks: PublishedContent[];
  committee: PublishedContent[];
  speakers: PublishedContent[];
  sections: PublishedContent[];
  [key: string]: unknown;
}

const DEFAULTS: Settings = {
  conference: {
    title: "ICGIT 2026 — International Conference on Global Innovation & Technology",
    dates: "December 8–10, 2026",
    venue: "Dubai World Trade Centre, Dubai, UAE",
    deadline: "October 1, 2026",
    supportEmail: "secretariat@icgit2026.org",
    phone: "+971 4 000 2026"
  },
  registration: {
    label: "Early-bird delegate rates",
    note: "All delegate tiers include digital proceedings and access to all hybrid tracks.",
    student: { EUR: 199, USD: 219, GBP: 179 },
    academic: { EUR: 399, USD: 439, GBP: 359 },
    industry: { EUR: 499, USD: 549, GBP: 449 }
  },
  accommodation: {
    single: { EUR: 120, USD: 135, GBP: 105 },
    double: { EUR: 160, USD: 180, GBP: 140 }
  },
  abstract: {
    minWords: 500,
    maxWords: 600,
    maxFileMB: 5
  },
  policies: {
    privacy:
      "Your personal details will be processed exclusively for conference management, registration, and certification in compliance with international privacy protocols.",
    terms:
      "All accepted abstracts are subject to double-blind scientific committee review and presentation requirements."
  },
  assets: {},
  tracks: INITIAL_TRACKS,
  committee: INITIAL_COMMITTEE,
  speakers: [],
  sections: []
};

export async function GET() {
  let settings: Settings = { ...DEFAULTS };
  let version = "v1.0";

  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      settings = {
        ...DEFAULTS,
        ...data,
        conference: { ...DEFAULTS.conference, ...(data.conference || {}) },
        registration: { ...DEFAULTS.registration, ...(data.registration || {}) },
        accommodation: { ...DEFAULTS.accommodation, ...(data.accommodation || {}) },
        abstract: { ...DEFAULTS.abstract, ...(data.abstract || {}) },
        policies: { ...DEFAULTS.policies, ...(data.policies || {}) },
        assets: { ...(data.assets || {}) },
        tracks: data.tracks || DEFAULTS.tracks,
        committee: data.committee || DEFAULTS.committee,
        speakers: data.speakers || [],
        sections: data.sections || []
      };
      version = "v1." + fs.statSync(SETTINGS_FILE).mtimeMs;
    } catch {}
  }

  try {
    const conference = await prisma.conference.findFirst({
      where: {
        slug: {
          equals: process.env.PUBLIC_CONFERENCE_SLUG || "icgit-2026",
          mode: "insensitive"
        },
        deletedAt: null
      },
      include: { settings: true }
    });
    if (conference) {
      const merged: Settings = { ...settings };
      const keys: Record<string, string> = {
        conference_display: "conference",
        registration_pricing: "registration",
        accommodation_pricing: "accommodation",
        abstract_settings: "abstract",
        policies: "policies",
        scientific_tracks: "tracks",
        organizing_committee: "committee",
        document_assets: "assets",
        approved_page_copy: "pageCopy"
      };
      for (const row of conference.settings) {
        const key = keys[row.key];
        if (key)
          merged[key] = Array.isArray(row.value)
            ? row.value
            : { ...(merged[key] as object), ...(row.value as object) };
      }
      const pricing = {
        ...merged.registration,
        accommodation: merged.registration.accommodation || merged.accommodation
      };
      merged.pricing = pricing;
      merged.accommodation = pricing.accommodation;
      merged.abstractSettings = {
        ...merged.abstract,
        maxFileSizeMb: merged.abstract.maxFileSizeMb ?? merged.abstract.maxFileMB
      };
      for (const key of ["tracks", "committee"]) {
        if (Array.isArray(merged[key])) {
          merged[key] = (merged[key] as PublishedContent[]).filter((item) => item.published !== false);
        }
      }
      settings = merged;
      version =
        conference.settings
          .map((row) => row.updatedAt.toISOString())
          .sort()
          .pop() || version;
    }
  } catch {
    // Retain local settings read fallback
  }

  return NextResponse.json(
    { settings, version },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: Request): Promise<Response>;
export async function PUT(): Promise<Response>;
export async function PUT(request?: Request): Promise<Response> {
  if (!request) {
    return NextResponse.json(
      { error: "Use the authenticated conference admin to publish settings." },
      { status: 403 }
    );
  }

  try {
    await requireAdminMutation(request);
    await limitRequests("admin-settings", 20);
    const body = z.object({ settings: z.record(z.string(), z.unknown()), version: z.string().max(100).optional() }).strict().parse(await readJson(request, 512_000));
    const incomingSettings = body.settings as Partial<Settings>;
    if (!incomingSettings || typeof incomingSettings !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    const storageDir = path.join(process.cwd(), "storage");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    let current: Settings = { ...DEFAULTS };
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      } catch {}
    }

    const merged = {
      ...current,
      ...incomingSettings,
      conference: { ...(current.conference || DEFAULTS.conference), ...(incomingSettings.conference || {}) },
      registration: { ...(current.registration || DEFAULTS.registration), ...(incomingSettings.registration || {}) },
      accommodation: { ...(current.accommodation || DEFAULTS.accommodation), ...(incomingSettings.accommodation || {}) },
      abstract: { ...(current.abstract || DEFAULTS.abstract), ...(incomingSettings.abstract || {}) },
      policies: { ...(current.policies || DEFAULTS.policies), ...(incomingSettings.policies || {}) },
      assets: { ...(current.assets || {}), ...(incomingSettings.assets || {}) },
      tracks: incomingSettings.tracks ?? current.tracks ?? DEFAULTS.tracks,
      committee: incomingSettings.committee ?? current.committee ?? DEFAULTS.committee,
      speakers: incomingSettings.speakers ?? current.speakers ?? [],
      sections: incomingSettings.sections ?? current.sections ?? []
    };

    // Keep the existing editor and checkout on the same conference-scoped price table.
    const rates = z.object({ EUR: z.number().finite().min(0).max(1000000), USD: z.number().finite().min(0).max(1000000), GBP: z.number().finite().min(0).max(1000000) }).strict();
    const registration = z.object({ student: rates, academic: rates, industry: rates }).passthrough().parse(merged.registration);
    const accommodation = z.object({ single: rates, double: rates }).strict().parse(merged.accommodation);
    const conference = await prisma.conference.findFirstOrThrow({ where: { slug: process.env.PUBLIC_CONFERENCE_SLUG || "icgit-2026", deletedAt: null } });
    await prisma.systemSetting.upsert({ where: { conferenceId_key: { conferenceId: conference.id, key: "registration_pricing" } },
      create: { conferenceId: conference.id, key: "registration_pricing", value: { ...registration, accommodation } as Prisma.InputJsonValue },
      update: { value: { ...registration, accommodation } as Prisma.InputJsonValue } });

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf8");
    await prisma.auditLog.create({ data: { action: "admin.settings.updated", entity: "SystemSetting" } });

    // Invalidate memory cache so updates appear instantly on live website
    invalidateCache();

    // Optionally update database if available
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
      if (conference && typeof merged.conference.title === "string") {
        await prisma.conference.update({
          where: { id: conference.id },
          data: { fullName: merged.conference.title }
        });
      }
    } catch {}

    const version = "v1." + Date.now();
    return NextResponse.json({ ok: true, version });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof PaymentError ? err.message : "Failed to save settings" }, { status: err instanceof PaymentError ? err.status : err instanceof z.ZodError ? 400 : 503 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutation(request);
    await limitRequests("admin-settings-upload", 10);
    const bytesBody = await readBody(request, 11 * 1024 * 1024);
    const bounded = new Request(request.url, { method: "POST", headers: request.headers, body: new Uint8Array(bytesBody) });
    const formData = await bounded.formData();
    const kind = formData.get("kind") as string;
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size < 1 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Select a file up to 10 MB." }, { status: 400 });
    if (!["brochure", "sampleAbstract", "committeePhoto", "speakerPhoto"].includes(kind)) return NextResponse.json({ error: "Unsupported upload kind." }, { status: 400 });
    for (const key of ["memberId", "speakerId"]) {
      const id = formData.get(key);
      if (id !== null && (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(id))) return NextResponse.json({ error: "Invalid content identifier." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = path.extname(file.name).toLowerCase();
    const image = ["committeePhoto", "speakerPhoto"].includes(kind);
    const allowed = image ? [".jpg", ".jpeg", ".png", ".webp"] : [".pdf", ".doc", ".docx"];
    const signatures: Record<string, boolean> = {
      ".pdf": buffer.subarray(0, 5).toString() === "%PDF-",
      ".doc": buffer.subarray(0, 8).equals(Buffer.from([208,207,17,224,161,177,26,225])),
      ".docx": buffer[0] === 80 && buffer[1] === 75 && buffer[2] === 3 && buffer[3] === 4,
      ".png": buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
      ".jpg": buffer[0] === 255 && buffer[1] === 216,
      ".jpeg": buffer[0] === 255 && buffer[1] === 216,
      ".webp": buffer.subarray(0,4).toString() === "RIFF" && buffer.subarray(8,12).toString() === "WEBP"
    };
    if (!allowed.includes(extension) || !signatures[extension]) return NextResponse.json({ error: "Unsupported file contents." }, { status: 400 });

    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    let current: Settings = { ...DEFAULTS };
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      } catch {}
    }

    if (kind === "brochure" || kind === "sampleAbstract") {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "conference-documents");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = randomUUID() + extension;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      if (!current.assets) current.assets = {};
      current.assets[kind] = {
        fileName: file.name,
        storageKey: safeName,
        url: `/uploads/conference-documents/${safeName}`
      };

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), "utf8");
      await prisma.auditLog.create({ data: { action: "admin.document.uploaded", entity: "FileAsset" } });
      invalidateCache();

      return NextResponse.json({
        ok: true,
        version: "v1." + Date.now(),
        asset: current.assets[kind]
      });
    }

    if (kind === "committeePhoto") {
      const memberId = formData.get("memberId") as string;
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "committee");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = randomUUID() + extension;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const photoObj = {
        fileName: file.name,
        key: safeName,
        url: `/uploads/committee/${safeName}`
      };

      if (Array.isArray(current.committee)) {
        current.committee = current.committee.map((m: PublishedContent) =>
          m.id === memberId ? { ...m, photo: photoObj } : m
        );
      }

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), "utf8");
      await prisma.auditLog.create({ data: { action: "admin.photo.uploaded", entity: "FileAsset" } });
      invalidateCache();

      return NextResponse.json({
        ok: true,
        version: "v1." + Date.now(),
        photo: photoObj
      });
    }

    if (kind === "speakerPhoto") {
      const speakerId = formData.get("speakerId") as string;
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "speakers");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = randomUUID() + extension;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const photoObj = {
        fileName: file.name,
        key: safeName,
        url: `/uploads/speakers/${safeName}`
      };

      if (Array.isArray(current.speakers)) {
        current.speakers = current.speakers.map((s: PublishedContent) =>
          s.id === speakerId ? { ...s, photo: photoObj } : s
        );
      }

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), "utf8");
      await prisma.auditLog.create({ data: { action: "admin.photo.uploaded", entity: "FileAsset" } });
      invalidateCache();

      return NextResponse.json({
        ok: true,
        version: "v1." + Date.now(),
        photo: photoObj
      });
    }

    return NextResponse.json({ error: "Unsupported upload kind" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof PaymentError ? err.message : "Upload failed" }, { status: err instanceof PaymentError ? err.status : 503 });
  }
}
