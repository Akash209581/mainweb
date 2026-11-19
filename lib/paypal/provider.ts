import { PaymentError, paypalConfig, type PaypalOperation } from "./config";

export type JsonObject = Record<string, unknown>;
let token: { value: string; expires: number; identity: string } | undefined;
let pendingToken: Promise<string> | undefined;
async function request(
  path: string,
  init: RequestInit,
  oauth = false
): Promise<JsonObject> {
  const c = paypalConfig();
  try {
    const response = await fetch(c.baseUrl + path, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok)
      throw new PaymentError(
        "PayPal could not complete this request. Check payment status before retrying.",
        503
      );
    const text = await response.text();
    if (text.length > 1_000_000) throw new Error("Oversized provider response");
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("Invalid response");
    return data as JsonObject;
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    throw new PaymentError(
      oauth
        ? "Checkout is unavailable."
        : "Payment status is uncertain. Check status before retrying.",
      503
    );
  }
}
async function accessToken() {
  const c = paypalConfig();
  const identity = c.PAYPAL_ENV + c.PAYPAL_CLIENT_ID + c.PAYPAL_CLIENT_SECRET;
  if (token?.identity === identity && token.expires > Date.now()) return token.value;
  if (!pendingToken)
    pendingToken = (async () => {
      const data = await request(
        "/v1/oauth2/token",
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(c.PAYPAL_CLIENT_ID + ":" + c.PAYPAL_CLIENT_SECRET).toString(
                "base64"
              ),
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: "grant_type=client_credentials"
        },
        true
      );
      if (
        typeof data.access_token !== "string" ||
        typeof data.expires_in !== "number" ||
        data.expires_in < 60
      )
        throw new PaymentError("Checkout is unavailable.", 503);
      token = {
        value: data.access_token,
        identity,
        expires: Date.now() + (data.expires_in - 30) * 1000
      };
      return token.value;
    })().finally(() => {
      pendingToken = undefined;
    });
  return pendingToken;
}
export async function paypalRequest(
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
  context: PaypalOperation = "reconcile"
) {
  let operation: PaypalOperation;
  if (method === "POST" && path === "/v2/checkout/orders") operation = "create";
  else if (method === "POST" && /^\/v2\/checkout\/orders\/[A-Z0-9]+\/capture$/.test(path))
    operation = "capture";
  else if (
    (method === "POST" && path === "/v1/notifications/verify-webhook-signature") ||
    (method === "GET" &&
      /^\/v1\/notifications\/webhooks-events\/[A-Z0-9-]{1,200}$/.test(path))
  )
    operation = "webhook";
  else if (
    method === "GET" &&
    /^\/v2\/(checkout\/orders|payments\/captures)\/[A-Z0-9]+$/.test(path)
  )
    operation = context;
  else throw new PaymentError("Invalid provider request.", 500);
  // A read context cannot bypass the operation-specific create/capture/signature gates.
  paypalConfig(operation);
  return request(path, {
    method,
    headers: {
      Authorization: "Bearer " + (await accessToken()),
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(key ? { "PayPal-Request-Id": key } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}
