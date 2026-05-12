"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateScopeAction, type ScopeResult } from "../actions";

const initial: ScopeResult = {};

type Labels = {
  placeholder: string;
  editor_placeholder: string;
  save: string;
  saving: string;
  cancel: string;
};

export function ScopeEditor({
  projectId,
  teamId,
  initialScope,
  labels,
}: {
  projectId: string;
  teamId: string;
  initialScope: string;
  labels: Labels;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useFormState(updateScopeAction, initial);
  const [value, setValue] = useState(initialScope);

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="block w-full text-left text-xs text-slate-600 hover:text-accent"
      >
        {initialScope ? initialScope : <em className="text-slate-400">{labels.placeholder}</em>}
      </button>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="teamId" value={teamId} />
      <textarea
        name="scope"
        rows={2}
        maxLength={500}
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono"
        placeholder={labels.editor_placeholder}
        autoFocus
      />
      <div className="flex items-center gap-2 text-xs">
        <Submit labels={labels} />
        <button
          type="button"
          onClick={() => {
            setValue(initialScope);
            setEditing(false);
          }}
          className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50"
        >
          {labels.cancel}
        </button>
        {state.error && <span className="text-red-600">{state.error}</span>}
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
      className="rounded bg-accent px-2 py-1 text-white disabled:opacity-50"
    >
      {pending ? labels.saving : labels.save}
    </button>
  );
}
