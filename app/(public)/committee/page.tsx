import type { Metadata } from "next";
import { CommitteeCard } from "@/components/committee/committee-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";
import { SearchBar } from "@/components/common/search-bar";
import { EmptyState } from "@/components/common/empty-state";
import { listCommittee } from "@/lib/repositories/public-content.repository";

export const metadata: Metadata = {
  title: "Committee",
  description: "Browse the ICGIT 2026 committee leadership."
};

interface CommitteePageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function CommitteePage({ searchParams }: CommitteePageProps) {
  const params = await searchParams;
  const search = params.search ?? "";

  const { items } = await listCommittee({
    page: 1,
    pageSize: 100,
    search,
    direction: "asc"
  });

  const groups: Record<string, typeof items> = {
    "Honorary Chairs": [],
    "General Chairs": [],
    "Program Chairs": [],
    "Organizing Committee": [],
    "Technical Committee": [],
    "International Advisory Board": []
  };

  items.forEach((member) => {
    const role = member.role.toLowerCase();
    if (role.includes("honorary")) {
      groups["Honorary Chairs"].push(member);
    } else if (role.includes("general")) {
      groups["General Chairs"].push(member);
    } else if (role.includes("program")) {
      groups["Program Chairs"].push(member);
    } else if (role.includes("organizing")) {
      groups["Organizing Committee"].push(member);
    } else if (role.includes("technical")) {
      groups["Technical Committee"].push(member);
    } else {
      groups["International Advisory Board"].push(member);
    }
  });

  const hasResults = Object.values(groups).some((arr) => arr.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="Committee"
        title="Governance for a trusted conference program"
        description="ICGIT 2026 is guided by international academic, publication, sponsorship, and program leadership."
      />
      <Section className="pt-0">
        <div className="mb-8">
          <SearchBar placeholder="Search committee members by name or affiliation..." />
        </div>

        {!hasResults ? (
          <EmptyState title="No committee members found" message="Try searching for a different name, affiliation, or role." />
        ) : (
          <div className="space-y-12">
            {Object.entries(groups).map(([groupName, members]) => {
              if (members.length === 0) return null;
              return (
                <div key={groupName} className="space-y-5">
                  <h2 className="font-heading text-2xl font-bold text-foreground border-b border-border/20 pb-2">
                    {groupName}
                  </h2>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => (
                      <CommitteeCard key={member.name} member={member} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}

