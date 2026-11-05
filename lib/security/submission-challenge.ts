import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { ValidationError } from "@/lib/errors/app-error";
function secret() {
  const s = process.env.SUBMISSION_CHALLENGE_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("Submission verification is not configured.");
  return s;
}
const used = new Map<string, number>();
export function createSubmissionChallenge() {
  const a = randomInt(2, 10),
    b = randomInt(1, 10),
    expires = Date.now() + 30 * 60000;
  const content = Buffer.from(
    JSON.stringify({ a, b, expires, nonce: randomUUID() })
  ).toString("base64url");
  const signature = createHmac("sha256", secret()).update(content).digest("hex");
  return { a, b, token: content + "." + signature };
}
export function verifySubmissionChallenge(token: unknown, answer: unknown) {
  if (
    typeof token !== "string" ||
    token.length > 1000 ||
    typeof answer !== "string" ||
    !/^\d{1,2}$/.test(answer.trim())
  )
    throw new ValidationError("Complete the verification challenge.");
  const [content, signature, ...extra] = token.split(".");
  const expected = createHmac("sha256", secret()).update(content).digest("hex");
  if (
    extra.length ||
    !signature ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    throw new ValidationError("Invalid verification challenge. Request a new challenge.");
  let data: any;
  try {
    data = JSON.parse(Buffer.from(content, "base64url").toString());
  } catch {
    throw new ValidationError("Invalid verification challenge.");
  }
  const now = Date.now();
  for (const [nonce, expiry] of used) if (expiry < now) used.delete(nonce);
  if (!Number.isFinite(data.expires) || data.expires < now || used.has(data.nonce))
    throw new ValidationError(
      "Verification expired or was already used. Request a new challenge."
    );
  if (Number(answer) !== data.a + data.b)
    throw new ValidationError("The verification answer is incorrect.");
  used.set(data.nonce, data.expires);
  return () => {
    used.delete(data.nonce);
  };
}
