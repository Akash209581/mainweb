import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 60; // 60 requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute window

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it is an API route (under /hanvo)
  if (pathname.startsWith("/hanvo")) {
    const headers = request.headers;
    const acceptHeader = headers.get("accept") || "";
    const secFetchDest = headers.get("sec-fetch-dest") || "";

    // 1. Direct browser access protection
    // Browsers navigating directly will have Accept containing text/html and sec-fetch-dest of document
    if (acceptHeader.includes("text/html") || secFetchDest === "document") {
      return new NextResponse(
        JSON.stringify({ error: "Direct browser access to API endpoints is strictly restricted." }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff"
          }
        }
      );
    }

    // 2. In-memory Rate Limiting
    const ip = (request as any).ip || request.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else if (now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else {
      record.count += 1;
      if (record.count > LIMIT) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-Content-Type-Options": "nosniff"
            }
          }
        );
      }
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
