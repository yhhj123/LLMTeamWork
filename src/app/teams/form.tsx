"use client";

import { useState } from "react";
import { CopyButton, CodeBlock } from "@/components/CopyButton";

type TeamResult = {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
};

type Labels = {
  name: string;
  desc: string;
  placeholder: string;
  submit: string;
  submitting: string;
  save_key: string;
  save_key_hint: string;
  wire_title: string;
  wire_sub: string;
  snippets_claude: string;
  snippets_json: string;
  snippets_env: string;
};

export function TeamRegisterForm({ labels }: { labels: Labels }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState<TeamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setTeam(null);
    try {
      const res = await fetch("/api/v1/teams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setError(data?.error?.message ?? `HTTP ${res.status}`);
      else setTeam(data as TeamResult);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="space-y-3 rounded-xl bg-white border border-slate-200 p-5"
      >
        <label className="block text-sm">
          <span className="font-medium">{labels.name}</span>
          <input
            required
            minLength={2}
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">{labels.desc}</span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            rows={2}
            placeholder={labels.placeholder}
          />
        </label>
        <button
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-accent text-white disabled:opacity-50"
        >
          {busy ? labels.submitting : labels.submit}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {team && <TeamCreatedPanel team={team} labels={labels} />}
    </div>
  );
}

function TeamCreatedPanel({ team, labels }: { team: TeamResult; labels: Labels }) {
  const origin = typeof window === "undefined" ? "https://YOUR_HOST" : window.location.origin;

  const mcpJson = JSON.stringify(
    {
      mcpServers: {
        "llm-teamwork": {
          type: "http",
          url: `${origin}/api/mcp`,
          headers: { Authorization: `Bearer ${team.apiKey}` },
        },
      },
    },
    null,
    2
  );

  const claudeCmd =
    `claude mcp add llm-teamwork \\\n` +
    `  --transport http \\\n` +
    `  --url ${origin}/api/mcp \\\n` +
    `  --header "Authorization=Bearer ${team.apiKey}"`;

  const envBlock = `export TEAMWORK_API_BASE=${origin}\nexport TEAMWORK_API_KEY=${team.apiKey}`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <KeyIcon className="h-4 w-4" />
          {labels.save_key}
        </div>
        <div className="flex items-center gap-2">
          <code className="break-all flex-1 rounded bg-white border border-amber-200 px-2 py-1 text-xs text-amber-900 font-mono">
            {team.apiKey}
          </code>
          <CopyButton value={team.apiKey} />
        </div>
        <p className="text-xs text-amber-800 mt-2">{labels.save_key_hint}</p>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
        <header>
          <h3 className="font-semibold text-slate-800">{labels.wire_title}</h3>
          <p className="text-sm text-slate-600 mt-1">{labels.wire_sub}</p>
        </header>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            {labels.snippets_claude}
          </h4>
          <CodeBlock code={claudeCmd} language="bash" />
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            {labels.snippets_json}
          </h4>
          <CodeBlock code={mcpJson} language="json" />
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            {labels.snippets_env}
          </h4>
          <CodeBlock code={envBlock} language="bash" />
        </div>
      </div>
    </div>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
