"use client";

export function useAuth() {
  return {
    isSignedIn: true,
    userId: "mock_local_clerk_id",
    isLoaded: true
  };
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "mock_local_clerk_id",
      firstName: "Local",
      lastName: "Admin",
      primaryEmailAddressId: "primary",
      emailAddresses: [
        {
          id: "primary",
          emailAddress: "admin@icgit2026.org"
        }
      ]
    }
  };
}
