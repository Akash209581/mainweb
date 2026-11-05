import defaultTracks from "@/lib/validation/default-public-tracks.json";
import { prisma } from "@/lib/prisma/client";
import { publicAbstractSchema } from "@/lib/validation/public-inputs";
import { ValidationError, NotFoundError } from "@/lib/errors/app-error";
import { randomUUID } from "crypto";
import path from "path";
export async function savePublicAbstract(payload: unknown, file: File | undefined) {
  const data = publicAbstractSchema.parse(payload);
  if (!(file instanceof File) || !file.size)
    throw new ValidationError("Choose an abstract document.");
  const conference = await prisma.conference.findFirst({
    where: { slug: { equals: data.conferenceSlug, mode: "insensitive" }, deletedAt: null }
  });
  if (!conference) throw new NotFoundError("Conference not found.");
  const settings = await prisma.systemSetting.findMany({
    where: {
      conferenceId: conference.id,
      key: { in: ["abstract_settings", "scientific_tracks"] }
    }
  });
  const config = settings.find((s) => s.key === "abstract_settings")?.value as
    Record<string, any> | undefined;
  const maxMB = Number(config?.maxFileSizeMb ?? config?.maxFileMB ?? 5);
  if (!Number.isFinite(maxMB) || maxMB < 1 || maxMB > 10)
    throw new ValidationError("The abstract upload limit is not configured correctly.");
  if (file.size > maxMB * 1024 * 1024)
    throw new ValidationError(`Maximum abstract document size is ${maxMB} MB.`);
  const tracks = settings.find((s) => s.key === "scientific_tracks")?.value;
  if (
    !["Other", "Other / interdisciplinary"].includes(data.track) &&
    !(Array.isArray(tracks)
      ? tracks.some((t: any) => t.published !== false && t.name === data.track)
      : defaultTracks.includes(data.track))
  )
    throw new ValidationError("Select a published scientific track.");
  const fileName = file.name
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f]/g, "");
  if (!fileName || fileName.length > 255)
    throw new ValidationError("Invalid document filename.");
  const ext = path.extname(fileName).toLowerCase(),
    bytes = Buffer.from(await file.arrayBuffer());
  const allowed: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  };
  const signature =
    ext === ".pdf"
      ? bytes.subarray(0, 5).toString() === "%PDF-"
      : ext === ".doc"
        ? bytes.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]))
        : ext === ".docx"
          ? bytes[0] === 80 &&
            bytes[1] === 75 &&
            bytes.includes(Buffer.from("word/document.xml")) &&
            bytes.includes(Buffer.from("[Content_Types].xml"))
          : false;
  if (!allowed[ext] || !signature)
    throw new ValidationError(
      "Choose a valid PDF, DOC or DOCX document; renaming another file is not allowed."
    );
  const referenceNumber = "ABS-" + new Date().getFullYear() + "-" + randomUUID();
  return prisma.$transaction(async (tx) => {
    const saved = await tx.publicAbstractSubmission.create({
      data: {
        conferenceId: conference.id,
        referenceNumber,
        payload: data,
        fileName,
        mimeType: allowed[ext],
        fileData: bytes,
        sizeBytes: bytes.length
      },
      select: { id: true, referenceNumber: true }
    });
    await tx.auditLog.create({
      data: {
        action: "public.abstract.submitted",
        entity: "PublicAbstractSubmission",
        entityId: saved.id,
        metadata: { conferenceId: conference.id, referenceNumber }
      }
    });
    return saved;
  });
}
