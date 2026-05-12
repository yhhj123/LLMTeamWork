"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { inviteTeamAction, type InviteResult } from "../actions";

const initial: InviteResult = {};

type Labels = {
  label: string;
  placeholder: string;
  hint: string;
  submit: string;
  submitting: string;
  invited: string;
};

export function InviteTeamForm({ projectId, labels }: { projectId: string; labels: Labels }) {
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

  const invitedMsg =
    lastInvited && labels.invited.replace("{name}", lastInvited);

  return (
    <form ref={formRef} action={action} className="space-y-3 text-sm">
      <input type="hidden" name="projectId" value={projectId} />
      <label className="block">
        <span className="font-medium">{labels.label}</span>
        <input
          required
          name="team"
          autoComplete="off"
          placeholder={labels.placeholder}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
        <span className="block text-xs text-slate-500 mt-1">{labels.hint}</span>
      </label>
      <div className="flex items-center gap-3">
        <Submit labels={labels} />
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {invitedMsg && <span className="text-sm text-emerald-600">{invitedMsg}</span>}
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
