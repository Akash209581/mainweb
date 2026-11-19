import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { AuthProvider } from "../components/auth/auth-provider";
import { useAuth } from "../lib/auth/client";

it("reports anonymous visitors as signed out and reflects the server session", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  const root = createRoot(host);
  function Status() { const auth = useAuth(); return <span>{auth.isSignedIn ? auth.userId : "signed out"}</span>; }
  try {
    await act(async () => root.render(<AuthProvider><Status /></AuthProvider>));
    expect(host.textContent).toBe("signed out");
    const user = { id: "server-user", firstName: "Person", lastName: "Test", primaryEmailAddressId: "primary", emailAddresses: [] };
    await act(async () => root.render(<AuthProvider user={user}><Status /></AuthProvider>));
    expect(host.textContent).toBe("server-user");
  } finally { await act(async () => root.unmount()); vi.unstubAllGlobals(); }
});
