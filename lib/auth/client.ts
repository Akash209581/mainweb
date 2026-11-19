"use client";

import { createContext, useContext } from "react";

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  primaryEmailAddressId: string;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
}

export const SessionContext = createContext<SessionUser | null>(null);

export function useUser() {
  const user = useContext(SessionContext);
  return { isLoaded: true, isSignedIn: user !== null, user };
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  return { isLoaded, isSignedIn, userId: user?.id ?? null };
}
