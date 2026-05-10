"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signupAction, type ActionResult } from "../(auth)/actions";

const initial: ActionResult = {};

export function SignupForm() {
  const [state, action] = useFormState(signupAction, initial);

  return (
    <form action={action} className="space-y-3 rounded-xl bg-white border border-slate-200 p-5">
      <label className="block text-sm">
        <span className="font-medium">Email</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Your name</span>
        <input
          required
          minLength={2}
          name="displayName"
          autoComplete="name"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Password</span>
        <input
          required
          minLength={8}
          type="password"
          name="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <span className="block text-xs text-slate-500 mt-1">At least 8 characters.</span>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Team name</span>
        <input
          required
          minLength={2}
          name="teamName"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="e.g. Frontend Squad"
        />
        <span className="block text-xs text-slate-500 mt-1">
          Your first team — you'll be its owner. You can be invited into more later.
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
      {pending ? "Creating account…" : "Sign up"}
    </button>
  );
}
