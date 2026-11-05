import { beforeEach, describe, expect, it, vi } from "vitest";
const { allowed, findUser } = vi.hoisted(() => ({ allowed: vi.fn(), findUser: vi.fn() }));
vi.mock("@/lib/security/admin-access", () => ({ hasAdminSession: allowed }));
vi.mock("@/lib/prisma/client", () => ({ prisma: { user: { findUnique: findUser } } }));
import { auth, currentUser } from "../lib/auth/server";
describe("legacy identity boundary", () => {
  beforeEach(() => {
    allowed.mockReset();
    findUser.mockReset();
    allowed.mockResolvedValue(false);
  });
  it("does not treat anonymous visitors as a mock administrator", async () => {
    expect((await auth()).userId).toBeNull();
    expect(await currentUser()).toBeNull();
    expect(findUser).not.toHaveBeenCalled();
  });
  it("uses persisted profile names for an authenticated session", async () => {
    allowed.mockResolvedValue(true);
    findUser.mockResolvedValue({
      firstName: "Updated",
      lastName: "Person",
      email: "admin@example.test"
    });
    expect(await currentUser()).toMatchObject({
      firstName: "Updated",
      lastName: "Person"
    });
    expect(findUser).toHaveBeenCalledOnce();
  });
});
