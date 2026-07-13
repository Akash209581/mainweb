import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verify database connectivity
    await prisma.conference.findFirst();
    return NextResponse.json({
      status: "UP",
      database: "CONNECTED",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "DOWN",
        database: "DISCONNECTED",
        error: error instanceof Error ? error.message : "Database connection failed",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
