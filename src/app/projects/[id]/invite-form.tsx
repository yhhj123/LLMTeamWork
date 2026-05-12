"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { inviteTeamAction, type InviteResult } from "../actions";

const initial: InviteResult = {};

export function InviteTeamForm({ projectId }: { projectId: string }) {
  const [state, action] = useFormState(inviteTeamAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [lastInvited, setLastInvited] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok && state.invitedName) {
      setLastInvited(state.invitedName);
      formRef.current?.reset();
      const t = setTimeout(() => setLastInvited(null), 3500);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3 text-sm">
      <input type="hidden" name="projectId" value={projectId} />
      <label className="block">
        <span className="font-medium">Team to invite</span>
        <input
          required
          name="team"
          autoComplete="off"
          placeholder="team slug, exact name, or id (e.g. backend-squad)"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <span className="block text-xs text-slate-500 mt-1">
          The team must already exist on the platform. Ask the other team's owner to share their
          slug — they can see it on <em>/me</em> or under their team settings page.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <Submit />
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {lastInvited && (
          <span className="text-sm text-emerald-600">
            Invited <strong>{lastInvited}</strong>.
          </span>
        )}
      </div>
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
      {pending ? "Inviting…" : "Invite team"}
    </button>
  );
}
