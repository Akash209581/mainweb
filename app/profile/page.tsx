/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { syncCurrentClerkUser } from "@/lib/auth/sync-user";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "ICGIT 2026 update delegate biography and professional designations."
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // 1. Sync and fetch user
  const user = await syncCurrentClerkUser();
  if (!user) {
    throw new Error("User synchronization failed. Please sign in again.");
  }

  // 2. Fetch countries list
  const countries = await prisma.country.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  const mappedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    title: user.profile?.title ?? "",
    designation: user.profile?.designation ?? "",
    phone: user.profile?.phone ?? "",
    bio: user.profile?.bio ?? "",
    countryId: user.profile?.countryId ?? "",
    organizationName: user.profile?.organization?.name ?? "",
    roles: user.roles.map((r: any) => r.role.name)
  };

  return (
    <>
      <PageHeader
        eyebrow="My Space"
        title="Profile Settings"
        description="Verify your dynamic profile mappings, biographical records, and workspace dashboard permissions."
      />
      <Section className="pt-0">
        <ProfileForm user={mappedUser} countries={countries} />
      </Section>
    </>
  );
}
