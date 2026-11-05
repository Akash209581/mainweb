import { beforeEach, describe, expect, it, vi } from "vitest";
const { identity, save } = vi.hoisted(() => ({ identity: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ auth: identity }));
vi.mock("@/lib/repositories/user.repository", () => ({ updateUserProfile: save }));
vi.mock("@/lib/logging/logger", () => ({ logger: { error: vi.fn() } }));
import { updateProfileAction } from "../actions/profile.actions";
const form = () => {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    firstName: "Updated",
    lastName: "Tester",
    phone: "+919876543210",
    organizationName: "Institute",
    countryId: "00000000-0000-4000-8000-000000000001",
    bio: "Profile biography"
  }))
    f.set(k, v);
  return f;
};
describe("profile action field mapping", () => {
  beforeEach(() => {
    identity.mockReset();
    save.mockReset();
    identity.mockResolvedValue({ userId: "user-id" });
    save.mockResolvedValue({ id: "profile" });
  });
  it("passes validated names and organisation as well as profile fields", async () => {
    expect((await updateProfileAction({ ok: false, message: "" }, form())).ok).toBe(true);
    expect(save).toHaveBeenCalledWith(
      "user-id",
      expect.objectContaining({
        phone: "+919876543210",
        country: { connect: { id: "00000000-0000-4000-8000-000000000001" } }
      }),
      { firstName: "Updated", lastName: "Tester", organizationName: "Institute" }
    );
  });
  it("rejects phone letters before updating", async () => {
    const f = form();
    f.set("phone", "letters");
    expect((await updateProfileAction({ ok: false, message: "" }, f)).ok).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });
  it("rejects anonymous profile updates", async () => {
    identity.mockResolvedValue({ userId: null });
    expect((await updateProfileAction({ ok: false, message: "" }, form())).ok).toBe(
      false
    );
    expect(save).not.toHaveBeenCalled();
  });
});
