import { hasAdminSession } from "@/lib/security/admin-access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import fs from "fs";
import path from "path";
import { requireAdminMutation } from "@/lib/security/admin-mutation";
import { PaymentError } from "@/lib/paypal/config";
import { limitRequests, readBody } from "@/lib/security/checkout";

export async function POST(request: Request) {
  if (!(await hasAdminSession()))
    return NextResponse.json(
      {
        error: "Administrator authentication required. Use the conference admin portal."
      },
      { status: 401 }
    );

  try {
    await requireAdminMutation(request);
    await limitRequests("admin-upload", 10);
    const bounded = new Request(request.url, { method: "POST", headers: request.headers, body: new Uint8Array(await readBody(request, 11 * 1024 * 1024)) });
    const formData = await bounded.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "branding";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(folder))
      return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
    if (file.size === 0 || file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "Select a file up to 10 MB" }, { status: 400 });
    const ext = path.extname(file.name).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".ico", ".pdf"].includes(ext))
      return NextResponse.json(
        { error: "Use PNG, JPEG, WebP, ICO or PDF" },
        { status: 400 }
      );
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const signatures: Record<string, boolean> = {
      ".pdf": buffer.subarray(0, 5).toString() === "%PDF-",
      ".png": buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      ".jpg": buffer[0] === 255 && buffer[1] === 216,
      ".jpeg": buffer[0] === 255 && buffer[1] === 216,
      ".webp":
        buffer.subarray(0, 4).toString() === "RIFF" &&
        buffer.subarray(8, 12).toString() === "WEBP",
      ".ico": buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0
    };
    if (!signatures[ext])
      return NextResponse.json(
        { error: "File contents do not match its extension" },
        { status: 400 }
      );
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}_${safeName}`;
    const relativeUrl = `/uploads/${folder}/${uniqueFileName}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const fileAsset = await prisma.fileAsset.create({
      data: {
        storageProvider: "local",
        storageKey: relativeUrl,
        originalName: file.name,
        mimeType: file.type || "image/jpeg",
        sizeBytes: buffer.length,
        visibility: "PUBLIC"
      }
    });

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      fileAssetId: fileAsset.id
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof PaymentError ? error.message : "Failed to upload file" }, { status: error instanceof PaymentError ? error.status : 503 });
  }
}
