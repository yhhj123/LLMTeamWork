"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type ActionResult } from "../(auth)/actions";

const initial: ActionResult = {};

export function LoginForm({
  labels,
}: {
  labels: { email: string; password: string; submit: string; submitting: string };
}) {
  const [state, action] = useFormState(loginAction, initial);

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
        <span className="font-medium">{labels.password}</span>
        <input
          required
          type="password"
          name="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
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
