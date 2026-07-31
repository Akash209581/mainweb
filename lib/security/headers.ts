import type { NextResponse } from "next/server";

export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://maps.geoapify.com https://*.google.com https://*.googleapis.com https://*.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' ws: wss: https://api.resend.com",
      "frame-src 'self' https://www.google.com https://maps.google.com https://*.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );
  return response;
}
