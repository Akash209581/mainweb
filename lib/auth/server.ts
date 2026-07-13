export async function auth() {
  return {
    userId: "mock_local_clerk_id"
  };
}

export async function currentUser() {
  return {
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
  };
}
