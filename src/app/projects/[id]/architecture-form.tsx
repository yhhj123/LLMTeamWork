"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateArchitectureAction, type ArchitectureResult } from "../actions";

const initial: ArchitectureResult = {};

const PLACEHOLDER = `# Architecture

Describe the system here. Use mermaid for diagrams:

\`\`\`mermaid
flowchart LR
  Browser -->|HTTPS| nginx
  nginx --> App
  App --> DB[(SQLite)]
\`\`\`

## Module ownership

- @frontend-squad — Cart UI, Checkout page
- @backend-squad — Cart / Inventory / Payment APIs
- @platform-team — CI, hosting, observability
`;

type Labels = {
  save: string;
  saving: string;
  cancel: string;
  hint: string;
};

export function ArchitectureForm({
  projectId,
  initialValue,
  onClose,
  labels,
}: {
  projectId: string;
  initialValue: string;
  onClose: () => void;
  labels: Labels;
}) {
  const [state, action] = useFormState(updateArchitectureAction, initial);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <textarea
        name="architecture"
        rows={18}
        maxLength={50_000}
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        placeholder={PLACEHOLDER}
      />
      <p className="text-xs text-slate-500">{labels.hint}</p>
      <div className="flex items-center gap-2">
        <Submit labels={labels} />
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50"
        >
          {labels.cancel}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

function Submit({ labels }: { labels: { save: string; saving: string } }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg bg-accent text-white text-sm disabled:opacity-50"
    >
      {pending ? labels.saving : labels.save}
    </button>
  );
}
