// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { identity, user, notifications } = vi.hoisted(() => ({ identity: vi.fn(), user: vi.fn(), notifications: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ auth: identity }));
vi.mock("@/lib/prisma/client", () => ({ prisma: { user: { findUnique: user }, notification: { findMany: notifications } } }));
import { GET } from "../app/hanvo/notifications/route";

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

describe("notification ownership", () => {
  it("rejects anonymous notification streams before querying records", async () => {
    identity.mockResolvedValue({ userId: null });
    const response = await GET(new NextRequest("https://conference.test/ICGIT/hanvo/notifications?clerkId=another-user"));
    expect(response.status).toBe(401);
    expect(user).not.toHaveBeenCalled();
  });
  it("uses the authenticated identity instead of a supplied user identifier", async () => {
    identity.mockResolvedValue({ userId: "authenticated-user" });
    user.mockResolvedValue({ id: "stored-user" });
    notifications.mockResolvedValue([]);
    const abort = new AbortController();
    const response = await GET(new NextRequest("https://conference.test/ICGIT/hanvo/notifications?clerkId=another-user", { signal: abort.signal }));
    const reader = response.body!.getReader();
    await reader.read();
    expect(user).toHaveBeenCalledWith(expect.objectContaining({ where: { clerkUserId: "authenticated-user" } }));
    expect(notifications).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "stored-user" }) }));
    abort.abort();
    expect(vi.getTimerCount()).toBe(0);
  });
});
