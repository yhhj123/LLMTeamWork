"use client";

import { useState } from "react";

export function TeamRegisterForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<{ apiKey?: string; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/teams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setResult({ error: data?.error?.message ?? `HTTP ${res.status}` });
      else setResult({ apiKey: data.apiKey });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-white border border-slate-200 p-5">
      <label className="block text-sm">
        <span className="font-medium">Team name</span>
        <input
          required
          minLength={2}
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Frontend Squad"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Description (optional)</span>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          rows={2}
        />
      </label>
      <button
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-accent text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create team"}
      </button>
      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
      {result?.apiKey && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm">
          <div className="font-semibold mb-1">Save this API key now — you won't see it again.</div>
          <code className="break-all">{result.apiKey}</code>
        </div>
      )}
    </form>
  );
}
