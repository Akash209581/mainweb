const encoder = new TextEncoder();
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return Array.from(
    new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)))
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function createSession(secret: string) {
  const payload = String(Date.now() + 8 * 60 * 60 * 1000) + "." + crypto.randomUUID();
  return payload + "." + (await sign(payload, secret));
}
export async function validSession(
  token: string | undefined,
  secret: string | undefined
) {
  if (!token || !secret || secret.length < 32) return false;
  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    !/^\d+$/.test(parts[0]) ||
    Number(parts[0]) <= Date.now() ||
    Number(parts[0]) > Date.now() + 8 * 60 * 60 * 1000
  )
    return false;
  const expected = await sign(parts[0] + "." + parts[1], secret);
  if (expected.length !== parts[2].length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ parts[2].charCodeAt(i);
  return diff === 0;
}
