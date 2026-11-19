"use client";
import { useLayoutEffect, type ReactNode } from "react";
export function AdminPortal({ csrf, children }: { csrf: string; children: ReactNode }) {
  useLayoutEffect(() => {
    const original = window.fetch;
    const wrapped: typeof fetch = (input, init) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
        location.origin
      );
      if (
        url.origin === location.origin &&
        (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ICGIT/api/"))
      ) {
        if (url.pathname.startsWith("/api/")) url.pathname = "/ICGIT" + url.pathname;
        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        );
        if (
          !["GET", "HEAD"].includes(
            (
              init?.method || (input instanceof Request ? input.method : "GET")
            ).toUpperCase()
          )
        )
          headers.set("X-CSRF-Token", csrf);
        return original(input instanceof Request ? new Request(url, input) : url, {
          ...init,
          headers
        });
      }
      return original(input, init);
    };
    window.fetch = wrapped;
    return () => {
      if (window.fetch === wrapped) window.fetch = original;
    };
  }, [csrf]);
  return (
    <div className="root-admin">
      <style>{'.root-admin a[href="/api/auth/logout"] { display:none }'}</style>
      <button
        className="fixed right-4 top-3 z-50 rounded bg-white px-3 py-2 text-black"
        onClick={async () => {
          const response = await fetch("/ICGIT/api/admin/session", {
            method: "DELETE",
            headers: { "X-CSRF-Token": csrf }
          });
          if (response.ok) location.reload();
        }}
      >
        Sign out
      </button>
      {children}
    </div>
  );
}
