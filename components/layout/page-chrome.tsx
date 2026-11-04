"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const approvedRoutes = new Set([
  "/registration",
  "/abstracts",
  "/brochure",
  "/sessions",
  "/committee"
]);

/** Keep the original navigation everywhere; reference pages supply their footer/background. */
export function PageChrome({
  children,
  header,
  footer,
  particles
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  particles: ReactNode;
}) {
  const pathname = usePathname()
    .replace(/^\/ICGIT(?=\/|$)/, "")
    .replace(/\/$/, "");

  useEffect(() => {
    // If navigating to a hash target like committee, let the targeted scroll handler position it exactly
    const hasHashTarget =
      (typeof window !== "undefined" && window.location.hash && window.location.hash !== "#" && window.location.hash !== "#home") ||
      (typeof window !== "undefined" && !!sessionStorage.getItem("target_nav_hash"));

    if (!hasHashTarget) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);
  if (approvedRoutes.has(pathname)) return <>{header}<div style={{ paddingTop: 80 }}>{children}</div></>;
  return (
    <>
      {particles}
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}
