// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const { authenticate, profile } = vi.hoisted(() => ({ authenticate: vi.fn(), profile: vi.fn() }));
vi.mock("@/lib/auth/rbac", () => ({ requireAuthenticatedUser: authenticate }));
vi.mock("@/lib/prisma/client", () => ({ prisma: { user: { findUniqueOrThrow: profile } } }));
import { syncCurrentClerkUser } from "../lib/auth/sync-user";
beforeEach(() => vi.resetAllMocks());
it("rejects anonymous profile loading before reading or creating an account", async () => {
  authenticate.mockRejectedValue(new Error("Authentication required"));
  await expect(syncCurrentClerkUser()).rejects.toThrow("Authentication required");
  expect(profile).not.toHaveBeenCalled();
});
it("loads the profile belonging to the authenticated account", async () => {
  authenticate.mockResolvedValue({ id: "authenticated-account" });
  profile.mockResolvedValue({ id: "authenticated-account", roles: [] });
  await syncCurrentClerkUser();
  expect(profile).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "authenticated-account" } }));
});
