export default function Loading() {
  return (
    <div className="container flex min-h-screen items-center justify-center pt-24">
      <div className="glass-panel w-full max-w-md rounded-lg p-8 text-center">
        <div className="mx-auto size-12 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="mt-5 text-sm text-muted">Loading ICGIT 2026 experience...</p>
      </div>
    </div>
  );
}
