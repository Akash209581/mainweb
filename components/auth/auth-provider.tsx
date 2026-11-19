"use client";

import type { ReactNode } from "react";
import { SessionContext, type SessionUser } from "@/lib/auth/client";

export function AuthProvider({ children, user = null }: { children: ReactNode; user?: SessionUser | null }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
