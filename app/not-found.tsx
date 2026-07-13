import Link from "next/link";
import { Button } from "@/components/buttons/button";
import { PageHeader } from "@/components/common/page-header";

export default function NotFound() {
  return (
    <>
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="The page you requested is not available in the ICGIT 2026 conference portal."
      />
      <div className="container pb-20">
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </>
  );
}
