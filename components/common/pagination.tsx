"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
}

export function Pagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const navigate = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => navigate(page - 1)}
        disabled={page <= 1}
        className="focus-ring flex size-9 items-center justify-center rounded-lg border border-border/45 bg-surface/60 hover:bg-hover/10 text-foreground disabled:opacity-40 disabled:hover:bg-transparent transition duration-200"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-xs text-muted font-semibold uppercase tracking-wider">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => navigate(page + 1)}
        disabled={page >= totalPages}
        className="focus-ring flex size-9 items-center justify-center rounded-lg border border-border/45 bg-surface/60 hover:bg-hover/10 text-foreground disabled:opacity-40 disabled:hover:bg-transparent transition duration-200"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
