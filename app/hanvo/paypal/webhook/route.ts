import { NextResponse } from "next/server";
import { PaymentError } from "@/lib/paypal/config";
import { webhook } from "@/lib/paypal/service";
import { object } from "@/lib/paypal/verification";
import { readJson } from "@/lib/security/checkout";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const event = object(await readJson(request, 256_000));
    await webhook(event, request.headers);
    return NextResponse.json({ received: true });
  } catch (error) {
    const status = error instanceof PaymentError ? error.status : 503;
    return NextResponse.json(
      {
        error:
          status >= 500
            ? "Webhook processing unavailable; retry delivery."
            : "Webhook rejected."
      },
      { status }
    );
  }
}
