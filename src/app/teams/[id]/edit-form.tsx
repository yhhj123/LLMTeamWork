"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateTeamAction, type UpdateTeamResult } from "../actions";

const initial: UpdateTeamResult = {};

type Labels = {
  name: string;
  desc: string;
  desc_hint: string;
  submit: string;
  submitting: string;
  saved: string;
};

export function EditTeamForm({
  teamId,
  initialName,
  initialDescription,
  labels,
}: {
  teamId: string;
  initialName: string;
  initialDescription: string;
  labels: Labels;
}) {
  const [state, action] = useFormState(updateTeamAction, initial);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white border border-slate-200 p-5">
      <input type="hidden" name="teamId" value={teamId} />
      <label className="block text-sm">
        <span className="font-medium">{labels.name}</span>
        <input
          required
          minLength={2}
          maxLength={60}
          name="name"
          defaultValue={initialName}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{labels.desc}</span>
        <textarea
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={initialDescription}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <span className="block text-xs text-slate-500 mt-1">{labels.desc_hint}</span>
      </label>
      <div className="flex items-center gap-3">
        <Submit labels={labels} />
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {showSaved && <span className="text-sm text-emerald-600">{labels.saved}</span>}
      </div>
    </form>
  );
}

function Submit({ labels }: { labels: { submit: string; submitting: string } }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg bg-accent text-white disabled:opacity-50"
    >
      {pending ? labels.submitting : labels.submit}
    </button>
  );
}
