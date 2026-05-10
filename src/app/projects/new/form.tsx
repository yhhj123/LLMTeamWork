"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProjectAction, type ProjectActionResult } from "../actions";

const initial: ProjectActionResult = {};

type Team = { id: string; name: string; role: string };

export function NewProjectForm({ teams }: { teams: Team[] }) {
  const [state, action] = useFormState(createProjectAction, initial);
  const defaultTeamId = teams.find(t => t.role === "owner")?.id ?? teams[0]?.id ?? "";

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white border border-slate-200 p-5">
      <label className="block text-sm">
        <span className="font-medium">Project name</span>
        <input
          required
          minLength={2}
          maxLength={80}
          name="name"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="e.g. Checkout Revamp"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Description (optional, markdown)</span>
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
          placeholder={"## Goals\n- ...\n\n## Out of scope\n- ..."}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Owning team</span>
        <select
          name="ownerTeamId"
          defaultValue={defaultTeamId}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
          required
        >
          {teams.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} {t.role === "owner" ? "(owner)" : `(${t.role})`}
            </option>
          ))}
        </select>
        <span className="block text-xs text-slate-500 mt-1">
          The team you pick becomes the project owner. You can invite other teams from the project
          page.
        </span>
      </label>
      <Submit />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg bg-accent text-white disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create project"}
    </button>
  );
}
