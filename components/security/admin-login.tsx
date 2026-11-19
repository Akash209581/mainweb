"use client";
import { useState, type FormEvent } from "react";
export function AdminLogin() {
  const [message, setMessage] = useState("");
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Signing in…");
    const form = new FormData(event.currentTarget);
    try {
      const challenge = await fetch("/ICGIT/api/admin/session", {
        cache: "no-store"
      }).then((r) => r.json());
      const response = await fetch("/ICGIT/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": challenge.csrfToken
        },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.reload();
    } catch (error) {
      setMessage((error as Error).message || "Sign in failed.");
    }
  }
  return (
    <main className="mx-auto max-w-md space-y-5 p-12">
      <h1 className="text-2xl">Administrator sign in</h1>
      <form onSubmit={login} className="space-y-4">
        <label className="block">
          Email
          <input
            className="block w-full rounded border p-2"
            name="email"
            type="email"
            required
            autoComplete="username"
          />
        </label>
        <label className="block">
          Password
          <input
            className="block w-full rounded border p-2"
            name="password"
            type="password"
            required
            maxLength={256}
            autoComplete="current-password"
          />
        </label>
        <button className="rounded border p-2">Sign in</button>
      </form>
      <p role="status">{message}</p>
    </main>
  );
}
