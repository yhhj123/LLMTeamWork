"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProjectAction, type ProjectActionResult } from "../actions";

const initial: ProjectActionResult = {};

type Team = { id: string; name: string; role: string };

type Labels = {
  name: string;
  name_placeholder: string;
  desc: string;
  owner: string;
  owner_hint: string;
  submit: string;
  submitting: string;
};

export function NewProjectForm({ teams, labels }: { teams: Team[]; labels: Labels }) {
  const [state, action] = useFormState(createProjectAction, initial);
  const defaultTeamId = teams.find(t => t.role === "owner")?.id ?? teams[0]?.id ?? "";

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white border border-slate-200 p-5">
      <label className="block text-sm">
        <span className="font-medium">{labels.name}</span>
        <input
          required
          minLength={2}
          maxLength={80}
          name="name"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder={labels.name_placeholder}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{labels.desc}</span>
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
          placeholder={"## Goals\n- ...\n\n## Out of scope\n- ..."}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{labels.owner}</span>
        <select
          name="ownerTeamId"
          defaultValue={defaultTeamId}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
          required
        >
          {teams.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.role})
            </option>
          ))}
        </select>
        <span className="block text-xs text-slate-500 mt-1">{labels.owner_hint}</span>
      </label>
      <Submit labels={labels} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
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
