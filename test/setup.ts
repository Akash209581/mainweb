import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}));

// Mock Clerk hooks
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isSignedIn: true,
    user: { id: "user_test_clerk_id", emailAddresses: [{ emailAddress: "test@icgit.org" }] }
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: "user_test_clerk_id"
  })
}));
