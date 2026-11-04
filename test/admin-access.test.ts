import { beforeEach, describe, expect, it, vi } from "vitest";
const { allowed, db } = vi.hoisted(() => ({ allowed: vi.fn(), db: vi.fn() }));
vi.mock("@/lib/security/admin-access", () => ({ hasAdminSession: allowed }));
vi.mock("@/lib/prisma/client", () => ({
  prisma: { user: { findFirst: db }, registration: { findMany: db } }
}));
import { GET } from "../app/api/records/route";
import { POST } from "../app/api/upload/route";
import { requireAuthenticatedUser } from "../lib/auth/rbac";
describe("legacy admin access boundaries", () => {
  beforeEach(() => {
    allowed.mockReset();
    db.mockReset();
    allowed.mockResolvedValue(false);
  });
  it("does not expose participant records to anonymous visitors", async () => {
    expect((await GET()).status).toBe(401);
    expect(db).not.toHaveBeenCalled();
  });
  it("rejects anonymous uploads before reading any file data", async () => {
    const formData = vi.fn();
    expect((await POST({ formData } as unknown as Request)).status).toBe(401);
    expect(formData).not.toHaveBeenCalled();
    expect(db).not.toHaveBeenCalled();
  });
  it("does not create a super-admin for an anonymous visitor", async () => {
    await expect(requireAuthenticatedUser()).rejects.toThrow();
    expect(db).not.toHaveBeenCalled();
  });
});
