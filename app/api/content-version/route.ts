import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [settingAgg, speakerAgg] = await Promise.all([
      prisma.systemSetting.aggregate({
        _max: { updatedAt: true }
      }),
      prisma.speaker.aggregate({
        _max: { updatedAt: true }
      })
    ]);

    const settingTime = settingAgg._max.updatedAt ? new Date(settingAgg._max.updatedAt).getTime() : 0;
    const speakerTime = speakerAgg._max.updatedAt ? new Date(speakerAgg._max.updatedAt).getTime() : 0;
    const maxTimestamp = Math.max(settingTime, speakerTime, 1);

    return NextResponse.json(
      { version: maxTimestamp },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ version: Date.now() });
  }
}
