"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CopyButton, CodeBlock } from "@/components/CopyButton";
import { rotateTeamApiKeyAction } from "./actions";

type Props = {
  teamId: string;
  teamName: string;
  teamSlug: string;
  apiKey: string;
  role: string;
  origin: string;
};

export function TeamKeyCard({
  teamId,
  teamName,
  teamSlug,
  apiKey: initialKey,
  role,
  origin,
}: Props) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [revealed, setRevealed] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const masked = `${apiKey.slice(0, 8)}${"•".repeat(Math.max(apiKey.length - 12, 8))}${apiKey.slice(-4)}`;

  function onRotate() {
    if (
      !window.confirm(
        `Rotate the API key for "${teamName}"?\n\nAny agent or webhook still using the old key will start failing immediately.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await rotateTeamApiKeyAction(teamId);
      if (res.error) setError(res.error);
      else if (res.apiKey) {
        setApiKey(res.apiKey);
        setRevealed(true);
      }
    });
  }

  const mcpJson = JSON.stringify(
    {
      mcpServers: {
        [`llm-teamwork-${teamSlug}`]: {
          type: "http",
          url: `${origin}/api/mcp`,
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      },
    },
    null,
    2
  );

  const claudeCmd =
    `claude mcp add llm-teamwork-${teamSlug} \\\n` +
    `  --transport http \\\n` +
    `  --url ${origin}/api/mcp \\\n` +
    `  --header "Authorization=Bearer ${apiKey}"`;

  const envBlock = `export TEAMWORK_API_BASE=${origin}\nexport TEAMWORK_API_KEY=${apiKey}`;

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/teams/${teamId}`}
            className="font-semibold text-slate-800 no-underline hover:text-accent"
          >
            {teamName}
          </Link>
          <div className="text-xs text-slate-500 mt-0.5">slug: {teamSlug}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/teams/${teamId}`}
            className="text-xs text-slate-500 hover:text-accent no-underline"
          >
            Settings →
          </Link>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{role}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          API key
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-slate-50 border border-slate-200 px-2 py-1.5 text-xs font-mono text-slate-800 overflow-x-auto">
            {revealed ? apiKey : masked}
          </code>
          <button
            type="button"
            onClick={() => setRevealed(v => !v)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
          <CopyButton value={apiKey} label="Copy" />
          {role === "owner" && (
            <button
              type="button"
              onClick={onRotate}
              disabled={pending}
              className="rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              {pending ? "Rotating…" : "Rotate"}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowSnippets(v => !v)}
          className="text-xs font-medium text-accent hover:underline"
        >
          {showSnippets ? "Hide" : "Show"} MCP / shell snippets ↓
        </button>
        {showSnippets && (
          <div className="mt-3 space-y-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Claude Code (one-liner)
              </h4>
              <CodeBlock code={claudeCmd} language="bash" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Cursor / Windsurf / Claude Desktop config
              </h4>
              <CodeBlock code={mcpJson} language="json" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Shell env (for the bundled skill / curl helper)
              </h4>
              <CodeBlock code={envBlock} language="bash" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
