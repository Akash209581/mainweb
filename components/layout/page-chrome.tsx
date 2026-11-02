"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
