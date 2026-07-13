"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/buttons/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="container flex min-h-screen items-center justify-center pt-24">
      <div className="glass-panel max-w-xl rounded-lg p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-danger">
          Application Error
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">{error.message}</p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
