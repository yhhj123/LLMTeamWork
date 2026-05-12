"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signupAction, type ActionResult } from "../(auth)/actions";

const initial: ActionResult = {};

export function SignupForm({
  labels,
}: {
  labels: {
    email: string;
    name: string;
    password: string;
    password_hint: string;
    team: string;
    team_placeholder: string;
    team_hint: string;
    submit: string;
    submitting: string;
  };
}) {
  const [state, action] = useFormState(signupAction, initial);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white border border-slate-200 p-5">
      <label className="block text-sm">
        <span className="font-medium">{labels.email}</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{labels.name}</span>
        <input
          required
          minLength={2}
          name="displayName"
          autoComplete="name"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">{labels.password}</span>
        <input
          required
          minLength={8}
          type="password"
          name="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <span className="block text-xs text-slate-500 mt-1">{labels.password_hint}</span>
      </label>
      <label className="block text-sm">
        <span className="font-medium">{labels.team}</span>
        <input
          required
          minLength={2}
          name="teamName"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder={labels.team_placeholder}
        />
        <span className="block text-xs text-slate-500 mt-1">{labels.team_hint}</span>
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
